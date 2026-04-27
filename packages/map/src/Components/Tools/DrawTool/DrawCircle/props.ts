import { PolygonProps } from "@map/Types";
import {
  addAlphaToHexColor,
  MapThemeColor,
  PointCoordinates,
} from "@gdu-gl/common";
import { VectorWallProps } from "@map/Components";
import {
  CommonDrawEmits,
  CommonDrawProps,
  defaultCommonProps,
} from "../Common/CommonProps";

export interface DrawCircleToolProps extends CommonDrawProps {
  circleStyle?: Pick<
    PolygonProps,
    | "strokeOutlineWidth"
    | "strokeOutlineColor"
    | "fillColor"
    | "strokeColor"
    | "strokeWidth"
    | "lineDash"
    | "strokeGapColor"
  >;
  wallStyle?: Pick<
    VectorWallProps,
    "fadeInColor" | "fadeOutColor" | "maxHeight" | "minHeight"
  >;
}

export interface DrawCircleToolEmits extends CommonDrawEmits {
  /**
   * 完成绘制事件
   * @param e
   * @param value
   * @param radius
   */
  (e: "finish", value: PointCoordinates, radius: number): void;
}

export interface EditCircleToolProps extends DrawCircleToolProps {
  featureId?: any;
  coordinates: PointCoordinates;
  radius: number;
}

/**
 * 编辑圆形工具的事件回调接口定义
 * 用于定义圆形绘制和编辑过程中触发的事件类型及参数
 */
export interface EditCircleToolEmits {
  /**
   * 圆形编辑开始时触发的事件
   * 通常在用户开始拖动圆形控制点或调整大小时触发
   */
  (e: "modifyStart"): void;

  /**
   * 圆形编辑结束时触发的事件
   * @param e - 事件名称，固定为 "modifyEnd"
   * @param value - 圆形的多边形坐标数组，包含构成圆形的顶点坐标
   * @param radius - 圆形的半径值（单位：像素）
   */
  (e: "modifyEnd", value: PointCoordinates, radius: number): void;
}

export const DrawCircleTextPadding = [3, 1];

export const defaultDrawCircleProps = {
  ...defaultCommonProps,
  circleStyle: {
    fillColor: addAlphaToHexColor(MapThemeColor.brand[500], 0.25),
    strokeColor: MapThemeColor.brand[500],
    strokeWidth: 5,
    strokeOutlineColor: MapThemeColor.neutral[100],
    strokeOutlineWidth: 1,
  },
};

export const defaultEditCircleProps = {
  ...defaultDrawCircleProps,
  radius: 0,
};
