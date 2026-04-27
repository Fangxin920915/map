import { LinePointAction } from "@gdu-gl/common";
import {
  EventCommonParams,
  RouteEditDataInfo,
  RouteLayerCommonEvent,
} from "../common/types/EventCommonParams";
import { RouteEditLayerProps } from "../props";

export interface WayPointEditProps
  extends Omit<RouteEditLayerProps, "type" | "area"> {
  line?: LinePointAction[];
}

export interface WayPointChangedParams extends EventCommonParams {
  line: LinePointAction[];
}

export interface WayPointModifyParams
  extends Omit<WayPointChangedParams, "type"> {}

export interface WayPointEditEmits extends RouteLayerCommonEvent {
  // (event: "select", params: RouteLayerSelect): void;
  (event: "changed", params: WayPointChangedParams): void;
  (event: "startModify", params: WayPointModifyParams): void;
}

export interface WayPointDataInfo extends RouteEditDataInfo {
  modifyLine: LinePointAction[];
  selectDeleteIndex: number;
}
