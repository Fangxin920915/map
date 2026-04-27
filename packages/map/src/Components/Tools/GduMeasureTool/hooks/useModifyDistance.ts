import { ComputedRef, watch, WritableComputedRef } from "vue";
import {
  LineStringCoordinates,
  MouseEventParams,
  PointCoordinates,
  measurementLayerPrefix,
  MeasureStatus,
  MeasureType,
  PointActionType,
} from "@gdu-gl/common";
import * as turf from "@turf/turf";
import { MeasureResult } from "../props";

/**
 * @function useModifyDistance
 * @description 用于处理距离测量操作的钩子函数。
 * @param measureResults - 可写的计算属性，存储所有测量结果。
 * @param activeFeature - 可写的计算属性，当前激活的测量要素。
 * @param measureStatus - 计算属性，当前激活要素的测量状态。
 * @returns 包含多个处理距离测量操作的函数。
 */
export function useModifyDistance(
  measureResults: WritableComputedRef<MeasureResult[]>,
  activeFeature: WritableComputedRef<MeasureResult | undefined>,
  measureStatus: ComputedRef<MeasureStatus | undefined>,
) {
  watch(
    () => activeFeature.value?.coordinates?.toString(),
    (newCoordinatesStr, oldCoordinatesStr) => {
      const newActiveFeature = activeFeature.value;
      if (
        newActiveFeature &&
        newActiveFeature.type === MeasureType.Distance &&
        newCoordinatesStr &&
        newCoordinatesStr !== oldCoordinatesStr
      ) {
        newActiveFeature.result = getTotalDistance(
          newActiveFeature.coordinates as LineStringCoordinates,
        );
        activeFeature.value = newActiveFeature;
      }
    },
    {
      deep: true,
      immediate: true,
    },
  );

  /**
   * @function startMeasureDistance
   * @description 开始一个新的距离测量任务。
   * 会将现有测量结果设为未选中状态，并添加新的测量结果到列表中。
   * @param {string} id - 新测量任务的唯一标识符。
   */
  function startMeasureDistance(id: string) {
    // 创建新的测量结果对象
    const result = {
      id,
      type: MeasureType.Distance,
      coordinates: [] as LineStringCoordinates,
      result: 0,
      selected: true,
      measureStatus: MeasureStatus.MeasureStart,
    };
    // 将所有现有测量结果设为未选中
    measureResults.value.forEach((measureResult) => {
      measureResult.selected = false;
    });
    // 添加新的测量结果到结果列表
    measureResults.value = [...measureResults.value, result];
  }

  /**
   * @function insertPointDistance
   * @description 向当前激活的距离测量线串添加新的点。
   * 会跳过测量已结束、无激活要素、无有效坐标或点击测量图层的情况。
   * @param {MouseEventParams} params - 鼠标点击事件参数，包含点击位置坐标。
   */
  function insertPointDistance(params: MouseEventParams) {
    // 若测量已结束，不执行操作
    if (measureStatus.value === MeasureStatus.MeasureEnd) {
      return;
    }
    // 若无激活要素或无有效坐标，不执行操作
    if (!activeFeature.value || !params.coordinates) {
      return;
    }
    // 若点击的是测量图层要素，不执行操作
    if (
      params.feature?.properties.name?.startsWith(measurementLayerPrefix) &&
      !params.feature?.properties.name?.endsWith(PointActionType.Line) &&
      !params.feature?.properties.name?.endsWith(PointActionType.Polygon)
    ) {
      return;
    }
    // 获取当前激活要素
    const newActiveFeature = activeFeature.value;
    const { coordinates } = newActiveFeature;
    // 截取线串除最后一个点外的部分
    const line = coordinates.slice(
      0,
      coordinates.length - 1,
    ) as LineStringCoordinates;
    // 获取点击位置的二维坐标
    const position = params.coordinates.slice(0, 2) as PointCoordinates;
    // 添加新点到线串
    line.push(position, position);
    // 更新激活要素的坐标
    newActiveFeature.coordinates = line;
    activeFeature.value = newActiveFeature;
  }

  /**
   * @function mouseMoveDistance
   * @description 鼠标移动时更新当前激活距离测量线串的最后一个点。
   * 会跳过测量已结束、无激活要素或无有效坐标的情况。
   * @param {MouseEventParams} params - 鼠标移动事件参数，包含鼠标位置坐标。
   */
  function mouseMoveDistance(params: MouseEventParams) {
    // 若测量已结束，不执行操作
    if (measureStatus.value === MeasureStatus.MeasureEnd) {
      return;
    }
    // 若无激活要素或无有效坐标，不执行操作
    if (!activeFeature.value || !params.coordinates) {
      return;
    }

    const newActiveFeature = activeFeature.value;
    // 获取当前激活要素
    const { coordinates } = newActiveFeature;

    if (coordinates.length <= 0) {
      return;
    }
    // 更新线串最后一个点的坐标
    coordinates[coordinates.length - 1] = params.coordinates;
    activeFeature.value = newActiveFeature;
  }

  /**
   * @function finishMeasureDistance
   * @description 结束当前激活的距离测量任务，将测量状态设为已结束。
   * 会跳过测量已结束或无激活要素的情况。
   */
  function finishMeasureDistance() {
    // 若无激活要素，不执行操作
    if (!activeFeature.value) {
      return;
    }

    // 获取当前激活要素
    const newActiveFeature = activeFeature.value;

    if (newActiveFeature.measureStatus === MeasureStatus.MeasureEnd) {
      return;
    }

    const { coordinates } = newActiveFeature;
    // 将测量状态设为已结束
    newActiveFeature.measureStatus = MeasureStatus.MeasureEnd;
    newActiveFeature.coordinates = coordinates.slice(
      0,
      coordinates.length - 1,
    ) as LineStringCoordinates;
    if (newActiveFeature.coordinates.length < 2) {
      measureResults.value = measureResults.value.filter(
        ({ id }) => id !== newActiveFeature.id,
      );
    } else {
      activeFeature.value = newActiveFeature;
    }
  }

  function getTotalDistance(coordinates: LineStringCoordinates) {
    if (coordinates && coordinates.length > 1) {
      return turf.length(turf.lineString(coordinates as number[][]));
    }
    return 0;
  }

  return {
    startMeasureDistance,
    insertPointDistance,
    mouseMoveDistance,
    finishMeasureDistance,
  };
}
