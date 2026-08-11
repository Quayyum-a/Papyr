import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ImageAnnotatorClient } from '@google-cloud/vision';

interface RecognizeRequestBody {
  image: string; // base64 PNG data URL
  columnLabel?: string;
}

/**
 * POST /api/ink/recognize-vision
 * 
 * Recognizes handwritten text from a cell's ink using Google Cloud Vision API.
 * Optimized for handwriting with document text detection.
 * 
 * Free tier: 1,000 requests/month
 * Cost after: $1.50 per 1,000 requests
 * 
 * Requires authentication via Supabase session.
 */
export async function POST(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'server_misconfiguration' },
      { status: 500 }
    );
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Check Google Cloud Vision configuration
  const credentialsPath = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS;
  const credentialsJson = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_JSON;
  const useADC = process.env.GOOGLE_CLOUD_USE_ADC === 'true';

  // Allow if at least one credential method is available
  if (!credentialsPath && !credentialsJson && !useADC) {
    console.error('Google Cloud Vision credentials not configured');
    return NextResponse.json(
      { error: 'recognition_service_not_configured' },
      { status: 503 }
    );
  }

  // Parse request body
  let body: RecognizeRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request_body' }, { status: 400 });
  }

  const { image, columnLabel } = body;

  if (!image || typeof image !== 'string') {
    return NextResponse.json(
      { error: 'missing_or_invalid_image' },
      { status: 400 }
    );
  }

  try {
    // Initialize Google Cloud Vision client
    let visionClient: ImageAnnotatorClient;

    if (useADC) {
      // Use Application Default Credentials (development)
      // Credentials come from: gcloud auth application-default login
      console.log('[Vision] Using Application Default Credentials');
      visionClient = new ImageAnnotatorClient();
    } else if (credentialsJson) {
      // Production: Use JSON string from environment variable
      console.log('[Vision] Using credentials from environment JSON');
      const credentials = JSON.parse(credentialsJson);
      visionClient = new ImageAnnotatorClient({
        credentials,
      });
    } else if (credentialsPath) {
      // Development: Use file path
      console.log('[Vision] Using credentials from file path');
      visionClient = new ImageAnnotatorClient({
        keyFilename: credentialsPath,
      });
    } else {
      throw new Error('No credentials available');
    }

    // Convert data URL to buffer
    // Format: "data:image/png;base64,iVBORw0KG..."
    const base64Data = image.split(',')[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: 'invalid_image_format' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Use documentTextDetection for better handwriting recognition
    // This is optimized for dense text and handwriting
    const [result] = await visionClient.documentTextDetection({
      image: {
        content: imageBuffer,
      },
      // Optional: Configure for handwriting
      imageContext: {
        languageHints: ['en'], // Nigerian English
      },
    });

    // Extract recognized text
    const fullTextAnnotation = result.fullTextAnnotation;
    
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      // No text detected or empty handwriting
      return NextResponse.json({
        text: '',
        confidence: 0,
        service: 'google-cloud-vision',
      });
    }

    let recognizedText = fullTextAnnotation.text.trim();

    // Calculate average confidence from all recognized words
    const pages = fullTextAnnotation.pages || [];
    let totalConfidence = 0;
    let wordCount = 0;

    for (const page of pages) {
      for (const block of page.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
          for (const word of paragraph.words || []) {
            if (word.confidence !== undefined && word.confidence !== null) {
              totalConfidence += word.confidence;
              wordCount++;
            }
          }
        }
      }
    }

    const averageConfidence = wordCount > 0 ? totalConfidence / wordCount : 0;

    // Optional: Post-process based on column label
    if (columnLabel && recognizedText) {
      recognizedText = postProcessByColumnType(recognizedText, columnLabel);
    }

    return NextResponse.json({
      text: recognizedText,
      confidence: averageConfidence,
      service: 'google-cloud-vision',
      columnLabel,
    });

  } catch (error: any) {
    console.error('Google Cloud Vision API error:', error);

    // Handle specific Google Cloud errors
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'credentials_file_not_found' },
        { status: 503 }
      );
    }

    if (error.code === 7) { // PERMISSION_DENIED
      return NextResponse.json(
        { error: 'permission_denied' },
        { status: 503 }
      );
    }

    if (error.code === 8) { // RESOURCE_EXHAUSTED (quota exceeded)
      return NextResponse.json(
        { error: 'quota_exceeded' },
        { status: 429 }
      );
    }

    // For any other error, return 503 to trigger fallback to OpenRouter
    return NextResponse.json(
      {
        error: 'recognition_failed',
        details: error.message
      },
      { status: 503 }
    );
  }
}

/**
 * Post-process recognized text based on column type
 * Helps improve accuracy for specific data types
 */
function postProcessByColumnType(text: string, columnLabel: string): string {
  const label = columnLabel.toLowerCase();

  // Date column: Clean up date formatting
  if (label.includes('date')) {
    // Remove extra spaces, normalize slashes
    text = text.replace(/\s+/g, '').replace(/[\\|]/g, '/');
  }

  // Debit/Credit/Amount columns: Clean up number formatting
  if (label.includes('debit') || label.includes('credit') || label.includes('amount') || label.includes('balance')) {
    // Remove spaces within numbers
    text = text.replace(/\s+/g, '');
    
    // Preserve Nigerian Naira symbol
    if (!text.startsWith('₦') && !text.startsWith('N')) {
      // Check if it looks like a number
      if (/^\d/.test(text)) {
        // It's a raw number, could add currency symbol
        // but safer to leave as-is for now
      }
    }
    
    // Normalize common OCR mistakes in numbers
    text = text
      .replace(/[Oo]/g, '0') // O looks like 0
      .replace(/[Il|]/g, '1') // I, l, | look like 1
      .replace(/[Ss\$]/g, '5'); // S looks like 5 sometimes
  }

  // Description column: Capitalize first letter
  if (label.includes('description') || label.includes('particulars') || label.includes('details')) {
    if (text.length > 0) {
      text = text.charAt(0).toUpperCase() + text.slice(1);
    }
  }

  return text;
}

/**
 * GET /api/ink/recognize-vision
 * Health check endpoint
 */
export async function GET() {
  const credentialsPath = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS;
  const credentialsJson = process.env.GOOGLE_CLOUD_VISION_CREDENTIALS_JSON;
  const useADC = process.env.GOOGLE_CLOUD_USE_ADC === 'true';
  
  const isConfigured = !!(credentialsPath || credentialsJson || useADC);
  
  let method = 'none';
  if (useADC) method = 'application-default-credentials';
  else if (credentialsJson) method = 'environment-json';
  else if (credentialsPath) method = 'file-path';

  return NextResponse.json({
    service: 'google-cloud-vision',
    configured: isConfigured,
    method,
    status: isConfigured ? 'ready' : 'not_configured',
  });
}
