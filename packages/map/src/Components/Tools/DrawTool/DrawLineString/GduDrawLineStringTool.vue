<template>
  <GduMapEvent
    v-if="drawing"
    :view-id="props.viewId"
    @click="mouseClickMap"
    @mouse-move="mouseMoveMap"
  />
  <GduVectorLayer v-if="drawing" :view-id="props.viewId">
    <draw-turn-points
      :layer-id="props.layerId"
      :view-id="props.viewId"
      :turn-points="turnPoints"
      :turn-point-style="props.turnPointStyle"
      :error-color="props.errorColor"
      :message="props.message"
      :is-polygon="false"
      @click="clickLineStringPoint"
      @delete="deletePoint"
    />
    <gdu-line-string
      v-if="points.length > 1"
      :coordinates="points"
      v-bind="props.lineStringStyle"
      clamp-to-ground
    />
  </GduVectorLayer>
</template>

<script setup lang="ts">
import { uuid } from "@gdu-gl/common";
import { GduLineString, GduMapEvent, GduVectorLayer } from "@map/Components";
import { defaultMapId } from "@map/Types";
import DrawTurnPoints from "@map/Components/Tools/DrawTool/Common/DrawTurnPoints.vue";
import { useMouseEvent } from "../Hooks/useMouseEvent";
import { useDrawEvent } from "./hooks/useDrawEvent";
import {
  defaultDrawLineStringProps,
  DrawLineStringToolEmits,
  DrawLineStringToolProps,
} from "./props";

const props = withDefaults(defineProps<DrawLineStringToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  lineStringStyle: () => defaultDrawLineStringProps.lineStringStyle,
  turnPointStyle: () => defaultDrawLineStringProps.turnPointStyle,
  message: () => defaultDrawLineStringProps.message,
});

const emits = defineEmits<DrawLineStringToolEmits>();

const {
  points,
  drawing,
  mouseClickMap,
  mouseMoveMap,
  turnPoints,
  startDraw,
  cancelDraw,
  finishDraw,
  deletePoint,
  hover,
} = useDrawEvent(props, emits);
useMouseEvent(props, "gdu-draw-line-cursor", drawing, hover, cancelDraw);

function clickLineStringPoint(index: number) {
  const { length } = turnPoints.value;
  if (length > 1 && index === length - 1) {
    finishDraw();
  }
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
