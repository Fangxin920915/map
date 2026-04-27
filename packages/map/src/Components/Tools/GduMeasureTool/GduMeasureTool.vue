<template>
  <gdu-map-event
    v-if="active"
    :view-id="props.viewId"
    @click="clickMap"
    @mouse-move="mouseMoveMap"
  />
  <gdu-vector-layer :view-id="props.viewId">
    <template
      v-for="(measureResult, index) in measureResults"
      :key="measureResult.id"
    >
      <component
        :is="
          measureResult.type === MeasureType.Distance
            ? toRaw(MeasureDistanceLayer)
            : toRaw(MeasureAreaLayer)
        "
        :view-id="props.viewId"
        v-bind="measureResult as MeasureLayerProps"
        :group-id="`${measurementLayerPrefix}${index}`"
        :delete-point-style="props.deletePointStyle"
        :turning-point-style="props.turningPointStyle"
        :finish-point-style="props.finishPointStyle"
        :insertion-point-style="props.insertionPointStyle"
        :line-style="props.lineStyle"
        :label-style="props.labelStyle"
        :polygon-style="props.polygonStyle"
        :selected-id="selectedId"
        :hover-id="hoverId"
        @select="selectFeature(measureResult.id)"
        @finish="finishMeasure"
        @cancel-drawing="cancelDrawing(measureResult.id)"
        @remove="removeResult(measureResult.id)"
        @delete-point="
          (line: LineStringCoordinates) => refreshFeaturePoint(index, line)
        "
        @insert-point="
          (line: LineStringCoordinates) => refreshFeaturePoint(index, line)
        "
        @start-modify-point="startModify"
        @end-modify-point="endModify"
        @modifying-point="
          (line: LineStringCoordinates) => refreshFeaturePoint(index, line)
        "
      />
    </template>
  </gdu-vector-layer>
</template>

<script setup lang="ts">
import {
  defaultMeasureToolProps,
  GduMapEvent,
  GduVectorLayer,
} from "@map/Components";
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from "vue";
import { defaultMapId } from "@map/Types";
import {
  measurementLayerPrefix,
  LineStringCoordinates,
  MeasureStatus,
  MouseEventParams,
  PointActionType,
  MeasureType,
  uuid,
} from "@gdu-gl/common";
import { mapViewInternal } from "@gdu-gl/core";
import { useModifyFeature } from "./hooks/useModifyFeature";
import MeasureAreaLayer from "./components/MeasureAreaLayer.vue";
import MeasureDistanceLayer from "./components/MeasureDistanceLayer.vue";
import {
  MeasureLayerProps,
  MeasureToolEmits,
  MeasureToolProps,
  MeasureResult,
} from "./props";

const props = withDefaults(defineProps<MeasureToolProps>(), {
  ...defaultMeasureToolProps,
  deletePointStyle: () => defaultMeasureToolProps.deletePointStyle,
  measureResults: () => defaultMeasureToolProps.measureResults,
  turningPointStyle: () => defaultMeasureToolProps.turningPointStyle,
  finishPointStyle: () => defaultMeasureToolProps.finishPointStyle,
  insertionPointStyle: () => defaultMeasureToolProps.insertionPointStyle,
  labelStyle: () => defaultMeasureToolProps.labelStyle,
  lineStyle: () => defaultMeasureToolProps.lineStyle,
  polygonStyle: () => defaultMeasureToolProps.polygonStyle,
  viewId: defaultMapId,
});

const emits = defineEmits<MeasureToolEmits>();

defineExpose({
  /**
   * ### 功能描述
   * 开始测量方法。
   *
   * ### 使用示例
   * ```ts
   * const measureToolRef = ref();
   * // 开始距离测量
   * measureToolRef.value.startMeasure(MeasureType.Distance, 'measure-1');
   * // 开始面积测量
   * measureToolRef.value.startMeasure(MeasureType.Area, 'measure-2');
   * ```
   *
   * ### 参数说明
   * - type: MeasureType - 测量类型（Distance | Area）
   * - id: string - 测量标识符
   */
  startMeasure,
  /**
   * ### 功能描述
   * 结束当前测量。
   *
   * ### 使用示例
   * ```ts
   * const measureToolRef = ref();
   * // 结束当前测量
   * measureToolRef.value.finishMeasure();
   * ```
   *
   * ### 注意事项
   * 1. 该方法会结束当前正在进行的测量
   * 2. 如果当前没有进行中的测量，调用该方法不会有任何效果
   */
  finishMeasure,
  /**
   * ### 功能描述
   * 清空所有测量结果。
   *
   * ### 使用示例
   * ```ts
   * const measureToolRef = ref();
   * // 结束当前测量
   * measureToolRef.value.cancelMeasure();
   * ```
   */
  cancelMeasure,
});

