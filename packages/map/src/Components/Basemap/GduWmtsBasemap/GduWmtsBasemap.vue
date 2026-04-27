<template>
  <slot />
</template>

<script setup lang="ts">
import { BasemapLayerType } from "@gdu-gl/common";
import { useAddBasemap } from "@map/Hooks";
import { defaultMapId } from "@map/Types";
import { defaultWmtsBasemapProps, WmtsBasemapProps } from "./props";

const props = withDefaults(defineProps<WmtsBasemapProps>(), {
  ...defaultWmtsBasemapProps,
  extent: () => defaultWmtsBasemapProps.extent,
  viewId: defaultMapId,
});
useAddBasemap(props, BasemapLayerType.WMTS);
</script>
