import { LineStringCoordinates, MapThemeColor } from "@gdu-gl/common";
import { FeatureEventEmits, LineStringProps } from "../../../../Types";

export interface ArrowLineStringProps
  extends Omit<LineStringProps, "lineDash"> {
  /** 线的经纬度数组，必传 */
  coordinates?: LineStringCoordinates;
  /**
   * 箭头线进度
   */
  progress?: number;
  /**
   * 箭头线进度颜色
   */
  progressColor?: string;
}

/**
 * vector 图层事件
 */
export interface ArrowLineStringEmits extends FeatureEventEmits {}

export const defaultArrowLineStringProps = {
  strokeColor: MapThemeColor.success[500],
  strokeWidth: 6,
  strokeOutlineColor: MapThemeColor.success[900],
  strokeOutlineWidth: 0,
  coordinates: [],
  visible: true,
  ring: false,
  progress: 0,
  progressColor: MapThemeColor.neutral[400],
};
