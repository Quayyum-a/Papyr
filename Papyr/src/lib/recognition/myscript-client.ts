/**
 * MyScript Client - Server-side only
 *
 * Handles communication with MyScript iink REST API for handwriting recognition.
 * Credentials are kept server-side only.
 *
 * Implements MyScript Cloud batch REST API v4.0:
 * - POST https://cloud.myscript.com/api/v4.0/iink/batch
 * - HMAC-SHA512 authentication with applicationKey + hmacKey as signing key
 * - JIIX export format for recognized text
 */

import type { Stroke } from '@/lib/ink-engine/types';
import type { CellCoordinates } from '@/types/ledger';
import type { RecognizeRequest, RecognizeResponse, MyScriptRecognitionMetadata } from './types';
import { createHmac } from 'crypto';

/**
 * MyScript stroke point format (parallel arrays per MyScript batch API)
 */
interface MyScriptStroke {
  id: string;
  pointerType: 'PEN';
  pointerId: number;
  x: number[];
  y: number[];
  t: number[];
  p: number[];
}

/**
 * MyScript batch API request payload
 */
interface MyScriptBatchRequest {
  configuration: {
    lang: string;
    export: {
      jiix: {
        strokes: boolean;
        text: {
          words: boolean;
          chars: boolean;
        };
      };
    };
  };
  xDPI: number;
  yDPI: number;
  contentType: 'Text';
  strokeGroups: { strokes: MyScriptStroke[] }[];
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
 * MyScript API response (batch API returns JIIX directly in response body)
 */
interface MyScriptApiResponse {
  type: string;
  // JIIX can come directly in response (batch API) or in exports (legacy)
  exports?: {
    'application/vnd.myscript.jiix': string;
    'text/plain'?: string;
  };
  // Direct JIIX fields when returned inline
  label?: string;
  words?: MyScriptWord[];
  chars?: MyScriptChar[];
  boundingBox?: MyScriptBoundingBox;
  version?: string;
  id?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Convert Papyr strokes to MyScript batch API format
 * Outputs parallel x/y/t/p arrays per stroke as required by MyScript
 */
export function convertStrokesToMyScript(strokes: Stroke[]): MyScriptStroke[] {
  return strokes.map((stroke, strokeIndex) => {
    const x: number[] = [];
    const y: number[] = [];
    const t: number[] = [];
    const p: number[] = [];

    // Base timestamp from stroke creation time
    const baseTime = stroke.createdAt;

    // Sample points from Bezier segments
    let pointIndex = 0;
    for (const segment of stroke.segments) {
      const sampledPoints = sampleBezierPoints(
        segment.p0 as [number, number],
        segment.p1 as [number, number],
        segment.p2 as [number, number],
        segment.p3 as [number, number],
        5 // 5 sample points per segment
      );

      // Interpolate pressure across the segment
      const pressureStart = segment.pressureStart ?? 0.5;
      const pressureEnd = segment.pressureEnd ?? 0.5;

      for (let i = 0; i < sampledPoints.length; i++) {
        const pt = sampledPoints[i];
        x.push(pt[0]);
        y.push(pt[1]);

        // Timestamp: increment by ~5ms per point (typical sampling rate)
        t.push(baseTime + pointIndex * 5);

        // Pressure: linear interpolation between segment start/end
        const pressureRatio = sampledPoints.length > 1 ? i / (sampledPoints.length - 1) : 0;
        p.push(pressureStart + (pressureEnd - pressureStart) * pressureRatio);

        pointIndex++;
      }
    }

    return {
      id: stroke.id,
      pointerType: 'PEN',
      pointerId: 0,
      x,
      y,
      t,
      p,
    };
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
 * Build MyScript batch API request from Papyr data
 */
export function buildMyScriptRequest(request: RecognizeRequest): MyScriptBatchRequest {
  const strokes = convertStrokesToMyScript(request.strokes);

  // MyScript expects strokeGroups: array of objects with "strokes" property
  // We put all strokes in a single group for text recognition
  const strokeGroups = [{ strokes }];

  // Map language to MyScript format (e.g., "en" -> "en_US")
  const lang = getMyScriptLanguageCode(request.language);

  return {
    configuration: {
      lang,
      export: {
        jiix: {
          strokes: false, // We don't need strokes back in JIIX
          text: {
            words: true,  // We want word-level recognition
            chars: false, // Don't need char-level
          },
        },
      },
    },
    xDPI: 96,
    yDPI: 96,
    contentType: 'Text',
    strokeGroups,
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
 * Handles both old format (objects with confidence) and new format (string arrays)
 */
function calculateAverageConfidence(jiix: MyScriptJiix): number | undefined {
  const confidences: number[] = [];

  if (jiix.words) {
    for (const word of jiix.words) {
      if (word.candidates) {
        for (const candidate of word.candidates) {
          // Handle both formats: {label, confidence} or just string
          if (typeof candidate === 'object' && candidate !== null && 'confidence' in candidate) {
            confidences.push((candidate as MyScriptCandidate).confidence);
          }
        }
      }
    }
  }

  if (confidences.length === 0) return undefined;

  const sum = confidences.reduce((acc, c) => acc + c, 0);
  return sum / confidences.length;
}

/**
 * Extract top alternative candidates for future UX
 * Handles both old format (objects with label/confidence) and new format (string arrays)
 */
function extractTopCandidates(jiix: MyScriptJiix): string[] {
  const candidates: string[] = [];

  if (jiix.words) {
    for (const word of jiix.words) {
      if (word.candidates && word.candidates.length > 1) {
        // Add alternative candidates (skip first which is the best)
        for (let i = 1; i < Math.min(word.candidates.length, 3); i++) {
          const candidate = word.candidates[i];
          // Handle both formats: {label, confidence} or just string
          if (typeof candidate === 'object' && candidate !== null && 'label' in candidate) {
            candidates.push((candidate as MyScriptCandidate).label);
          } else if (typeof candidate === 'string') {
            candidates.push(candidate);
          }
        }
      }
    }
  }

  return candidates;
}

/**
 * Generate MyScript HMAC-SHA512 signature for batch API
 *
 * MyScript batch API authentication:
 * - Signing key: applicationKey + hmacKey (concatenated as raw strings, UTF-8 encoded)
 * - Message: EXACT JSON string of the request body (byte-for-byte identical)
 * - Algorithm: HMAC-SHA512
 * - Output: hex-encoded signature
 *
 * This runs server-side in Next.js API route, using Node's built-in crypto module.
 */
function generateMyScriptHmac(applicationKey: string, hmacKey: string, requestBody: string): string {
  // Signing key = applicationKey + hmacKey concatenated
  const signingKey = applicationKey + hmacKey;

  // Compute HMAC-SHA512 of the exact request body JSON string
  const hmac = createHmac('sha512', signingKey);
  hmac.update(requestBody, 'utf8');
  return hmac.digest('hex');
}

/**
 * Call MyScript batch REST API for recognition
 * This should only be called from server-side code (Next.js API route)
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

  // Serialize to JSON - this EXACT string is what gets signed
  const requestBody = JSON.stringify(myscriptRequest);

  // Generate HMAC signature
  const hmacSignature = generateMyScriptHmac(applicationKey, hmacKey, requestBody);

  try {
    const response = await fetch('https://cloud.myscript.com/api/v4.0/iink/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.myscript.jiix,application/json',
        'applicationKey': applicationKey,
        'hmac': hmacSignature,
      },
      body: requestBody,
    });

    if (!response.ok) {
      let errorMessage = `myscript_api_error: ${response.status}`;
      try {
        const errorData = await response.json();
        // MyScript returns {"code": "api.mapping.error", "message": "..."} for schema mismatches
        if (errorData?.error?.message) {
          errorMessage = `myscript_error: ${errorData.error.code} - ${errorData.error.message}`;
        } else if (errorData?.message) {
          errorMessage = `myscript_error: ${errorData.message}`;
        }
      } catch {
        // If we can't parse error response, use status code
      }
      console.error('[MyScript] API error:', response.status, errorMessage);
      return {
        success: false,
        error: errorMessage,
        cellRevision: request.cellRevision,
      };
    }

    const data: MyScriptApiResponse = await response.json();

    if (data.error) {
      console.error('[MyScript] Recognition error:', data.error);
      return {
        success: false,
        error: `myscript_error: ${data.error.code} - ${data.error.message}`,
        cellRevision: request.cellRevision,
      };
    }

    // Extract recognized text from JIIX
    // Batch API returns JIIX directly in response body (with words, label, etc.)
    // Legacy API returns it in exports['application/vnd.myscript.jiix']
    let jiixExport: string;

    if (data.exports?.['application/vnd.myscript.jiix']) {
      // Legacy format
      jiixExport = data.exports['application/vnd.myscript.jiix'];
    } else if (data.words || data.label || data.chars) {
      // Direct JIIX format (batch API) - serialize the response as JIIX
      jiixExport = JSON.stringify(data);
    } else {
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
 * Get MyScript-supported language code
 * Maps our internal language to MyScript format (e.g., "en" -> "en_US")
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