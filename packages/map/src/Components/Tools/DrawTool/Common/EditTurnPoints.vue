<template>
  <!-- 转折点编辑区域：渲染可编辑的顶点及删除弹窗 -->
  <template v-for="(point, index) in turnInsertPoints.turnPoints" :key="index">
    <!-- 转折点标记：支持点击选择、鼠标悬停、拖拽编辑功能 -->
    <gdu-point
      enable-modify
      modify-type="ground"
      :name="props.layerId"
      :coordinates="point"
      :icon-width="18"
      :icon-height="17"
      :icon-src="getEditTurnIcon(getTurnIdByIndex(index))"
      clamp-to-ground
      :feature-properties="turnFeatureInfo"
      @click="selectTurnPoint(index)"
      @mouse-enter="mouseEnter(getTurnIdByIndex(index))"
      @mouse-leave="mouseLeave"
      @modify-start="modifyStart(index)"
      @modifying="modifying(index, $event)"
      @modify-end="modifyEnd"
    />
    <!-- 删除弹窗：仅在当前转折点被选中时显示 -->
    <delete-popup
      :visible="!editing && getVisibleDeletePopup(index)"
      :view-id="props.viewId"
      :coordinates="point"
      clamp-to-ground
      :message="props.message"
      :offset="deletePopupOffset"
      @click="deletePoint(index)"
    />
    <polygon-self-intersecting-popup
      v-if="
        props.isPolygon &&
        getVisibleDeletePopup(index) &&
        props.isPolygonSelfIntersecting
      "
      :view-id="props.viewId"
      :coordinates="point"
      :offset="polygonSelfIntersectingPopupOffset"
      :message="props.message"
    />
  </template>

  <!-- 插入点区域：渲染线段中点，用于添加新转折点 -->
  <gdu-point
    v-for="(point, index) in turnInsertPoints.insertPoints"
    :key="index"
    :name="props.layerId"
    :coordinates="point"
    :icon-width="18"
    :icon-height="17"
    :icon-src="getEditInsertIcon(getInsertIdByIndex(index))"
    :feature-properties="props.featureId"
    clamp-to-ground
    @mouse-enter="mouseEnter(getInsertIdByIndex(index))"
    @mouse-leave="mouseLeave"
    @click="add(index, point)"
  />
</template>

