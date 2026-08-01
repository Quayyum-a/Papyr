import { useState, useCallback } from 'react';
import { Stroke } from '../types/stroke';

export const useStrokeHistory = () => {
  const [state, setState] = useState({
    past: [] as Stroke[],
    present: [] as Stroke[],
    future: [] as Stroke[]
  });

  const addStroke = useCallback((newStroke: Stroke) => {
    setState(prev => {
      const newPast = [...prev.past, ...prev.present];
      if (newPast.length > 50) newPast.shift();
      return {
        past: newPast,
        present: [newStroke],
        future: []
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.past.length === 0) return prev;
      const newPast = prev.past.slice(0, -1);
      const popped = prev.past[prev.past.length - 1];
      return {
        past: newPast,
        present: prev.present.filter(stroke => stroke.id !== popped.id),
        future: [popped, ...prev.future]
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev;
      const popped = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        past: [...prev.past, popped],
        present: prev.present.filter(stroke => stroke.id !== popped.id),
        future: newFuture
      };
    });
  }, []);

  return {
    strokes: state.present,
    addStroke,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0
  };
};
