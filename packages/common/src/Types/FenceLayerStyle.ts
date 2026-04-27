// 导入坐标类型定义（用于描述地理要素的坐标信息）
import { Coordinates } from "@common/Interfaces";
import { GeoFeatureType } from "./MarkerLayerStyle";

export enum ElectronicFenceType {
  /** 禁飞区 */
  NO_FLY = 1,
  /** 高度限制 */
  HEIGHT_LIMIT = 2,
  /** 适飞区 */
  APPROPRIATE_FLY = 3,
}

export interface ElectronicFenceFeatureOption {
  type: ElectronicFenceType;
  height?: number;
  name?: string;
  visible?: boolean;
  disabled?: boolean;
}

/**
 * 标记要素接口
 * 完整描述一个标记要素的结构，包含几何信息和属性信息
 */
export interface ElectronicFenceFeature {
  geometry: {
    type: GeoFeatureType; // 几何类型（必填，指定是圆/面）
    coordinates: Coordinates; // 坐标信息（必填，符合Coordinates类型格式的地理坐标）
    radius?: number; // 圆半径（为圆类型时必填，单位：km ）
  };
  properties: {
    id: string | number;
    options: ElectronicFenceFeatureOption;
  };
}
