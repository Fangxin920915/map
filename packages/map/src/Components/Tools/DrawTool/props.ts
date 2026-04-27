import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
  GeoFeatureType,
} from "@gdu-gl/common";
import { DrawLineStringToolProps } from "./DrawLineString/props";
import { DrawPolygonToolProps } from "./DrawPolygon/props";
import { CommonDrawProps } from "./Common/CommonProps";

export interface DrawToolProps extends CommonDrawProps {
  style?:
    | Pick<DrawPolygonToolProps, "polygonStyle">
    | Pick<DrawLineStringToolProps, "lineStringStyle">;
}

export interface DrawToolEmits {
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
    value: {
      type: GeoFeatureType;
      coordinates:
        | PointCoordinates
        | LineStringCoordinates
        | PolygonCoordinates;
      radius?: number;
    },
  ): void;
}
