import {
  LineStringCoordinates,
  MeasureStatus,
  MeasureType,
} from "@gdu-gl/common";
import {
  ActionIconStyle,
  BaseProps,
  defaultCommonDrawIconProps,
  DrawIconProps,
} from "../../../Types";

/**
 * 量测数据详细信息
 */
export interface MeasureResult {
  id: string;
  type: MeasureType;
  coordinates: LineStringCoordinates;
  result?: number;
  selected?: boolean;
  measureStatus: MeasureStatus;
}

export interface MeasureToolEmits {
  (event: "update:measureResults", measureResults: MeasureResult[]): void;
  /**
   * 开始测量回调函数
   * @param event
   * @param id 测量id
   */
  (event: "startMeasure", id: string): void;
  /**
   * 结束测量回调函数
   * @param event
   * @param id 测量id
   */
  (event: "finishMeasure", id: string): void;
  /**
   * 取消测量回调函数
   * @param event
   * @param id 测量id
   */
  (event: "cancelDrawing", id: string): void;
}

export interface MeasureLayerEmits {
  (event: "finish"): void;
  (event: "remove"): void;
  (event: "deletePoint", line: LineStringCoordinates): void;
  (event: "insertPoint", line: LineStringCoordinates): void;
  (event: "startModifyPoint", name: string): void;
  (event: "modifyingPoint", line: LineStringCoordinates): void;
  (event: "endModifyPoint"): void;
}

export interface MeasureTypeLayerEmits extends MeasureLayerEmits {
  (event: "select"): void;
  (event: "cancelDrawing"): void;
}

/**
 * 量测图层属性
 */
export interface MeasureLayerProps
  extends MeasureResult,
    DrawIconProps,
    BaseProps {
  groupId: string;
  coordinates: any;
  labelStyle?: ActionIconStyle;
  selectedId: string;
  hoverId: string;
}

export interface MeasureToolProps extends BaseProps, DrawIconProps {
  /**
   * 测量结果数组，包含所有测量数据
   *
   * 每个测量结果包含以下属性：
   * - id: 唯一标识符，用于区分不同的测量结果
   * - type: 测量类型，可以是距离测量或面积测量
   * - coordinates: 测量点的坐标数据，可以是线坐标或多边形坐标
   * - result: 测量结果值，表示距离或面积的具体数值
   * - selected: 表示该测量结果是否被选中
   * - measureStatus: 测量状态，表示测量是开始、进行中还是结束
   */
  measureResults: MeasureResult[];
  /**
   * 标签样式配置，用于自定义测量结果的标签外观
   */
  labelStyle?: ActionIconStyle;
}

export const defaultMeasureToolProps = {
  measureResults: [],
  ...defaultCommonDrawIconProps,
  labelStyle: {
    fillColor: "rgba(45, 45, 46, 0.8)",
    outlineColor: "rgba(136, 136, 143, 0.2)",
    textColor: "#DADADB",
  },
};
