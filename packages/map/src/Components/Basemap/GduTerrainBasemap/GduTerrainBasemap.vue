<template>
  <slot />
</template>
<script setup lang="ts">
import { defaultMapId } from "@map/Types";
import { mapViewInternal } from "@gdu-gl/core";
import { onMounted, onBeforeUnmount, watch } from "vue";

import {
  defaultTerrainBasemapProps,
  TerrainBasemapEmit,
  TerrainBasemapProps,
} from "./props";

const props = withDefaults(defineProps<TerrainBasemapProps>(), {
  ...defaultTerrainBasemapProps,
  viewId: defaultMapId,
});

const emits = defineEmits<TerrainBasemapEmit>();

const viewer = mapViewInternal.getViewer(props.viewId as string);

watch(
  () => props.url,
  () => changeTerrain(),
  {
    deep: true,
  },
);

onMounted(() => {
  changeTerrain();
});

onBeforeUnmount(() => {
  viewer?.basemapsDelegate.basemapCollection.removeTerrain();
});

function changeTerrain() {
  viewer?.basemapsDelegate.basemapCollection
    .changeTerrain({
      url: props.url,
    })
    .then((res: any) => {
      emits("ready", res);
    })
    .catch((e: Error) => {
      emits("error", e);
    });
}
</script>
