<template>
  <gdu-map-event
    v-if="props.active"
    :view-id="props.viewId"
    @click="clickMap"
    @mouse-move="mouseMoveMapFun"
  />
  <area-turn-points
    v-for="(routeLine, index) in editTurnPointList"
    :key="index"
    :route-line="routeLine"
  />
  <area-points />
  <gdu-takeoff-point-layer
    v-bind="takeoffProps"
    :lines="editTurnPointList"
    :active="
      props.active &&
      !(
        dataInfo.drawStatus === RouteEditDrawStatus.MODIFY &&
        dataInfo.hover.type !== RoutePointType.TAKEOFF
      ) &&
      dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING
    "
    :alt-press="dataInfo.altPress"
    :stroke-color="props.theme?.line?.strokeColor"
    :stroke-width="6"
    :takeoff-icon-visible="true"
    @start-modify="startModifyTakeoff"
    @changed="endModifyTakeoff"
    @click="clickAreaPoint(-1)"
  />
  <polygon-self-intersecting-popup
    v-if="mousePosition && isPolygonSelfIntersecting"
    :view-id="props.viewId"
    :coordinates="mousePosition"
    :offset="polygonSelfIntersectingPopupOffset"
    :message="props.message"
  />
  <gdu-popup
    v-if="showModifyPopup || showTakeoffSelectTip"
    :view-id="props.viewId"
    :coordinates="mousePosition"
    :position="PopupPosition.TOP_LEFT"
    :offset="polygonSelfIntersectingPopupOffset"
  >
    <route-edit-popup-content
      :message="props.message"
      :show-vertical-modify-popup="!props.clampToGround"
      :show-takeoff-select-tip="showTakeoffSelectTip"
    />
  </gdu-popup>
</template>

<script setup lang="ts">
import { mapViewInternal } from "@gdu-gl/core";
import {
  GduMapEvent,
  GduPopup,
  RouteAreaEditDataInfo,
  GduTakeoffPointLayer,
} from "@map/Components";
import {
  MouseEventParams,
  PopupPosition,
  RouteEditDrawStatus,
  RoutePointType,
} from "@gdu-gl/common";
import { computed } from "vue";
import PolygonSelfIntersectingPopup from "@map/Components/Common/PolygonSelfIntersectingPopup.vue";
import { polygonSelfIntersectingPopupOffset } from "@map/Constants";
import RouteEditPopupContent from "../common/components/RouteEditPopupContent.vue";
import {
  RouteEditComponentsType,
  useTakeoffEvent,
} from "../common/hooks/useTakeoffEvent";
import AreaPoints from "./components/AreaPoints.vue";
import AreaTurnPoints from "../common/components/AreaTurnPoints.vue";
import { useGlobalMapEvent } from "../common/hooks/useGlobalMapEvent";
import { RouteAreaEditEmits, RouteAreaEditProps } from "./props";
import { useProvideAreaEditProps } from "./hooks/useProvideAreaEditProps";
import { useMouseEvent } from "./hooks/useMouseEvent";
import { useAreaPointEvent } from "./hooks/useAreaPointEvent";

const props = defineProps<RouteAreaEditProps>();
const emits = defineEmits<RouteAreaEditEmits>();

// 根据传入的 viewId 获取地图视图的 viewer 实例
const viewer = mapViewInternal.getViewer(props.viewId!)!;

const { dataInfo, isPolygonSelfIntersecting, editTurnPointList, selectInfo } =
  useProvideAreaEditProps(props, emits);
const { mousePosition, showModifyPopup, showTakeoffSelectTip } = useMouseEvent(
  props,
  viewer,
  dataInfo,
);
const { addAreaPoint, mouseMoveAreaPoint, clickAreaPoint } = useAreaPointEvent(
  props,
  emits,
  dataInfo,
  selectInfo,
  isPolygonSelfIntersecting,
);
const { mouseMoveMap } = useGlobalMapEvent(
  props,
  dataInfo,
  mousePosition,
  showTakeoffSelectTip,
);

const { addTakeoff, startModifyTakeoff, endModifyTakeoff, resetTakeoff } =
  useTakeoffEvent<RouteAreaEditDataInfo>(
    RouteEditComponentsType.WAYPOINT,
    props,
    emits,
    dataInfo,
    selectInfo,
  );

const takeoffProps = computed(() => {
  return {
    altitudeMode: props.altitudeMode,
    layerId: props.layerId,
    clampToGround: props.clampToGround,
    takeoffPoint: props.takeoffPoint,
    viewId: props.viewId,
    takeoffSafeHeight: props.takeoffSafeHeight,
  };
});

/**
 * 处理地图点击事件
 * @param params - 鼠标点击事件参数
 */
function clickMap(params: MouseEventParams) {
  // 获取点击要素的名称
  const name = params.feature?.properties.name;

  // 若要素名称以当前图层 ID 开头
  if (name === props.layerId) {
    return;
  }

  if (name !== props.layerId) {
    selectInfo.value = {
      type: null,
      index: -1,
    };
  }

  // 若没有有效的坐标信息，直接返回
  if (!params.coordinates) {
    return;
  }
  if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_TAKEOFF) {
    addTakeoff(params);
    showTakeoffSelectTip.value = false;
  } else {
    addAreaPoint(params.coordinates);
  }
}

function mouseMoveMapFun(params: MouseEventParams) {
  mouseMoveMap(params);
  // 若没有有效的坐标信息，直接返回
  if (!params.coordinates) {
    return;
  }
  mouseMoveAreaPoint(params.coordinates);
}

defineExpose({
  resetTakeoff,
});
</script>
