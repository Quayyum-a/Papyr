import { useCallback, useState } from 'react';
import { StrokeRenderer } from '../lib/ink-engine/stroke-renderer';
import type { RawPoint, Stroke, PenSize, PenConfig, StrokeSegment } from '../lib/ink-engine/types';
import { PEN_CONFIGS } from '../lib/ink-engine/types';
import { v4 as uuidv4 } from 'uuid';

interface InkEngineState {
  strokes: Stroke[];
  history: Stroke[][];
  historyIndex: number;
  currentPenSize: PenSize;
  currentColor: string;
}

export function useInkEngine() {
  const [state, setState] = useState<InkEngineState>({
    strokes: [],
    history: [[]],
    historyIndex: 0,
    currentPenSize: 'medium',
    currentColor: '#000000',
  });

  const createStroke = useCallback(
    (points: RawPoint[]): Stroke => {
      const penConfig: PenConfig = {
        ...PEN_CONFIGS[state.currentPenSize],
        color: state.currentColor,
      };

      const renderer = new StrokeRenderer(penConfig);
      const segments = renderer.renderStroke(points);

      const bounds = {
        minX: Math.min(...points.map(p => p.x)),
        minY: Math.min(...points.map(p => p.y)),
        maxX: Math.max(...points.map(p => p.x)),
        maxY: Math.max(...points.map(p => p.y)),
      };

      return {
        id: uuidv4(),
        tool: 'pen',
        color: state.currentColor,
        size: state.currentPenSize,
        segments,
        createdAt: Date.now(),
        bounds,
      };
    },
    [state.currentPenSize, state.currentColor]
  );

  const addStroke = useCallback(
    (stroke: Stroke) => {
      setState(prev => {
        const newStrokes = [...prev.strokes, stroke];
        const newHistory = prev.history.slice(0, prev.historyIndex + 1);
        newHistory.push(newStrokes);

        return {
          ...prev,
          strokes: newStrokes,
          history: newHistory,
          historyIndex: newHistory.length - 1,
        };
      });
    },
    []
  );

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex <= 0) return prev;
      const newIndex = prev.historyIndex - 1;
      return {
        ...prev,
        strokes: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const newIndex = prev.historyIndex + 1;
      return {
        ...prev,
        strokes: prev.history[newIndex],
        historyIndex: newIndex,
      };
    });
  }, []);

  const setPenSize = useCallback((size: PenSize) => {
    setState(prev => ({ ...prev, currentPenSize: size }));
  }, []);

  const setPenColor = useCallback((color: string) => {
    setState(prev => ({ ...prev, currentColor: color }));
  }, []);

  return {
    strokes: state.strokes,
    createStroke,
    addStroke,
    undo,
    redo,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
    setPenSize,
    setPenColor,
    currentPenSize: state.currentPenSize,
    currentColor: state.currentColor,
  };
}
