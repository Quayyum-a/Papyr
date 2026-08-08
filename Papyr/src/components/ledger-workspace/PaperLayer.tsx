import { useEffect } from 'react';
import { LEDGER_CONSTANTS } from '@/types/ledger';

interface PaperLayerProps {
  ctx: CanvasRenderingContext2D | null;
  width: number;
  height: number;
}

/**
 * Renders the paper background with subtle texture
 * This provides the realistic paper feel for the ledger
 */
export function PaperLayer({ ctx, width, height }: PaperLayerProps) {
  useEffect(() => {
    console.log('PaperLayer render:', { ctx: !!ctx, width, height });
    if (!ctx || width === 0 || height === 0) {
      console.warn('PaperLayer: Invalid context or dimensions');
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw paper background color
    ctx.fillStyle = LEDGER_CONSTANTS.PAPER_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Add subtle paper texture using noise
    addPaperTexture(ctx, width, height);
    
    console.log('PaperLayer: Rendered successfully');
  }, [ctx, width, height]);

  return null; // This component only renders to canvas, no DOM output
}

/**
 * Adds subtle paper grain texture to the canvas
 * Uses random noise with very low opacity for realism
 */
function addPaperTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Add subtle noise (3% opacity)
  for (let i = 0; i < pixels.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10; // Range: -5 to +5
    pixels[i] += noise;     // R
    pixels[i + 1] += noise; // G
    pixels[i + 2] += noise; // B
    // Alpha channel (i + 3) unchanged
  }

  ctx.putImageData(imageData, 0, 0);
}
