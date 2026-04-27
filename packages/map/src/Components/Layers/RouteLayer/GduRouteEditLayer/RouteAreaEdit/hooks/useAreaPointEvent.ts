import {
  LineStringCoordinates,
  PointCoordinates,
  RouteEditDrawStatus,
  RouteEditEventType,
  RoutePointType,
} from "@gdu-gl/common";
import { computed, WritableComputedRef, ref, Ref, toRaw } from "vue";
import { cloneDeep } from "lodash-es";
import { RouteActiveFeature } from "../../common/types/EventCommonParams";
import {
  RouteAreaEditDataInfo,
  RouteAreaEditEmits,
  RouteAreaEditProps,
} from "../props";

export function useAreaPointEvent(
  props: RouteAreaEditProps,
  emits: RouteAreaEditEmits,
  dataInfo: RouteAreaEditDataInfo,
  selectInfo: WritableComputedRef<RouteActiveFeature>,
  isPolygonSelfIntersecting: Ref<boolean>,
) {
  const copyAreaLine = ref<LineStringCoordinates>([]);

  /**
   * 记录修改前的状态，如果是绘制起飞点状态，在编辑完成后需要恢复到绘制起飞点状态
   */
  let beforeModifyStatus = dataInfo.drawStatus;

  /**
   * 计算属性，根据绘制状态过滤编辑面线数组
   * @returns 过滤后的编辑面线数组
   */
  const linePoints = computed(() => {
    const { length } = dataInfo.modifyAreaLine;
    // 若处于绘制状态，过滤掉最后一个点
    if (dataInfo.drawStatus === RouteEditDrawStatus.DRAWING) {
      return dataInfo.modifyAreaLine.slice(0, length - 1);
    }
    return dataInfo.modifyAreaLine;
  });

  /**
   * 计算属性，将编辑中的面线数据转换为多边形数据。
   * 多边形要求至少有三个点才能形成封闭图形，若点数不足则返回空数组。
   * 若点数足够，会将面线的第一个点添加到末尾，从而形成封闭的多边形。
   * @returns 转换后的多边形数据，格式为二维数组，若不满足条件则返回空数组。
   */
  const areaLineToPolygon = computed(() => {
    // 检查面线的点数是否少于 3 个，少于 3 个点无法构成多边形
    if (dataInfo.modifyAreaLine.length < 3) {
      return [];
    }
    // 提取面线的第一个点
    const [first] = dataInfo.modifyAreaLine;
    // 将第一个点添加到面线末尾，形成封闭多边形，并包裹在二维数组中返回
    return [[...dataInfo.modifyAreaLine, first]];
  });

  /**
   * 向编辑中的面线数据添加新的区域点。
   * 若当前绘制状态为绘制结束，则不执行添加操作。
   * @param coordinates - 要添加的区域点的坐标，格式为 [经度, 纬度]。
   */
  function addAreaPoint(coordinates: PointCoordinates) {
    // 检查当前绘制状态是否为绘制结束，若是则直接返回
    if (
      dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING ||
      isPolygonSelfIntersecting.value
    ) {
      return;
    }
    // 解构出坐标的经度和纬度
    const [lon, lat] = coordinates;
    // 复制面线数据，排除最后一个点
    const line = dataInfo.modifyAreaLine.slice(
      0,
      dataInfo.modifyAreaLine.length - 1,
    );
    // 将新的区域点添加两次到复制后的面线数据中
    line.push([lon, lat], [lon, lat]);
    // 更新面线数据
    dataInfo.modifyAreaLine = line;

    if (linePoints.value.length > 1) {
      dataInfo.hover = {
        index: linePoints.value.length - 1,
        type: RoutePointType.FOOT,
      };
    }
  }

  /**
   * 处理鼠标移动时更新面线数据中最后一个区域点的坐标。
   * 若面线数据为空或当前绘制状态为绘制结束，则不执行更新操作。
   * @param coordinates - 鼠标当前位置的坐标，格式为 [经度, 纬度]。
   */
  function mouseMoveAreaPoint(coordinates: PointCoordinates) {
    // 检查面线数据是否为空或者当前绘制状态是否为绘制结束，满足任一条件则直接返回
    if (
      !dataInfo.modifyAreaLine.length ||
      dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING
    ) {
      return;
    }
    // 解构出坐标的经度和纬度
    const [lon, lat] = coordinates;
    // 更新面线数据中最后一个点的坐标
    dataInfo.modifyAreaLine[dataInfo.modifyAreaLine.length - 1] = [lon, lat];
  }

  /**
   * 结束区域点的绘制操作。
   * 若当前航线类型为航点航线，会输出警告信息并终止操作，因为航点航线不支持此方法。
   * 若当前绘制状态已经是绘制结束，会输出警告信息并终止操作，避免重复调用。
   * 根据面线数据的有效点数，决定是创建多边形还是清空面线数据，并触发相应事件。
   */
  function finishDrawAreaPoint() {
    // 检查当前绘制状态是否为绘制结束，若是则输出警告信息并返回
    if (dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING) {
      console.warn("当前绘制已结束，无需重复调用该方法");
      return;
    }
    // 将绘制状态设置为绘制结束
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
    // 截取面线数据，排除最后一个点
    const line = dataInfo.modifyAreaLine.slice(
      0,
      dataInfo.modifyAreaLine.length - 1,
    );
    // 定义事件类型变量
    let type: RouteEditEventType;
    // 检查截取后的面线数据点数是否大于 2
    if (line.length > 2) {
      // 若点数大于 2，更新面线数据
      dataInfo.modifyAreaLine = line;
      // 设置事件类型为创建
      type = RouteEditEventType.CREATE;
      // selectId.value = `${footPointPrefix.value}${dataInfo.modifyAreaLine.length - 1}`;
      selectInfo.value = {
        type: RoutePointType.FOOT,
        index: dataInfo.modifyAreaLine.length - 1,
      };
    } else {
      // 若点数不大于 2，清空面线数据
      dataInfo.modifyAreaLine = [];
      // 设置事件类型为清空
      type = RouteEditEventType.CLEAR;
      selectInfo.value = {
        type: null,
        index: -1,
      };
    }
    // 触发 'changed' 事件，通知外部绘制状态改变
    emits("changed", {
      type,
      area: toRaw(areaLineToPolygon.value),
    });

    selectInfo.value = {
      type: RoutePointType.FOOT,
      index: linePoints.value.length - 1,
    };
  }

  /**
   * 在指定索引位置插入新的区域点。
   * 接收要插入的索引位置和区域点坐标，将新的区域点插入到指定位置。
   * 插入完成后，触发相应事件通知外部区域数据已更新。
   * @param index - 插入位置的索引，新区域点将插入到该索引的下一个位置。
   * @param coordinates - 要插入的区域点的坐标，格式为 [经度, 纬度]。
   */
  function insertAreaPoint(index: number, coordinates: PointCoordinates) {
    if (!props.active) {
      return;
    }
    // 解构出坐标的经度和纬度
    const [lon, lat] = coordinates;
    // 在指定索引位置的下一个位置插入新的区域点
    dataInfo.modifyAreaLine.splice(index + 1, 0, [lon, lat]);
    // selectId.value = `${footPointPrefix.value}${index + 1}`;
    selectInfo.value = {
      type: RoutePointType.FOOT,
      index: index + 1,
    };
    // 触发 'changed' 事件，通知外部插入了新的区域点
    emits("changed", {
      type: RouteEditEventType.INSERT,
      idx: index + 1,
      area: toRaw(areaLineToPolygon.value),
    });
  }

  /**
   * 开始修改指定索引位置的区域点。
   * 接收要修改的区域点的索引，触发 `startModify` 事件，通知外部开始修改操作。
   * @param index - 要修改的区域点的索引。
   */
  function modifyStartAreaPoint(index: number) {
    beforeModifyStatus = dataInfo.drawStatus;
    dataInfo.drawStatus = RouteEditDrawStatus.MODIFY;
    // selectId.value = `${footPointPrefix.value}${index}`;
    selectInfo.value = {
      type: RoutePointType.FOOT,
      index,
    };
    dataInfo.hover = {
      type: RoutePointType.FOOT,
      index,
    };
    copyAreaLine.value = cloneDeep(toRaw(dataInfo.modifyAreaLine));
    // 触发 'startModify' 事件，通知外部开始修改指定索引的区域点
    emits("startModify", {
      idx: index,
      area: toRaw(areaLineToPolygon.value),
    });
  }

  /**
   * 修改指定索引位置的区域点的坐标。
   * 接收要修改的区域点的索引和新的坐标，更新对应区域点的坐标。
   * @param index - 要修改的区域点的索引。
   * @param coordinates - 新的区域点坐标，格式为 [经度, 纬度]。
   */
  function modifyingAreaPoint(index: number, coordinates: PointCoordinates) {
    // 解构出坐标的经度和纬度
    const [lon, lat] = coordinates;
    // 更新指定索引位置的区域点坐标
    dataInfo.modifyAreaLine[index] = [lon, lat];
  }

  /**
   * 结束对指定索引位置区域点的修改。
   * 接收已修改的区域点的索引，触发 `changed` 事件，通知外部修改操作已结束。
   * @param index - 已修改的区域点的索引。
   */
  function modifyEndAreaPoint(index: number) {
    if (beforeModifyStatus !== RouteEditDrawStatus.DRAW_TAKEOFF) {
      dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
    } else {
      dataInfo.drawStatus = beforeModifyStatus;
    }
    if (isPolygonSelfIntersecting.value) {
      dataInfo.modifyAreaLine = copyAreaLine.value;
      dataInfo.hover = {
        type: null,
        index: -1,
      };
      return;
    }
    // 触发 'changed' 事件，通知外部完成对指定索引区域点的修改
    emits("changed", {
      type: RouteEditEventType.MODIFY,
      idx: index,
      area: toRaw(areaLineToPolygon.value),
    });
  }

  function deleteAreaPoint(index: number) {
    switch (dataInfo.drawStatus) {
      case RouteEditDrawStatus.DRAW_END:
        deletePointOnDrawEnd(index);
        break;
      default:
        deletePointOnDrawing(index);
        break;
    }
    selectInfo.value = {
      type: null,
      index: -1,
    };
  }

  function deletePointOnDrawing(index: number) {
    if (dataInfo.modifyAreaLine.length > 2) {
      dataInfo.modifyAreaLine.splice(index, 1);
    } else {
      dataInfo.modifyAreaLine = [];
    }
  }

  function deletePointOnDrawEnd(index: number) {
    if (dataInfo.modifyAreaLine.length > 3) {
      dataInfo.modifyAreaLine.splice(index, 1);
      emits("changed", {
        type: RouteEditEventType.REMOVE,
        idx: index,
        area: toRaw(areaLineToPolygon.value),
      });
    } else {
      dataInfo.modifyAreaLine = [];
      emits("changed", {
        type: RouteEditEventType.CLEAR,
        area: toRaw(areaLineToPolygon.value),
      });
    }
  }

  function clickAreaPoint(index: number) {
    if (!props.active) {
      return;
    }
    // 若编辑面线数组长度大于 2，点击的是最后一个点且处于绘制状态，结束绘制
    if (
      linePoints.value.length > 2 &&
      index === linePoints.value.length - 1 &&
      dataInfo.drawStatus === RouteEditDrawStatus.DRAWING
    ) {
      finishDrawAreaPoint();
    }
    // 若处于绘制结束状态，预留点击点展示编辑信息的逻辑
    else if (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_END) {
      // selectId.value = `${footPointPrefix.value}${index}`;
      selectInfo.value = {
        type: RoutePointType.FOOT,
        index,
      };
    }
  }

  return {
    modifyStartAreaPoint,
    modifyingAreaPoint,
    modifyEndAreaPoint,
    addAreaPoint,
    mouseMoveAreaPoint,
    finishDrawAreaPoint,
    areaLineToPolygon,
    insertAreaPoint,
    linePoints,
    deleteAreaPoint,
    clickAreaPoint,
  };
}
