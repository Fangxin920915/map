<template>
  <template v-for="(lines, i) in indicatorLines" :key="i">
    <GduMultiLineString
      :coordinates="lines"
      :stroke-color="routeProps.theme?.helperLine.fillColor"
      :line-dash="lineDash"
      :stroke-width="1"
    />
    <GduPoint
      v-for="(line, index) in lines"
      :key="`${i}-${index}`"
      :coordinates="line[1]"
      :visible="!routeProps.clampToGround"
      :icon-src="footPoint"
      :icon-height="16"
      :icon-width="17"
      clamp-to-ground
    />
  </template>
</template>

<script setup lang="ts">
import { GduPoint, GduMultiLineString } from "@map/index";
import { LineStringCoordinates } from "@gdu-gl/common";
import { watch, ref } from "vue";
import { isEmpty } from "lodash-es";
import { useRouteIcons } from "../hooks/useRouteIcons";
import { useInjectRouteProps } from "../hooks/useInjectRouteProps";

const { turnPointList, routeProps } = useInjectRouteProps();

const { footPoint } = useRouteIcons(routeProps);
const lineDash = [10, 2];
const indicatorLines = ref<LineStringCoordinates[][]>([]);

watch(
  turnPointList,
  () => {
    if (isEmpty(turnPointList.value)) {
      indicatorLines.value = [];
      return;
    }
    const arr: LineStringCoordinates[][] = [];
    turnPointList.value.forEach((list) => {
      const indicatorArr: LineStringCoordinates[] = [];
      list.forEach(({ coordinates }) => {
        const [lon, lat] = coordinates;
        indicatorArr.push([coordinates, [lon, lat]]);
      });
      arr.push(indicatorArr);
    });
    // for (let i = 0; i < turnPointList.value.length; i++) {
    //   const { coordinates } = turnPointList.value[i];
    //   const [lon, lat] = coordinates;
    //   line.push(coordinates);
    //   arr.push([coordinates, [lon, lat]]);
    // }
    indicatorLines.value = arr;
  },
  {
    deep: true,
    immediate: true,
  },
);
</script>
