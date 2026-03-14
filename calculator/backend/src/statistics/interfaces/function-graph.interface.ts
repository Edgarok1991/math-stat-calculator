export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface FunctionGraph2DResult {
  points: Point2D[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface FunctionGraph3DResult {
  points: Point3D[];
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
}

