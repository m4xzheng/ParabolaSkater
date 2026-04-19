import { useEffect, useRef } from 'react';

import { drawLevel } from '../render/drawLevel';
import type { LevelId, LevelTwoParameters, SimulationResult } from '../sim/types';
import type { SessionPhase } from '../state/feedback';

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 480;

export function GameCanvas(props: {
  activeLevel: LevelId;
  aValue: number;
  levelTwoParameters: LevelTwoParameters;
  ghostResults: SimulationResult[];
  playbackProgress: number;
  phase: SessionPhase;
  showGhostTrails: boolean;
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
      activeLevel: props.activeLevel,
      a: props.aValue,
      levelTwoParameters: props.levelTwoParameters,
      ghostResults: props.ghostResults,
      playbackProgress: props.playbackProgress,
      phase: props.phase,
      showGhostTrails: props.showGhostTrails,
      simulationResult: props.simulationResult,
    });
  }, [
    props.activeLevel,
    props.aValue,
    props.ghostResults,
    props.levelTwoParameters,
    props.playbackProgress,
    props.phase,
    props.showGhostTrails,
    props.simulationResult,
  ]);

  return (
    <figure className="game-canvas-frame">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="抛物线关卡画布"
      />
      <figcaption className="game-canvas-caption">
        看滑手从左侧平台出发，沿着抛物线滑道穿过谷底，滑向右侧目标平台。
      </figcaption>
    </figure>
  );
}
