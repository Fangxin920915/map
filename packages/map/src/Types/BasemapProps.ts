import { BaseProps } from "./BaseProps";

export interface BasemapProps extends BaseProps {
  /**
   * 底图请求url
   */
  url: string;
  /**
   * 底图可见性
   */
  visible?: boolean;
  /**
   * 地图显示顺序
   */
  zIndex?: number;
  /**
   * 投影坐标
   */
  projection?: string;
  /**
   * 图层范围
   */
  extent?: number[];
  /**
   * 图层最小请求瓦片层级
   */
  minZoom?: number;
  /**
   * 图层最大请求瓦片层级
   */
  maxZoom?: number;
  /**
   * 图层透明度
   */
  alpha?: number;
}

export const defaultBasemapProps = {
  url: "",
  visible: true,
  alpha: 1,
  maxZoom: 18,
  minZoom: 0,
  zIndex: 0,
  extent: [-180, -90, 180, 90],
  projection: "EPSG:3857",
};
