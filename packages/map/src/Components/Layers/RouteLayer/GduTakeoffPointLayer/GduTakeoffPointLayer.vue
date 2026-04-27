<template>
  <gdu-point
    v-if="!isEmpty(modifyTakeoff)"
    :coordinates="modifyTakeoff"
    :name="props.layerId"
    :icon-src="referencePoint"
    :icon-width="35"
    :icon-height="35"
    :enable-modify="props.active"
    :modify-type="modifyType"
    :visible="props.takeoffIconVisible"
    :feature-properties="featureProperties"
    @modify-start="startModify"
    @modifying="modifying"
    @modify-end="onModifyEnd"
    @click="emits('click')"
  />
  <template v-if="!isEmpty(takeoffPointConnectionLine.line)">
    <gdu-line-string
      :coordinates="takeoffPointConnectionLine.line"
      :clamp-to-ground="false"
      :stroke-color="props.strokeColor"
      :stroke-width="props.strokeWidth"
      :line-dash="dash"
    />
  </template>
  <gdu-point
    v-for="(
      { coordinates, distance, visible }, index
    ) in takeoffPointConnectionLine.pointList"
    :key="index"
    :view-id="props.viewId"
    :coordinates="coordinates"
    :visible="visible"
    :text="distance"
    shape-type="none"
    :text-size="10"
    :text-background-radius="4"
    text-background-color="rgba(0, 0, 0, 0.6)"
  />
  <template
    v-if="
      !isEmpty(takeoffPointConnectionLine.helperLine) &&
      takeoffPointConnectionLine.helperLine.length > 1
    "
  >
    <gdu-line-string
      :coordinates="takeoffPointConnectionLine.helperLine"
      :line-dash="dash"
      :stroke-color="defaultNormalRouteTheme.helperLine.fillColor"
      :stroke-width="1"
    />
    <gdu-point
      :coordinates="
        takeoffPointConnectionLine.helperLine[0] as PointCoordinates
      "
      :shape-size="7"
      :shape-fill-color="defaultNormalRouteTheme.footPoint.fillColor"
      :shape-outline-width="0"
      clamp-to-ground
      :disable-depth-test-distance="0"
    />
  </template>
</template>

