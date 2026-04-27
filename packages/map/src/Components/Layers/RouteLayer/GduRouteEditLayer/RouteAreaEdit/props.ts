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
export interface RouteAreaChangedParams extends EventCommonParams {
  area: PolygonCoordinates;
}

/**
 * 区域编辑属性
 */
export interface RouteAreaModifyParams
  extends Omit<RouteAreaChangedParams, "type"> {}

export interface RouteAreaEditProps extends Omit<RouteEditLayerProps, "type"> {}

export interface RouteAreaEditEmits extends RouteLayerCommonEvent {
  // (event: "select", params: RouteLayerSelect): void;
  (event: "changed", params: RouteAreaChangedParams): void;
  (event: "startModify", params: RouteAreaModifyParams): void;
}

export interface RouteAreaEditDataInfo extends RouteEditDataInfo {
  modifyAreaLine: LineStringCoordinates;
}