<script setup lang="ts">
import {
  getMidPoint,
  LineStringCoordinates,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { computed, ref } from "vue";
import { GduPoint } from "@map/Components";
import { cloneDeep } from "lodash-es";
import DeletePopup from "@map/Components/Common/DeletePopup.vue";
import {
  deletePopupOffset,
  polygonSelfIntersectingPopupOffset,
} from "@map/Constants";
import PolygonSelfIntersectingPopup from "@map/Components/Common/PolygonSelfIntersectingPopup.vue";
import { useDrawIcon } from "../Hooks/useDrawIcon";
import { CommonDrawProps } from "./CommonProps";

/**
 * 组件属性定义
 * - points: 线/面的坐标数组（LineString格式）
 * - isPolygon: 是否为多边形（多边形坐标首尾点相同，需特殊处理）
 */
interface Props extends CommonDrawProps {
  points: LineStringCoordinates;
  isPolygon?: boolean;
  isPolygonSelfIntersecting?: boolean;
  featureId?: {
    [key: string]: any;
  };
}

const props = defineProps<Props>();

/**
 * 组件事件定义
 * - update:points: 实时更新坐标（用于拖拽编辑过程中）
 * - start: 开始编辑时触发
 * - finish: 编辑完成（如插入/修改点后）触发，返回最终坐标
 */
const emits = defineEmits<{
  (e: "update:points", points: LineStringCoordinates): void;
  (e: "start"): void;
  (e: "finish", points: LineStringCoordinates): void;
}>();

// 图标状态管理：通过useDrawIcon获取垂足点(turnPoint)和插入点(insertPoint)的图标配置
const { footPoint, insertPoint } = useDrawIcon(props);

// 当前激活的点ID（用于高亮选中状态）
const activeId = ref("");
// 当前 hover 的点ID（用于鼠标悬停效果）
const hoverId = ref("");
// 编辑状态标记（拖拽编辑过程中为true，禁用部分交互）
const editing = ref(false);

const turnFeatureInfo = computed(() => {
  return {
    ...props.featureId,
    type: RoutePointType.FOOT,
  };
});

/**
 * 计算属性：生成转折点和插入点数据
 * - insertPoints: 线段中点数组（每个线段中间的可插入点）
 * - turnPoints: 可编辑的顶点数组（多边形需排除最后一个重复点）
 */
const turnInsertPoints = computed(() => {
  const insertPoints = [];
  // 遍历线段，计算每两个连续点的中点作为插入点
  for (let i = 0; i < props.points.length - 1; i++) {
    const currentPoint = props.points[i];
    const nextPoint = props.points[i + 1];
    const midPoint = getMidPoint(currentPoint, nextPoint);
    insertPoints.push(midPoint);
  }
  // 多边形的坐标数组首尾相同，需截取掉最后一个点避免重复渲染
  const turnPoints = props.isPolygon
    ? props.points.slice(0, props.points.length - 1)
    : props.points;
  return {
    insertPoints,
    turnPoints,
  };
});

/**
 * 获取转折点图标
 * @param id 点ID（格式：turn:index）
 * @returns 图标路径（根据激活/hover状态返回不同图标）
 */
function getEditTurnIcon(id: string) {
  const { normal, select, hover } = footPoint.value;
  switch (id) {
    case activeId.value:
      return select; // 激活状态图标
    case hoverId.value:
      return hover; // 悬停状态图标
    default:
      return normal; // 默认状态图标
  }
}

/**
 * 获取插入点图标
 * @param id 点ID（格式：insert:index）
 * @returns 图标路径（仅区分悬停和默认状态）
 */
function getEditInsertIcon(id: string) {
  const { normal, hover } = insertPoint.value;
  switch (id) {
    case hoverId.value:
      return hover; // 悬停状态图标
    default:
      return normal; // 默认状态图标
  }
}

/**
 * 插入新点到线段中
 * @param index 线段索引（对应insertPoints的索引）
 * @param point 插入点坐标（线段中点）
 */
function add(index: number, point: PointCoordinates): void {
  // 深拷贝原坐标数组（避免直接修改props）
  const points = cloneDeep(props.points);
  // 在index+1位置插入新点（线段后方）
  points.splice(index + 1, 0, point);
  activeId.value = getTurnIdByIndex(index + 1);
  // 触发完成事件，返回新坐标
  emits("finish", points);
  // 实时更新坐标（用于父组件同步渲染）
  emits("update:points", points);
}

function deletePoint(index: number): void {
  activeId.value = "";
  // 深拷贝原坐标数组（避免直接修改props）
  const points = cloneDeep(props.points);
  // 在index+1位置插入新点（线段后方）
  points.splice(index, 1);
  if (props.isPolygon && index === 0) {
    // 使用数组解构获取第一个点
    const [firstPoint] = points;
    points[points.length - 1] = firstPoint;
  }
  // 触发完成事件，返回新坐标
  emits("finish", points);
  // 实时更新坐标（用于父组件同步渲染）
  emits("update:points", points);
}

/**
 * 鼠标进入点区域时触发
 * @param id 点ID（turn:index 或 insert:index）
 */
function mouseEnter(id: string) {
  if (editing.value) {
    return; // 编辑中不响应hover
  }
  hoverId.value = id;
}

/**
 * 鼠标离开点区域时触发
 */
function mouseLeave() {
  if (editing.value) {
    return; // 编辑中不清除hover
  }
  hoverId.value = "";
}

/**
 * 选中转折点（点击删除弹窗时触发）
 * @param index 转折点索引
 */
function selectTurnPoint(index: number) {
  activeId.value = getTurnIdByIndex(index);
}

/**
 * 开始拖拽编辑转折点
 * @param index 转折点索引
 */
function modifyStart(index: number) {
  editing.value = true; // 进入编辑状态
  activeId.value = getTurnIdByIndex(index); // 激活当前点
  hoverId.value = activeId.value; // 强制hover状态（避免拖拽时闪烁）
  emits("start"); // 通知父组件开始编辑
}

/**
 * 结束拖拽编辑
 */
function modifyEnd() {
  editing.value = false; // 退出编辑状态
  emits("finish", props.points); // 触发完成事件，返回最终坐标
}

/**
 * 拖拽编辑过程中实时更新坐标
 * @param index 转折点索引
 * @param point 拖拽后的新坐标
 */
function modifying(index: number, point: PointCoordinates): void {
  const points = cloneDeep(props.points);
  points[index] = point;
  // 多边形特殊处理：首点和尾点需保持一致（因多边形坐标首尾相同）
  if (props.isPolygon && index === 0) {
    points[props.points.length - 1] = point;
  }
  // 实时更新坐标（用于父组件同步渲染）
  emits("update:points", points);
}

/**
 * 生成转折点唯一ID
 * @param index 转折点索引
 * @returns 格式如 "turn:0" 的ID字符串
 */
function getTurnIdByIndex(index: number) {
  return `turn:${index}`;
}

/**
 * 生成插入点唯一ID
 * @param index 插入点索引
 * @returns 格式如 "insert:0" 的ID字符串
 */
function getInsertIdByIndex(index: number) {
  return `insert:${index}`;
}

function getVisibleDeletePopup(index: number) {
  if (props.isPolygon && props.points.length > 4) {
    return activeId.value === getTurnIdByIndex(index);
  }

  if (props.isPolygon && props.points.length <= 4) {
    return false;
  }

  if (!props.isPolygon && props.points.length > 2) {
    return activeId.value === getTurnIdByIndex(index);
  }

  if (!props.isPolygon && props.points.length <= 2) {
    return false;
  }

  return activeId.value === getTurnIdByIndex(index);
}

function refreshId() {
  activeId.value = "";
  hoverId.value = "";
}

defineExpose({
  refreshId,
});
</script>
