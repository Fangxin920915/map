import { LineStringCoordinates } from "@gdu-gl/common";
import { FeatureEventEmits, Features } from "../../../../Types";

export interface VectorWallProps extends Features {
  maxHeight?: number;
  minHeight?: number;
  fadeInColor?: string;
  fadeOutColor?: string;
  coordinates?: LineStringCoordinates | null;
}

export interface VectorWallEmits extends FeatureEventEmits {}

export const defaultVectorWallProps = {
  coordinates: [],
  minHeight: 0,
  maxHeight: 100,
  fadeInColor: "rgba(255, 255, 255, 1)",
  fadeOutColor: "rgba(0, 0, 0, 0)",
  visible: true,
  name: "",
};
