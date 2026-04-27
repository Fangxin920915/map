<template>
  <slot />
</template>

<script setup lang="ts">
import { mapViewInternal } from "@gdu-gl/core";
import { uuid } from "@gdu-gl/common";
import { onBeforeMount, onBeforeUnmount, provide, shallowRef } from "vue";
import { VectorLayerKey } from "@map/Constants";
import { defaultMapId } from "@map/Types";
import {
  defaultVectorLayerProps,
  VectorLayerEmits,
  VectorLayerProps,
} from "./props";

const props = withDefaults(defineProps<VectorLayerProps>(), {
  ...defaultVectorLayerProps,
  layerId: () => uuid(),
  viewId: defaultMapId,
});
const emit = defineEmits<VectorLayerEmits>();

const viewer = mapViewInternal.getViewer(props.viewId as string);

const vectorLayer = shallowRef(createLayer());

provide(VectorLayerKey, vectorLayer);

onBeforeMount(() => {
  vectorLayer.value && emit("ready", vectorLayer.value);
});

onBeforeUnmount(() => {
  emit("beforeDestroy");
  viewer?.geometryManagerDelegate.removeLayer(
    vectorLayer.value?.layerId as string,
  );
});

function createLayer() {
  viewer?.geometryManagerDelegate.addLayer(props.layerId, {
    type: "FeatureCollection",
    features: [],
  });
  return viewer?.geometryManagerDelegate.getLayer(props.layerId);
}
</script>
