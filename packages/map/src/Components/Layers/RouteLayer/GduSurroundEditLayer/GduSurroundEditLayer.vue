<template>
  <gdu-map-event
    :view-id="props.viewId"
    @click="mouseClickEvent"
    @mouse-move="mouseMoveEvent"
  />
  <template v-if="circlePolygon">
    <gdu-polygon
      v-bind="circlePolygon"
      :height="elevation"
      :extruded-height="elevation"
    />
  </template>
  <template v-if="helperLine">
    <gdu-line-string v-bind="helperLine" />
    <gdu-point
      :visible="!props.clamToGround"
      :coordinates="helperLine.coordinates[1]"
      :icon-width="30"
      :icon-height="30"
      :icon-src="drawCenter"
    />
  </template>
  <edit-layer
    v-if="!isEmpty(circleCenterEllipsoid)"
    :view-id="props.viewId"
    :coordinates="circleCenterEllipsoid!"
    :radius="props.radius"
    :layer-id="props.layerId"
    :clam-to-ground="props.clamToGround"
    :enable-counterclockwise="props.enableCounterclockwise"
    :takeoff-point="props.takeoffPoint"
    :max-distance="props.maxDistance"
    @changed="emits('changed', $event)"
  />
  <polygon-self-intersecting-popup
    v-if="mousePosition && exceedingDistance"
    :view-id="props.viewId"
    :coordinates="mousePosition"
    :offset="polygonSelfIntersectingPopupOffset"
    :message="transformMessage"
  />
</template>

<script setup lang="ts">
import {
  GduLineString,
  GduMapEvent,
  GduPoint,
  GduPolygon,
} from "@map/Components";
import { defaultMapId } from "@map/Types";
import {
  addAlphaToHexColor,
  AltitudeMode,
  booleanExceedingDistance,
  elevationToEllipsoid,
  ellipsoidToElevation,
  LineStringCoordinates,
  MapThemeColor,
  MouseEventParams,
  PointCoordinates,
  PolygonCoordinates,
  RouteEditDrawStatus,
  uuid,
} from "@gdu-gl/common";
import { computed, watch } from "vue";
import * as turf from "@turf/turf";
import { isEmpty } from "lodash-es";
import drawCenter from "@map/Assets/drag-surround-center.png";
import { mapViewInternal } from "@gdu-gl/core";
import { polygonSelfIntersectingPopupOffset } from "@map/Constants";
import PolygonSelfIntersectingPopup from "@map/Components/Common/PolygonSelfIntersectingPopup.vue";
import {
  defaultSurroundEditLayerProps,
  SurroundEditLayerEmits,
  SurroundEditLayerProps,
} from "./props";
import EditLayer from "./components/EditLayer.vue";
import { useMouseEvent } from "./hooks/useMouseEvent";

const props = withDefaults(defineProps<SurroundEditLayerProps>(), {
  ...defaultSurroundEditLayerProps,
  viewId: defaultMapId,
  layerId: () => uuid(),
  message: () => defaultSurroundEditLayerProps.message,
});

const emits = defineEmits<SurroundEditLayerEmits>();

// 根据传入的 viewId 获取地图视图的 viewer 实例
const viewer = mapViewInternal.getViewer(props.viewId!)!;

const { mousePosition, status, hoverInfo } = useMouseEvent(viewer);

const transformMessage = computed(() => ({
  polygonSelfIntersectStr:
    props.message?.exceedDistanceStr ??
    defaultSurroundEditLayerProps.message.exceedDistanceStr,
}));

const elevation = computed(() => {
  if (props.altitudeMode === AltitudeMode.Elevation) {
    return props.height;
  }
  const takeoffElevation = ellipsoidToElevation(props.takeoffPoint);
  return takeoffElevation + props.height;
});

const circleCenterEllipsoid = computed(() => {
  if (isEmpty(props.coordinates)) {
    return null;
  }
  const [lon, lat] = props.coordinates!;
  const ellipsoid = elevationToEllipsoid(props.coordinates, elevation.value);
  return [lon, lat, ellipsoid] as PointCoordinates;
});

/**
 * 绘制时是否超出最大距离
 */
const exceedingDistance = computed(() => {
  if (status.value !== RouteEditDrawStatus.DRAWING || !mousePosition.value) {
    return false;
  }
  return booleanExceedingDistance(
    props.takeoffPoint,
    mousePosition.value,
    props.radius,
    props.maxDistance!,
  );
});

const circlePolygon = computed(() => {
  if (status.value !== RouteEditDrawStatus.DRAWING || !mousePosition.value) {
    return null;
  }
  const point = turf.point(mousePosition.value as number[]);
  const coordinates = turf.circle(point, props.radius).geometry
    .coordinates as PolygonCoordinates;
  const height = elevationToEllipsoid(mousePosition.value, elevation.value);
  const color = exceedingDistance.value
    ? MapThemeColor.danger[500]
    : MapThemeColor.execute[500];
  return {
    coordinates,
    height,
    extrudedHeight: height,
    fillColor: addAlphaToHexColor(color, 0.25),
    strokeColor: color,
    strokeWidth: 7,
    strokeOutlineColor: "#FFFFFF",
    strokeOutlineWidth: 1,
    lineDash: [15, 5],
  };
});

const helperLine = computed(() => {
  if (
    status.value !== RouteEditDrawStatus.DRAWING ||
    !mousePosition.value ||
    !circlePolygon.value
  ) {
    return null;
  }
  const { height } = circlePolygon.value;
  const [lon, lat] = mousePosition.value;
  const line = [
    [lon, lat],
    [lon, lat, height],
  ] as LineStringCoordinates;
  return {
    coordinates: line,
    lineDash: [10, 3],
    strokeColor: "#FFFFFF",
    strokeWidth: 1,
  };
});

watch(
  circleCenterEllipsoid,
  () => {
    if (!circleCenterEllipsoid.value) {
      status.value = RouteEditDrawStatus.DRAWING;
    } else {
      status.value = RouteEditDrawStatus.DRAW_END;
    }
  },
  {
    immediate: true,
    deep: true,
  },
);

function mouseClickEvent(params: MouseEventParams) {
  if (!params.coordinates) {
    return;
  }
  if (status.value !== RouteEditDrawStatus.DRAWING) {
    return;
  }
  if (exceedingDistance.value) {
    return;
  }
  mousePosition.value = params.coordinates;
  status.value = RouteEditDrawStatus.DRAW_END;
  emits("changed", {
    coordinates: params.coordinates,
    radius: props.radius,
  });
}

function mouseMoveEvent(params: MouseEventParams) {
  if (!params.coordinates) {
    return;
  }

  if (params.feature?.properties.name === props.layerId) {
    hoverInfo.value.type = params.feature?.properties?.featureProperties?.type;
  } else {
    hoverInfo.value.type = null;
  }

  if (status.value !== RouteEditDrawStatus.DRAWING) {
    return;
  }
  mousePosition.value = params.coordinates;
}
</script>
