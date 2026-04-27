<template>
  <!--  悬空线  -->
  <GduArrowLineString :coordinates="circleToLine" :ring="true" />
  <!-- 悬空垂直辅助线 -->
  <template v-if="helperLine">
    <gdu-line-string v-bind="helperLine" />
    <gdu-point
      :visible="!props.clamToGround"
      :coordinates="props.coordinates"
      :icon-width="18"
      :icon-height="17"
      :icon-src="footPoint"
      clamp-to-ground
    />
  </template>
  <!-- 中心点图标 -->
  <gdu-point
    :coordinates="props.coordinates"
    :icon-width="30"
    :icon-height="30"
    :icon-src="drawCenter"
  />
  <!-- 起始点图标 -->
  <gdu-point v-bind="startPoint" />
</template>

<script setup lang="ts">
import { LineStringCoordinates, MapThemeColor } from "@gdu-gl/common";
import { computed, toRaw } from "vue";
import * as turf from "@turf/turf";
import { GduArrowLineString, GduLineString, GduPoint } from "@map/Components";
import { isEmpty, isNil } from "lodash-es";
import drawCenter from "@map/Assets/drag-surround-center.png";
import { getFootPointIcon, getPointIcon } from "@map/Utils";
import { SurroundShowLayerProps } from "../props";

const props = defineProps<SurroundShowLayerProps>();

const footPoint = computed(() => {
  return getFootPointIcon(
    MapThemeColor.success[100],
    MapThemeColor.success[900],
  );
});

const startPoint = computed(() => {
  return {
    iconSrc: getPointIcon(
      MapThemeColor.execute[500],
      MapThemeColor.execute[900],
    ),
    coordinates: props.startPoint,
    iconWidth: 24,
    iconHeight: 24,
    text: "S",
    textColor: "#FFFFFF",
    textSize: 16,
    textFontWeight: "bold",
  };
});

const helperLine = computed(() => {
  if (isEmpty(props.coordinates)) {
    return null;
  }
  const [lon, lat] = props.coordinates!;
  const line = [
    toRaw(props.coordinates),
    [lon, lat, 0],
  ] as LineStringCoordinates;
  return {
    coordinates: line,
    lineDash: [10, 3],
    strokeColor: "#FFFFFF",
    strokeWidth: 1,
  };
});

/**
 * 计算并返回当前圆的多边形坐标
 * 基于圆心点和当前半径值
 */
const circleToLine = computed(() => {
  if (isEmpty(props.coordinates) || isNil(props.radius)) {
    return [];
  }
  const [centerLon, centerLat, height] = props.coordinates!;
  const [circleLine] = turf.circle(
    turf.point([centerLon, centerLat]),
    props.radius!,
    {
      steps: 64,
    },
  ).geometry.coordinates;
  const line: LineStringCoordinates = [];
  // 如果启用逆时针，反转圆的坐标顺序
  if (!props.enableCounterclockwise) {
    circleLine.reverse();
  }
  circleLine.forEach((point, index) => {
    if (index === circleLine.length - 1) {
      return;
    }
    const [lon, lat] = point;
    line.push([lon, lat, height]);
  });
  return line;
});
</script>
