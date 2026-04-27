<!--
  RouteLine 组件
  功能：航线核心渲染组件，负责在地图上绘制单条航线段，包括带箭头的航线和投影线
  
  主要职责：
  1. 渲染带箭头指示方向的航线线条（GduArrowLineString）
  2. 在点类型项目中渲染地面投影线（GduLineString）
  3. 计算并显示航线飞行进度
  
  数据流向：
  父组件 GduRouteLayer -> RouteLine（接收分组后的航线数据）
-->
<template>
  <!-- 仅当航线数据非空时渲染 -->
  <template v-if="!isEmpty(props.line)">
    <!-- 
      主航线组件：带箭头的航线线条
      - 使用主题样式配置
      - coordinates 使用优化后的航线坐标（去除冗余转弯点）
      - progress 控制已飞行部分的显示
    -->
    <GduArrowLineString
      v-bind="routeProps.theme?.line"
      :coordinates="transformLine.line"
      :stroke-width="6"
      :stroke-outline-width="0"
      :progress="progress"
    />

    <!-- 
      投影线组件：仅在点类型项目中显示
      - 将航线投影到地面（clamp-to-ground）
      - 用于显示航线的地面参考路径
    -->
    <GduLineString
      v-if="routeProps.type === RouteLayerType.MapProjectTypePoint"
      :coordinates="props.line"
      :stroke-color="routeProps.theme?.projectionLine.fillColor"
      :stroke-width="2"
      clamp-to-ground
    />
  </template>
</template>

<script setup lang="ts">
import { GduArrowLineString, GduLineString } from "@map/Components";
import { computed } from "vue";
import { isEmpty, isNil } from "lodash-es";
import { getFakeRouteLineProgress, mapViewInternal } from "@gdu-gl/core";
import {
  isValidCoordinates,
  isValidLineString,
  LineStringCoordinates,
  optimizePolylineTurningPoints,
  RouteLayerType,
} from "@gdu-gl/common";
import { useInjectRouteProps } from "../hooks/useInjectRouteProps";

/**
 * 组件 Props 定义
 * @property line - 当前航线段的坐标点数组
 * @property surroundGroupFullLine - 环绕航线切割后的完整分组，用于计算航点索引偏移
 * @property surroundLineIndex - 当前航线段在环绕分组中的索引
 * @property groupIndex - 当前航线在整体航线分组中的索引
 */
const props = defineProps<{
  line: LineStringCoordinates;
  /**
   * ### 功能描述
   * 环绕航线切割分组完整
   */
  surroundGroupFullLine: LineStringCoordinates[];
  /**
   * ### 功能描述
   * 环绕航线切割分组索引
   */
  surroundLineIndex: number;
  /**
   * 航线分组索引
   */
  groupIndex: number;
}>();

/**
 * 注入父组件提供的路由属性
 * 包含航线配置、主题、无人机位置、飞行状态等信息
 */
const { routeProps } = useInjectRouteProps();

/**
 * 获取地图视图实例
 * 用于后续的航线进度计算
 */
const viewer = mapViewInternal.getViewer(routeProps.viewId as string);

/**
 * 计算属性：优化后的航线坐标
 * 对航线进行转弯点优化处理，去除冗余点，使航线更平滑
 */
const transformLine = computed(() => {
  return optimizePolylineTurningPoints(props.line);
});

/**
 * 计算属性：飞向航点在当前航线段中的相对索引
 *
 * ### 计算逻辑说明：
 * 由于航线中包含环绕航点（surroundPoint），全局索引需要转换为当前段的相对索引
 *
 * 1. 先计算当前航线段之前有多少个航点（indexOfFullLine）
 * 2. 再计算这些航点及其环绕点总数（count）
 * 3. 用全局飞行目标索引减去 count 得到相对索引
 *
 * @returns 相对索引值，如果无法计算则返回 -1
 */
const flyToIndexInCurrentLine = computed(() => {
  const currentFullLine = routeProps.lines?.[props.groupIndex];

  // 前置条件检查：当前航线组存在且非空，且有飞行目标点
  if (
    !currentFullLine ||
    isEmpty(currentFullLine) ||
    isNil(routeProps.flyToPointIndex)
  ) {
    return -1;
  }

  // 步骤1：计算当前航线段在完整航线中的起始索引
  // indexOfFullLine 表示当前段之前所有航点的数量
  let indexOfFullLine = -1;
  for (let i = 0; i < props.surroundLineIndex; i++) {
    indexOfFullLine += props.surroundGroupFullLine[i].length;
  }

  // 步骤2：统计当前段之前所有航点及环绕点的总数量
  let count = 0;
  for (let i = 0; i <= indexOfFullLine; i++) {
    count += 1; // 常规航点计数
    // 如果该航点有环绕点，加上环绕点数量
    if (currentFullLine[i].surroundPoint) {
      count += currentFullLine[i].surroundPoint!.pointList.length;
    }
  }

  // 步骤3：计算相对索引
  return routeProps.flyToPointIndex - count;
});

/**
 * 计算属性：航线飞行进度
 *
 * ### 进度计算规则：
 * - 进度范围：0（未开始）到 1（已完成）
 * - 如果当前航线组已完成（parentsIdx > groupIndex），进度为 1
 * - 如果当前航线组未到达（parentsIdx < groupIndex），进度为 0
 * - 如果正在当前航线组飞行，根据无人机位置计算精确进度
 *
 * @returns 0-1 之间的进度值
 */
const progress = computed(() => {
  // 获取父航线组索引（表示当前飞行到哪个航线组）
  const parentsIdx = routeProps.parentsIdx ?? 0;

  // 边界条件：航线数据不足
  if (isEmpty(props.line) || props.line.length < 2) {
    return 0;
  }

  // 如果当前航线组已经飞过，返回完成状态
  if (parentsIdx > props.groupIndex) {
    return 1;
  }

  // 如果还没飞到当前航线组，返回未开始状态
  if (parentsIdx < props.groupIndex) {
    return 0;
  }

  // 正在当前航线组飞行时的进度计算
  // 需要检查航线数据和无人机位置是否有效
  if (
    isEmpty(routeProps.lines![props.groupIndex]) ||
    isEmpty(routeProps.uavPosition)
  ) {
    return 0;
  }

  try {
    // 验证无人机坐标有效性
    const point = isValidCoordinates(routeProps.uavPosition);
    // 验证航线坐标有效性
    isValidLineString(props.line);

    // 调用核心算法计算精确进度
    return getFakeRouteLineProgress(viewer!, {
      clampToGround: false,
      line: props.line,
      uavPosition: point,
      flyToPointIndex: flyToIndexInCurrentLine.value,
      optimizePolyline: transformLine.value,
    });
  } catch (e) {
    // 异常处理：进度计算失败时重置为 0
    console.warn("航线进度计算异常，已将航线进度重置为0", e);
    return 0;
  }
});
</script>
