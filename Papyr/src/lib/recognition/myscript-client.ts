/**
 * MyScript Client - Server-side only
 *
 * Handles communication with MyScript iink REST API for handwriting recognition.
 * Credentials are kept server-side only.
 */

import type { Stroke } from '@/lib/ink-engine/types';
import type { CellCoordinates } from '@/types/ledger';
import type { RecognizeRequest, RecognizeResponse, MyScriptRecognitionMetadata } from './types';

/**
 * MyScript stroke point format
 */
interface MyScriptPoint {
  x: number;
  y: number;
  t?: number;      // timestamp (ms since epoch)
  p?: number;      // pressure (0-1)
}

/**
 * MyScript stroke format
 */
interface MyScriptStroke {
  points: MyScriptPoint[];
  type?: 'stroke';
}

/**
 * MyScript recognition request payload
 */
interface MyScriptRecognitionRequest {
  strokes: MyScriptStroke[];
  language: string;
  textCandidateListSize?: number;
  contentType?: 'text' | 'math' | 'diagram' | 'music';
}

/**
 * MyScript JIIX export structure (subset we care about)
 */
interface MyScriptJiix {
  type: 'Text' | 'Math' | 'Diagram' | 'Music' | 'Raw Content';
  label?: string;
  words?: MyScriptWord[];
  chars?: MyScriptChar[];
  boundingBox?: MyScriptBoundingBox;
  version?: string;
}

interface MyScriptWord {
  label: string;
  firstChar: number;
  lastChar: number;
  items: number[];
  boundingBox?: MyScriptBoundingBox;
  candidates?: MyScriptCandidate[];
}

interface MyScriptChar {
  label: string;
  items: number[];
  boundingBox?: MyScriptBoundingBox;
  candidates?: MyScriptCandidate[];
}

interface MyScriptCandidate {
  label: string;
  confidence: number;
}

interface MyScriptBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * MyScript API response
 */
