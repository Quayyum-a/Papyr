/**
 * MyScript Recognition Comparison Test
 *
 * This script tests the server-side MyScript REST API with predefined stroke data
 * to compare recognition accuracy. Run with Node.js after installing dependencies.
 *
 * Usage:
 * 1. cd prototypes/myscript
 * 2. npm install
 * 3. Set MYSCRIPT_APPLICATION_KEY and MYSCRIPT_HMAC_KEY environment variables
 * 4. node comparison-test.js
 */

import { convertStrokesToMyScript, buildMyScriptRequest, recognizeWithMyScript } from '../../src/lib/recognition/myscript-client.js';
import type { Stroke, RecognizeRequest } from '../../src/lib/recognition/types.js';

// Test stroke data for common words
// These are simplified stroke representations - in reality, you'd capture real strokes from the canvas

// "iPhone" in cursive-like strokes (simplified)
const iPhoneCursiveStrokes: Stroke[] = [
  {
    id: 'stroke-1',
    tool: 'pen',
    color: '#000000',
    size: 'medium',
    segments: [
      { p0: [100, 200], p1: [110, 190], p2: [120, 185], p3: [130, 180], widthStart: 2, widthEnd: 2, pressureStart: 0.5, pressureEnd: 0.5 },
      { p0: [130, 180], p1: [140, 175], p2: [150, 170], p3: [160, 165], widthStart: 2, widthEnd: 2, pressureStart: 0.5, pressureEnd: 0.5 },
    ],
    createdAt: Date.now(),
    bounds: { minX: 100, minY: 165, maxX: 160, maxY: 200 },
    cell_id: 'col-0-row-0'
  },
  // "Phone" part - more strokes would be needed for real recognition
];

// "iPhone" in print/separate letters
const iPhonePrintStrokes: Stroke[] = [
  {
    id: 'stroke-1',
    tool: 'pen',
    color: '#000000',
    size: 'medium',
    segments: [
      { p0: [100, 200], p1: [100, 190], p2: [100, 180], p3: [100, 170], widthStart: 2, widthEnd: 2, pressureStart: 0.5, pressureEnd: 0.5 },
    ],
    createdAt: Date.now(),
    bounds: { minX: 100, minY: 170, maxX: 100, maxY: 200 },
    cell_id: 'col-0-row-0'
  },
  // More strokes for "Phone" would be added
];

// "Hello" in cursive
const helloCursiveStrokes: Stroke[] = [
  {
    id: 'stroke-1',
    tool: 'pen',
    color: '#000000',
    size: 'medium',
    segments: [
      { p0: [100, 200], p1: [110, 190], p2: [120, 185], p3: [130, 180], widthStart: 2, widthEnd: 2, pressureStart: 0.5, pressureEnd: 0.5 },
      { p0: [130, 180], p1: [140, 175], p2: [150, 170], p3: [160, 165], widthStart: 2, widthEnd: 2, pressureStart: 0.5, pressureEnd: 0.5 },
      { p0: [160, 165], p1: [170, 160], p2: [180, 155], p3: [190, 150], widthStart: 2, widthEnd: 2, pressureStart: 0.5, pressureEnd: 0.5 },
    ],
    createdAt: Date.now(),
    bounds: { minX: 100, minY: 150, maxX: 190, maxY: 200 },
    cell_id: 'col-0-row-0'
  },
];

// "Papyr" in cursive
const papyrCursiveStrokes: Stroke[] = [
  {
    id: 'stroke-1',
    tool: 'pen',
    color: '#000000',
    size: 'medium',
    segments: [
      { p0: [100, 200], p1: [110, 190], p2: [120, 185], p3: [130, 180], widthStart: 2, widthEnd: 2, pressureStart: 0.5, pressureEnd: 0.5 },
    ],
    createdAt: Date.now(),
    bounds: { minX: 100, minY: 180, maxX: 130, maxY: 200 },
    cell_id: 'col-0-row-0'
  },
];

// Test cases
const testCases = [
  { name: 'iPhone (cursive)', strokes: iPhoneCursiveStrokes, expected: 'iPhone' },
  { name: 'iPhone (print)', strokes: iPhonePrintStrokes, expected: 'iPhone' },
  { name: 'Hello (cursive)', strokes: helloCursiveStrokes, expected: 'Hello' },
  { name: 'Papyr (cursive)', strokes: papyrCursiveStrokes, expected: 'Papyr' },
];

async function runComparison() {
  console.log('=== MyScript Recognition Comparison Test ===\n');

  const appKey = process.env.MYSCRIPT_APPLICATION_KEY;
  const hmacKey = process.env.MYSCRIPT_HMAC_KEY;

  if (!appKey || !hmacKey) {
    console.error('❌ Missing credentials!');
    console.error('Set MYSCRIPT_APPLICATION_KEY and MYSCRIPT_HMAC_KEY environment variables');
    process.exit(1);
  }

  console.log('✓ Credentials loaded');
  console.log(`  Application Key: ${appKey.substring(0, 8)}...`);
  console.log(`  HMAC Key: ${hmacKey.substring(0, 8)}...`);
  console.log();

  for (const testCase of testCases) {
    console.log(`--- Testing: ${testCase.name} ---`);
    console.log(`Expected: "${testCase.expected}"`);

    try {
      // Convert strokes to MyScript format
      const myscriptStrokes = convertStrokesToMyScript(testCase.strokes);
      console.log(`Strokes converted: ${myscriptStrokes.length} strokes, ${myscriptStrokes.reduce((sum, s) => sum + s.points.length, 0)} points`);

      // Build request
      const request: RecognizeRequest = {
        bookId: 'test-book',
        pageId: 'test-page',
        cellId: 'col-0-row-0',
        cellCoords: { columnIndex: 0, rowIndex: 0 },
        columnType: 'text',
        columnLabel: 'Test',
        strokes: testCase.strokes,
        cellRevision: 1,
        language: 'en_US',
      };

      // Call MyScript
      const result = await recognizeWithMyScript(request);

      if (result.success) {
        console.log(`✓ Recognized: "${result.recognizedText}"`);
        console.log(`  Confidence: ${result.metadata?.confidence || 'N/A'}`);
        console.log(`  Candidates: ${result.metadata?.candidates?.join(', ') || 'N/A'}`);

        // Simple accuracy check
        const recognized = result.recognizedText?.toLowerCase().trim() || '';
        const expected = testCase.expected.toLowerCase().trim();
        const match = recognized === expected || recognized.includes(expected) || expected.includes(recognized);
        console.log(`  Match: ${match ? '✓ YES' : '✗ NO'}`);
      } else {
        console.log(`✗ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }

    console.log();
  }

  console.log('=== Test Complete ===');
  console.log('\nNotes:');
  console.log('- These are simplified synthetic strokes, not real handwriting');
  console.log('- For accurate testing, use the web prototype (index.html) with real handwriting');
  console.log('- The server-side REST API is what the production RecognitionService uses');
  console.log('- iinkTS (client-side) provides real-time recognition with better UX');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runComparison().catch(console.error);
}

export { runComparison, testCases };