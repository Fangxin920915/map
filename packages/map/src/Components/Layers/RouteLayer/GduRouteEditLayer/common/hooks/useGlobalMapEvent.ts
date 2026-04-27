import {
  MouseEventParams,
  PointCoordinates,
  RouteEditDrawStatus,
} from "@gdu-gl/common";
import { Ref } from "vue";
import { RouteEditLayerProps } from "../../props";
import { RouteEditDataInfo } from "../types/EventCommonParams";

export function useGlobalMapEvent(
  props: Pick<RouteEditLayerProps, "layerId" | "takeoffSelectLayers">,
  dataInfo: RouteEditDataInfo,
  mousePosition: Ref<PointCoordinates | undefined>,
  showTakeoffSelectTip: Ref<boolean>,
) {
  /**
   * 处理地图鼠标移动事件
   * @param params - 鼠标移动事件参数
   */
  function mouseMoveMap(params: MouseEventParams) {
    mousePosition.value = params.coordinates;
    showTakeoffSelectTip.value = false;
    // 若鼠标悬停在要素上且要素名称以当前图层 ID 开头，更新 hoverId
    if (
      dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING &&
      dataInfo.drawStatus !== RouteEditDrawStatus.MODIFY &&
      dataInfo.drawStatus !== RouteEditDrawStatus.DRAW_TAKEOFF &&
      params.feature?.properties?.name === props.layerId
    ) {
      const { featureProperties } = params.feature!.properties;
      dataInfo.hover = {
        type: featureProperties?.type ?? null,
        index: featureProperties?.index ?? -1,
        parentsIdx: featureProperties?.parentsIdx,
      };
    } else if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_TAKEOFF) {
      dataInfo.hover = {
        type: null,
        index: -1,
        parentsIdx: undefined,
      };
      showTakeoffSelectTip.value = !!props.takeoffSelectLayers?.includes(
        params.layerId ?? "",
      );
    } else if (dataInfo.drawStatus !== RouteEditDrawStatus.MODIFY) {
      dataInfo.hover = {
        type: null,
        index: -1,
        parentsIdx: undefined,
      };
    }
  }

  return {
    mouseMoveMap,
  };
}
