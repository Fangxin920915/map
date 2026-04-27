import { BaseProps } from "../../../Types";

export interface GeoJsonProps extends BaseProps {
  /**
   * 地图中心点
   */
  center?: number[];
  /** 地图层级 */
  zoom?: number;
}

export interface GeoJsonEmits {
  /**
   * 地图创建完毕事件
   *   `map：地图`
   *   `id：地图`
   */
  (event: "ready", map: string, id?: string | number): void;
  /** 地图销毁事件 */
  (event: "destroy"): void;
}
