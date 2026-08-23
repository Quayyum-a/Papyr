import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { recognizeWithMyScript } from '@/lib/recognition/myscript-client';
import type { RecognizeRequest, RecognizeResponse } from '@/lib/recognition/types';

interface RecognizeRequestBody {
  bookId: string;
  pageId: string;
  cellId: string;
  cellCoords: { columnIndex: number; rowIndex: number };
  columnType?: 'text' | 'number' | 'date';
  columnLabel?: string;
  strokes: Array<{
    id: string;
    tool: 'pen' | 'eraser';
    color: string;
    size: string;
    segments: Array<{
      p0: [number, number];
      p1: [number, number];
      p2: [number, number];
      p3: [number, number];
      widthStart: number;
      widthEnd: number;
      pressureStart: number;
      pressureEnd: number;
    }>;
    createdAt: number;
    bounds: { minX: number; minY: number; maxX: number; maxY: number };
    cell_id?: string | null;
  }>;
  cellRevision: number;
  language?: string;
}

/**
 * POST /api/ink/recognize
 *
 * Recognizes handwritten text from a cell's strokes using MyScript.
 * Requires authentication via Supabase session.
 * Validates that the user owns the book/page/cell.
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

  // Parse request body
  let body: RecognizeRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request_body' }, { status: 400 });
  }

  const {
    bookId,
    pageId,
    cellId,
    cellCoords,
    columnType,
    columnLabel,
    strokes,
    cellRevision,
    language = 'en_US',
  } = body;

  // Validate required fields
  if (!bookId || !pageId || !cellId || !cellCoords || !strokes || cellRevision === undefined) {
    return NextResponse.json(
      { error: 'missing_required_fields' },
      { status: 400 }
    );
  }

  // Verify user owns this book (RLS will also enforce this, but explicit check is cleaner)
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('id')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: 'book_not_found' }, { status: 404 });
  }

  // Verify page belongs to book
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('id, content')
    .eq('id', pageId)
    .eq('book_id', bookId)
    .single();

  if (pageError || !page) {
    return NextResponse.json({ error: 'page_not_found' }, { status: 404 });
  }

  // Verify cell revision matches current state (optimistic locking)
  const pageContent = page.content as {
    strokes?: Array<{ cell_id?: string; id: string }>;
    cells?: Record<string, { recognitionRevision?: number }>;
  };

  const currentCellStrokes = pageContent.strokes?.filter(s => s.cell_id === cellId) || [];
  const currentRevision = currentCellStrokes.length; // Simple revision = stroke count

  // Note: We don't strictly enforce revision match here because:
  // 1. The client sends the revision it's recognizing
  // 2. The client handles stale result rejection
  // 3. Server could optionally reject if revision differs significantly
  // For now, we trust the client's revision and let client handle race conditions

  // Filter out eraser strokes - only recognize pen strokes
  const penStrokes = strokes.filter(s => s.tool === 'pen');

  if (penStrokes.length === 0) {
    return NextResponse.json({
      success: true,
      recognizedText: '',
      cellRevision,
      metadata: { jiix: null },
    });
  }

  // Convert strokes to the format expected by MyScript client
  const myscriptStrokes = penStrokes.map(s => ({
    id: s.id,
    tool: s.tool,
    color: s.color,
    size: s.size as 'extra-fine' | 'fine' | 'medium' | 'bold' | 'marker',
    segments: s.segments.map(seg => ({
      p0: seg.p0,
      p1: seg.p1,
      p2: seg.p2,
      p3: seg.p3,
      widthStart: seg.widthStart,
      widthEnd: seg.widthEnd,
      pressureStart: seg.pressureStart,
      pressureEnd: seg.pressureEnd,
    })),
    createdAt: s.createdAt,
    bounds: s.bounds,
    cell_id: s.cell_id,
  }));

  const recognizeRequest: RecognizeRequest = {
    bookId,
    pageId,
    cellId,
    cellCoords,
    columnType,
    columnLabel,
    strokes: myscriptStrokes,
    cellRevision,
    language,
  };

  // Call MyScript recognition
  const result: RecognizeResponse = await recognizeWithMyScript(recognizeRequest);

  // Return result
  const statusCode = result.success ? 200 : 503;
  return NextResponse.json(result, { status: statusCode });
}