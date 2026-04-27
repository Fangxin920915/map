import {
  computed,
  ComputedRef,
  InjectionKey,
  provide,
  reactive,
  Reactive,
  watch,
  WritableComputedRef,
} from "vue";
import { isEmpty } from "lodash-es";
import {
  groupWayPointBySurround,
  LinePointAction,
  LineStringCoordinates,
  RouteEditDrawStatus,
  RoutePointType,
} from "@gdu-gl/common";
import { transformRoutePointHeightByMode } from "@map/Utils";
import { RouteActiveFeature } from "../../common/types/EventCommonParams";
import {
  WayPointDataInfo,
  WayPointEditEmits,
  WayPointEditProps,
} from "../props";

/**
 * 航点航线数据的注入键
 */
export const WayPointDataInfoKey: InjectionKey<Reactive<WayPointDataInfo>> =
  Symbol("航点航线数据的注入键");

/**
 * 航点航线属性的注入键
 */
export const WayPointEditPropsKey: InjectionKey<WayPointEditProps> =
  Symbol("航点航线属性的注入键");

/**
 * 航点航线回调事件
 */
export const WayPointEditEmitsKey: InjectionKey<WayPointEditEmits> =
  Symbol("航点航线回调事件");

/**
 * 航线拐点 provide 的 key 值，用于注入计算属性类型的航线拐点列表
 */
export const EditTurnPointListKey: InjectionKey<
  ComputedRef<LinePointAction[]>
> = Symbol("航线拐点provide的key值");

/**
 * 航线拐点 provide 的 key 值，用于注入计算属性类型的航线拐点列表
 */
export const GroupWayPointKey: InjectionKey<
  ComputedRef<LineStringCoordinates[]>
> = Symbol("按环绕点分组的航点provide的key值");

/**
 * 选中点位信息的注入键
 */
export const WayPointEditSelectDataInfoKey: InjectionKey<
  WritableComputedRef<RouteActiveFeature>
> = Symbol("选中点位信息的注入键");

export function useProvideWayPointProps(
  props: WayPointEditProps,
  emits: WayPointEditEmits,
) {
  const dataInfo = reactive<WayPointDataInfo>({
    hover: {
      type: null,
      index: -1,
    },
    selectDeleteIndex: -1,
    altPress: false,
    modifyLine: [],
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
        type: RoutePointType.TURN,
        index: props.select.idx,
      };
    },
    set(value: RouteActiveFeature) {
      emits("update:select", { idx: value.index });
    },
  });

  /**
   * 监听 props.line的变化
   * 当类型发生变化时，将绘制状态设为绘制结束，并清空编辑线数组
   * 每次变化时，深拷贝 props.line 到 modifyLine
   */
  watch(
    [
      () => props.line,
      () => props.takeoffPoint?.toString(),
      () => props.altitudeMode,
    ],
    () => {
      const line = props.line ?? [];
      // 情况1: 既没有起飞点也没有航线数据
      if (isEmpty(props.takeoffPoint) && isEmpty(line)) {
        resetDataInfo(); // 重置所有编辑状态
        dataInfo.drawStatus = RouteEditDrawStatus.DRAW_TAKEOFF; // 设置为等待绘制起飞点状态
        dataInfo.modifyLine = []; // 清空编辑线数组
      }
      // 情况2: 没有起飞点但有航线数据
      else if (isEmpty(props.takeoffPoint) && !isEmpty(line)) {
        resetDataInfo(); // 重置所有编辑状态
        dataInfo.drawStatus = RouteEditDrawStatus.DRAW_TAKEOFF; // 设置为等待绘制起飞点状态
        dataInfo.modifyLine = transformRoutePointHeightByMode(
          props.altitudeMode,
          line,
          props.takeoffPoint,
        ); // 深拷贝传入的航线数据到编辑线数组
      }
      // 情况3: 有起飞点但没有航线数据
      else if (!isEmpty(props.takeoffPoint) && isEmpty(line)) {
        resetDataInfo(); // 重置所有编辑状态
        dataInfo.modifyLine = []; // 清空编辑线数组
      }
      // 情况4: 有起飞点且有航线数据
      else {
        dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
        dataInfo.modifyLine = transformRoutePointHeightByMode(
          props.altitudeMode,
          line,
          props.takeoffPoint,
        ); // 深拷贝传入的航线数据到编辑线数组
      }
    },
    {
      immediate: true,
      deep: true,
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

  /**
   * 如果用户正在新增环绕点，且选中的点发生变化时，将删除索引设为-1，并将绘制状态设为绘制结束
   */
  watch(
    () => selectInfo.value.index,
    (newVal, oldVal) => {
      if (
        newVal !== oldVal &&
        dataInfo.drawStatus === RouteEditDrawStatus.DRAW_SURROUND
      ) {
        dataInfo.selectDeleteIndex = -1;
        dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
      }
    },
    {
      immediate: true,
    },
  );

  /**
   * 计算属性，过滤出编辑线数组中标记为拐点的元素
   * @returns 包含所有拐点的数组
   */
  const editTurnPointList = computed(() => {
    return dataInfo.modifyLine.filter(({ isTurn }) => !!isTurn);
  });

  /**
   * 计算属性，将编辑线数组中的拐点按环绕点分组
   */
  const groupWayPointList = computed(() => {
    return groupWayPointBySurround(editTurnPointList.value);
  });

  provide(WayPointDataInfoKey, dataInfo);
  provide(WayPointEditPropsKey, props);
  provide(WayPointEditEmitsKey, emits);
  provide(EditTurnPointListKey, editTurnPointList);
  provide(WayPointEditSelectDataInfoKey, selectInfo);
  provide(GroupWayPointKey, groupWayPointList);

  function resetDataInfo() {
    // selectInfo.value = {
    //   type: null,
    //   index: -1,
    // };
    dataInfo.hover = {
      type: null,
      index: -1,
    };
    dataInfo.altPress = false;
    dataInfo.selectDeleteIndex = -1;
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
  }

  return {
    selectInfo,
    dataInfo,
    editTurnPointList,
  };
}
