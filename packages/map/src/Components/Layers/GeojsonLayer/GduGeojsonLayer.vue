<template>
  <div ref="mapContainer" class="gdu-map-container">
    test
    <slot />
  </div>
</template>

<script setup lang="ts">
import type { GeoJsonEmits, GeoJsonProps } from "./props";

withDefaults(defineProps<GeoJsonProps>(), {
  center: () => [0, 0],
  zoom: 10,
  mapId: "",
});
defineEmits<GeoJsonEmits>();
</script>
