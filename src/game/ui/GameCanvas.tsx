import { useEffect, useRef } from 'react';

import type { SimulationResult } from '../sim/types';
import { drawLevel } from '../render/drawLevel';
import type { SessionPhase } from '../state/feedback';

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 480;

export function GameCanvas(props: {
  aValue: number;
  phase: SessionPhase;
  simulationResult: SimulationResult | null;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    const getContext = canvas.getContext?.bind(canvas);

    if (typeof getContext !== 'function') {
      return;
    }

    let context: CanvasRenderingContext2D | null = null;

    try {
      context = getContext('2d');
    } catch {
      context = null;
    }

    if (context === null) {
      return;
    }

    drawLevel(context, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      a: props.aValue,
      phase: props.phase,
      simulationResult: props.simulationResult,
    });
  }, [props.aValue, props.phase, props.simulationResult]);

  return (
    <figure className="game-canvas-frame">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="Parabola level canvas"
      />
      <figcaption className="game-canvas-caption">
        {'\u5de6\u4fa7\u662f\u6ed1\u9053\u89c6\u56fe\uff0c\u53f3\u4fa7\u6559\u5b66\u9762\u677f\u4f1a\u5e2e\u4f60\u89e3\u8bfb a \u7684\u53d8\u5316\u3002'}
      </figcaption>
    </figure>
  );
}
