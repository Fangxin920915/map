<template>
  <GduMapEvent
    v-if="drawing"
    :view-id="props.viewId"
    @click="mouseClick"
    @mouse-move="mouseMove"
  />
  <GduVectorLayer v-if="drawing" :view-id="props.viewId">
    <gdu-point
      v-for="(point, i) in points"
      :key="i"
      :coordinates="point"
      v-bind="getDrawingIcon(i)"
      :name="props.layerId!"
      clamp-to-ground
      @click="clickFinish(i)"
    />
    <gdu-line-string
      :coordinates="points"
      :stroke-color="props.circleStyle.strokeColor"
      :stroke-width="3"
      :stroke-outline-width="0"
      :line-dash="lineDash"
      clamp-to-ground
    />
    <gdu-point
      v-if="centerText"
      :coordinates="centerText.point"
      shape-type="none"
      :text="centerText.text"
      :text-size="10"
      :text-background-radius="4"
      :text-background-padding="DrawCircleTextPadding"
      text-background-color="rgba(0, 0, 0, 0.5)"
      clamp-to-ground
    />
    <gdu-polygon
      :coordinates="circlePolygon"
      v-bind="props.circleStyle"
      clamp-to-ground
    />
  </GduVectorLayer>
</template>

<script setup lang="ts">
import {
  GduMapEvent,
  GduVectorLayer,
  GduPoint,
  GduPolygon,
  GduLineString,
  DrawCircleTextPadding,
} from "@map/Components";
import { uuid } from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { useDrawIcon } from "@map/Components/Tools/DrawTool/Hooks/useDrawIcon";
import drawCenter from "@map/Assets/draw-circle-center.png";
import { useMouseEvent } from "../Hooks/useMouseEvent";
import {
  DrawCircleToolProps,
  DrawCircleToolEmits,
  defaultDrawCircleProps,
} from "./props";
import { useDrawEvent } from "./Hooks/useDrawEvent";

const props = withDefaults(defineProps<DrawCircleToolProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
  circleStyle: () => defaultDrawCircleProps.circleStyle,
  turnPointStyle: () => defaultDrawCircleProps.turnPointStyle,
  message: () => defaultDrawCircleProps.message,
});

const emits = defineEmits<DrawCircleToolEmits>();

const lineDash = [10, 5];

const { finishPointIcon } = useDrawIcon(props);

const {
  drawing,
  mouseMove,
  mouseClick,
  startDraw,
  cancelDraw,
  finishDraw,
  points,
  circlePolygon,
  hover,
  centerText,
} = useDrawEvent(emits);

useMouseEvent(props, "gdu-draw-circle-cursor", drawing, hover, cancelDraw);

/**
 * 获取绘制状态下点的图标
 * @param index - 点的索引
 * @returns 包含图标名称和图标的对象
 */
function getDrawingIcon(index: number) {
  // 获取正常状态下的垂足点图标
  const { length } = points.value;
  if (index === length - 1) {
    return {
      iconSrc: finishPointIcon.value,
      iconWidth: 18,
      iconHeight: 17,
    };
  }
  return {
    iconSrc: drawCenter,
    iconWidth: 18,
    iconHeight: 18,
  };
}

function clickFinish(i: number) {
  if (i === points.value.length - 1) {
    finishDraw();
  }
}

defineExpose({
  startDraw,
  cancelDraw,
  finishDraw,
});
</script>
