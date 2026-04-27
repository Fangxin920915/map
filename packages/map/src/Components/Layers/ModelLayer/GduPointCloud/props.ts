import { BaseProps } from "../../../../Types";

export interface PointCloudShadingOptions {
  /** 是否启用点云衰减效果，根据距离自动调整点大小 */
  attenuation?: boolean;
  /** 几何误差对应的点大小缩放因子 */
  geometricErrorScale?: number;
  /** 最大衰减距离（超过此距离后点不再缩小），单位为像素 */
  maximumAttenuation?: number;
  /** 基础分辨率（当几何误差为0时使用的点间距） */
  baseResolution?: number;
  /** 是否启用Eye Dome Lighting效果，增强点云深度感知 */
  eyeDomeLighting?: boolean;
  /** Eye Dome Lighting强度 */
  eyeDomeLightingStrength?: number;
  /** Eye Dome Lighting半径 */
  eyeDomeLightingRadius?: number;
}

export interface PointCloudFeatureProps extends BaseProps {
  /** 点位名称 */
  name?: number | string;
  /** 该要素的可见性 */
  visible?: boolean;
  /** 点云数据的url地址（3D Tiles格式），必传 */
  url?: string;
  /** 自动定位到点云数据位置 */
  autoZoom?: boolean;
  /** 最大屏幕空间误差，控制点云精细度，值越小越精细（默认16） */
  maximumScreenSpaceError?: number;
  /** 最大加载瓦片数 */
  maximumNumberOfLoadedTiles?: number;
  /** 点云渲染设置 */
  pointCloudShading?: PointCloudShadingOptions;
  /**
   * 点云样式表达式，用于自定义点的颜色和大小
   * @example { color: "color('red')", pointSize: "5" }
   */
  style?: {
    color?: string;
    pointSize?: string;
    show?: string;
  };
}

export const defaultPointCloudFeatureProps = {
  url: "",
  visible: true,
  name: "",
  autoZoom: false,
  maximumScreenSpaceError: 16,
  maximumNumberOfLoadedTiles: undefined,
  pointCloudShading: undefined,
  style: undefined,
};
