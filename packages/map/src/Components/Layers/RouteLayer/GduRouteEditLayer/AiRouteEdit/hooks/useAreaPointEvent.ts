import { computed, ref, Ref, toRaw, WritableComputedRef } from "vue";
import {
  LineStringCoordinates,
  PointCoordinates,
  PolygonCoordinates,
  RouteEditDrawStatus,
  RouteEditEventType,
  RoutePointType,
} from "@gdu-gl/common";
import { cloneDeep } from "lodash-es";
import { RouteActiveFeature } from "../../common/types/EventCommonParams";
import {
  AiRouteEditDataInfo,
  AiRouteEditEmits,
  AiRouteEditProps,
} from "../props";

export function useAreaPointEvent(
  props: AiRouteEditProps,
  emits: AiRouteEditEmits,
  areaPointsProps: { parentsIdx: number; areaLine: LineStringCoordinates },
  dataInfo: AiRouteEditDataInfo,
  selectInfo: WritableComputedRef<RouteActiveFeature>,
  isPolygonSelfIntersecting: Ref<boolean>,
  isPolygonIntersect: Ref<boolean>,
) {
  /**
   * 记录修改前的状态，如果是绘制起飞点状态，在编辑完成后需要恢复到绘制起飞点状态
   */
  let beforeModifyStatus = dataInfo.drawStatus;

  const copyAreaLine = ref<LineStringCoordinates>([]);

  /**
   * 计算属性，根据绘制状态过滤编辑面线数组
   * @returns 过滤后的编辑面线数组
   */
  const linePoints = computed(() => {
    // 若处于绘制状态，过滤掉最后一个点
    if (
      areaPointsProps.parentsIdx === selectInfo.value.parentsIdx &&
      dataInfo.drawStatus === RouteEditDrawStatus.DRAWING
    ) {
      return areaPointsProps.areaLine.slice(
        0,
        areaPointsProps.areaLine.length - 1,
      );
    }
    return areaPointsProps.areaLine;
  });

  /**
   * 在指定索引位置插入新的区域点。
   * 接收要插入的索引位置和区域点坐标，将新的区域点插入到指定位置。
   * 插入完成后，触发相应事件通知外部区域数据已更新。
   * @param index - 插入位置的索引，新区域点将插入到该索引的下一个位置。
   * @param coordinates - 要插入的区域点的坐标，格式为 [经度, 纬度]。
   */
  function insertAreaPoint(index: number, coordinates: PointCoordinates) {
    if (
      !props.active ||
      (dataInfo.drawStatus === RouteEditDrawStatus.DRAWING &&
        selectInfo.value.parentsIdx !== areaPointsProps.parentsIdx)
    ) {
      return;
    }
    // 解构出坐标的经度和纬度
    const [lon, lat] = coordinates;
    // 在指定索引位置的下一个位置插入新的区域点
    const line = [...areaPointsProps.areaLine];
    line.splice(index + 1, 0, [lon, lat]);
    // selectId.value = `${footPointPrefix.value}${index + 1}`;
    selectInfo.value = {
      type: RoutePointType.FOOT,
      index: index + 1,
      parentsIdx: areaPointsProps.parentsIdx,
    };

    // TODO 这个位置需要提取到公共处理函数
    const area = props.area!.map((polygon, i) => {
      if (i === areaPointsProps.parentsIdx) {
        return transformLineToPolygon(line);
      }
      return polygon as PolygonCoordinates;
    });

    // 触发 'changed' 事件，通知外部插入了新的区域点
    emits("changed", {
      type: RouteEditEventType.INSERT,
      idx: index + 1,
      parentsIdx: areaPointsProps.parentsIdx,
      area,
    });
  }

  function clickAreaPoint(index: number) {
    if (
      !props.active ||
      (dataInfo.drawStatus === RouteEditDrawStatus.DRAWING &&
        selectInfo.value.parentsIdx !== areaPointsProps.parentsIdx)
    ) {
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
        parentsIdx: areaPointsProps.parentsIdx,
      };
    }
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
    const line = areaPointsProps.areaLine.slice(
      0,
      areaPointsProps.areaLine.length - 1,
    );
    // 检查截取后的面线数据点数是否大于 2
    if (line.length > 2) {
      // 若点数大于 2，更新面线数据
      // dataInfo.modifyMultiAreaLine[areaPointsProps.parentsIdx] = line;
      // selectId.value = `${footPointPrefix.value}${dataInfo.modifyAreaLine.length - 1}`;
      selectInfo.value = {
        type: RoutePointType.FOOT,
        index: line.length - 1,
        parentsIdx: areaPointsProps.parentsIdx,
      };

      // TODO 这个位置需要提取到公共处理函数
      const area = [
        ...(props.area ?? []),
        transformLineToPolygon(line),
      ] as PolygonCoordinates[];
      emits("changed", {
        type: RouteEditEventType.CREATE,
        area,
      });
    } else {
      const area = props.area!.filter((_, i) => {
        return i !== areaPointsProps.parentsIdx;
      }) as PolygonCoordinates[];

      // TODO需要处理当前面被清空的情况
      emits("changed", {
        type: RouteEditEventType.CLEAR,
        area,
      });
      selectInfo.value = {
        type: null,
        index: -1,
        parentsIdx: -1,
      };
    }
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
  }

  function deletePointOnDrawing(index: number) {
    let parentsIdx;
    if (dataInfo.modifyMultiAreaLine[areaPointsProps.parentsIdx].length > 2) {
      dataInfo.modifyMultiAreaLine[areaPointsProps.parentsIdx].splice(index, 1);
      parentsIdx = areaPointsProps.parentsIdx;
    } else {
      dataInfo.modifyMultiAreaLine.splice(areaPointsProps.parentsIdx, 1);
      dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
      parentsIdx = -1;
    }
    selectInfo.value = {
      type: null,
      index: -1,
      parentsIdx,
    };
  }

  function deletePointOnDrawEnd(index: number) {
    if (areaPointsProps.areaLine.length > 3) {
      selectInfo.value = {
        type: null,
        index: -1,
        parentsIdx: areaPointsProps.parentsIdx,
      };
      const line = [...areaPointsProps.areaLine];
      line.splice(index, 1);
      // TODO 这个位置需要提取到公共处理函数
      const area = props.area!.map((polygon, i) => {
        if (i === areaPointsProps.parentsIdx) {
          return transformLineToPolygon(line);
        }
        return polygon as PolygonCoordinates;
      });
      emits("changed", {
        type: RouteEditEventType.REMOVE,
        idx: index,
        parentsIdx: areaPointsProps.parentsIdx,
        area,
      });
    } else {
      selectInfo.value = {
        type: null,
        index: -1,
        parentsIdx: -1,
      };
      // TODO 需要处理这个面被清空的情况
      const area = props.area!.filter((_, i) => {
        return i !== areaPointsProps.parentsIdx;
      }) as PolygonCoordinates[];
      // dataInfo.modifyAreaLine = [];
      emits("changed", {
        type: RouteEditEventType.CLEAR,
        parentsIdx: -1,
        area,
      });
    }
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
      parentsIdx: areaPointsProps.parentsIdx,
    };
    dataInfo.hover = {
      type: RoutePointType.FOOT,
      index,
      parentsIdx: areaPointsProps.parentsIdx,
    };
    copyAreaLine.value = cloneDeep(toRaw(areaPointsProps.areaLine));

    // 触发 'startModify' 事件，通知外部开始修改指定索引的区域点
    emits("startModify", {
      parentsIdx: areaPointsProps.parentsIdx,
      idx: index,
      area: (props.area ?? []) as PolygonCoordinates[],
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
    dataInfo.modifyMultiAreaLine[areaPointsProps.parentsIdx][index] = [
      lon,
      lat,
    ];
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
    if (isPolygonSelfIntersecting.value || isPolygonIntersect.value) {
      dataInfo.modifyMultiAreaLine[areaPointsProps.parentsIdx] =
        copyAreaLine.value;
      dataInfo.hover = {
        type: null,
        index: -1,
        parentsIdx: -1,
      };
      return;
    }
    const area = props.area!.map((polygon, i) => {
      if (i === areaPointsProps.parentsIdx) {
        return transformLineToPolygon(
          dataInfo.modifyMultiAreaLine[areaPointsProps.parentsIdx],
        );
      }
      return polygon as PolygonCoordinates;
    });
    // 触发 'changed' 事件，通知外部完成对指定索引区域点的修改
    emits("changed", {
      type: RouteEditEventType.MODIFY,
      idx: index,
      parentsIdx: areaPointsProps.parentsIdx,
      area,
    });
  }

  /**
   * 计算属性，将编辑中的面线数据转换为多边形数据。
   * 多边形要求至少有三个点才能形成封闭图形，若点数不足则返回空数组。
   * 若点数足够，会将面线的第一个点添加到末尾，从而形成封闭的多边形。
   * @returns [] 转换后的多边形数据，格式为二维数组，若不满足条件则返回空数组。
   */
  function transformLineToPolygon(line: LineStringCoordinates) {
    // 检查面线的点数是否少于 3 个，少于 3 个点无法构成多边形
    if (line.length < 3) {
      return [];
    }
    // 提取面线的第一个点
    const [first] = line;
    // 将第一个点添加到面线末尾，形成封闭多边形，并包裹在二维数组中返回
    return [[...line, first]];
  }

  return {
    modifyStartAreaPoint,
    modifyingAreaPoint,
    modifyEndAreaPoint,
    finishDrawAreaPoint,
    transformLineToPolygon,
    insertAreaPoint,
    linePoints,
    deleteAreaPoint,
    clickAreaPoint,
  };
}
