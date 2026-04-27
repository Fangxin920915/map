import { PointCoordinates } from "./IGeojson";

/**
 * 高度查询接口
 * 继承自 IBase 的 destroy 方法
 * 查询坐标高度查询
 */
export interface IQueryAltitudes {
  getHeight(coordinates: PointCoordinates): number | undefined;
}
