<template>
  <slot />
</template>

<script setup lang="ts">
import { onBeforeMount, onBeforeUnmount, watch, ref } from "vue";
import { mapViewInternal } from "@gdu-gl/core";
import * as Cesium from "cesium";
import { defaultPointCloudFeatureProps, PointCloudFeatureProps } from "./props";

const props = withDefaults(defineProps<PointCloudFeatureProps>(), {
  ...defaultPointCloudFeatureProps,
});

const emits = defineEmits<{
  (event: "ready", tileset: Cesium.Cesium3DTileset): void;
  (event: "error", error: unknown): void;
}>();

const viewer = mapViewInternal.getViewer(props.viewId as string)
  ?.mapProviderDelegate.map as Cesium.Viewer;

let tileset: Cesium.Cesium3DTileset | null = null;
const isReady = ref(false);

watch([() => props.visible, () => props.url], ([, url], [, oldUrl]) => {
  if (!tileset) return;
  if (url !== oldUrl) {
    removeTileset();
    createPointCloud();
  } else {
    tileset.show = props.visible;
  }
});

watch(
  () => props.maximumScreenSpaceError,
  (val) => {
    if (tileset && val !== undefined) {
      tileset.maximumScreenSpaceError = val;
    }
  },
);

watch(
  () => props.pointCloudShading,
  (shading) => {
    if (!tileset || !shading) return;
    applyPointCloudShading(shading);
  },
  { deep: true },
);

watch(
  () => props.style,
  (styleOptions) => {
    if (!tileset) return;
    applyStyle(styleOptions);
  },
  { deep: true },
);

onBeforeMount(() => {
  createPointCloud();
});

onBeforeUnmount(() => {
  removeTileset();
});

function applyPointCloudShading(
  shading: PointCloudFeatureProps["pointCloudShading"],
) {
  if (!tileset || !shading) return;
  tileset.pointCloudShading.attenuation = shading.attenuation ?? false;
  tileset.pointCloudShading.geometricErrorScale =
    shading.geometricErrorScale ?? 1;
  if (shading.maximumAttenuation !== undefined) {
    tileset.pointCloudShading.maximumAttenuation = shading.maximumAttenuation;
  }
  if (shading.baseResolution !== undefined) {
    tileset.pointCloudShading.baseResolution = shading.baseResolution;
  }
  tileset.pointCloudShading.eyeDomeLighting = shading.eyeDomeLighting ?? true;
  tileset.pointCloudShading.eyeDomeLightingStrength =
    shading.eyeDomeLightingStrength ?? 1;
  tileset.pointCloudShading.eyeDomeLightingRadius =
    shading.eyeDomeLightingRadius ?? 1;
}

function applyStyle(styleOptions: PointCloudFeatureProps["style"]) {
  if (!tileset) return;
  if (!styleOptions) {
    tileset.style = undefined;
    return;
  }
  const styleObj = Object.create(null) as { [k: string]: unknown };
  if (styleOptions.color) {
    styleObj.color = styleOptions.color;
  }
  if (styleOptions.pointSize) {
    styleObj.pointSize = styleOptions.pointSize;
  }
  if (styleOptions.show) {
    styleObj.show = styleOptions.show;
  }
  tileset.style = new Cesium.Cesium3DTileStyle(styleObj);
}

async function createPointCloud() {
  if (!props.url) return;
  try {
    const tilesetOptions: Cesium.Cesium3DTileset.ConstructorOptions = {
      show: props.visible,
      maximumScreenSpaceError: props.maximumScreenSpaceError ?? 16,
    };

    tileset = await Cesium.Cesium3DTileset.fromUrl(props.url, tilesetOptions);

    if (props.maximumNumberOfLoadedTiles !== undefined) {
      (tileset as any).maximumNumberOfLoadedTiles =
        props.maximumNumberOfLoadedTiles;
    }

    if (props.pointCloudShading) {
      applyPointCloudShading(props.pointCloudShading);
    }

    if (props.style) {
      applyStyle(props.style);
    }

    viewer.scene.primitives.add(tileset);
    isReady.value = true;
    emits("ready", tileset);

    if (props.autoZoom) {
      viewer.zoomTo(tileset);
    }
  } catch (error) {
    console.warn("点云数据加载失败", error);
    emits("error", error);
  }
}

function removeTileset() {
  if (tileset) {
    viewer.scene.primitives.remove(tileset);
    tileset = null;
    isReady.value = false;
  }
}
</script>
