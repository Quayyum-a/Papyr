import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

interface RecognizeRequestBody {
  image: string; // base64 PNG data URL
  columnLabel?: string;
}

interface OpenRouterMessage {
  role: 'user';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
    };
  }>;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
    code?: string;
  };
}

/**
 * POST /api/ink/recognize
 * 
 * Recognizes handwritten text from a cell's ink using OpenRouter vision models.
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

  // Read OpenRouter configuration from environment
  const apiKey = process.env.OPENROUTER_API_KEY;
  const modelsEnv = process.env.OPENROUTER_VISION_MODELS;

  if (!apiKey || !modelsEnv) {
    return NextResponse.json(
      { error: 'recognition_service_not_configured' },
      { status: 503 }
    );
  }

  const models = modelsEnv.split(',').map((m) => m.trim()).filter(Boolean);

  if (models.length === 0) {
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

  // Build prompt
  let promptText = 'Transcribe the handwritten text in this image. This is natural handwriting, possibly cursive or with connected letters, written quickly — take your time interpreting stroke shapes and letter boundaries rather than assuming clean print handwriting. Respond with only the transcribed text and nothing else — no explanation, no quotation marks. If nothing is legibly written, respond with an empty string.';
  
  if (columnLabel) {
    promptText += ` This is from a ledger column labeled '${columnLabel}' — if the writing is ambiguous, prefer an interpretation that fits that column (e.g. a date, a name, or a currency amount, whichever fits the label).`;
  }

  // Try each model in order until one succeeds
  for (const model of models) {
    try {
      const openRouterRequest: OpenRouterRequest = {
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: promptText,
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openRouterRequest),
      });

      if (!response.ok) {
        console.error(`Model ${model} failed with status ${response.status}`);
        continue; // Try next model
      }

      const data: OpenRouterResponse = await response.json();

      if (data.error) {
        console.error(`Model ${model} returned error:`, data.error);
        continue; // Try next model
      }

      const recognizedText = data.choices?.[0]?.message?.content?.trim();

      if (recognizedText !== undefined && recognizedText !== null) {
        // Success! Return the recognized text
        return NextResponse.json({
          text: recognizedText,
          model, // Include which model succeeded (useful for debugging)
        });
      }

      console.error(`Model ${model} returned empty response`);
    } catch (error) {
      console.error(`Model ${model} threw error:`, error);
      continue; // Try next model
    }
  }

  // All models failed
  return NextResponse.json(
    { error: 'recognition_unavailable' },
    { status: 503 }
  );
}
