import {
  ElectronicFenceFeature,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { omit } from "lodash-es";
import {
  VectorPointProps,
  VectorPolygonProps,
  VectorWallProps,
} from "@map/Components";
import {
  BaseProps,
  defaultPromptMessageConfiguration,
  PromptMessageConfiguration,
} from "../../../Types";

/**
 * 通过dataSource生成的电子围栏的最终样式，包含划入、划出、选中
 */
export interface ElectronicFenceFeatureStyle {
  id: string | number;
  height?: number;
  featureInfo: ElectronicFenceFeatureInfo;
  pointStyle: VectorPointProps;
  polygonStyle: VectorPolygonProps;
  wallStyle: VectorWallProps;
}

/**
 * 围栏数据包含中心坐标
 */
export interface ElectronicFenceFeatureWithCenter
  extends ElectronicFenceFeature {
  featureInfo: ElectronicFenceFeatureInfo;
  centerCoordinates: PointCoordinates;
}

/**
 * 围栏数据，用来标识围栏类型和id
 */
export interface ElectronicFenceFeatureInfo {
  id?: string | number | null;
  type?: RoutePointType | null;
}

export interface ElectronicFenceLayerProps extends BaseProps {
  /**
   * 围栏图层id
   */
  layerId?: string;
  /**
   * 围栏是否可编辑
   */
  enableModify?: boolean;
  /**
   * 围栏是否可选择
   */
  enableSelect?: boolean;
  /**
   * 围栏数据
   */
  dataSource: ElectronicFenceFeature[];
  /**
   * 选中的围栏id
   */
  selectId?: string | number | null;
  /**
   * 围栏提示信息
   */
  message?: Omit<PromptMessageConfiguration, "confirmTextDeleteTurnStr">;
}

export interface ElectronicFenceLayerEmits {
  /**
   * ### 功能描述
   * 选中围栏id变化事件
   *
   * ### 回传参数
   * ```
   * function(value:当前选中围栏id){}
   * ```
   */
  (event: "update:selectId", value?: string | number | null): void;
  /**
   * ### 功能描述
   * 围栏数据集发生变化事件
   *
   * ### 回传参数
   * ```
   * function(value:当前选中围栏id){}
   * ```
   */
  (event: "update:dataSource", value: ElectronicFenceFeature[]): void;
  /**
   * ### 功能描述
   * 开始绘制围栏事件
   */
  (event: "startDraw"): void;
  /**
   * ### 功能描述
   * 取消绘制围栏事件
   */
  (event: "cancelDraw"): void;
  /**
   * ### 功能描述
   * 取消绘制围栏事件
   *
   * ### 回传参数
   * ```
   * function(value:绘制完成的围栏数据){}
   * ```
   */
  (event: "finishDraw", value: ElectronicFenceFeature): void;
  /**
   * ### 功能描述
   * 开始编辑围栏事件
   *
   * ### 回传参数
   * ```
   * function(id:围栏id,value:编辑前的数据){}
   * ```
   */
  (
    event: "startModify",
    id: string | number,
    value: ElectronicFenceFeature,
  ): void;

  /**
   * ### 功能描述
   * 完成编辑围栏事件
   *
   * ### 回传参数
   * ```
   * function(id:围栏id,value:编辑完成后的数据,dataSource:更新后围栏数据集){}
   * ```
   */
  (
    event: "finishModify",
    id: string | number,
    value: ElectronicFenceFeature,
    dataSource: ElectronicFenceFeature[],
  ): void;
}

export const defaultElectronicFenceLayerProps = {
  dataSource: [],
  selectId: null,
  enableModify: false,
  enableSelect: true,
  message: {
    ...omit(defaultPromptMessageConfiguration, ["confirmTextDeleteTurnStr"]),
  },
};