interface MyScriptApiResponse {
  type: string;
  exports?: {
    'application/vnd.myscript.jiix': string;
    'text/plain'?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Convert Papyr strokes to MyScript format
 */
export function convertStrokesToMyScript(strokes: Stroke[]): MyScriptStroke[] {
  return strokes.map(stroke => {
    const points: MyScriptPoint[] = [];

    for (const segment of stroke.segments) {
      // Segment has p0, p1, p2, p3 as [x, y] tuples
      // We sample points along the Bezier curve for MyScript
      const sampledPoints = sampleBezierPoints(
        segment.p0 as [number, number],
        segment.p1 as [number, number],
        segment.p2 as [number, number],
        segment.p3 as [number, number],
        5 // Number of sample points per segment
      );

      for (const pt of sampledPoints) {
        points.push({
          x: pt[0],
          y: pt[1],
          // Timestamp and pressure could be approximated from stroke metadata
          // For now we use the stroke's createdAt as base
        });
      }
    }

    return { points };
  });
}

/**
 * Sample points along a cubic Bezier curve
 */
function sampleBezierPoints(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  numSamples: number
): [number, number][] {
  const points: [number, number][] = [];

  for (let i = 0; i <= numSamples; i++) {
    const t = i / numSamples;
    const mt = 1 - t;

    // Cubic Bezier formula
    const x = mt * mt * mt * p0[0] +
              3 * mt * mt * t * p1[0] +
              3 * mt * t * t * p2[0] +
              t * t * t * p3[0];

    const y = mt * mt * mt * p0[1] +
              3 * mt * mt * t * p1[1] +
              3 * mt * t * t * p2[1] +
              t * t * t * p3[1];

    points.push([x, y]);
  }

  return points;
}

/**
 * Build MyScript recognition request from Papyr data
 */
export function buildMyScriptRequest(request: RecognizeRequest): MyScriptRecognitionRequest {
  const strokes = convertStrokesToMyScript(request.strokes);

  // Determine content type based on column type
  let contentType: MyScriptRecognitionRequest['contentType'] = 'text';
  if (request.columnType === 'number') {
    contentType = 'text'; // MyScript doesn't have a pure "number" type, use text with constraints
  } else if (request.columnType === 'date') {
    contentType = 'text';
  }

  return {
    strokes,
    language: request.language,
    textCandidateListSize: 3, // Get top 3 candidates
    contentType,
  };
}

/**
 * Parse MyScript JIIX response to extract recognized text
 */
export function parseMyScriptResponse(jiixString: string): {
  text: string;
  metadata: MyScriptRecognitionMetadata;
} {
  let jiix: MyScriptJiix;
  try {
    jiix = JSON.parse(jiixString);
  } catch (error) {
    console.error('[MyScript] Failed to parse JIIX:', error);
    return { text: '', metadata: {} };
  }

  // Extract plain text from JIIX
  let text = '';

  if (jiix.words && jiix.words.length > 0) {
    // Join words with spaces
    text = jiix.words.map(w => w.label).join(' ');
  } else if (jiix.chars && jiix.chars.length > 0) {
    // Fallback to character-level
    text = jiix.chars.map(c => c.label).join('');
  }

  // Build metadata for future extensibility
  const metadata: MyScriptRecognitionMetadata = {
    jiix,
    confidence: calculateAverageConfidence(jiix),
    candidates: extractTopCandidates(jiix),
    language: jiix.label, // Might contain language info
  };

  return { text: text.trim(), metadata };
}

/**
 * Calculate average confidence from JIIX candidates
 */
function calculateAverageConfidence(jiix: MyScriptJiix): number | undefined {
  const candidates: MyScriptCandidate[] = [];

  if (jiix.words) {
    for (const word of jiix.words) {
      if (word.candidates) {
        candidates.push(...word.candidates);
      }
    }
  }

  if (candidates.length === 0) return undefined;

  const sum = candidates.reduce((acc, c) => acc + c.confidence, 0);
  return sum / candidates.length;
}

/**
 * Extract top alternative candidates for future UX
 */
function extractTopCandidates(jiix: MyScriptJiix): string[] {
  const candidates: string[] = [];

  if (jiix.words) {
    for (const word of jiix.words) {
      if (word.candidates && word.candidates.length > 1) {
        // Add alternative candidates (skip first which is the best)
        for (let i = 1; i < Math.min(word.candidates.length, 3); i++) {
          candidates.push(word.candidates[i].label);
        }
      }
    }
  }

  return candidates;
}

/**
 * Call MyScript REST API for recognition
 * This should only be called from server-side code
 */
export async function recognizeWithMyScript(
  request: RecognizeRequest
): Promise<RecognizeResponse> {
  const applicationKey = process.env.MYSCRIPT_APPLICATION_KEY;
  const hmacKey = process.env.MYSCRIPT_HMAC_KEY;

  if (!applicationKey || !hmacKey) {
    console.error('[MyScript] Credentials not configured');
    return {
      success: false,
      error: 'recognition_service_not_configured',
      cellRevision: request.cellRevision,
    };
  }

  const myscriptRequest = buildMyScriptRequest(request);

  try {
    const token = await generateMyScriptToken(applicationKey, hmacKey);
    const response = await fetch('https://cloud.myscript.com/api/v4.0/iink/batch/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(myscriptRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[MyScript] API error:', response.status, errorText);
      return {
        success: false,
        error: `myscript_api_error: ${response.status}`,
        cellRevision: request.cellRevision,
      };
    }

    const data: MyScriptApiResponse = await response.json();

    if (data.error) {
      console.error('[MyScript] Recognition error:', data.error);
      return {
        success: false,
        error: `myscript_error: ${data.error.message}`,
        cellRevision: request.cellRevision,
      };
    }

    // Extract recognized text from JIIX export
    const jiixExport = data.exports?.['application/vnd.myscript.jiix'];
    if (!jiixExport) {
      console.error('[MyScript] No JIIX export in response');
      return {
        success: false,
        error: 'myscript_no_result',
        cellRevision: request.cellRevision,
      };
    }

    const { text, metadata } = parseMyScriptResponse(jiixExport);

    return {
      success: true,
      recognizedText: text,
      cellRevision: request.cellRevision,
      metadata,
    };
  } catch (error) {
    console.error('[MyScript] Network/parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'unknown_error',
      cellRevision: request.cellRevision,
    };
  }
}

/**
 * Generate MyScript HMAC token for authentication
 * Based on MyScript Cloud authentication specification
 * Uses Web Crypto API for HMAC-SHA256 (available in Node.js and modern browsers)
 */
async function generateMyScriptToken(applicationKey: string, hmacKey: string): Promise<string> {
  // MyScript uses HMAC-SHA256 with timestamp
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const message = `${applicationKey}:${timestamp}`;

  // Convert keys to proper format
  const encoder = new TextEncoder();
  const keyData = encoder.encode(hmacKey);
  const messageData = encoder.encode(message);

  // Import the HMAC key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Generate HMAC signature
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${applicationKey}:${hashHex}:${timestamp}`;
}

/**
 * Get MyScript-supported language code
 * Maps our internal language to MyScript format
 */
export function getMyScriptLanguageCode(language: string): string {
  const languageMap: Record<string, string> = {
    'en': 'en_US',
    'en_US': 'en_US',
    'en_GB': 'en_GB',
    'fr': 'fr_FR',
    'de': 'de_DE',
    'es': 'es_ES',
    'it': 'it_IT',
    'pt': 'pt_PT',
    'nl': 'nl_NL',
    'pl': 'pl_PL',
    'ru': 'ru_RU',
    'zh': 'zh_CN',
    'ja': 'ja_JP',
    'ko': 'ko_KR',
  };

  return languageMap[language] || 'en_US';
}