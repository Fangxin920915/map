import { WritableComputedRef } from "vue";
import {
  MouseEventParams,
  RouteEditDrawStatus,
  RoutePointType,
  PointCoordinates,
} from "@gdu-gl/common";
import { RouteEditLayerProps } from "../../props";
import {
  RouteActiveFeature,
  RouteEditDataInfo,
  RouteLayerCommonEvent,
} from "../types/EventCommonParams";

export enum RouteEditComponentsType {
  WAYPOINT,
  AREA,
}

export function useTakeoffEvent<T extends RouteEditDataInfo>(
  type: RouteEditComponentsType,
  props: Pick<RouteEditLayerProps, "takeoffSelectLayers">,
  emits: RouteLayerCommonEvent,
  dataInfo: T,
  selectInfo: WritableComputedRef<RouteActiveFeature, RouteActiveFeature>,
) {
  function addTakeoff(params: MouseEventParams) {
    selectInfo.value = {
      type: null,
      index: -1,
      parentsIdx: -1,
    };
    if (type === RouteEditComponentsType.WAYPOINT) {
      (dataInfo as any).selectDeleteIndex = -1;
    }
    let takeoffPoint: PointCoordinates;
    // 如果点击的图层在 takeoffSelectLayers 中，使用 feature 的坐标
    if (
      props.takeoffSelectLayers?.includes(params.layerId ?? "") &&
      params.feature?.geometry?.coordinates
    ) {
      takeoffPoint = params.feature.geometry.coordinates as PointCoordinates;
    } else {
      takeoffPoint = params.coordinates!;
    }
    emits("takeoffChanged", takeoffPoint);
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
    return takeoffPoint;
  }

  function startModifyTakeoff() {
    dataInfo.drawStatus = RouteEditDrawStatus.MODIFY;
    dataInfo.hover = {
      type: RoutePointType.TAKEOFF,
      index: 0,
      parentsIdx: -1,
    };
    selectInfo.value = {
      type: null,
      index: -1,
      parentsIdx: -1,
    };
    if (type === RouteEditComponentsType.WAYPOINT) {
      (dataInfo as any).selectDeleteIndex = -1;
    }
  }

  function endModifyTakeoff(params: PointCoordinates) {
    emits("takeoffChanged", params);
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
  }

  function resetTakeoff() {
    // selectInfo.value = {
    //   type: null,
    //   index: -1,
    // };
    // if (type === RouteEditComponentsType.WAYPOINT) {
    //   (dataInfo as any).selectDeleteIndex = -1;
    // }
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_TAKEOFF;
  }

  return {
    addTakeoff,
    startModifyTakeoff,
    endModifyTakeoff,
    resetTakeoff,
  };
}
