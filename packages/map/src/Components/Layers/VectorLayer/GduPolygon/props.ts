import { MultiPolygonCoordinates, PolygonCoordinates } from "@gdu-gl/common";
import { omit } from "lodash-es";
import { defaultVectorLineStringProps } from "../GduLineString";
import { FeatureEventEmits, PolygonProps } from "../../../../Types";

export interface VectorPolygonProps extends PolygonProps {
  /** 面的经纬度数组，必传（收尾需要形成闭合） */
  coordinates?: PolygonCoordinates | MultiPolygonCoordinates | null;
  height?: number;
  extrudedHeight?: number;
}

/**
 * vector 图层事件
 */
export interface VectorPolygonEmits extends FeatureEventEmits {}

export const defaultVectorPolygonProps = {
  fillColor: "rgba(64,158,255,0.6)",
  ...omit(defaultVectorLineStringProps, ["ring"]),
  height: 0,
  extrudedHeight: 0,
};
