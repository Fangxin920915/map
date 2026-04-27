<template>
  <!-- 根据 drawType 的值渲染不同的绘制工具组件 -->
  <GduDrawPointTool
    v-if="drawType === GeoFeatureType.Point"
    ref="drawRef"
    :view-id="props.viewId"
    :layer-id="props.layerId"
    :message="props.message"
    @start="startEvent"
    @cancel="cancelEvent"
    @finish="finishEvent"
  />
  <GduDrawLineStringTool
    v-else-if="drawType === GeoFeatureType.LineString"
    ref="drawRef"
    :view-id="props.viewId"
    :layer-id="props.layerId"
    :message="props.message"
    :turn-point-style="props.turnPointStyle"
    :line-string-style="props.style as any"
    @start="startEvent"
    @cancel="cancelEvent"
    @finish="finishEvent"
  />
  <GduDrawPolygonTool
    v-else-if="drawType === GeoFeatureType.Polygon"
    ref="drawRef"
    :view-id="props.viewId"
    :layer-id="props.layerId"
    :message="props.message"
    :turn-point-style="props.turnPointStyle"
    :error-color="props.errorColor"
    :polygon-style="props.style as any"
    @start="startEvent"
    @cancel="cancelEvent"
    @finish="finishEvent"
  />
  <GduDrawCircleTool
    v-else-if="drawType === GeoFeatureType.Circle"
    ref="drawRef"
    :view-id="props.viewId"
    :layer-id="props.layerId"
    :message="props.message"
    :turn-point-style="props.turnPointStyle"
    :circle-style="props.style as any"
    @start="startEvent"
    @cancel="cancelEvent"
    @finish="finishEvent"
  />
</template>

<script setup lang="ts">
import {
  GduDrawLineStringTool,
  GduDrawPointTool,
  GduDrawPolygonTool,
  GduDrawCircleTool,
} from "@map/Components";
import { nextTick, ref, useTemplateRef } from "vue";
import { defaultMapId } from "@map/Types";
import {
  LineStringCoordinates,
  GeoFeatureType,
  PointCoordinates,
  PolygonCoordinates,
  uuid,
} from "@gdu-gl/common";
import { DrawToolEmits, DrawToolProps } from "./props";
import { defaultCommonProps } from "./Common/CommonProps";

// 定义组件的 props，并设置默认值
const props = withDefaults(defineProps<DrawToolProps>(), {
  ...defaultCommonProps,
  layerId: () => uuid(),
  viewId: defaultMapId,
  turnPointStyle: () => defaultCommonProps.turnPointStyle,
  message: () => defaultCommonProps.message,
});

// 定义组件的 emits
const emits = defineEmits<DrawToolEmits>();

// 定义绘制类型的响应式变量，初始值为 null
const drawType = ref<GeoFeatureType | null>(null);

// 使用 useTemplateRef 获取绘制工具组件的引用
const drawRef = useTemplateRef("drawRef");

/**
 * 开始绘制的方法
 * @param type
 */
function startDraw(type: (typeof GeoFeatureType)[keyof typeof GeoFeatureType]) {
  // 触发 start 事件
  emits("start");
  // 设置绘制类型
  drawType.value = type;
  nextTick(() => {
    // 调用绘制工具组件的 startDraw 方法
    drawRef.value?.startDraw();
  });
}

/**
 * 处理绘制开始事件
 */
function startEvent() {
  // 触发 start 事件
  emits("start");
}

/**
 * 处理绘制取消事件
 */
function cancelEvent() {
  // 触发 cancel 事件
  emits("cancel");
}

/**
 * 处理绘制完成事件
 * @param coordinates - 绘制完成后的坐标，可能是点、线、面的坐标
 * @param radius
 */
function finishEvent(
  coordinates: PointCoordinates | LineStringCoordinates | PolygonCoordinates,
  radius?: number,
) {
  if (!coordinates) {
    return;
  }

  // 触发 finish 事件，传递生成的要素样式
  emits("finish", { type: drawType.value!, coordinates, radius });
  // 重置绘制类型
  drawType.value = null;
}

/**
 * 取消绘制的方法
 */
function cancelDraw() {
  // 调用绘制工具组件的 cancelDraw 方法
  drawRef.value?.cancelDraw();
}

/**
 * 完成绘制的方法
 */
function finishDraw() {
  // 调用绘制工具组件的 finishDraw 方法
  drawRef.value?.finishDraw();
}

// 暴露方法供父组件调用
defineExpose({
  cancelDraw,
  startDraw,
  finishDraw,
});
</script>
