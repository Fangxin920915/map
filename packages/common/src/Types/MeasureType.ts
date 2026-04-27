export const measurementLayerPrefix = "measure-layer_";
export enum PointActionType {
  Turn = "turn",
  Insert = "insert",
  Delete = "delete",
  Finish = "finish",
  Line = "line-string",
  Polygon = "polygon",
}

export enum MeasureType {
  /** 测量距离 */
  Distance = "distance",
  /** 测量面积 */
  Area = "area",
}

export enum MeasureStatus {
  MeasureStart = "measureStart",
  Measuring = "measuring",
  MeasureEnd = "measureEnd",
}
