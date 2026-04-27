<template>
  <div
    v-if="!$slots.default"
    v-show="scaleInfo.distanceLabel && scaleInfo.barWidth && scaleInfo.distance"
    class="distance-legend"
  >
    <div class="distance-legend-label">{{ scaleInfo.distanceLabel }}</div>
    <div
      class="distance-legend-scale-bar"
      :style="`width: ${scaleInfo.barWidth ?? 0}px`"
    ></div>
  </div>
  <slot v-else v-bind="scaleInfo"> </slot>
</template>

<script setup lang="ts">
import { defaultMapId } from "@map/Types";
import { onBeforeUnmount, onMounted, reactive, watch } from "vue";
import { mapViewInternal } from "@gdu-gl/core";
import { WidgetType, IScaleToolImp } from "@gdu-gl/common";
import { defaultScaleToolProps, ScaleToolEmits, ScaleToolProps } from "./props";

const props = withDefaults(defineProps<ScaleToolProps>(), {
  ...defaultScaleToolProps,
  viewId: defaultMapId,
});

const emit = defineEmits<ScaleToolEmits>();

const scaleInfo = reactive<{
  barWidth?: number;
  distanceLabel?: string;
  distance?: number;
}>({});

const viewer = mapViewInternal.getViewer(props.viewId);
const scaleWidget = viewer?.widgetsDelegate.widgets.getWidgetByType(
  WidgetType.ScaleTool,
) as IScaleToolImp;

watch(
  () => props.maxBarWidth,
  () => {
    scaleWidget?.setMaxBarWidth(props.maxBarWidth);
  },
);

onMounted(() => {
  scaleWidget.init({
    maxBarWidth: props.maxBarWidth,
    changeCallback: ({ barWidth, distanceLabel, distance }) => {
      scaleInfo.barWidth = barWidth;
      scaleInfo.distanceLabel = distanceLabel;
      scaleInfo.distance = distance;
      emit("change", { barWidth, distanceLabel, distance });
    },
  });
});

onBeforeUnmount(() => {
  scaleWidget?.destroy();
});

defineSlots<{
  /**
   * ### 功能描述
   * 该方法用于覆盖比例尺的默认dom，自定义比例尺样式
   *
   * ### 返回值
   * - **barWidth** `number`: 比例尺宽度。
   * - **distanceLabel** `string`: 比例尺文字。
   * - **distance** `number`: 比例尺实际距离。
   */
  default(props: {
    barWidth?: number;
    distanceLabel?: string;
    distance?: number;
  }): any;
}>();
</script>
