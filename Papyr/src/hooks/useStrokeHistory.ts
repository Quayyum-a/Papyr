import { useCallback, useState } from 'react';
import { Stroke } from '../types/stroke';

export const useStrokeHistory = () => {
  const [history, setHistory] = useState<{
    past: Stroke[];
    present: Stroke[];
    future: Stroke[];
  }>({
    past: [],
    present: [],
    future: [],
  });

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const addStroke = useCallback((stroke: Stroke) => {
    setState((state) => {
      const newPast = [...state.past, stroke];
      // Limit history to 50 actions
      if (newPast.length > 50) {
        newPast.shift();
      }
      return {
        past: newPast,
        present: [...state.present, stroke],
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((state) => {
      if (state.past.length === 0) return state;
      const newPast = state.past.slice(0, -1);
      const popped = state.past[state.past.length - 1];
      const newPresent = state.present.filter((s) => s.id !== popped.id);
      return {
        past: newPast,
        present: newPresent,
        future: [...state.future, popped],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((state) => {
      if (state.future.length === 0) return state;
      const newFuture = state.future.slice(0, -1);
      const popped = state.future[state.future.length - 1];
      return {
        past: [...state.past, popped],
        present: [...state.present, popped],
        future: newFuture,
      };
    });
  }, []);

  return {
    strokes: history.present,
    addStroke,
    undo,
    redo,
    canUndo,
    canRedo,
  };
};