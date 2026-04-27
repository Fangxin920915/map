import { LineStringCoordinates, PolygonCoordinates } from "@gdu-gl/common";
import { RouteEditLayerProps } from "../props";
import {
  EventCommonParams,
  RouteEditDataInfo,
  RouteLayerCommonEvent,
} from "../common/types/EventCommonParams";

/**
 * 区域数据变更属性
 */
export interface AiRouteChangedParams extends EventCommonParams {
  area: PolygonCoordinates[];
}

/**
 * 区域编辑属性
 */
export interface AiRouteModifyParams
  extends Omit<AiRouteChangedParams, "type"> {}

export interface AiRouteEditProps extends Omit<RouteEditLayerProps, "type"> {}

export interface AiRouteEditEmits extends RouteLayerCommonEvent {
  // (event: "select", params: RouteLayerSelect): void;
  (event: "changed", params: AiRouteChangedParams): void;
  (event: "startModify", params: AiRouteModifyParams): void;
}

export interface AiRouteEditDataInfo extends RouteEditDataInfo {
  modifyMultiAreaLine: LineStringCoordinates[];
}
