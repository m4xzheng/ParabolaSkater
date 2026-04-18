import type { MathPoint } from './parabola';

export type ScreenPoint = { x: number; y: number };

export function createCoordinateMapper(input: {
  width: number;
  height: number;
  origin: ScreenPoint;
  pixelsPerUnit: number;
}) {
  return {
    toScreen(point: MathPoint): ScreenPoint {
      return {
        x: input.origin.x + point.x * input.pixelsPerUnit,
        y: input.origin.y - point.y * input.pixelsPerUnit,
      };
    },
    toMath(point: ScreenPoint): MathPoint {
      return {
        x: Number(((point.x - input.origin.x) / input.pixelsPerUnit).toFixed(4)),
        y: Number(((input.origin.y - point.y) / input.pixelsPerUnit).toFixed(4)),
      };
    },
  };
}
