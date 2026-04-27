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

  <area-points
    v-for="(areaLine, index) in dataInfo.modifyMultiAreaLine"
    :key="index"
    :parents-idx="index"
    :area-line="areaLine"
  />

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
  />

  <polygon-self-intersecting-popup
    v-if="mousePosition && (isPolygonSelfIntersecting || isPolygonIntersect)"
    :view-id="props.viewId"
    :coordinates="mousePosition"
    :is-intersect="isPolygonIntersect"
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
import { polygonSelfIntersectingPopupOffset } from "@map/Constants";
import PolygonSelfIntersectingPopup from "@map/Components/Common/PolygonSelfIntersectingPopup.vue";
import {
  MouseEventParams,
  PointCoordinates,
  PopupPosition,
  RouteEditDrawStatus,
  RoutePointType,
} from "@gdu-gl/common";
import {
  AiRouteEditDataInfo,
  GduMapEvent,
  GduPopup,
  GduTakeoffPointLayer,
} from "@map/Components";
import { computed } from "vue";
import AreaPoints from "./components/AreaPoints.vue";
import {
  RouteEditComponentsType,
  useTakeoffEvent,
} from "../common/hooks/useTakeoffEvent";
import { useGlobalMapEvent } from "../common/hooks/useGlobalMapEvent";
import RouteEditPopupContent from "../common/components/RouteEditPopupContent.vue";
import { useProvideAreaEditProps } from "./hooks/useProvideAreaEditProps";
import { AiRouteEditEmits, AiRouteEditProps } from "./props";
import AreaTurnPoints from "../common/components/AreaTurnPoints.vue";
import { useMouseEvent } from "./hooks/useMouseEvent";

const props = defineProps<AiRouteEditProps>();
const emits = defineEmits<AiRouteEditEmits>();

// 根据传入的 viewId 获取地图视图的 viewer 实例
const viewer = mapViewInternal.getViewer(props.viewId!)!;

const {
  dataInfo,
  isPolygonSelfIntersecting,
  editTurnPointList,
  selectInfo,
  isPolygonIntersect,
} = useProvideAreaEditProps(props, emits);

const { mousePosition, showModifyPopup, showTakeoffSelectTip } = useMouseEvent(
  props,
  emits,
  viewer,
  dataInfo,
  selectInfo,
);

const { mouseMoveMap } = useGlobalMapEvent(
  props,
  dataInfo,
  mousePosition,
  showTakeoffSelectTip,
);

const { addTakeoff, startModifyTakeoff, endModifyTakeoff, resetTakeoff } =
  useTakeoffEvent<AiRouteEditDataInfo>(
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
  if (!getContinueClickStatus(params)) {
    return;
  }

  // 若没有有效的坐标信息，直接返回
  if (!params.coordinates) {
    return;
  }
  if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_TAKEOFF) {
    selectInfo.value = {
      type: null,
      index: -1,
      parentsIdx: -1,
    };
    addTakeoff(params);
    showTakeoffSelectTip.value = false;
    return;
  }

  if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_END) {
    dataInfo.drawStatus = RouteEditDrawStatus.DRAWING;
    dataInfo.modifyMultiAreaLine.push([]);
  }
  addAreaPoint(params.coordinates);
}

function getContinueClickStatus(params: MouseEventParams) {
  const name = params.feature?.properties.name;
  const featureProperties = params.feature?.properties?.featureProperties;
  if (name !== props.layerId) {
    return true;
  }

  // 检查点击的要素是否为区域
  const booleanClickArea = featureProperties?.type === RoutePointType.AREA;
  if (dataInfo.drawStatus === RouteEditDrawStatus.DRAWING) {
    /**
     * 点击区域点时，若当前绘制状态为绘制中且点击的是区域点，则继续点击。
     */
    return booleanClickArea;
  }

  if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_END) {
    /**
     * 如果是绘制结束状态，点击要素则拦截点击事件。
     */
    if (booleanClickArea) {
      selectInfo.value = featureProperties;
    }
    return false;
  }
  return true;
}

/**
 * 向编辑中的面线数据添加新的区域点。
 * 若当前绘制状态为绘制结束，则不执行添加操作。
 * @param coordinates - 要添加的区域点的坐标，格式为 [经度, 纬度]。
 */
function addAreaPoint(coordinates: PointCoordinates) {
  // 检查当前绘制状态是否为绘制结束，若是则直接返回
  if (
    dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING ||
    isPolygonSelfIntersecting.value ||
    isPolygonIntersect.value
  ) {
    return;
  }
  const { length } = dataInfo.modifyMultiAreaLine;
  // 复制面线数据，排除最后一个点
  let line = dataInfo.modifyMultiAreaLine[length - 1];

  selectInfo.value = {
    type: RoutePointType.FOOT,
    index: line.length - 2,
    parentsIdx: dataInfo.modifyMultiAreaLine.length - 1,
  };

  // 解构出坐标的经度和纬度
  const [lon, lat] = coordinates;
  line = line.slice(0, line.length - 1);
  /**
   * 这里是检测最后一个点是否与新点相同，若相同则屏蔽新点，防止重复点位添加
   * 在比较卡的电脑上，用户在同一个位置快速点击，点位渲染比较慢，鼠标会拾取同一个位置要素为空，导致添加重复点位
   * 我们需要判断最后一个点与新点差别是否在0.00001范围内，若在范围内则屏蔽新点
   */
  const lastPoint = line[line.length - 1];
  // 若最后一个点与新点相同，则屏蔽新点，防止重复点位添加
  if (
    lastPoint &&
    Math.abs(lastPoint[0] - lon) < 0.00001 &&
    Math.abs(lastPoint[1] - lat) < 0.00001
  ) {
    line.push([lon, lat]);
  } else {
    // 将新的区域点添加两次到复制后的面线数据中
    line.push([lon, lat], [lon, lat]);
  }

  // 更新面线数据
  dataInfo.modifyMultiAreaLine[length - 1] = line;
  const linePoints = line.slice(0, line.length - 1);
  // TODO 具体需要看看linePoints实现的意义是什么
  if (linePoints.length > 1) {
    dataInfo.hover = {
      index: linePoints.length - 1,
      type: RoutePointType.FOOT,
      parentsIdx: length - 1,
    };
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

/**
 * 处理鼠标移动时更新面线数据中最后一个区域点的坐标。
 * 若面线数据为空或当前绘制状态为绘制结束，则不执行更新操作。
 * @param coordinates - 鼠标当前位置的坐标，格式为 [经度, 纬度]。
 */
function mouseMoveAreaPoint(coordinates: PointCoordinates) {
  const lastLine =
    dataInfo.modifyMultiAreaLine[dataInfo.modifyMultiAreaLine.length - 1];
  // 检查面线数据是否为空或者当前绘制状态是否为绘制结束，满足任一条件则直接返回
  if (
    !lastLine?.length ||
    dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING
  ) {
    return;
  }
  // 解构出坐标的经度和纬度
  const [lon, lat] = coordinates;
  // 更新面线数据中最后一个点的坐标
  lastLine[lastLine.length - 1] = [lon, lat];
}

defineExpose({
  resetTakeoff,
});
</script>
