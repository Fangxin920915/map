<template>
  <template v-for="(pointList, i) in pointGroupList" :key="i">
    <template v-for="(point, index) in pointList" :key="`${i}-${index}`">
      <SurroundRouteLine
        v-if="
          point.surroundPoint &&
          routeProps.type === RouteLayerType.MapProjectTypePoint
        "
        :parents-index="i"
        :idx="index"
        :start-coordinates="point.coordinates"
        :coordinates="point.surroundPoint.coordinates"
        :end-coordinates="pointList[index + 1]?.coordinates"
        :enable-counterclockwise="point.surroundPoint.enableCounterclockwise"
        :angle="point.surroundPoint.angle"
        :height="point.surroundPoint.height"
        :repeat="point.surroundPoint.repeat"
        :step-angle="point.surroundPoint.stepAngle"
        :surround-point-list="point.surroundPoint.pointList"
        :altitude-mode="routeProps.altitudeMode"
        :takeoff-point="routeProps.takeoffPoint"
      />
      <GduPoint
        v-bind="getIcon(point, index, pointList.length)"
        :coordinates="point.coordinates"
      />
    </template>
  </template>
</template>

<script setup lang="ts">
import { GduPoint } from "@map/index";
import { LinePointAction, RouteLayerType } from "@gdu-gl/common";
import { computed } from "vue";
import SurroundRouteLine from "./SurroundRouteLine.vue";
import { useRouteIcons } from "../hooks/useRouteIcons";
import { useInjectRouteProps } from "../hooks/useInjectRouteProps";

const { routeProps, turnPointList } = useInjectRouteProps();

const {
  startSafePoint,
  endSafePoint,
  turnSafePoint,
  startPoint,
  endPoint,
  turnPoint,
} = useRouteIcons(routeProps);

const pointGroupList = computed(() => {
  if (routeProps.type === RouteLayerType.MapProjectTypePoint) {
    return turnPointList.value;
  }
  return turnPointList.value.map((list) =>
    list.filter((_, i) => i === 0 || i === list.length - 1),
  );
});

function getIcon(point: LinePointAction, index: number, length: number) {
  const normalPointSize = {
    iconWidth: 24,
    iconHeight: 24,
  };
  const safePointSize = {
    iconWidth: 23,
    iconHeight: 26,
  };
  const commonStyle = {
    ...(point.isSafe ? safePointSize : normalPointSize),
    textSize: 14,
    textFontWeight: "bold",
  };
  switch (index) {
    case 0:
      return {
        text: "S",
        ...commonStyle,
        textColor: point.isSafe
          ? routeProps.theme?.safeStartPoint.textColor
          : routeProps.theme?.startPoint.textColor,
        iconSrc: point.isSafe ? startSafePoint.value : startPoint.value,
      };
    case length - 1:
      return {
        text: "E",
        ...commonStyle,
        textColor: point.isSafe
          ? routeProps.theme?.safeEndPoint.textColor
          : routeProps.theme?.endPoint.textColor,
        iconSrc: point.isSafe ? endSafePoint.value : endPoint.value,
      };
    default:
      return {
        text: `${index + 1}`,
        ...commonStyle,
        textColor: point.isSafe
          ? routeProps.theme?.safeTurnPoint.textColor
          : routeProps.theme?.turnPoint.textColor,
        iconSrc: point.isSafe ? turnSafePoint.value : turnPoint.value,
      };
  }
}
</script>
