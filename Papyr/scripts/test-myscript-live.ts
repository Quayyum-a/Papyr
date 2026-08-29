#!/usr/bin/env npx tsx

/**
 * Manual verification script for MyScript batch REST API integration
 *
 * This script sends a real stroke (the word "Lagos") to the live MyScript API
 * and verifies the response.
 *
 * Run with: npx tsx scripts/test-myscript-live.ts
 *
 * Requires MYSCRIPT_APPLICATION_KEY and MYSCRIPT_HMAC_KEY in environment
 */

import { recognizeWithMyScript } from '@/lib/recognition/myscript-client';
import type { RecognizeRequest } from '@/lib/recognition/types';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Simple stroke for the word "Lagos" - roughly traced
// This creates a simple cursive-like stroke pattern
function createLagosStroke(): RecognizeRequest['strokes'] {
  const baseX = 100;
  const baseY = 100;
  const baseTime = Date.now();

  return [
    {
      id: 'stroke-1',
      tool: 'pen',
      color: '#000000',
      size: 'medium' as const,
      segments: [
        // L - vertical downstroke
        { p0: [baseX, baseY], p1: [baseX, baseY + 10], p2: [baseX, baseY + 20], p3: [baseX, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX, baseY + 30], p1: [baseX + 5, baseY + 30], p2: [baseX + 10, baseY + 30], p3: [baseX + 15, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        // a - circle-ish
        { p0: [baseX + 20, baseY + 20], p1: [baseX + 15, baseY + 10], p2: [baseX + 25, baseY + 10], p3: [baseX + 30, baseY + 20], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 30, baseY + 20], p1: [baseX + 35, baseY + 25], p2: [baseX + 35, baseY + 30], p3: [baseX + 30, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 30, baseY + 30], p1: [baseX + 25, baseY + 35], p2: [baseX + 15, baseY + 35], p3: [baseX + 10, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        // g - loop
        { p0: [baseX + 40, baseY + 20], p1: [baseX + 35, baseY + 10], p2: [baseX + 45, baseY + 10], p3: [baseX + 50, baseY + 20], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 50, baseY + 20], p1: [baseX + 55, baseY + 25], p2: [baseX + 55, baseY + 30], p3: [baseX + 50, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 50, baseY + 30], p1: [baseX + 45, baseY + 35], p2: [baseX + 35, baseY + 35], p3: [baseX + 30, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 30, baseY + 30], p1: [baseX + 25, baseY + 40], p2: [baseX + 35, baseY + 50], p3: [baseX + 40, baseY + 50], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        // o - circle
        { p0: [baseX + 55, baseY + 20], p1: [baseX + 50, baseY + 10], p2: [baseX + 60, baseY + 10], p3: [baseX + 65, baseY + 20], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 65, baseY + 20], p1: [baseX + 70, baseY + 25], p2: [baseX + 70, baseY + 30], p3: [baseX + 65, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 65, baseY + 30], p1: [baseX + 60, baseY + 35], p2: [baseX + 50, baseY + 35], p3: [baseX + 45, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        // s - curve
        { p0: [baseX + 70, baseY + 20], p1: [baseX + 75, baseY + 15], p2: [baseX + 70, baseY + 20], p3: [baseX + 65, baseY + 25], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
        { p0: [baseX + 65, baseY + 25], p1: [baseX + 60, baseY + 30], p2: [baseX + 70, baseY + 35], p3: [baseX + 75, baseY + 30], widthStart: 1.4, widthEnd: 1.4, pressureStart: 0.5, pressureEnd: 0.5 },
      ],
      createdAt: baseTime,
      bounds: { minX: baseX, minY: baseY, maxX: baseX + 80, maxY: baseY + 60 },
      cell_id: 'col-0-row-0',
    },
  ];
}

async function main() {
  console.log('=== MyScript Live Integration Test ===\n');

  const applicationKey = process.env.MYSCRIPT_APPLICATION_KEY;
  const hmacKey = process.env.MYSCRIPT_HMAC_KEY;

  if (!applicationKey || !hmacKey) {
    console.error('❌ MYSCRIPT_APPLICATION_KEY and MYSCRIPT_HMAC_KEY must be set in .env.local');
    process.exit(1);
  }

  console.log(`Application Key: ${applicationKey.substring(0, 8)}...`);
  console.log(`HMAC Key: ${hmacKey.substring(0, 8)}...`);
  console.log('');

  const strokes = createLagosStroke();
  console.log(`Created test stroke with ${strokes[0].segments.length} segments for "Lagos"\n`);

  const request: RecognizeRequest = {
    bookId: 'test-book',
    pageId: 'test-page',
    cellId: 'col-0-row-0',
    cellCoords: { columnIndex: 0, rowIndex: 0 },
    columnType: 'text',
    columnLabel: 'City',
    strokes,
    cellRevision: 1,
    language: 'en_US',
  };

  console.log('Sending request to MyScript batch API...');
  const startTime = Date.now();

  const result = await recognizeWithMyScript(request);

  const elapsed = Date.now() - startTime;
  console.log(`\nResponse received in ${elapsed}ms\n`);

  if (result.success) {
    console.log('✅ SUCCESS!');
    console.log(`   Recognized text: "${result.recognizedText}"`);
    console.log(`   Cell revision: ${result.cellRevision}`);
    if (result.metadata?.confidence !== undefined) {
      console.log(`   Confidence: ${(result.metadata.confidence * 100).toFixed(1)}%`);
    }
    if (result.metadata?.candidates && result.metadata.candidates.length > 0) {
      console.log(`   Alternatives: ${result.metadata.candidates.join(', ')}`);
    }
    process.exit(0);
  } else {
    console.log('❌ FAILED!');
    console.log(`   Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});