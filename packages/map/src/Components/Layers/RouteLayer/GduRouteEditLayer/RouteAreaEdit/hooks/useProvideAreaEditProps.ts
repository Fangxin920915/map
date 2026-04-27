import {
  computed,
  reactive,
  toRaw,
  watch,
  InjectionKey,
  Reactive,
  provide,
} from "vue";
import {
  isValidPolygon,
  RoutePointType,
  RouteEditDrawStatus,
  PolygonCoordinates,
} from "@gdu-gl/common";
import { cloneDeep, isEmpty } from "lodash-es";
import * as turf from "@turf/turf";
import { transformRoutePointHeightByMode } from "@map/Utils";
import {
  IsPolygonSelfIntersectingKey,
  RouteAreaEditPropsKey,
  RouteAreaEditSelectDataInfoKey,
} from "../../common/types/ProviderCommonKey";
import { RouteActiveFeature } from "../../common/types/EventCommonParams";
import {
  RouteAreaEditDataInfo,
  RouteAreaEditEmits,
  RouteAreaEditProps,
} from "../props";

/**
 * 航点航线数据的注入键
 */
export const RouteAreaEditDataInfoKey: InjectionKey<
  Reactive<RouteAreaEditDataInfo>
> = Symbol("航点航线数据的注入键");

/**
 * 航点航线回调事件
 */
export const RouteAreaEditEmitsKey: InjectionKey<RouteAreaEditEmits> =
  Symbol("航点航线回调事件");

export function useProvideAreaEditProps(
  props: RouteAreaEditProps,
  emits: RouteAreaEditEmits,
) {
  const dataInfo = reactive<RouteAreaEditDataInfo>({
    altPress: false,
    hover: {
      type: null,
      index: -1,
    },
    modifyAreaLine: [],
    drawStatus: RouteEditDrawStatus.DRAW_END,
  });

  const selectInfo = computed({
    get() {
      if (!props.select) {
        return {
          type: null,
          index: -1,
        };
      }
      return {
        type: RoutePointType.FOOT,
        index: props.select.idx,
      };
    },
    set(value: RouteActiveFeature) {
      emits("update:select", { idx: value.index });
    },
  });

  /**
   * 计算属性，过滤出编辑线数组中标记为拐点的元素
   * @returns 包含所有拐点的数组
   */
  const editTurnPointList = computed(() => {
    const lines = props.lines ?? [];
    return lines.map((line) => {
      return transformRoutePointHeightByMode(
        props.altitudeMode,
        line,
        props.takeoffPoint,
      );
    });
  });

  const isPolygonSelfIntersecting = computed(() => {
    // 检查面线的点数是否少于 3 个，少于 3 个点无法构成多边形
    if (dataInfo.modifyAreaLine.length < 3) {
      return false;
    }

    if (
      dataInfo.drawStatus === RouteEditDrawStatus.DRAWING &&
      dataInfo.hover.type === RoutePointType.FOOT &&
      dataInfo.hover.index === dataInfo.modifyAreaLine.length - 2
    ) {
      return false;
    }

    // 提取面线的第一个点
    const [first] = dataInfo.modifyAreaLine;
    // 将第一个点添加到面线末尾，形成封闭多边形，并包裹在二维数组中返回
    const polygon = [[...dataInfo.modifyAreaLine, first]] as number[][][];

    if (!isEmpty(polygon)) {
      const { length } = turf.kinks(turf.polygon(polygon)).features;
      return length > 0;
    }
    return false;
  });

  provide(RouteAreaEditDataInfoKey, dataInfo);
  provide(RouteAreaEditPropsKey, props);
  provide(RouteAreaEditEmitsKey, emits);
  provide(IsPolygonSelfIntersectingKey, isPolygonSelfIntersecting);
  provide(RouteAreaEditSelectDataInfoKey, selectInfo);

  /**
   * 监听 props.area 和 props.type 的变化
   * 当类型发生变化时，将绘制状态设为绘制结束，并清空编辑线和编辑面线数组
   * 若 props.area 为空，直接清空编辑面线数组
   * 若 props.area 有效，提取有效多边形数据并处理后赋值给 modifyAreaLine
   */
  watch(
    [() => props.area?.toString(), () => props.takeoffPoint?.toString()],
    () => {
      // 情况1: 既没有起飞点也没有区域数据
      if (isEmpty(props.takeoffPoint) && isEmpty(props.area)) {
        resetDataInfo(); // 重置所有编辑状态
        dataInfo.drawStatus = RouteEditDrawStatus.DRAW_TAKEOFF; // 设置为等待绘制起飞点状态
        dataInfo.modifyAreaLine = []; // 清空编辑区域线数组
      }
      // 情况2: 没有起飞点但有区域数据
      else if (isEmpty(props.takeoffPoint) && !isEmpty(props.area)) {
        resetDataInfo(); // 重置所有编辑状态
        dataInfo.drawStatus = RouteEditDrawStatus.DRAW_TAKEOFF; // 设置为等待绘制起飞点状态
        resetArea(); // 调用resetArea方法处理区域数据
      }
      // 情况3: 有起飞点但没有区域数据
      else if (!isEmpty(props.takeoffPoint) && isEmpty(props.area)) {
        resetDataInfo(); // 重置所有编辑状态
        dataInfo.modifyAreaLine = []; // 清空编辑区域线数组
        dataInfo.drawStatus = RouteEditDrawStatus.DRAWING; // 设置为绘制中状态
        emits("startDraw"); // 触发开始绘制事件
      }
      // 情况4: 既有起飞点也有区域数据
      else {
        dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
        resetArea(); // 调用resetArea方法处理区域数据
      }
    },
    {
      immediate: true,
    },
  );

  watch(
    () => props.active,
    () => {
      if (!props.active) {
        resetDataInfo();
      }
    },
    {
      immediate: true,
    },
  );

  function resetArea() {
    try {
      const area = isValidPolygon(props.area as PolygonCoordinates);
      const areaLine = area[0];
      const { length } = areaLine;
      dataInfo.modifyAreaLine = cloneDeep(toRaw(areaLine.slice(0, length - 1)));
    } catch (e) {
      console.error("面数据异常,已清空数据", e);
      dataInfo.modifyAreaLine = [];
    }
  }

  function resetDataInfo() {
    selectInfo.value = {
      type: null,
      index: -1,
    };
    dataInfo.hover = {
      type: null,
      index: -1,
    };
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
  }

  return {
    selectInfo,
    dataInfo,
    editTurnPointList,
    isPolygonSelfIntersecting,
  };
}
