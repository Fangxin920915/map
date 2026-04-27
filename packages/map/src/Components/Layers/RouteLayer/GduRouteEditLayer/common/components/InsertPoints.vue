<template>
  <gdu-map-event :view-id="props.viewId" @camera-moving="getFootScreen" />
  <GduPoint
    v-for="({ coordinates, featureProperties, visible }, index) in insertPoints"
    :key="index"
    :name="props.layerId"
    :icon-src="getInsertIcon(index)"
    :coordinates="coordinates"
    :icon-height="16"
    :icon-width="17"
    :visible="(footVisibleCollection[index] ?? true) && visible"
    clamp-to-ground
    :feature-properties="featureProperties"
    @click="clickPoint(index, coordinates)"
  />
</template>

<script setup lang="ts">
import { GduMapEvent, GduPoint } from "@map/Components";
import {
  LineStringCoordinates,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { computed } from "vue";
import * as turf from "@turf/turf";
import { useGetFootScreen } from "../hooks/useGetFootScreen";
import { RouteActiveFeature } from "../types/EventCommonParams";
import { useRouteEditIcons } from "../hooks/useRouteEditIcons";
import { RouteEditLayerProps } from "../../props";

const props = defineProps<{
  line: LineStringCoordinates;
  visibleArr?: Array<boolean>;
  select: RouteActiveFeature;
  hover: RouteActiveFeature;
  theme: RouteEditLayerProps["theme"];
  parentsIdx?: number;
  layerId: string;
  viewId: string;
}>();

const emits = defineEmits<{
  (event: "click", index: number, point: PointCoordinates): void;
}>();

// 从 useRouteEditIcons 钩子中获取插入点的图标对象，该对象包含不同状态（如选中、悬停、正常）下的图标
const { insertionPoint } = useRouteEditIcons(props);

const { footVisibleCollection, getFootScreen } = useGetFootScreen(props);

/**
 * 计算属性，用于计算并返回插入点数组
 * 该数组包含输入线段中每相邻两点之间的中点坐标
 * @returns 包含所有相邻两点中点坐标的数组
 */
const insertPoints = computed(() => {
  // 初始化一个空数组，用于存储计算得到的插入点（中点）坐标
  const inserts: Array<{
    visible: boolean;
    coordinates: PointCoordinates;
    featureProperties: any;
  }> = [];
  // 遍历输入线段的坐标数组，由于要计算相邻两点的中点，所以遍历到倒数第二个点为止
  for (let i = 0; i < props.line.length - 1; i++) {
    // 获取当前点的坐标
    const current = props.line[i];
    // 获取下一个点的坐标
    const next = props.line[i + 1];
    // 使用 Turf 库的 midpoint 函数计算当前点和下一个点的中点
    const centerFeature = turf.midpoint(
      // 将当前点的坐标转换为 Turf 库的 point 对象
      turf.point(current as number[]),
      // 将下一个点的坐标转换为 Turf 库的 point 对象
      turf.point(next as number[]),
    );
    // 将计算得到的中点坐标添加到插入点数组中
    inserts.push({
      visible: props.visibleArr?.[i] ?? true,
      coordinates: centerFeature.geometry.coordinates as PointCoordinates,
      featureProperties: {
        type: RoutePointType.INSERT,
        index: i,
        parentsIdx: props.parentsIdx,
      },
    });
  }
  // 返回包含所有相邻两点中点坐标的数组
  return inserts;
});

/**
 * 处理插入点点击事件，根据不同的航线类型调用相应的插入点函数
 * @param index - 点击的插入点在 insertPoints 数组中的索引
 * @param point - 点击的插入点的坐标
 */
function clickPoint(index: number, point: PointCoordinates) {
  emits("click", index, point);
}

/**
 * 根据索引获取插入点的图标信息
 * @param index - 插入点在 insertPoints 数组中的索引
 * @returns 包含插入点名称和对应图标的对象
 */
function getInsertIcon(index: number) {
  // 若当前插入点名称与鼠标悬停元素的 ID 相同，返回悬停状态的图标信息
  if (
    props.hover.type === RoutePointType.INSERT &&
    props.hover.index === index &&
    props.hover.parentsIdx === props.parentsIdx
  ) {
    return insertionPoint.value.hover;
  }
  // 若既未选中也未悬停，返回正常状态的图标信息
  return insertionPoint.value.normal;
}
</script>
