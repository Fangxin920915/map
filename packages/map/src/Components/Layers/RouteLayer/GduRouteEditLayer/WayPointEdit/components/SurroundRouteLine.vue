<template>
  <!-- 当前点生成的环绕线 -->
  <template v-if="!isEmpty(arcLine) && arcLine.length > 1">
    <gdu-arrow-line-string
      v-bind="wayPointProps.theme?.line"
      :coordinates="arcLine"
      :stroke-width="6"
      :stroke-outline-width="0"
    />
    <GduLineString
      :coordinates="arcLine"
      :stroke-color="wayPointProps.theme!.projectionLine.fillColor"
      :stroke-width="2"
      clamp-to-ground
    />
  </template>
  <!-- 环绕线与下一个点的连接线 -->
  <template v-if="!isEmpty(concatLine) && concatLine.length > 1">
    <gdu-arrow-line-string
      v-bind="wayPointProps.theme?.line"
      :coordinates="concatLine"
      :stroke-width="6"
      :stroke-outline-width="0"
    />
    <GduLineString
      :coordinates="concatLine"
      :stroke-color="wayPointProps.theme!.projectionLine.fillColor"
      :stroke-width="2"
      clamp-to-ground
    />
    <GduPoint
      v-if="insertPoint"
      :name="wayPointProps.layerId"
      v-bind="insertPoint"
      :icon-src="getInsertIcon()"
      :icon-height="16"
      :icon-width="17"
      clamp-to-ground
      @click="insertWayPoint(props.idx, insertPoint.coordinates)"
    />
  </template>
  <!-- 环绕航线的半径值与其辅助线 -->
  <template v-if="circleRadiusHelperLine">
    <gdu-line-string
      :coordinates="circleRadiusHelperLine.line"
      :stroke-color="MapThemeColor.success[500]"
      :stroke-width="3"
      :stroke-outline-width="0"
      :line-dash="lineDash"
    />
    <gdu-point
      :coordinates="circleRadiusHelperLine.position"
      shape-type="none"
      :text="circleRadiusHelperLine.radius"
      :text-size="10"
      :text-background-radius="4"
      text-background-color="rgba(0, 0, 0, 0.6)"
    />
  </template>
  <GduLineString
    v-if="!isEmpty(vectorHelperLine.circle)"
    :stroke-color="wayPointProps.theme!.helperLine.normal.fillColor"
    :coordinates="vectorHelperLine.circle"
    :stroke-width="1"
    :line-dash="lineDash"
  />
  <GduLineString
    v-if="vectorHelperLine.arc && !isEmpty(vectorHelperLine.arc)"
    :stroke-color="wayPointProps.theme!.helperLine.normal.fillColor"
    :coordinates="vectorHelperLine.arc"
    :stroke-width="1"
    :line-dash="lineDash"
  />
  <gdu-point
    :name="wayPointProps.layerId"
    :coordinates="circleCenter"
    :icon-width="30"
    :icon-height="30"
    :icon-src="drawCenter"
    :feature-properties="circleCenterProperties"
    enable-modify
    modify-type="horizontal"
    @modify-start="
      modifyStartWayPoint(
        props.idx,
        RoutePointType.FOOT,
        RouteEditDrawStatus.MODIFY_SURROUND,
      )
    "
    @modifying="modifySurroundPoint(props.idx, $event)"
    @modify-end="modifyEndWayPoint(props.idx, RoutePointType.SURROUND)"
  />
</template>

<script setup lang="ts">
import {
  AltitudeMode,
  createArcFromPoints,
  getHeightByMode,
  LineStringCoordinates,
  MapThemeColor,
  PointCoordinates,
  RouteEditDrawStatus,
  RoutePointType,
} from "@gdu-gl/common";
import * as turf from "@turf/turf";
import { computed } from "vue";
import { isEmpty, isNil } from "lodash-es";
import { GduArrowLineString, GduLineString, GduPoint } from "@map/Components";
import drawCenter from "@map/Assets/drag-surround-center.png";
import { useWayPointEvent } from "../hooks/useWayPointEvent";
import { useInjectWayPointProps } from "../hooks/useInjectWayPointProps";
import { useRouteEditIcons } from "../../common/hooks/useRouteEditIcons";

