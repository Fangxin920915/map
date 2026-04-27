import {
  LineStringCoordinates,
  MapThemeColor,
  MultiLineStringCoordinates,
} from "@gdu-gl/common";
import { FeatureEventEmits, LineStringProps } from "../../../../Types";

export interface VectorLineStringProps extends LineStringProps {
  /** 线的经纬度数组，必传 */
  coordinates?: LineStringCoordinates | MultiLineStringCoordinates | null;
}

/**
 * vector 图层事件
 */
export interface VectorLineStringEmits extends FeatureEventEmits {}

export const defaultVectorLineStringProps = {
  strokeColor: MapThemeColor.brand[500],
  strokeWidth: 6,
  strokeGapColor: "transparent",
  strokeOutlineColor: "#FFF",
  strokeOutlineWidth: 0,
  lineDash: [],
  coordinates: [],
  visible: true,
  ring: false,
};
