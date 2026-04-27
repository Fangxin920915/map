import {
  PointCoordinates,
  RouteEditDrawStatus,
  RouteEditEventType,
  RouteLayerSelect,
  RouteLayerType,
  RoutePointType,
} from "@gdu-gl/common";

/**
 * 编辑事件的公共参数
 */
export interface EventCommonParams {
  type: RouteEditEventType;
  idx?: number;
  parentsIdx?: number;
}

export interface RouteLayerCommonEvent {
  /**
   * 开始绘制
   */
  (event: "startDraw"): void;
  (event: "update:select", params: RouteLayerSelect): void;
  (event: "takeoffChanged", params: PointCoordinates): void;
}

export interface RouteActiveFeature {
  type: RoutePointType | null;
  index: number;
  parentsIdx?: number;
}

export interface RouteEditDataInfo {
  altPress: boolean;
  hover: RouteActiveFeature;
  drawStatus: RouteEditDrawStatus;
}

/**
 * 使用航线编辑的类型数组
 */
export const wayPointTypes = [RouteLayerType.MapProjectTypePoint];

/**
 * 使用区域编辑的类型数组
 */
export const areaEditTypes = [
  RouteLayerType.MapProjectType2D,
  RouteLayerType.MapProjectType3D,
  RouteLayerType.MapProjectTypeSnake,
  RouteLayerType.MapProjectTypeOblique,
  RouteLayerType.MapProjectTypeSmartSwing_Five,
  RouteLayerType.MapProjectTypeSmartSwing_Three,
];

/**
 * 使用多区域绘制的类型
 */
export const multiAreaTypes = [RouteLayerType.MapProjectTypeAIRoute];
