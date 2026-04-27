import { BaseProps } from "../../../Types";

export interface ARMapProps extends BaseProps {
  /**
   * 像素大小
   */
  pixelSize?: number;
  /**
   * 宽高比
   */
  aspectRatio?: number;
  /**
   * 有效像素数
   */
  effectivePixels?: number;
  /**
   * 实际焦距
   */
  actualFocalLength?: number;
  /**
   * 偏移高度
   */
  offsetHeight?: number;
  /**
   * 场景透明度
   */
  sceneOpacity?: number;
  /**
   * 道路透明度
   */
  roadOpacity?: number;
  /**
   * MVT 地址
   */
  mvtUrl?: string;
  /**
   * DEM 地址
   */
  demUrl?: string;
  /**
   * 地图样式地址
   */
  styleUrl?: string;
}
