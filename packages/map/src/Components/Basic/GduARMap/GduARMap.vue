<script setup lang="ts">
import { defaultMapId } from "@map/Types";
import { ARMap, mapViewInternal } from "@gdu-gl/core";
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { EngineType, SeiData } from "@gdu-gl/common";
import { ARMapProps } from "./props";

const props = withDefaults(defineProps<ARMapProps>(), {
  viewId: defaultMapId,
  sceneOpacity: 1,
  roadOpacity: 1,
});

const viewer = mapViewInternal.getViewer(props.viewId as string);

const arMap = ref<ARMap>();

onMounted(() => {
  if (!viewer) {
    return;
  }
  const mvtUrl = `/ar_map_mvt`;
  const demUrl = `/dem_server`;
  //
  // const mvtUrl = `http://gdu-dev.com:30500`;
  // const demUrl = `http://gdu-dev.com:32305/`;

  arMap.value = new ARMap({
    engineType: viewer.engineType as EngineType,
    viewer,
    pixelSize: props.pixelSize,
    aspectRatio: props.aspectRatio,
    effectivePixels: props.effectivePixels,
    actualFocalLength: props.actualFocalLength,
    offsetHeight: props.offsetHeight,
    mvtUrl,
    demUrl,
    styleUrl: props.styleUrl,
  });
  arMap.value.init();
  if (
    props.sceneOpacity !== undefined &&
    props.sceneOpacity >= 0 &&
    props.sceneOpacity <= 1 &&
    props.roadOpacity !== undefined &&
    props.roadOpacity >= 0 &&
    props.roadOpacity <= 1
  ) {
    arMap.value.arSceneDelegate.setSceneOpacity(
      props.sceneOpacity,
      props.roadOpacity,
    );
  }
});

onBeforeUnmount(() => {
  arMap.value?.destroy();
});

defineExpose({
  /**
   * 同步sei数据
   * @param data
   */
  onSeiDataReceived: (data: SeiData) => {
    arMap.value?.onSeiDataReceived(data);
  },
});

watch([() => props.sceneOpacity, () => props.roadOpacity], (newVals) => {
  if (
    arMap.value &&
    newVals.every((val) => val !== undefined && val >= 0 && val <= 1)
  ) {
    arMap.value.arSceneDelegate.setSceneOpacity(newVals[0], newVals[1]);
  }
});

watch(
  () => props.offsetHeight,
  (newVal) => {
    if (arMap.value && newVal !== undefined) {
      arMap.value.offsetHeight = newVal;
    }
  },
);
watch(
  [
    () => props.aspectRatio,
    () => props.effectivePixels,
    () => props.actualFocalLength,
  ],
  (newVals) => {
    if (arMap.value) {
      const [aspectRatio, effectivePixels, actualFocalLength] = newVals;
      arMap.value.cameraControlDelegate.aspectRatio = aspectRatio;
      arMap.value.cameraControlDelegate.effectivePixels = effectivePixels;
      arMap.value.cameraControlDelegate.actualFocalLength = actualFocalLength;
      arMap.value.cameraControlDelegate.init();
    }
  },
);
</script>

<template>
  <slot></slot>
</template>