<script setup lang="ts">
import { GduLineString, GduPoint } from "@map/Components";
import {
  altitudeAccuracy,
  AltitudeMode,
  defaultNormalRouteTheme,
  ellipsoidToElevation,
  getMidPoint,
  getStraightLineDistance,
  LinePointAction,
  LineStringCoordinates,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { computed, ref, watch } from "vue";
import { cloneDeep, isEmpty, isNil, round } from "lodash-es";
import referencePoint from "@map/Assets/reference-takeoff-point.png";
import { mapViewInternal } from "@gdu-gl/core";
import { TakeoffPointEmits, TakeoffPointProps } from "./props";

interface CenterPoint {
  coordinates: PointCoordinates;
  distance: string;
  visible: boolean;
}

enum RecordTakeoffStatus {
  KeepDistance,
  ChangeDistance,
}

const props = defineProps<TakeoffPointProps>();

const emits = defineEmits<TakeoffPointEmits>();

// 根据传入的 viewId 获取地图视图的 viewer 实例
const viewer = mapViewInternal.getViewer(props.viewId!)!;

const modifyTakeoff = ref<PointCoordinates | null>(null);

const dash = [10, 7];

const featureProperties = {
  type: RoutePointType.TAKEOFF,
  index: 0,
};

/**
 * 记录起飞点修改过程中的相关信息，包括离地距离和修改状态
 */
const recordTakeoff = {
  /**
   * 起飞点的离地距离，单位为米。
   * 当修改类型为垂直修改时，该值为 0；
   * 当修改类型为非垂直修改时，该值为起飞点椭球高与地面高程的差值。
   */
  distance: 0,
  /**
   * 起飞点修改状态，取值为 RecordTakeoffStatus 枚举类型。
   * - RecordTakeoffStatus.KeepDistance: 保持离地距离不变
   * - RecordTakeoffStatus.ChangeDistance: 改变离地距离
   */
  status: RecordTakeoffStatus.KeepDistance,
};

const startLinePoint = computed(() => {
  if (isEmpty(props.lines) || isEmpty(props.lines![0])) {
    return null;
  }
  const linePoint = props.lines![0].find(({ isTurn }) => isTurn);
  if (!linePoint) {
    return null;
  }

  let startPointElevation = 0;
  switch (props.altitudeMode) {
    case AltitudeMode.Elevation:
      startPointElevation = linePoint.height;
      break;
    case AltitudeMode.Relative:
    default:
      startPointElevation =
        linePoint.height + ellipsoidToElevation(props.takeoffPoint);
      break;
  }
  return {
    ...linePoint,
    elevation: startPointElevation,
  };
});

const takeoffPointConnectionLine = computed(() => {
  const helperLine: LineStringCoordinates = [];
  const line: LineStringCoordinates = [];
  const pointList: Array<CenterPoint> = [];
  if (isEmpty(modifyTakeoff.value) || isNil(startLinePoint.value)) {
    return {
      line,
      helperLine,
      pointList,
    };
  }
  const takeoffElevation = ellipsoidToElevation(modifyTakeoff.value);
  if (
    takeoffElevation + props.takeoffSafeHeight! >
    startLinePoint.value!.elevation
  ) {
    return aboveRouteHeight(startLinePoint.value!);
  }
  return belowRouteHeight(startLinePoint.value!);
});

watch(
  () => props.takeoffPoint?.toString(),
  () => {
    if (isEmpty(props.takeoffPoint)) {
      modifyTakeoff.value = null;
    } else {
      modifyTakeoff.value = cloneDeep(props.takeoffPoint!);
    }
  },
  {
    immediate: true,
  },
);

const modifyType = computed(() => {
  if (props.altPress) {
    return "vertical";
  }
  return "horizontal";
});

/**
 * 当起飞点高程加上安全高度大于起始点高程时，计算起飞点连接线路径
 * @param linePoint - 包含起始点信息的对象
 * @returns 包含辅助线、连接线和中点信息的对象
 */
function aboveRouteHeight(linePoint: LinePointAction) {
  // 初始化辅助线数组，用于存储辅助线的坐标点
  const helperLine: LineStringCoordinates = [];
  // 初始化连接线数组，用于存储连接起飞点和起始点的线路坐标点
  const line: LineStringCoordinates = [];
  // 初始化中点信息数组，用于存储连接线上各线段的中点坐标和距离信息
  const pointList: Array<CenterPoint> = [];
  const { coordinates: startPointCoordinates } = linePoint;
  const takeoffCoordinates = modifyTakeoff.value!;
  const [startPointLon, startPointLat] = startPointCoordinates;
  const [takeoffLon, takeoffLat, takeoffEllipsoid = 0] = takeoffCoordinates;
  // 计算安全椭球高度，即起飞点椭球高加上安全高度
  const safeEllipsoidHeight = takeoffEllipsoid + props.takeoffSafeHeight!;
  // 定义第一个点，即起飞点坐标
  const point1 = takeoffCoordinates;
  // 定义第二个点，其经度和纬度与起飞点相同，高度为安全椭球高度
  const point2 = [
    takeoffLon,
    takeoffLat,
    safeEllipsoidHeight,
  ] as PointCoordinates;
  // 定义第三个点，其经度和纬度与起始点相同，高度为安全椭球高度
  const point3 = [
    startPointLon,
    startPointLat,
    safeEllipsoidHeight,
  ] as PointCoordinates;
  // 定义第四个点，即起始点坐标
  const point4 = startPointCoordinates;
  // 向辅助线数组中添加辅助线的坐标点
  helperLine.push([takeoffLon, takeoffLat, 0], point1);
  // 向连接线数组中添加连接线路径的坐标点
  line.push(point1, point2, point3, point4);
  pointList.push(
    {
      coordinates: getMidPoint(point1, point2),
      distance: `${getStraightLineDistance(point1, point2)}m`,
      visible: !props.clampToGround,
    },
    {
      coordinates: getMidPoint(point2, point3),
      distance: `${getStraightLineDistance(point2, point3)}m`,
      visible: getStraightLineDistance(point2, point3) >= 2,
    },
  );
  // 返回包含辅助线、连接线和中点信息的对象
  return {
    helperLine,
    line,
    pointList,
  };
}

/**
 * 当起飞点高程加上安全高度小于等于起始点高程时，计算起飞点连接线路径
 * @param linePoint - 包含起始点信息的对象
 * @returns 包含辅助线、连接线和中点信息的对象
 */
function belowRouteHeight(linePoint: LinePointAction) {
  // 初始化辅助线数组，用于存储辅助线的坐标点
  const helperLine: LineStringCoordinates = [];
  // 初始化连接线数组，用于存储连接起飞点和起始点的线路坐标点
  const line: LineStringCoordinates = [];
  // 初始化中点信息数组，用于存储连接线上各线段的中点坐标和距离信息
  const pointList: Array<CenterPoint> = [];

  const { coordinates: startPointCoordinates } = linePoint;
  const takeoffCoordinates = modifyTakeoff.value!;

  const [, , startPointEllipsoid = 0] = startPointCoordinates;
  const [takeoffLon, takeoffLat] = takeoffCoordinates;

  // 定义第一个点，即起飞点坐标
  const point1 = takeoffCoordinates;
  // 定义第二个点，其经度和纬度与起飞点相同，高度与起始点椭球高相同
  const point2 = [
    takeoffLon,
    takeoffLat,
    startPointEllipsoid,
  ] as PointCoordinates;
  // 定义第三个点，即起始点坐标
  const point3 = startPointCoordinates;

  // 向辅助线数组中添加辅助线的坐标点，从地面到起飞点
  helperLine.push([takeoffLon, takeoffLat, 0], point1);
  // 向连接线数组中添加连接线路径的坐标点，从起飞点到与起始点同高的点，再到起始点
  line.push(point1, point2, point3);

  const takeOffElevation = ellipsoidToElevation(modifyTakeoff.value);

  // 计算并添加第一个线段（起飞点到与起始点同高的点）的中点信息
  pointList.push(
    {
      coordinates: getMidPoint(point1, point2),
      distance: `${round(linePoint.elevation - takeOffElevation, 1)}m`,
      visible: !props.clampToGround,
    },
    // 计算并添加第二个线段（与起始点同高的点到起始点）的中点信息
    {
      coordinates: getMidPoint(point2, point3),
      distance: `${getStraightLineDistance(point2, point3)}m`,
      visible: getStraightLineDistance(point2, point3) >= 2,
    },
  );

  // 返回包含辅助线、连接线和中点信息的对象
  return {
    helperLine,
    line,
    pointList,
  };
}

/**
 * 处理起飞点开始修改的事件
 * 该函数会根据修改类型初始化起飞点的离地距离和修改状态，
 * 并触发 `startModify` 事件通知外部起飞点开始修改
 */
function startModify() {
  // 检查当前的修改类型是否为垂直修改
  if (modifyType.value === "vertical") {
    // 若为垂直修改，将记录的离地距离设为 0
    recordTakeoff.distance = 0;
    // 将起飞点修改状态设置为改变离地距离
    recordTakeoff.status = RecordTakeoffStatus.ChangeDistance;
  } else {
    // 若不是垂直修改，从当前修改的起飞点信息中解构出坐标
    const takeoffCoordinates = modifyTakeoff.value!;
    // 从坐标中提取高度信息，若未提供则默认值为 0
    const [, , height = 0] = takeoffCoordinates;
    // 获取当前起飞点坐标位置的地面高程，如果获取失败则默认为 0
    const groundHeight =
      viewer.mapProviderDelegate.mapProvider?.queryAltitudes?.getHeight(
        takeoffCoordinates,
      ) ?? 0;
    // 计算起飞点的离地距离，即起飞点高度减去地面高程
    recordTakeoff.distance = height - groundHeight;
    // 将起飞点修改状态设置为保持离地距离不变
    recordTakeoff.status = RecordTakeoffStatus.KeepDistance;
  }
  // 触发 `startModify` 事件，通知外部起飞点开始修改
  emits("startModify");
}

function modifying(coordinates: PointCoordinates) {
  modifyTakeoff.value = coordinates;
}

/**
 * 处理起飞点修改结束事件
 * 当修改状态为保持离地距离不变时，会重新计算起飞点的坐标，确保离地距离不变
 * 最后触发 `changed` 事件，通知外部起飞点已修改
 */
function onModifyEnd() {
  // 检查起飞点修改状态是否为保持离地距离不变
  if (recordTakeoff.status === RecordTakeoffStatus.KeepDistance) {
    // 从修改后的起飞点信息中解构出坐标
    const takeoffCoordinates = modifyTakeoff.value!;
    // 从坐标中提取经度和纬度，忽略原有的高度信息
    const [longitude, latitude] = takeoffCoordinates;
    // 获取当前坐标位置的地面高程，如果获取失败则默认为 0
    const groundHeight =
      viewer.mapProviderDelegate.mapProvider?.queryAltitudes?.getHeight(
        takeoffCoordinates,
      ) ?? 0;
    // 计算新的起飞点坐标，高度为地面高程加上记录的离地距离，并进行高度精度处理
    // 更新起飞点信息，包含新的坐标和对应的海拔高度
    modifyTakeoff.value = [
      longitude,
      latitude,
      altitudeAccuracy(groundHeight + recordTakeoff.distance),
    ] as PointCoordinates;
  }
  // 触发 `changed` 事件，将修改后的起飞点信息传递给外部
  emits("changed", modifyTakeoff.value!);
}
</script>
