<template>
  <!--  悬空线  -->
  <GduArrowLineString :coordinates="circleToLine" :ring="true" />
  <!-- 悬空辅助线 -->
  <template v-if="helperLine">
    <gdu-line-string v-bind="helperLine" />
    <gdu-point
      :visible="!props.clamToGround"
      :coordinates="modifyCenterPoint"
      enable-modify
      :modify-type="'ground'"
      :name="props.layerId"
      :icon-width="18"
      :icon-height="17"
      :icon-src="footPoint.normal"
      :feature-properties="centerMoveFeatureProperties"
      clamp-to-ground
      @mouse-enter="mouseEnter(0)"
      @mouse-leave="mouseLeave"
      @modify-start="modifyStart(0)"
      @modifying="modifyingCenter"
      @modify-end="modifyEnd"
    />
  </template>
  <gdu-point
    :coordinates="modifyCenterPoint"
    enable-modify
    :modify-type="'horizontal'"
    :name="props.layerId"
    :icon-width="30"
    :icon-height="30"
    :icon-src="drawCenter"
    :feature-properties="centerMoveFeatureProperties"
    @mouse-enter="mouseEnter(0)"
    @mouse-leave="mouseLeave"
    @modify-start="modifyStart(0)"
    @modifying="modifyingCenter"
    @modify-end="modifyEnd"
  />
  <gdu-point
    :coordinates="modifyDragPoint"
    enable-modify
    :modify-type="'horizontal'"
    :name="props.layerId"
    :icon-width="18"
    :icon-height="17"
    :icon-src="getEditTurnIcon(1)"
    @mouse-enter="mouseEnter(1)"
    @mouse-leave="mouseLeave"
    @modify-start="modifyStart(1)"
    @modifying="modifyingDrag"
    @modify-end="modifyEnd"
  />

  <template v-if="centerText">
    <gdu-line-string
      :coordinates="centerText.line"
      :stroke-color="MapThemeColor.success[500]"
      :stroke-width="3"
      :stroke-outline-width="0"
      :line-dash="lineDash"
    />
    <gdu-point
      :coordinates="centerText?.point"
      shape-type="none"
      :text="centerText?.text"
      :text-size="10"
      :text-background-radius="4"
      :text-background-padding="DrawCircleTextPadding"
      text-background-color="rgba(0, 0, 0, 0.5)"
    />
  </template>
</template>

