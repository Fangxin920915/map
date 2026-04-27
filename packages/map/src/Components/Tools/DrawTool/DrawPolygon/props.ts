import {
  addAlphaToHexColor,
  MapThemeColor,
  PolygonCoordinates,
} from "@gdu-gl/common";
import { VectorWallProps } from "@map/Components";
import {
  CommonDrawEmits,
  CommonDrawProps,
  defaultCommonProps,
} from "../Common/CommonProps";
import { PolygonProps } from "../../../../Types";

export interface DrawPolygonToolProps extends CommonDrawProps {
  polygonStyle?: Pick<
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

export interface DrawPolygonToolEmits extends CommonDrawEmits {
  /**
   * 完成绘制事件
   * @param e
   * @param value
   */
  (e: "finish", value: PolygonCoordinates): void;
}

export interface EditPolygonToolProps extends DrawPolygonToolProps {
  featureId?: any;
  coordinates: PolygonCoordinates;
}

export interface EditPolygonToolEmits {
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
  (e: "modifyEnd", value: PolygonCoordinates): void;
}

export const defaultDrawPolygonProps = {
  ...defaultCommonProps,
  polygonStyle: {
    fillColor: addAlphaToHexColor(MapThemeColor.brand[500], 0.25),
    strokeColor: MapThemeColor.brand[500],
    strokeWidth: 5,
    strokeOutlineColor: MapThemeColor.neutral[100],
    strokeOutlineWidth: 1,
  },
};

export const defaultEditPolygonProps = {
  ...defaultDrawPolygonProps,
  coordinates: [],
};