const viewer = mapViewInternal.getViewer(props.viewId);

const modifying = ref(false);

const active = ref(false);

const measureResults = computed({
  get() {
    return props.measureResults;
  },
  set(value: MeasureResult[]) {
    emits("update:measureResults", value);
  },
});

watch(
  () => props.measureResults,
  (results) => {
    active.value = results.length > 0;
  },
  {
    immediate: true,
  },
);

const {
  removeResult,
  selectedId,
  hoverId,
  activeFeature,
  measureStatus,
  startMeasureDistance,
  insertPointDistance,
  mouseMoveDistance,
  finishMeasureDistance,
  refreshFeaturePoint,
  startMeasureArea,
  insertPointArea,
  mouseMoveArea,
  finishMeasureArea,
} = useModifyFeature(viewer, measureResults);

onMounted(() => {
  addEvent();
});

onBeforeUnmount(() => {
  removeEvent();
});

function handleKeyPress(event: KeyboardEvent) {
  if (event.key === "Escape") {
    const results: MeasureResult[] = [];
    let needEmit = false;
    props.measureResults.forEach((result) => {
      if (
        result.selected ||
        result.measureStatus !== MeasureStatus.MeasureEnd
      ) {
        needEmit = true;
      }
      result.selected = false;
      if (result.measureStatus === MeasureStatus.MeasureEnd) {
        results.push(result);
      }
    });

    measureResults.value = results;
    if (needEmit) {
      emits("finishMeasure", "");
    }
  }
}

function addEvent() {
  window.addEventListener("keydown", handleKeyPress);
}

function removeEvent() {
  window.removeEventListener("keydown", handleKeyPress);
}

function clickMap(params: MouseEventParams) {
  const featureId = params.feature?.properties.name ?? "";
  if (measureStatus.value !== MeasureStatus.MeasureEnd) {
    selectedId.value = "";
  } else if (!modifying.value) {
    const isSelectedLayer = featureId.startsWith(measurementLayerPrefix);
    selectedId.value =
      isSelectedLayer && featureId.includes("_turn_") ? featureId : "";
    if (!isSelectedLayer) {
      measureResults.value = props.measureResults.map((item) => ({
        ...item,
        selected: false,
      }));
    }
  }
  switch (activeFeature.value?.type) {
    case MeasureType.Distance:
      insertPointDistance(params);
      break;
    case MeasureType.Area:
      insertPointArea(params);
      break;
  }
}

function mouseMoveMap(params: MouseEventParams) {
  const featureId = params.feature?.properties.name ?? "";
  if (measureStatus.value !== MeasureStatus.MeasureEnd) {
    const isFinishPoint =
      featureId.startsWith(measurementLayerPrefix) &&
      featureId.includes(`_${PointActionType.Finish}_`);
    const isDeletePoint =
      featureId.startsWith(measurementLayerPrefix) &&
      featureId.includes(`_${PointActionType.Delete}_`);
    hoverId.value = isFinishPoint || isDeletePoint ? featureId : "";
  } else {
    hoverId.value = !modifying.value ? featureId : "";
  }

  switch (activeFeature.value?.type) {
    case MeasureType.Distance:
      mouseMoveDistance(params);
      break;
    case MeasureType.Area:
      mouseMoveArea(params);
      break;
  }
}

function startMeasure(type: MeasureType, id?: string) {
  active.value = true;
  finishMeasure(true);
  const measureId = id ?? uuid();
  switch (type) {
    case MeasureType.Distance:
      startMeasureDistance(measureId);
      break;
    case MeasureType.Area:
      startMeasureArea(measureId);
      break;
  }
  emits("startMeasure", measureId);
}

function finishMeasure(passEmit?: boolean) {
  if (activeFeature.value?.id && !passEmit) {
    emits("finishMeasure", activeFeature.value.id);
  }
  switch (activeFeature.value?.type) {
    case MeasureType.Distance:
      finishMeasureDistance();
      break;
    case MeasureType.Area:
      finishMeasureArea();
      break;
  }
}

/**
 * 取消绘制
 */
function cancelMeasure() {
  emits("update:measureResults", []);
}

function startModify(name: string) {
  selectedId.value = name;
  modifying.value = true;
}

function endModify() {
  modifying.value = false;
}

function cancelDrawing(id: string) {
  emits("cancelDrawing", id);
}

function selectFeature(id: string) {
  if (modifying.value || measureStatus.value !== MeasureStatus.MeasureEnd) {
    return;
  }
  const arr = measureResults.value;
  arr.forEach((item) => {
    item.selected = item.id === id;
  });
  measureResults.value = arr;
}
</script>
