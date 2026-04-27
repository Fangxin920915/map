import {
  Anchor,
  ModifyType,
  MultiPointCoordinates,
  PointCoordinates,
  ShapeType,
} from "@gdu-gl/common";
import { FeatureEventEmits, PointProps } from "../../../../Types";

export interface VectorPointProps extends PointProps {
  /**
   * 编辑方式
   * - `horizontal`: 水平方向拖动，高度不变
   * - `vertical`: 垂直方向拖动，经纬度不变
   * - `ground`: 贴着地表拖动，高度不变
   */
  modifyType?: ModifyType;
  /**
   * 是否允许编辑
   */
  enableModify?: boolean;
  /** 点的经纬度，必传 */
  coordinates?: PointCoordinates | null;
}

export interface VectorMultiPointProps extends PointProps {
  /** 点的经纬度，必传 */
  coordinates?: MultiPointCoordinates | null;
}

export interface VectorMultiPointEmits extends FeatureEventEmits {}

/**
 * vector 图层事件
 */
export interface VectorPointEmits extends FeatureEventEmits {
  /**
   * 更新坐标点 <br>
   * `返回值：更新后的坐标`
   */
  (event: "update:coordinates", coordinates: PointCoordinates): void;
  /**
   * 开始编辑要素事件
   */
  (event: "modifyStart"): void;
  /**
   * 要素编辑中事件
   */
  (event: "modifying", coordinates: PointCoordinates): void;
  /**
   * 鼠标划出要素
   */
  (event: "modifyEnd", coordinates: PointCoordinates): void;
}

export const singlePointProps = {
  enableModify: false,
  modifyType: "horizontal" as ModifyType,
};

export const defaultVectorPointProps = {
  anchor: "center-center" as Anchor,
  textAnchor: "center-center" as Anchor,
  shapeType: "circle" as ShapeType,
  shapeOutlineColor: "#FFFFFF",
  shapeOutlineWidth: 2,
  shapeFillColor: "#409EFF",
  shapeSize: 20,
  coordinates: undefined,
  offset: [0, 0],
  visible: true,
  iconSrc: "",
  text: "",
  textSize: 16,
  textFontWeight: "normal",
  textColor: "#FFFFFF",
  textOffset: [0, 0],
  iconWidth: 20,
  iconHeight: 20,
  textBackgroundPadding: [4, 3] as [number, number],
  textBackgroundRadius: 0,
  textBackgroundBorderWidth: 0,
  textBackgroundBorderColor: "#FFFFFF",
  disableDepthTestDistance: Number.POSITIVE_INFINITY,
};
