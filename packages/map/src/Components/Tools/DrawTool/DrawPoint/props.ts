import { PointCoordinates } from "@gdu-gl/common";
import { PointProps } from "@map/Types";
import {
  CommonDrawEmits,
  CommonDrawProps,
  defaultCommonProps,
} from "../Common/CommonProps";

export interface DrawPointToolProps
  extends Pick<
    CommonDrawProps,
    "layerId" | "message" | "viewId" | "clampToGround"
  > {}

export interface DrawPointToolEmits extends CommonDrawEmits {
  /**
   * 完成绘制事件
   * @param e
   * @param value
   */
  (e: "finish", value: PointCoordinates): void;
}

export interface EditPointToolProps extends DrawPointToolProps {
  pointStyle?: Omit<
    PointProps,
    | "coordinates"
    | "name"
    | "visible"
    | "clampToGround"
    | "featureProperties"
    | "disableDepthTestDistance"
  >;
  altPress?: boolean;
  coordinates?: PointCoordinates;
  featureId?: any;
}

export interface EditPointToolEmits {
  /**
   * 编辑开始事件
   * @param e 事件名 "modifyStart"
   * 触发时机：用户开始拖拽编辑线串顶点时
   */
  (e: "modifyStart"): void;
  /**
   * 编辑完成事件
   * @param e 事件名 "modifyEnd"
   * @param value 编辑完成后的线串坐标数组
   * 触发时机：用户结束拖拽或完成编辑操作时
   */
  (e: "modifyEnd", value: PointCoordinates): void;
}

export const defaultDrawPointProps = {
  message: defaultCommonProps.message,
};

export const defaultEditPointProps = {
  message: defaultCommonProps.message,
  pointStyle: {
    shapeOutlineColor: "#FFFFFF",
    shapeOutlineWidth: 2,
    shapeFillColor: "#409EFF",
    shapeSize: 20,
  },
  altPress: false,
};
