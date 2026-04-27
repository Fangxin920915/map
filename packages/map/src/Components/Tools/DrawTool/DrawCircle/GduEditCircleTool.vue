<template>
  <gdu-vector-layer :view-id="props.viewId">
    <gdu-wall
      v-if="props.wallStyle && !isEmpty(circlePolygon[0])"
      v-bind="props.wallStyle"
      :coordinates="circlePolygon[0]"
      :name="props.layerId"
      :feature-properties="props.featureId"
      @click="refreshId"
    />
    <gdu-polygon
      v-if="!isEmpty(circlePolygon)"
      :coordinates="circlePolygon"
      v-bind="props.circleStyle"
      :name="props.layerId"
      :feature-properties="props.featureId"
      clamp-to-ground
      @click="refreshId"
    />
    <gdu-point
      :coordinates="modifyCenterPoint"
      enable-modify
      modify-type="ground"
      :name="props.layerId"
      :icon-width="18"
      :icon-height="18"
      :icon-src="drawCenter"
      :feature-properties="centerMoveFeatureProperties"
      clamp-to-ground
      @mouse-enter="mouseEnter(0)"
      @mouse-leave="mouseLeave"
      @modify-start="modifyStart(0)"
      @modifying="modifyingCenter"
      @modify-end="modifyEnd"
    />
    <gdu-point
      v-model:coordinates="modifyDragPoint"
      enable-modify
      modify-type="ground"
      :name="props.layerId"
      :icon-width="18"
      :icon-height="17"
      :icon-src="getEditTurnIcon(1)"
      clamp-to-ground
      :feature-properties="props.featureId"
      @mouse-enter="mouseEnter(1)"
      @mouse-leave="mouseLeave"
      @modify-start="modifyStart(1)"
      @modify-end="modifyEnd"
    />

    <template v-if="centerText">
      <gdu-line-string
        :coordinates="centerText.line"
        :stroke-color="props.circleStyle.strokeColor"
        :stroke-width="3"
        :stroke-outline-width="0"
        :line-dash="lineDash"
        clamp-to-ground
      />
      <gdu-point
        :coordinates="centerText?.point"
        shape-type="none"
        :text="centerText?.text"
        :text-size="10"
        :text-background-radius="4"
        :text-background-padding="DrawCircleTextPadding"
        text-background-color="rgba(0, 0, 0, 0.5)"
        clamp-to-ground
      />
    </template>
  </gdu-vector-layer>
</template>

<script setup lang="ts">
import {
  uuid,
  altitudeAccuracy,
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { computed, ref, watch } from "vue";
import * as turf from "@turf/turf";
import {
  GduPolygon,
  GduVectorLayer,
  GduPoint,
  GduLineString,
  DrawCircleTextPadding,
  GduWall,
} from "@map/Components";
import { isEmpty } from "lodash-es";
import drawCenter from "@map/Assets/draw-circle-center.png";
import {
  EditCircleToolEmits,
  EditCircleToolProps,
  defaultEditCircleProps,
} from "./props";
import { useDrawIcon } from "../Hooks/useDrawIcon";

const props = withDefaults(defineProps<EditCircleToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  radius: defaultEditCircleProps.radius,
  circleStyle: () => defaultEditCircleProps.circleStyle,
  turnPointStyle: () => defaultEditCircleProps.turnPointStyle,
  message: () => defaultEditCircleProps.message,
});

const emits = defineEmits<EditCircleToolEmits>();

// 用于存储正在修改的圆心点坐标，null表示未处于修改状态
const modifyCenterPoint = ref<PointCoordinates | null>(null);

// 用于存储拖拽修改时的临时点坐标，null表示未处于拖拽状态
const modifyDragPoint = ref<PointCoordinates | null>(null);

// 计算属性，返回中心点移动时的特征属性
// 包含要素ID和点类型（此处为RoutePointType.FOOT）
const centerMoveFeatureProperties = computed(() => {
  return {
    ...props.featureId,
    type: RoutePointType.FOOT,
  };
});

// 当前 hover 的点ID（用于鼠标悬停效果）
const hoverId = ref(-1);

// 编辑状态标记（拖拽编辑过程中为true，禁用部分交互）
const editing = ref(false);

// 虚线样式数组，定义虚线的线段长度和间隔，[实线长度, 间隔长度]
const lineDash = [10, 5];

const { footPoint } = useDrawIcon(props);

watch(
  [() => props.radius, () => props.coordinates],
  () => {
    // 更新圆心点坐标为当前属性值
    modifyCenterPoint.value = [...props.coordinates];
    // 计算并更新拖拽点坐标
    // 使用 turf.destination 计算从圆心沿正东方向移动指定半径距离后的点
    modifyDragPoint.value = turf.destination(
      turf.point(modifyCenterPoint.value as number[]), // 起点：圆心点
      props.radius, // 距离：使用当前半径值（单位：千米）
      90, // 方位角：90°表示正东方向
    ).geometry.coordinates as PointCoordinates;
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
  return {
    line: [start, end] as LineStringCoordinates,
    point: turf.midpoint(start, end).geometry.coordinates as PointCoordinates,
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
const circlePolygon = computed(() => {
  if (!modifyCenterPoint.value || !modifyDragPoint.value) {
    return [];
  }
  return turf.circle(
    turf.point(modifyCenterPoint.value as number[]),
    modifyRadius.value,
    {
      steps: 48,
    },
  ).geometry.coordinates as PolygonCoordinates;
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
  emits("modifyStart");
}

/**
 * 拖动圆心时，整体平移圆的位置
 * @param coordinates
 */
function modifyingCenter(coordinates: PointCoordinates) {
  // 更新圆心坐标
  modifyCenterPoint.value = coordinates;
  // 计算拖拽点位置：从圆心向正东方向移动指定半径距离
  modifyDragPoint.value = turf.destination(
    turf.point(modifyCenterPoint.value as number[]), // 起点坐标（圆心）
    props.radius, // 移动距离（单位：千米，来自组件属性）
    90, // 方位角（90°表示正东方向）
  ).geometry.coordinates as PointCoordinates;
}

function modifyEnd() {
  editing.value = false;
  emits("modifyEnd", modifyCenterPoint.value!, modifyRadius.value);
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
