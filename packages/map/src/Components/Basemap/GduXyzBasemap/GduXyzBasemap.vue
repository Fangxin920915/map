<template>
  <slot />
</template>

<script setup lang="ts">
import { BasemapLayerType } from "@gdu-gl/common";
import { useAddBasemap } from "@map/Hooks";
import { defaultMapId } from "@map/Types";
import { defaultXyzBasemapProps, XyzBasemapProps } from "./props";

const props = withDefaults(defineProps<XyzBasemapProps>(), {
  ...defaultXyzBasemapProps,
  extent: () => defaultXyzBasemapProps.extent,
  viewId: defaultMapId,
});
useAddBasemap(props, BasemapLayerType.XYZ);
</script>
