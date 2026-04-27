<template>
  <gdu-map-event
    v-if="props.active"
    :view-id="props.viewId"
    @click="clickMap"
    @mouse-move="mouseMoveMap"
  />
  <turn-points>
    <template #wayPoint="scope">
      <slot name="wayPoint" v-bind="scope"></slot>
    </template>
  </turn-points>
  <foot-points />
  <gdu-takeoff-point-layer
    v-bind="takeoffProps"
    :active="
      props.active &&
      !(
        dataInfo.drawStatus !== RouteEditDrawStatus.DRAW_END &&
        dataInfo.hover.type !== RoutePointType.TAKEOFF
      )
    "
    :alt-press="dataInfo.altPress"
    :stroke-color="props.theme?.line?.strokeColor"
    :stroke-width="6"
    :takeoff-icon-visible="true"
    @start-modify="startModifyTakeoff"
    @changed="beforeEndModifyTakeoff"
    @click="clickWayPoint(-1)"
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
      :show-vertical-modify-popup="showVerticalModifyPopup"
      :show-add-surround-point-tip="
        !dataInfo.hover.type &&
        dataInfo.drawStatus === RouteEditDrawStatus.DRAW_SURROUND
      "
      :show-takeoff-select-tip="showTakeoffSelectTip"
    />
  </gdu-popup>
</template>

<script setup lang="ts">
import {
  GduMapEvent,
  GduPopup,
  GduTakeoffPointLayer,
  WayPointDataInfo,
} from "@map/Components";
import { mapViewInternal } from "@gdu-gl/core";
import {
  MouseEventParams,
  PopupPosition,
  RouteEditDrawStatus,
  RouteEditEventType,
  RoutePointType,
  getHeightByMode,
  PointCoordinates,
} from "@gdu-gl/common";
import { computed, toRaw } from "vue";
import { polygonSelfIntersectingPopupOffset } from "@map/Constants";
import { getLinePointHeightByMode } from "@map/Utils";
import RouteEditPopupContent from "../common/components/RouteEditPopupContent.vue";
import {
  RouteEditComponentsType,
  useTakeoffEvent,
} from "../common/hooks/useTakeoffEvent";
import { useGlobalMapEvent } from "../common/hooks/useGlobalMapEvent";
import FootPoints from "./components/FootPoints.vue";
import TurnPoints from "./components/TurnPoints.vue";
import { useProvideWayPointProps } from "./hooks/useProvideWayPointProps";
import { WayPointEditEmits, WayPointEditProps } from "./props";
import { useMouseEvent } from "./hooks/useMouseEvent";
import { useWayPointEvent } from "./hooks/useWayPointEvent";
import { WayPointSlotProps } from "../props";

const props = defineProps<WayPointEditProps>();
const emits = defineEmits<WayPointEditEmits>();
defineSlots<WayPointSlotProps>();

// 根据传入的 viewId 获取地图视图的 viewer 实例
const viewer = mapViewInternal.getViewer(props.viewId!)!;

const { dataInfo, selectInfo } = useProvideWayPointProps(props, emits);
const { addWayPoint, clickWayPoint, addSurroundCenterPoint } = useWayPointEvent(
  props,
  emits,
  dataInfo,
  selectInfo,
);

const {
  mousePosition,
  showModifyPopup,
  showVerticalModifyPopup,
  showTakeoffSelectTip,
} = useMouseEvent(viewer, props, dataInfo);
const { mouseMoveMap } = useGlobalMapEvent(
  props,
  dataInfo,
  mousePosition,
  showTakeoffSelectTip,
);
const { addTakeoff, startModifyTakeoff, endModifyTakeoff, resetTakeoff } =
  useTakeoffEvent<WayPointDataInfo>(
    RouteEditComponentsType.WAYPOINT,
    props,
    emits,
    dataInfo,
    selectInfo,
  );

const takeoffProps = computed(() => {
  return {
    altitudeMode: props.altitudeMode,
    lines: [dataInfo.modifyLine],
    layerId: props.layerId,
    clampToGround: props.clampToGround,
    takeoffPoint: props.takeoffPoint,
    viewId: props.viewId,
    takeoffSafeHeight: props.takeoffSafeHeight,
  };
});

function beforeEndModifyTakeoff(params: PointCoordinates) {
  recalculateRouteAltitude(params);
  endModifyTakeoff(params);
}

function recalculateRouteAltitude(params: PointCoordinates) {
  dataInfo.modifyLine.forEach((point) => {
    const { coordinates, elevationHeight, relativeHeight } = getHeightByMode({
      mode: props.altitudeMode!,
      takeoffPoint: params,
      height: point.height,
      coordinates: point.coordinates,
    });
    point.height = getLinePointHeightByMode(
      props.altitudeMode!,
      relativeHeight,
      elevationHeight,
    );
    point.coordinates = coordinates;
  });
  emits("changed", {
    // 事件类型为添加
    type: RouteEditEventType.REFRESH,
    // 当前完整的航线数据
    line: toRaw(dataInfo.modifyLine),
  });
}
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

  if (
    name !== props.layerId &&
    dataInfo.drawStatus !== RouteEditDrawStatus.DRAW_SURROUND
  ) {
    selectInfo.value = {
      type: null,
      index: -1,
    };
    dataInfo.selectDeleteIndex = -1;
  }

  // 若没有有效的坐标信息，直接返回
  if (!params.coordinates) {
    return;
  }
  if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_TAKEOFF) {
    const takeoff = addTakeoff(params);
    recalculateRouteAltitude(takeoff);
    showTakeoffSelectTip.value = false;
  } else if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_SURROUND) {
    addSurroundCenterPoint(params.coordinates);
  } else {
    addWayPoint(params.coordinates);
  }
}

defineExpose({
  resetTakeoff,
});
</script>
