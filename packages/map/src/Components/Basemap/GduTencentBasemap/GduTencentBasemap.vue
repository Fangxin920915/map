<template>
  <slot />
</template>

<script setup lang="ts">
import { BasemapLayerType } from "@gdu-gl/common";
import { useAddBasemap } from "@map/Hooks";
import { defaultMapId } from "@map/Types";
import { defaultTencentBasemapProps, TencentBasemapProps } from "./props";

const props = withDefaults(defineProps<TencentBasemapProps>(), {
  ...defaultTencentBasemapProps,
  extent: () => defaultTencentBasemapProps.extent,
  viewId: defaultMapId,
});
useAddBasemap(props, BasemapLayerType.TENCENT);
</script>
