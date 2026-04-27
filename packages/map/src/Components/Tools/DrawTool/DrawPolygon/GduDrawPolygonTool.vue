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
      is-polygon
      @click="clickAreaPoint"
      @delete="deletePoint"
    />
    <gdu-line-string
      v-if="points.length === 2"
      :coordinates="points"
      v-bind="omit(props.polygonStyle!, ['fillColor'])"
      clamp-to-ground
    />
    <gdu-polygon
      v-else-if="!isEmpty(polygon)"
      clamp-to-ground
      :coordinates="polygon"
      v-bind="props.polygonStyle"
      :fill-color="polygonSelfStyle.fillColor"
      :stroke-color="polygonSelfStyle.strokeColor"
      :stroke-gap-color="polygonSelfStyle!.strokeGapColor"
    />
  </GduVectorLayer>
  <polygon-self-intersecting-popup
    v-if="mousePosition && isPolygonSelfIntersecting"
    :view-id="props.viewId"
    :coordinates="mousePosition"
    :offset="polygonSelfIntersectingPopupOffset"
    :message="props.message"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { uuid, isTransparentColor } from "@gdu-gl/common";
import {
  GduLineString,
  GduMapEvent,
  GduPolygon,
  GduVectorLayer,
} from "@map/Components";
import { defaultMapId } from "@map/Types";
import { isEmpty, omit } from "lodash-es";
import PolygonSelfIntersectingPopup from "@map/Components/Common/PolygonSelfIntersectingPopup.vue";
import { polygonSelfIntersectingPopupOffset } from "@map/Constants";
import DrawTurnPoints from "@map/Components/Tools/DrawTool/Common/DrawTurnPoints.vue";
import { useMouseEvent } from "../Hooks/useMouseEvent";
import { useDrawEvent } from "./hooks/useDrawEvent";
import {
  DrawPolygonToolEmits,
  DrawPolygonToolProps,
  defaultDrawPolygonProps,
} from "./props";

const props = withDefaults(defineProps<DrawPolygonToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  polygonStyle: () => defaultDrawPolygonProps.polygonStyle,
  turnPointStyle: () => defaultDrawPolygonProps.turnPointStyle,
  message: () => defaultDrawPolygonProps.message,
});

const emits = defineEmits<DrawPolygonToolEmits>();

const {
  points,
  drawing,
  mouseClickMap,
  mouseMoveMap,
  isPolygonSelfIntersecting,
  polygon,
  turnPoints,
  startDraw,
  cancelDraw,
  finishDraw,
  deletePoint,
  hover,
  mousePosition,
} = useDrawEvent(props, emits);
useMouseEvent(props, "gdu-draw-area-cursor", drawing, hover, cancelDraw);

const polygonSelfStyle = computed(() => {
  if (isPolygonSelfIntersecting.value) {
    const isTransparent = isTransparentColor(
      props.polygonStyle?.strokeGapColor,
    );
    return {
      fillColor: "rgba(0,0,0,0)",
      strokeColor: props.errorColor,
      strokeGapColor: isTransparent ? "transparent" : props.errorColor,
    };
  }
  return {
    fillColor: props.polygonStyle!.fillColor,
    strokeColor: props.polygonStyle!.strokeColor,
    strokeGapColor: props.polygonStyle?.strokeGapColor,
  };
});

function clickAreaPoint(index: number) {
  const { length } = turnPoints.value;
  if (length > 2 && index === length - 1) {
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
