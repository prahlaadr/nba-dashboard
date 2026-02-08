import { SVG } from './constants';

export interface CoordinateMapper {
  x: (nbaX: number) => number;
  y: (nbaY: number) => number;
  scale: (feet: number) => number;
}

/**
 * Maps NBA shot chart coordinates to SVG viewport coordinates.
 *
 * NBA system: LOC_X [-250, 250], LOC_Y [-52, 418]
 * Basket at (0, 0), court center at (0, 470)
 *
 * SVG system: We render half-court with basket at bottom-center.
 * SVG (0,0) is top-left. Y increases downward.
 *
 * SVG x = nbaX + 250  (shift so -250 maps to 0, 250 maps to 500)
 * SVG y = 470 - (nbaY + 52.5)  (flip Y so basket is at bottom, add offset for below-basket shots)
 */
export function createCoordinateMapper(): CoordinateMapper {
  return {
    x: (nbaX: number) => nbaX + SVG.WIDTH / 2,
    y: (nbaY: number) => SVG.HEIGHT - (nbaY + 52.5),
    scale: (feet: number) => feet * 10, // NBA coords are in tenths of feet
  };
}