const props = defineProps<{
  /**
   * ### 功能描述
   * 环绕线索引
   */
  idx: number;
  /**
   * ### 功能描述
   * 环绕线起始坐标
   */
  startCoordinates: PointCoordinates;
  /**
   * ### 功能描述
   * 环绕线结束坐标
   */
  endCoordinates?: PointCoordinates | null;
  /**
   * ### 功能描述
   * 中心坐标
   */
  coordinates: PointCoordinates;
  /**
   * ### 功能描述
   * 是否启用逆时针时针
   */
  enableCounterclockwise: boolean;
  /**
   * ### 功能描述
   * 环绕角度,单位为度
   */
  angle: number;
  /**
   * ### 功能描述
   * 兴趣点相对于起飞点的高度
   */
  height: number;
  /**
   * ### 功能描述
   * 起飞点坐标。
   */
  takeoffPoint?: PointCoordinates | null;
  /**
   * ### 功能描述
   * 高度模式；
   * **AltitudeMode.Elevation** 海拔高度；
   * **AltitudeMode.Relative** 相对高度；
   */
  altitudeMode: AltitudeMode;
}>();

// 虚线样式数组，定义虚线的线段长度和间隔，[实线长度, 间隔长度]
const lineDash = [10, 5];

const { wayPointProps, wayPointEmits, dataInfo, selectInfo } =
  useInjectWayPointProps();

const { insertionPoint } = useRouteEditIcons(wayPointProps);

const {
  modifySurroundPoint,
  modifyEndWayPoint,
  modifyStartWayPoint,
  insertWayPoint,
} = useWayPointEvent(wayPointProps, wayPointEmits, dataInfo, selectInfo);

const circleCenterProperties = computed(() => ({
  type: RoutePointType.SURROUND,
  index: props.idx,
}));

const circleCenter = computed(() => {
  const { coordinates } = getHeightByMode({
    mode: props.altitudeMode,
    takeoffPoint: props.takeoffPoint,
    height: props.height,
    coordinates: props.coordinates,
  });
  return coordinates;
});

/**
 * ### 功能描述
 * 环绕线
 */
const arcLine = computed(() => {
  return createArcFromPoints(
    props.startCoordinates as number[],
    circleCenter.value as number[],
    props.angle,
    props.enableCounterclockwise,
  );
});

const vectorHelperLine = computed(() => {
  const [centerLon, centerLat] = circleCenter.value;
  const circle = [
    circleCenter.value,
    [centerLon, centerLat],
  ] as LineStringCoordinates;
  if (arcLine.value.length < 2 || props.angle >= 360) {
    return {
      circle,
      arc: [] as LineStringCoordinates,
    };
  }
  const lastPoint = arcLine.value[arcLine.value.length - 1];
  const [lastLon, lastLat] = lastPoint;
  return {
    circle,
    arc: [lastPoint, [lastLon, lastLat]] as LineStringCoordinates,
  };
});

/**
 * ### 功能描述
 * 环绕线与下一个点的连接线
 */
const concatLine = computed(() => {
  if (
    isEmpty(props.endCoordinates) ||
    isNil(props.endCoordinates) ||
    arcLine.value.length < 2
  ) {
    return [];
  }
  const lastPoint = arcLine.value[arcLine.value.length - 1];
  return [lastPoint, props.endCoordinates];
});

const insertPoint = computed(() => {
  if (concatLine.value.length < 2) {
    return null;
  }
  const midPoint = turf.midpoint(
    concatLine.value[0] as number[],
    concatLine.value[1] as number[],
  );
  return {
    coordinates: turf.getCoord(midPoint) as PointCoordinates,
    featureProperties: {
      type: RoutePointType.INSERT,
      index: props.idx,
    },
  };
});

const circleRadiusHelperLine = computed(() => {
  if (isEmpty(props.startCoordinates) || isEmpty(circleCenter.value)) {
    return null;
  }
  const radius = turf.distance(
    props.startCoordinates as number[],
    circleCenter.value as number[],
  );
  const [midPointLon, midPointLat] = turf.getCoord(
    turf.midpoint(
      props.startCoordinates as number[],
      circleCenter.value as number[],
    ),
  );
  const [, , startHeight = 0] = props.startCoordinates;
  const [lon, lat] = circleCenter.value;
  const line = [
    props.startCoordinates,
    [lon, lat, startHeight],
    circleCenter.value,
  ] as LineStringCoordinates;
  return {
    radius: `${Math.round(radius * 1000)}m`,
    line,
    position: [midPointLon, midPointLat, startHeight] as PointCoordinates,
  };
});

/**
 * 根据索引获取插入点的图标信息
 * @returns 包含插入点名称和对应图标的对象
 */
function getInsertIcon() {
  // 若当前插入点名称与鼠标悬停元素的 ID 相同，返回悬停状态的图标信息
  if (
    dataInfo.hover.type === RoutePointType.INSERT &&
    dataInfo.hover.index === props.idx
  ) {
    return insertionPoint.value.hover;
  }
  // 若既未选中也未悬停，返回正常状态的图标信息
  return insertionPoint.value.normal;
}
</script>