<script setup lang="ts">
import {
  altitudeAccuracy,
  getSurroundMaxRadius,
  LineStringCoordinates,
  MapThemeColor,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { computed, ref, toRaw, watch } from "vue";
import * as turf from "@turf/turf";
import { GduArrowLineString, GduLineString, GduPoint } from "@map/Components";
import { isEmpty } from "lodash-es";
import drawCenter from "@map/Assets/drag-surround-center.png";
import { getFootPointIcon } from "@map/Utils";
import { SurroundEditLayerChildProps, SurroundEditLayerEmits } from "../props";

const props = defineProps<SurroundEditLayerChildProps>();

const emits = defineEmits<SurroundEditLayerEmits>();

const DrawCircleTextPadding = [3, 1];

// 用于存储正在修改的圆心点坐标，null表示未处于修改状态
const modifyCenterPoint = ref<PointCoordinates | null>(null);

// 用于存储拖拽修改时的临时点坐标，null表示未处于拖拽状态
const modifyDragPoint = ref<PointCoordinates | null>(null);

// 计算属性，返回中心点移动时的特征属性
// 包含要素ID和点类型（此处为RoutePointType.FOOT）
const centerMoveFeatureProperties = computed(() => {
  return {
    type: RoutePointType.FOOT,
  };
});

// 当前 hover 的点ID（用于鼠标悬停效果）
const hoverId = ref(-1);

// 编辑状态标记（拖拽编辑过程中为true，禁用部分交互）
const editing = ref(false);

// 虚线样式数组，定义虚线的线段长度和间隔，[实线长度, 间隔长度]
const lineDash = [10, 5];

const footPoint = computed(() => {
  return {
    select: getFootPointIcon(
      MapThemeColor.success[900],
      MapThemeColor.success[100],
    ),
    normal: getFootPointIcon(
      MapThemeColor.success[100],
      MapThemeColor.success[900],
    ),
  };
});

const helperLine = computed(() => {
  if (isEmpty(modifyCenterPoint.value)) {
    return null;
  }
  const [lon, lat] = modifyCenterPoint.value!;
  const line = [
    toRaw(modifyCenterPoint.value),
    [lon, lat, 0],
  ] as LineStringCoordinates;
  return {
    coordinates: line,
    lineDash: [10, 3],
    strokeColor: "#FFFFFF",
    strokeWidth: 1,
  };
});

watch(
  [() => props.radius, () => props.coordinates],
  () => {
    const [centerLon, centerLat, height] = props.coordinates!;
    // 更新圆心点坐标为当前属性值
    modifyCenterPoint.value = [centerLon, centerLat, height];
    // 计算并更新拖拽点坐标
    // 使用 turf.destination 计算从圆心沿正东方向移动指定半径距离后的点
    const [lon, lat] = turf.destination(
      turf.point(modifyCenterPoint.value as number[]), // 起点：圆心点
      props.radius!, // 距离：使用当前半径值（单位：千米）
      90, // 方位角：90°表示正东方向
    ).geometry.coordinates;
    modifyDragPoint.value = [lon, lat, height];
  },
  {
    immediate: true,
    deep: true,
  },
);

/**
 * 计算当前半径值
 * 基于圆心点和拖拽点的距离，单位：千米
 */
const modifyRadius = computed(() => {
  if (!modifyCenterPoint.value || !modifyDragPoint.value) {
    return 0;
  }
  return turf.distance(
    turf.point(modifyCenterPoint.value as number[]),
    turf.point(modifyDragPoint.value as number[]),
  );
});

/**
 * 计算并返回圆心到拖拽点的文本信息
 * 包含距离值和单位（km/m）
 */
const centerText = computed(() => {
  const start = modifyCenterPoint.value as number[];
  const end = modifyDragPoint.value as number[];
  if (isEmpty(start) || isEmpty(end)) {
    return null;
  }
  const [lonStart, latStart, height] = start;
  const [lonEnd, latEnd] = end;
  const line = [
    [lonStart, latStart, height],
    [lonEnd, latEnd, height],
  ] as LineStringCoordinates;
  const [lonCenter, latCenter] = turf.midpoint(start, end).geometry.coordinates;
  return {
    line,
    point: [lonCenter, latCenter, height] as PointCoordinates,
    text:
      modifyRadius.value < 1
        ? `${altitudeAccuracy(modifyRadius.value * 1000)}m`
        : `${altitudeAccuracy(modifyRadius.value)}km`,
  };
});

/**
 * 计算并返回当前圆的多边形坐标
 * 基于圆心点和当前半径值
 */
const circleToLine = computed(() => {
  if (!modifyCenterPoint.value || !modifyDragPoint.value) {
    return [];
  }
  const [centerLon, centerLat, height] = modifyCenterPoint.value;
  const [circleLine] = turf.circle(
    turf.point([centerLon, centerLat]),
    modifyRadius.value,
  ).geometry.coordinates;
  const line: LineStringCoordinates = [];
  // 如果启用逆时针，反转圆的坐标顺序
  if (!props.enableCounterclockwise) {
    circleLine.reverse();
  }
  circleLine.forEach((point, index) => {
    if (index === circleLine.length - 1) {
      return;
    }
    const [lon, lat] = point;
    line.push([lon, lat, height]);
  });
  return line;
});

/**
 * 获取转折点图标
 * @param id 点ID（格式：turn:index）
 * @returns 图标路径（根据激活/hover状态返回不同图标）
 */
function getEditTurnIcon(id: number) {
  const { normal, select } = footPoint.value;
  switch (id) {
    case hoverId.value:
      return select; // 悬停状态图标
    default:
      return normal; // 默认状态图标
  }
}

/**
 * 开始编辑圆的事件，固定hoverId，并开启编辑状态，拦截滑动事件
 * @param id 点ID（格式：turn:index）
 */
function modifyStart(id: number) {
  hoverId.value = id;
  editing.value = true;
  // emits("modifyStart");
}

/**
 * 处理拖拽修改环绕点的函数
 * 该函数确保拖拽的点不会超出最大距离限制，维持在允许的范围内
 *
 * @param coordinates - 拖拽操作的目标坐标点，格式为[经度, 纬度, 高度]
 */
function modifyingDrag(coordinates: PointCoordinates) {
  // 从拖拽坐标中解构出经度、纬度和高度
  const [lon, lat, height] = coordinates;

  // 获取修改中心点的原始值（使用toRaw避免Vue响应式系统的影响）
  // 这是环绕区域的中心点，拖拽操作基于此点进行计算
  const center = toRaw(modifyCenterPoint.value) as number[];

  // 计算最大允许半径
  // 最大半径 = 允许的最大距离 - 中心点到起飞点的距离
  // 这确保整个环绕区域不超过设定的最大飞行距离
  const maxRadius = getSurroundMaxRadius(
    props.takeoffPoint,
    toRaw(modifyCenterPoint.value)!,
    props.maxDistance!,
  );

  // 使用turf.js计算在直线上指定距离的点坐标
  // 1. 首先创建从中心点到鼠标拖拽点的线段
  // 2. 然后在该线段上找到距离中心点为maxRadius的点
  // 这样确保拖拽点不会超出最大允许半径
  const [lonNew, latNew] = turf.along(
    turf.lineString([center, [lon, lat]]),
    maxRadius,
  ).geometry.coordinates as PointCoordinates;

  // 更新拖拽点的坐标，保留原始高度值
  // 这是最终应用的拖拽目标点，已确保在允许范围内
  modifyDragPoint.value = [lonNew, latNew, height] as PointCoordinates;
}

/**
 * 处理环绕区域中心点拖拽修改的函数
 * 该函数确保拖拽的中心点不会超出最大距离限制，同时更新拖拽点的位置
 *
 * @param coordinates - 拖拽操作的目标坐标点，格式为[经度, 纬度, 高度]
 */
function modifyingCenter(coordinates: PointCoordinates) {
  // 从组件现有坐标中解构出高度值，保持高度不变
  const [, , height] = props.coordinates!;

  // 从拖拽坐标中解构出经度和纬度（忽略高度，使用原有高度）
  const [lon, lat] = coordinates;

  // 计算圆心到起飞点的最大允许距离
  // 最大圆心距离 = 最大总距离 - 环绕半径
  // 这样确保整个环绕区域（圆心+半径）不超过设定的最大飞行距离
  const maxCenterDistance = props.maxDistance! - props.radius!;

  // 获取起飞点坐标
  // 这是无人机起飞的位置，用于计算距离限制和方向
  const takeoffPoint = props.takeoffPoint as number[];

  // 使用turf.js计算在直线上指定距离的点坐标
  // 1. 创建从起飞点到鼠标拖拽点的线段
  // 2. 在该线段上找到距离起飞点为maxCenterDistance的点
  // 这样确保圆心不会超出最大允许距离
  const [lonNew, latNew] = turf.along(
    turf.lineString([takeoffPoint, [lon, lat]]),
    maxCenterDistance,
  ).geometry.coordinates as PointCoordinates;

  // 更新圆心坐标，保留原有高度值
  // 这是最终应用的圆心位置，已确保在允许范围内
  modifyCenterPoint.value = [lonNew, latNew, height] as PointCoordinates;

  // 计算拖拽点位置：从圆心向正东方向移动指定半径距离
  // 使用turf.destination方法计算基于起点、距离和方位角的终点坐标
  const drag = turf.destination(
    turf.point(modifyCenterPoint.value as number[]), // 起点坐标（圆心）
    props.radius!, // 移动距离（单位：千米，来自组件属性）
    90, // 方位角（90°表示正东方向）
  ).geometry.coordinates as PointCoordinates;

  // 更新拖拽点坐标，使用与圆心相同的高度
  // 拖拽点是用户用于调整环绕半径的控制点
  modifyDragPoint.value = [drag[0], drag[1], height];
}

function modifyEnd() {
  editing.value = false;
  hoverId.value = -1;
  emits("changed", {
    coordinates: modifyCenterPoint.value!,
    radius: modifyRadius.value,
  });
}

function refreshId() {
  hoverId.value = -1;
}

function mouseEnter(id: number) {
  if (editing.value) {
    return;
  }
  hoverId.value = id;
}

function mouseLeave() {
  if (editing.value) {
    return;
  }
  hoverId.value = -1;
}

defineExpose({ refreshId });
</script>
