<script setup lang="ts">
import { defaultMapId } from "@map/Types";
import { GduMap, GduARMap } from "@map/Components";
import { onMounted, onUnmounted, ref, watch } from "vue";
import { SeiData } from "@gdu-gl/common";
// import { GduTerrainBasemap } from "@gdu-gl/map";
import { ARMapContainerProps } from "./props";

const props = withDefaults(defineProps<ARMapContainerProps>(), {
  viewId: defaultMapId,
  widthAspectRatio: 16,
  heightAspectRatio: 9,
});

const mapReady = ref(false);
const arMapContainerRef = ref<HTMLDivElement>();
const emits = defineEmits<{
  (event: "ready", map?: any): void;
}>();
const ready = (viewer: any) => {
  mapReady.value = true;
  // 等待DOM渲染完成
  // 初始计算一次
  updateChildSize();
  emits("ready", viewer);
};

/**
 * 根据容器尺寸和给定的宽高比，计算适应容器的子元素尺寸
 * @param {HTMLElement} container - 容器DOM元素
 * @param {number} aspectRatio - 宽高比（宽/高），例如16/9
 * @returns {Object} 返回包含width和height的对象
 */
function calculateSizeByAspectRatio(
  container: HTMLElement | undefined,
  aspectRatio: number,
) {
  if (!container || !aspectRatio || aspectRatio <= 0) {
    return { width: 0, height: 0 };
  }

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 如果容器尺寸为0，返回0
  if (containerWidth === 0 || containerHeight === 0) {
    return { width: 0, height: 0 };
  }

  // 容器自身的宽高比
  const containerRatio = containerWidth / containerHeight;

  let width;
  let height;

  if (containerRatio > aspectRatio) {
    // 容器比目标比例更宽，以高度为基准
    height = containerHeight;
    width = height * aspectRatio;
  } else {
    // 容器比目标比例更高，以宽度为基准
    width = containerWidth;
    height = width / aspectRatio;
  }

  // 确保不超过容器边界（由于浮点数计算可能有微小误差）
  width = Math.min(width, containerWidth);
  height = Math.min(height, containerHeight);

  return {
    width: Math.floor(width), // 取整避免像素模糊
    height: Math.floor(height),
  };
}

const childSize = ref({ width: 0, height: 0 });
let resizeObserver: ResizeObserver | null = null;

const updateChildSize = () => {
  const aspectRatio = props.widthAspectRatio / props.heightAspectRatio;
  if (!props.isOpenAR) {
    childSize.value = {
      width: 5,
      height: 5,
    };
  } else {
    childSize.value = calculateSizeByAspectRatio(
      arMapContainerRef.value,
      aspectRatio,
    );
  }
};

onMounted(() => {
  // 使用ResizeObserver监听容器尺寸变化
  if (arMapContainerRef.value && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() => {
      // 防抖处理，避免频繁触发
      clearTimeout((resizeObserver as any)._timeout);
      (resizeObserver as any)._timeout = setTimeout(() => {
        updateChildSize();
      }, 100);
    });

    resizeObserver.observe(arMapContainerRef.value);
  } else {
    // 降级方案：监听窗口变化
    window.addEventListener("resize", updateChildSize);
  }
});

onUnmounted(() => {
  // 清理观察器
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }

  // 移除窗口监听
  window.removeEventListener("resize", updateChildSize);
});

const mapInitialOptions = {
  contextOptions: {
    webgl: {
      alpha: true,
    },
    allowTextureFilterAnisotropic: true,
  },
};

const arMap = ref<typeof GduARMap>();

defineExpose({
  onSeiDataReceived: (data: SeiData) => {
    arMap.value?.onSeiDataReceived(data);
  },
});
watch(
  () => props.isOpenAR,
  () => {
    console.log("监听到isopenAR", props.isOpenAR);
    updateChildSize();
  },
);
</script>

<template>
  <div ref="arMapContainerRef" class="ar-map-container">
    <div
      class="ar-map-content"
      :style="{
        width: childSize.width + 'px',
        height: childSize.height + 'px',
      }"
    >
      <gdu-map
        :view-id="props.viewId"
        :auto-orthographic="false"
        :engine-type="props.engineType"
        :map-initial-options="mapInitialOptions"
        :is-ar-map="true"
        @ready="ready"
        @before-destroy="mapReady = false"
      >
        <GduARMap
          ref="arMap"
          :view-id="props.viewId"
          :pixel-size="props.pixelSize"
          :aspect-ratio="props.aspectRatio"
          :effective-pixels="props.effectivePixels"
          :actual-focal-length="props.actualFocalLength"
          :offset-height="props.offsetHeight"
          :scene-opacity="props.sceneOpacity"
          :road-opacity="props.roadOpacity"
          :mvt-url="props.mvtUrl"
          :dem-url="props.demUrl"
          :style-url="props.styleUrl"
        >
          <slot></slot>
        </GduARMap>
        <!--        <GduTerrainBasemap-->
        <!--          :view-id="props.viewId"-->
        <!--          :url="'http://gdu-dev.com:32305/'"-->
        <!--        ></GduTerrainBasemap>-->
      </gdu-map>
      <!--      <template v-if="mapReady">-->
      <!--        <GduARMap-->
      <!--          ref="arMap"-->
      <!--          :view-id="props.viewId"-->
      <!--          :pixel-size="props.pixelSize"-->
      <!--          :aspect-ratio="props.aspectRatio"-->
      <!--          :effective-pixels="props.effectivePixels"-->
      <!--          :actual-focal-length="props.actualFocalLength"-->
      <!--          :offset-height="props.offsetHeight"-->
      <!--          :scene-opacity="props.sceneOpacity"-->
      <!--          :road-opacity="props.roadOpacity"-->
      <!--          :mvt-url="props.mvtUrl"-->
      <!--          :dem-url="props.demUrl"-->
      <!--          :style-url="props.styleUrl"-->
      <!--        >-->
      <!--          <slot></slot>-->
      <!--        </GduARMap>-->
      <!--        &lt;!&ndash;        <GduTerrainBasemap&ndash;&gt;-->
      <!--        &lt;!&ndash;          :view-id="props.viewId"&ndash;&gt;-->
      <!--        &lt;!&ndash;          :url="'http://gdu-dev.com:32305/'"&ndash;&gt;-->
      <!--        &lt;!&ndash;        ></GduTerrainBasemap>&ndash;&gt;-->
      <!--      </template>-->
    </div>
  </div>
</template>

<style lang="scss">
.ar-map-container {
  position: relative; /* 添加相对定位 */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.ar-map-content {
  position: absolute; /* 使用绝对定位来居中 */
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: transparent;
  transform: translate(-50%, -50%);
}
</style>
