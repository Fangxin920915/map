<template>
  <slot />
</template>

<script setup lang="ts">
import { mapViewInternal } from "@gdu-gl/core";
import { uuid } from "@gdu-gl/common";
import { onBeforeMount, onBeforeUnmount, provide, shallowRef } from "vue";
import { ModelLayerKey } from "@map/Constants";
import { defaultMapId } from "@map/Types";
import { ModelLayerEmits, ModelLayerProps } from "./props";

const props = withDefaults(defineProps<ModelLayerProps>(), {
  layerId: () => uuid(),
  viewId: defaultMapId,
});
const emit = defineEmits<ModelLayerEmits>();

const viewer = mapViewInternal.getViewer(props.viewId as string);

const modelLayer = shallowRef(createLayer());

provide(ModelLayerKey, modelLayer);

onBeforeMount(() => {
  modelLayer.value && emit("ready", modelLayer.value);
});

onBeforeUnmount(() => {
  emit("beforeDestroy");
  viewer?.modelManagerDelegate.removeLayer(modelLayer.value?.layerId as string);
});

function createLayer() {
  viewer?.modelManagerDelegate.addLayer(props.layerId, {
    type: "ModelFeatureCollection",
    features: [],
  });
  return viewer?.modelManagerDelegate.getLayer(props.layerId);
}
</script>
