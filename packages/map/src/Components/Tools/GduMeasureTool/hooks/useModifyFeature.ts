import { computed, ref, watch, WritableComputedRef } from "vue";
import { Viewer } from "@gdu-gl/core";
import {
  LineStringCoordinates,
  measurementLayerPrefix,
  MeasureStatus,
  MeasureType,
} from "@gdu-gl/common";
import { MeasureResult } from "../props";
import { useModifyArea } from "./useModifyArea";
import { useModifyDistance } from "./useModifyDistance";

export function useModifyFeature(
  viewer: Viewer | undefined,
  measureResults: WritableComputedRef<MeasureResult[]>,
) {
  const canvas = viewer?.mapProviderDelegate?.map.canvas;

  const selectedId = ref("");

  const hoverId = ref("");

  const activeFeature = computed({
    get: () => {
      return measureResults.value.find((item) => item.selected);
    },
    set: (value) => {
      const index = measureResults.value.findIndex((item) => item.selected);
      if (index > -1) {
        const newMeasureResults = measureResults.value;
        newMeasureResults[index] = value as MeasureResult;
        measureResults.value = newMeasureResults;
      }
    },
  });

  const measureStatus = computed(
    () => activeFeature.value?.measureStatus ?? MeasureStatus.MeasureEnd,
  );

  watch(
    [measureStatus, hoverId, () => activeFeature.value?.type],
    ([newStatus, newHoverId, newType]) => {
      canvas?.classList.remove("gdu-draw-line-cursor");
      canvas?.classList.remove("gdu-draw-area-cursor");
      canvas?.classList.remove("gdu-draw-hover-feature-cursor");
      if (newHoverId.startsWith(measurementLayerPrefix)) {
        canvas?.classList.add("gdu-draw-hover-feature-cursor");
      } else if (
        newStatus &&
        newStatus !== MeasureStatus.MeasureEnd &&
        newType === MeasureType.Distance
      ) {
        canvas?.classList.add("gdu-draw-line-cursor");
      } else if (
        newStatus &&
        newStatus !== MeasureStatus.MeasureEnd &&
        newType === MeasureType.Area
      ) {
        canvas?.classList.add("gdu-draw-area-cursor");
      }
    },
    {
      immediate: true,
    },
  );

  const {
    startMeasureDistance,
    insertPointDistance,
    mouseMoveDistance,
    finishMeasureDistance,
  } = useModifyDistance(measureResults, activeFeature, measureStatus);

  const {
    startMeasureArea,
    insertPointArea,
    mouseMoveArea,
    finishMeasureArea,
  } = useModifyArea(measureResults, activeFeature, measureStatus);

  function removeResult(id: string) {
    measureResults.value = measureResults.value.filter(
      (item) => item.id !== id,
    );
  }

  function refreshFeaturePoint(
    resultIndex: number,
    feature: LineStringCoordinates,
  ) {
    const arr = measureResults.value;
    const newActiveFeature = arr[resultIndex];
    newActiveFeature.coordinates = feature;
    measureResults.value = arr;
  }

  return {
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
  };
}
