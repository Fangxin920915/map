import {
  MarkerFeature,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { omit } from "lodash-es";
import {
  BaseProps,
  defaultPromptMessageConfiguration,
  PromptMessageConfiguration,
} from "../../../Types";

export interface MarkerFeatureInfo {
  id: string | null | undefined;
  type: RoutePointType | null;
}

export interface MarkerMessage
  extends Omit<PromptMessageConfiguration, "confirmTextDeleteTurnStr"> {
  aiMouseTooltip?: string;
}

export interface MarkerLayerProps extends BaseProps {
  /**
   * 标注图层id
   */
  layerId?: string;
  /**
   * ### 标注数据集
   * 标注图层的数据源，包含多个地理要素对象。
   * 每个对象代表一个地理要素，如点、线、多边形等，包含几何信息和属性信息。
   * 几何信息描述要素的空间形状，属性信息包含要素的唯一标识和不同状态下的样式配置。
   *
   * ### 示例数据格式：
   * 参考下示例数据
   */
  dataSource: MarkerFeature[];
  /**
   * 选中的标注id
   */
  selectIds?: string[] | null;
  /**
   * 是否使用AI管理鼠標樣式
   */
  enableAiMouseStyle?: boolean;
  /**
   * 是否允许选中编辑,(在允许编辑时，请将enableMultiSelect设置为false)
   */
  enableModify?: boolean;
  /**
   * 是否允许多选
   */
  enableMultiSelect?: boolean;
  /**
   * 是否固定到地面
   */
  clampToGround?: boolean;
  message?: MarkerMessage;
}

export interface MarkerLayerEmits {
  /**
   * ### 功能描述
   * 双向绑定选中id事件, 如果enableModify为true，该要素会展示成编辑状态
   */
  (event: "update:selectIds", value?: string[] | null): void;
  /**
   * ### 功能描述
   * 双向绑定选中dataSource, 选中dataSource改变时触发
   */
  (event: "update:dataSource", value: MarkerFeature[]): void;
  /**
   * ### 功能描述
   * 开始绘制时触发事件
   */
  (event: "startDraw"): void;
  /**
   * ### 功能描述
   * 取消绘制时触发事件，例：按下esc触发该事件
   */
  (event: "cancelDraw"): void;
  /**
   * ### 功能描述
   * 绘制完成时触发事件
   * ### 回传参数
   * ```
   * function(value:当前新增标注要素){}
   * ```
   */
  (event: "finishDraw", value: MarkerFeature): void;
  /**
   * ### 功能描述
   * 开始编辑时触发事件
   *
   * ### 回传参数
   * ```
   * function(id:当前编辑标注要素id,value:当前编辑标注要素){}
   * ```
   */
  (event: "startModify", id: string | number, value: MarkerFeature): void;
  /**
   * ### 功能描述
   * 完成编辑时触发事件
   *
   * ### 回传参数
   * ```
   * function(id:当前编辑标注要素id,value:当前编辑标注要素,dataSource:更新后的数据集){}
   * ```
   */
  (
    event: "finishModify",
    id: string | number,
    value: MarkerFeature,
    dataSource: MarkerFeature[],
  ): void;
  /**
   * ### 功能描述
   * 鼠标移动时触发事件
   *
   * ### 回传参数
   * ```
   * function(coordinates:当前鼠标位置;markerFeature:{id:当前标注要素id,feature:当前标注要素}){}
   * ```
   */
  (
    event: "mouseMove",
    coordinates: PointCoordinates | null | undefined,
    markerFeature: MarkerFeature | null | undefined,
  ): void;
}

export const defaultMarkerLayerProps = {
  dataSource: [],
  selectIds: null,
  enableModify: false,
  enableMultiSelect: false,
  enableAiMouseStyle: false,
  message: {
    ...omit(defaultPromptMessageConfiguration, ["confirmTextDeleteTurnStr"]),
    aiMouseTooltip: "选择标注",
  },
};
