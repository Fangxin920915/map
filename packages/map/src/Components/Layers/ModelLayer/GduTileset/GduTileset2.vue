<template>
  <slot />
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, watch } from "vue";
import { mapViewInternal } from "@gdu-gl/core";
import * as Cesium from "cesium";
import { defaultTilesetFeatureProps, TilesetFeatureProps } from "./props";

const props = withDefaults(defineProps<TilesetFeatureProps>(), {
  ...defaultTilesetFeatureProps,
});

const viewer = mapViewInternal.getViewer(props.viewId as string)
  ?.mapProviderDelegate.map as Cesium.Viewer;

let tileset: Cesium.Cesium3DTileset | null = null;

watch([() => props.visible, () => props.url], ([, url], [, oldUrl]) => {
  if (!tileset) {
    return;
  }
  if (url !== oldUrl) {
    viewer.scene.primitives.remove(tileset);
    tileset = null;
    createModel();
  } else {
    tileset.show = props.visible;
  }
});

onBeforeMount(() => {
  createModel();
});

onBeforeUnmount(() => {
  tileset && viewer.scene.primitives.remove(tileset);
  tileset = null;
});

async function createModel() {
  try {
    tileset = await Cesium.Cesium3DTileset.fromUrl(props.url, {
      show: props.visible,
      maximumScreenSpaceError: 32,
      enableCollision: true,
    });
    viewer.scene.primitives.add(tileset);
  } catch (error) {
    console.warn("模型瓦片加载失败", error);
  }
}
</script>
