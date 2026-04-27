import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
  RoutePointStyle,
} from "@gdu-gl/common";
import {
  BaseProps,
  defaultPromptMessageConfiguration,
  PromptMessageConfiguration,
} from "../../../../Types";

export interface CommonDrawProps extends BaseProps {
  /**
   * 转折点的样式
   */
  turnPointStyle?: {
    normal: RoutePointStyle;
    hover: RoutePointStyle;
    select: RoutePointStyle;
  };
  /**
   * 自相交时，线的颜色
   */
  errorColor?: string;
  /**
   * 国际化需要的文字
   */
  message?: PromptMessageConfiguration;
  layerId?: string;
  clampToGround?: boolean;
}
export interface CommonDrawEmits {
  /**
   * 开始绘制事件
   * @param e
   */
  (e: "start"): void;
  /**
   * 取消绘制事件
   * @param e
   */
  (e: "cancel"): void;
  /**
   * 完成绘制事件
   * @param e
   * @param value
   */
  (
    e: "finish",
    value: PointCoordinates | PolygonCoordinates | LineStringCoordinates,
  ): void;
}

export const defaultCommonProps = {
  errorColor: "#E14545",
  message: defaultPromptMessageConfiguration,
  turnPointStyle: {
    normal: {
      fillColor: "#F9DCD0",
      outlineColor: "#4A2418",
      textColor: "white",
    },
    hover: {
      fillColor: "#E67341",
      outlineColor: "#4A2418",
      textColor: "white",
    },
    select: {
      fillColor: "#E05012",
      outlineColor: "#4A2418",
      textColor: "white",
    },
  },
};
