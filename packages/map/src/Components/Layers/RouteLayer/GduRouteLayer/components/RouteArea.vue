<template>
  <template
    v-for="({ polygon, center }, index) in polygonsWithStyle"
    :key="index"
  >
    <GduPolygon
      v-bind="polygon"
      :coordinates="polygon.coordinates"
      :stroke-width="polygon.strokeWidth"
      clamp-to-ground
    />
    <gdu-point v-if="center" v-bind="center" clamp-to-ground />
  </template>
</template>

<script setup lang="ts">
import { GduPolygon, GduPoint } from "@map/index";
import {
  getGroundPolygonCenter,
  MapThemeColor,
  PolygonCoordinates,
  RouteLayerType,
} from "@gdu-gl/common";
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import { useInjectRouteProps } from "../hooks/useInjectRouteProps";

const { routeProps } = useInjectRouteProps();

const polygonsWithStyle = computed(() => {
  if (routeProps.type === RouteLayerType.MapProjectTypeAIRoute) {
    const areas = routeProps.area as PolygonCoordinates[];
    return areas.map((area, index) => {
      const center = getGroundPolygonCenter(area ?? []);
      return {
        polygon: {
          coordinates: area,
          ...routeProps.theme?.area,
          strokeWidth: 3,
        },
        center: {
          coordinates: center,
          shapeSize: 24,
          shapeOutlineColor: "#ffffff",
          shapeFillColor: MapThemeColor.warning[500],
          textColor: "#ffffff",
          text: `${index + 1}`,
          shapeOutlineWidth: 2,
        },
      };
    });
  }
  if (!isEmpty(routeProps.area)) {
    return [
      {
        polygon: {
          coordinates: (routeProps.area ?? []) as PolygonCoordinates,
          ...routeProps.theme?.area,
          strokeWidth: 3,
        },
        center: null,
      },
    ];
  }
  return [];
});
</script>
