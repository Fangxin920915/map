<template>
  <slot />
</template>

<script setup lang="ts">
import { inject, onBeforeMount, onBeforeUnmount, watch } from "vue";
import { ModelLayerKey } from "@map/Constants";
import { ModelType, ModelFeature, uuid } from "@gdu-gl/common";
import { defaultTilesetFeatureProps, TilesetFeatureProps } from "./props";

const props = withDefaults(defineProps<TilesetFeatureProps>(), {
  ...defaultTilesetFeatureProps,
});

const modelLayer = inject(ModelLayerKey);

/** 自动生成的要素唯一标识符 */
const id = uuid();

let modelReady = false;

watch(
  [() => props.name, () => props.visible, () => props.url],
  ([, , url], [, , oldUrl]) => {
    if (!modelReady) {
      return;
    }
    if (url !== oldUrl) {
      modelReady = false;
      modelLayer?.value?.removeModel(id);
      createModel();
    } else {
      modelLayer?.value?.updateModelProperties(getTilesetProperties());
    }
  },
);

onBeforeMount(() => {
  createModel();
});

onBeforeUnmount(() => {
  modelLayer?.value?.removeModel(id);
});

function createModel() {
  try {
    modelLayer?.value?.addModel(getTilesetFeature());
    modelReady = true;
  } catch (e) {
    console.error(e);
  }
}

function getTilesetFeature() {
  return {
    type: ModelType.TILES,
    properties: getTilesetProperties(),
    geometry: {
      coordinates: [0, 0, 0],
    },
  } as ModelFeature;
}

function getTilesetProperties() {
  return {
    id,
    name: props.name,
    url: props.url,
    attributesProperties: {
      show: props.visible,
    },
  };
}
</script>
