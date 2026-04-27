<template>
  <div :id="props.viewId" ref="mapContainer" class="gdu-map-container"></div>
  <slot v-if="mapLoaded" />
</template>

<script setup lang="ts">
import "cesium/Build/Cesium/Widgets/widgets.css";
import "@map/Assets/Style/index.scss";
import { onBeforeUnmount, onMounted, onUnmounted, ref, watch } from "vue";
import { mapViewInternal, Viewer } from "@gdu-gl/core";
import { defaultMapId } from "@map/Types";
import { EventName, TileLoadProgressParams } from "@gdu-gl/common";
import { useClickEvents } from "./hooks/useClickEvents";
import { useDragEvents } from "./hooks/useDragEvents";
import { defaultMapProps, MapEmits, MapProps } from "./props";

const props = withDefaults(defineProps<MapProps>(), {
  ...defaultMapProps,
  viewId: defaultMapId,
  center: () => defaultMapProps.center,
});

const emits = defineEmits<MapEmits>();

const { addClickEvent } = useClickEvents(props, emits);
const { addDragEvent } = useDragEvents(props);

const mapLoaded = ref(false);

let viewer: Viewer | null = null;

// watch(
//   [
//     () => props.center?.toString(),
//     () => props.heading,
//     () => props.pitch,
//     () => props.zoom,
//   ],
//   (
//     [newCenter, newHeading, newPitch, newZoom],
//     [oldCenter, oldHeading, oldPitch, oldZoom],
//   ) => {
//     if (
//       newCenter === oldCenter &&
//       newHeading === oldHeading &&
//       newPitch === oldPitch &&
//       newZoom === oldZoom
//     ) {
//       return;
//     }
//     setInitialViewing();
//   },
//   {
//     deep: true,
//   },
// );

watch(
  [
    () => props.maxZoom,
    () => props.minZoom,
    () => props.enableDragPan,
    () => props.enableDragRotate,
    () => props.enableScrollZoom,
    () => props.enableDebugger,
    () => props.enableDepthTestAgainstTerrain,
    () => props.autoOrthographic,
  ],
  () => {
    setEnableControl();
    setEnableDebugger();
  },
  {
    deep: true,
  },
);

onMounted(async () => {
  viewer = await mapViewInternal.createViewer({
    viewerId: props.viewId,
    engineType: props.engineType,
    center: props.center,
    zoom: props.zoom,
    heading: props.heading,
    pitch: props.pitch,
    mapInitialOptions: props.mapInitialOptions,
    isArMap: props.isArMap,
  });
  if (!viewer) {
    return;
  }

  addClickEvent();
  addDragEvent();
  setEnableControl();
  setEnableDebugger();

  /**
   * 监听 Cesium 地图加载进度事件，当地图瓦片加载一部分后，初始化高度转换工具并触发 ready 事件
   * 如果是 AR 地图，不监听事件，直接初始化高度转换工具并触发 ready 事件
   */
  if (!props.isArMap) {
    viewer?.eventsDelegate.addEventListener(
      EventName.TILE_LOAD_PROGRESS,
      readyMap,
    );
  } else {
    // 初始化高度转换工具
    await mapViewInternal.initGeoidInstance();
    mapLoaded.value = true;
    emits("ready", viewer);
  }
});

onBeforeUnmount(() => {
  mapLoaded.value = false;
  emits("beforeDestroy");
  viewer?.eventsDelegate.removeEventListener(
    EventName.TILE_LOAD_PROGRESS,
    readyMap,
  );
});

onUnmounted(() => {
  mapViewInternal.destroyViewer(props.viewId);
});

async function readyMap(e: TileLoadProgressParams) {
  if (e.progress > 0) {
    viewer?.eventsDelegate.removeEventListener(
      EventName.TILE_LOAD_PROGRESS,
      readyMap,
    );
    await mapViewInternal.initGeoidInstance();
    mapLoaded.value = true;
    emits("ready", viewer!);
  }
}

/**
 * 控制地图手势
 */
function setEnableControl() {
  if (viewer?.mapProviderDelegate?.mapProvider) {
    viewer.mapProviderDelegate.mapProvider.autoOrthographic =
      props.autoOrthographic;
    viewer.mapProviderDelegate.mapProvider.enableDragRotate =
      props.enableDragRotate;
    viewer.mapProviderDelegate.mapProvider.enableDragPan = props.enableDragPan;
    viewer.mapProviderDelegate.mapProvider.enableScrollZoom =
      props.enableScrollZoom;
    viewer.mapProviderDelegate.mapProvider.enableDepthTestAgainstTerrain =
      props.enableDepthTestAgainstTerrain;
    viewer.mapProviderDelegate.mapProvider.maxZoom = props.maxZoom;
    viewer.mapProviderDelegate.mapProvider.minZoom = props.minZoom;
  }
}

/**
 * 开启或者关闭帧率窗口
 */
function setEnableDebugger() {
  if (viewer?.mapProviderDelegate.mapProvider) {
    viewer.mapProviderDelegate.mapProvider.enableDebugger =
      props.enableDebugger;
  }
}

/**
 * 设置地图初始位置
 */
// function setInitialViewing() {
//   viewer?.cameraDelegate.cameraManager?.jumpTo({
//     position: props.center,
//     heading: props.heading,
//     pitch: props.pitch,
//     zoom: props.zoom,
//     duration: 0,
//   });
// }
</script>
