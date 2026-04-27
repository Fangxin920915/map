<template>
  <GduMapEvent v-if="drawing" :view-id="props.viewId" @click="mouseClickMap" />
</template>

<script setup lang="ts">
import { MouseEventParams, PointCoordinates, uuid } from "@gdu-gl/common";
import { GduMapEvent } from "@map/Components";
import { defaultMapId } from "@map/Types";
import { useDrawShapeEvent } from "@map/Components/Tools/DrawTool/Hooks/useDrawShapeEvent";
import { useMouseEvent } from "../Hooks/useMouseEvent";
import {
  defaultDrawPointProps,
  DrawPointToolEmits,
  DrawPointToolProps,
} from "./props";

const props = withDefaults(defineProps<DrawPointToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  message: () => defaultDrawPointProps.message,
});

const emits = defineEmits<DrawPointToolEmits>();

const { points, drawing, hover, startDraw, cancelDraw } = useDrawShapeEvent(
  props,
  emits,
);

useMouseEvent(props, "gdu-draw-point-cursor", drawing, hover, cancelDraw);

function finishDraw(position?: PointCoordinates) {
  emits("finish", position ?? []);
  drawing.value = false;
  points.value = [];
  hover.value = -1;
}

function mouseClickMap(params: MouseEventParams) {
  // 获取点击要素的名称
  const name = params.feature?.properties.name;
  // 若要素名称以当前图层 ID 开头
  if (name === props.layerId) {
    return;
  }
  if (!params.coordinates) {
    return;
  }
  finishDraw(params.coordinates);
}

defineExpose({
  /**
   * 开始绘制面
   */
  startDraw,
  /**
   * 结束绘制面
   */
  finishDraw,
  /**
   * 取消绘制面
   */
  cancelDraw,
});
</script>
