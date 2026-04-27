<template>
  <slot />
</template>

<script setup lang="ts">
import { BasemapLayerType } from "@gdu-gl/common";
import { useAddBasemap } from "@map/Hooks";
import { defaultMapId } from "@map/Types";
import { defaultWmsBasemapProps, WmsBasemapProps } from "./props";

const props = withDefaults(defineProps<WmsBasemapProps>(), {
  ...defaultWmsBasemapProps,
  extent: () => defaultWmsBasemapProps.extent,
  viewId: defaultMapId,
});
useAddBasemap(props, BasemapLayerType.WMS);
</script>
