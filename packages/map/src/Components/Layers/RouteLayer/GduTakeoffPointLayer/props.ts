import { PointCoordinates } from "@gdu-gl/common";
import { RouteCommonProps } from "../../../../Types";

export interface TakeoffPointProps
  extends Omit<RouteCommonProps, "area" | "type"> {
  active?: boolean;
  layerId?: string;
  strokeColor?: string;
  strokeWidth?: 6;
  altPress?: boolean;
  takeoffIconVisible?: boolean;
}

export interface TakeoffPointEmits {
  (event: "changed", params: PointCoordinates): void;
  (event: "startModify"): void;
  (event: "click"): void;
}
