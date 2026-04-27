<template>
  <show-layer
    v-if="centerEllipsoid"
    :altitude-mode="props.altitudeMode"
    :coordinates="centerEllipsoid"
    :radius="props.radius"
    :takeoff-point="props.takeoffPoint"
    :start-point="startEllipsoid"
    :enable-counterclockwise="props.enableCounterclockwise"
    :clam-to-ground="props.clamToGround"
  />
  <!-- 无人机到其实点的垂直抬升连线 -->
  <gdu-line-string v-if="helperLine" v-bind="helperLine" />
  <!-- 中心点的操作框 -->
  <gdu-popup
    v-if="centerEllipsoid"
    :view-id="props.viewId"
    :coordinates="centerEllipsoid"
    :position="PopupPosition.BOTTOM_CENTER"
    :offset="popupOffset"
  >
    <slot name="popup" />
  </gdu-popup>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  AltitudeMode,
  elevationToEllipsoid,
  ellipsoidToElevation,
  LineStringCoordinates,
  MapThemeColor,
  PointCoordinates,
  PopupPosition,
} from "@gdu-gl/common";
import { isEmpty } from "lodash-es";
import { GduLineString, GduPopup } from "@map/Components";
import { defaultSurroundShowLayerProps, SurroundShowLayerProps } from "./props";
import ShowLayer from "./components/ShowLayer.vue";

const props = withDefaults(defineProps<SurroundShowLayerProps>(), {
  ...defaultSurroundShowLayerProps,
});

const popupOffset = [0, -18];

const elevation = computed(() => {
  if (props.altitudeMode === AltitudeMode.Elevation) {
    return props.height;
  }
  const takeoffElevation = ellipsoidToElevation(props.takeoffPoint);
  return takeoffElevation + props.height;
});

const centerEllipsoid = computed(() => {
  if (isEmpty(props.coordinates)) {
    return null;
  }
  const [lon, lat] = props.coordinates!;
  const ellipsoid = elevationToEllipsoid(props.coordinates, elevation.value);
  return [lon, lat, ellipsoid] as PointCoordinates;
});

const startEllipsoid = computed(() => {
  if (!centerEllipsoid.value || isEmpty(props.startPoint)) {
    return null;
  }
  const [lon, lat] = props.startPoint!;
  const [, , ellipsoid] = centerEllipsoid.value;
  return [lon, lat, ellipsoid] as PointCoordinates;
});

const helperLine = computed(() => {
  if (!startEllipsoid.value || isEmpty(props.uavPosition)) {
    return null;
  }
  const [, , ellipsoid] = startEllipsoid.value!;
  const [lon, lat] = props.uavPosition!;
  const line = [
    props.uavPosition,
    [lon, lat, ellipsoid],
    startEllipsoid.value,
  ] as LineStringCoordinates;
  return {
    coordinates: line,
    lineDash: [10, 5],
    strokeColor: MapThemeColor.success[500],
    strokeWidth: 5,
    strokeOutlineWidth: 0,
  };
});

defineSlots<{
  /**
   * ### 功能描述
   * 中心点上方的自定义弹框内容
   */
  popup(): any;
}>();
</script>
