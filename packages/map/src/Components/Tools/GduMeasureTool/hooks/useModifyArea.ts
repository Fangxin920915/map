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
 * @function useModifyArea
 * @description 用于处理面积测量操作的钩子函数
 * @param measureResults - 可写的计算属性，存储所有测量结果
 * @param activeFeature - 可写的计算属性，当前激活的测量要素
 * @param measureStatus - 计算属性，当前激活要素的测量状态
 * @returns 包含多个处理面积测量操作的函数
 * @property startMeasureArea - 开始新的面积测量
 * @property insertPointArea - 向当前激活的多边形添加新的点
 * @property mouseMoveArea - 处理鼠标移动时更新多边形最后一个点的位置
 * @property finishMeasureArea - 结束当前激活的面积测量
 */
export function useModifyArea(
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
        newActiveFeature.type === MeasureType.Area &&
        newCoordinatesStr &&
        newCoordinatesStr !== oldCoordinatesStr
      ) {
        newActiveFeature.result = getTotalArea(newActiveFeature.coordinates);
        activeFeature.value = newActiveFeature;
      }
    },
    {
      deep: true,
      immediate: true,
    },
  );

  /**
   * @function startMeasureArea
   * @description 开始一个新的面积测量任务
   * 1. 创建新的测量结果对象
   * 2. 将所有现有测量结果设为未选中状态
   * 3. 将新的测量结果添加到结果列表中
   * @param {string} id - 新测量任务的唯一标识符
   */
  function startMeasureArea(id: string) {
    // 创建新的测量结果对象
    const result = {
      id,
      type: MeasureType.Area,
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
   * @function insertPointArea
   * @description 向当前激活的面积测量多边形添加新的点
   * 1. 检查测量状态，若已结束则不执行操作
   * 2. 检查激活要素和坐标有效性
   * 3. 检查是否点击了测量图层要素
   * 4. 获取当前激活要素并更新其坐标
   * 5. 添加新点到多边形，若点数≥3则闭合多边形
   * @param {MouseEventParams} params - 鼠标点击事件参数，包含点击位置坐标
   */
  function insertPointArea(params: MouseEventParams) {
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
    const { length } = coordinates;
    // 截取线串除最后一个点外的部分
    const line = coordinates.slice(0, length > 3 ? length - 2 : length - 1);
    // 获取点击位置的二维坐标
    const position = params.coordinates.slice(0, 2) as PointCoordinates;
    // 添加新点到线串
    line.push(position, position);
    if (line.length >= 3) {
      line.push(coordinates[0]);
    }
    // 更新激活要素的坐标
    newActiveFeature.coordinates = line;
    activeFeature.value = newActiveFeature;
  }

  /**
   * @function mouseMoveArea
   * @description 处理鼠标移动时更新面积测量多边形的最后一个点
   * 1. 检查测量状态，若已结束则不执行操作
   * 2. 检查激活要素和坐标有效性
   * 3. 获取当前激活要素的坐标
   * 4. 根据坐标数量更新最后一个点或倒数第二个点的位置
   * @param {MouseEventParams} params - 鼠标移动事件参数，包含鼠标位置坐标
   */
  function mouseMoveArea(params: MouseEventParams) {
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

    const { length } = coordinates;
    if (length <= 0) {
      return;
    }
    if (length > 3) {
      coordinates[coordinates.length - 2] = params.coordinates;
    } else {
      coordinates[coordinates.length - 1] = params.coordinates;
    }

    activeFeature.value = newActiveFeature;
  }

  /**
   * @function finishMeasureArea
   * @description 结束当前激活的面积测量任务
   * 1. 检查是否存在激活要素，若无则直接返回
   * 2. 检查测量状态，若已结束则直接返回
   * 3. 更新测量状态为已结束
   * 4. 裁剪坐标数组，移除最后两个点
   * 5. 若裁剪后坐标数量小于3，则移除该测量结果
   * 6. 否则闭合多边形并更新激活要素
   */
  function finishMeasureArea() {
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
    newActiveFeature.coordinates = coordinates.slice(0, coordinates.length - 2);
    if (newActiveFeature.coordinates.length < 3) {
      measureResults.value = measureResults.value.filter(
        ({ id }) => id !== newActiveFeature.id,
      );
    } else {
      newActiveFeature.coordinates.push(coordinates[0]);
      activeFeature.value = newActiveFeature;
    }
  }

  function getTotalArea(coordinates: LineStringCoordinates) {
    if (coordinates && coordinates.length > 3) {
      return turf.area(turf.polygon([coordinates] as number[][][]));
    }
    return 0;
  }

  return {
    startMeasureArea,
    insertPointArea,
    mouseMoveArea,
    finishMeasureArea,
  };
}
