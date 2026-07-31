import { useState, useCallback } from 'react';
import { Stroke } from '../types/stroke';

export const useStrokeHistory = () => {
  const [past, setPast] = useState<Stroke[]>([]);
  const [present, setPresent] = useState<Stroke[]>([]);
  const [future, setFuture] = useState<Stroke[]>([]);

  const addStroke = useCallback((newStroke: Stroke) => {
    setPast((prevPast) => {
      const newPast = [...prevPast, newStroke];
      // Limit history to 50 actions
      if (newPast.length > 50) {
        newPast.shift(); // Remove the oldest
      }
      return newPast;
    });
    setPresent((prevPresent) => [...prevPresent, newStroke]);
    setFuture([]); // Clear redo stack
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return past;
      const newPast = past.slice(0, -1);
      const popped = past[past.length - 1];
      setPresent((prevPresent) => {
        // Remove the popped stroke from present
        const newPresent = [...prevPresent].filter((stroke) => stroke.id !== popped.id);
        setFuture((prevFuture) => [...prevFuture, popped]);
        return newPresent;
      });
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return future;
      const newFuture = future.slice(0, -1);
      const popped = future[future.length - 1];
      setPast((prevPast) => [...past, popped]);
      setPresent((prevPresent) => [...prevPresent, popped]);
      return newFuture;
    });
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    strokes: present,
    addStroke,
    undo,
    redo,
    canUndo,
    canRedo
  };
};