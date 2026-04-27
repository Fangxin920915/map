import { PointCoordinates } from "@common/Interfaces";

/**
 * 引擎类型枚举
 * 拓展引擎类型时，拓展此处类型
 */
export enum EngineType {
  CESIUM = 1,
}

/**
 * 引擎初始化参数定义，拓展时定义
 */
// export type EngineOptions = {
//   containerId: HTMLElement | string;
// };

export interface ViewerOptions {
  viewerId: string;
  engineType: EngineType;
  center: PointCoordinates;
  zoom: number;
  heading: number;
  pitch: number;
  mapInitialOptions?: any;
  isArMap?: boolean;
}
