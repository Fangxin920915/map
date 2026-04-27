<template>
  <template v-for="(point, index) in pointListBindProperties" :key="index">
    <GduPoint
      v-bind="getIcon(point, index)"
      :name="wayPointProps.layerId"
      :coordinates="point.coordinates"
      :enable-modify="wayPointProps.active"
      :modify-type="modifyType"
      :feature-properties="point.turnProperties"
      @modify-start="modifyStartWayPoint(index, RoutePointType.TURN)"
      @modifying="modifyingWayPoint(index, $event)"
      @modify-end="modifyEndWayPoint(index)"
      @click="clickWayPoint(index)"
    />
    <surround-route-line
      v-if="point.surroundPoint?.coordinates"
      :idx="index"
      :altitude-mode="wayPointProps.altitudeMode"
      :start-coordinates="point.coordinates"
      :end-coordinates="pointListBindProperties[index + 1]?.coordinates"
      :coordinates="point.surroundPoint.coordinates"
      :enable-counterclockwise="point.surroundPoint.enableCounterclockwise"
      :angle="point.surroundPoint.angle"
      :height="point.surroundPoint.height"
      :takeoff-point="wayPointProps.takeoffPoint"
    />
    <way-point-confirm-popup
      :visible="
        index === selectInfo.index &&
        dataInfo.drawStatus !== RouteEditDrawStatus.DRAW_SURROUND
      "
      :current-delete-index="index"
      :view-id="wayPointProps.viewId"
      :coordinates="point.coordinates"
      :clamp-to-ground="false"
      :offset="deleteOffset"
      :open-delete-menu="!!point.surroundPoint?.coordinates"
      :message="wayPointProps.message"
      @delete-way-point="deleteWayPoint(index)"
      @add-surround-point="startAddSurroundPoint(index)"
      @delete-surround-point="deleteSurroundPoint(index)"
    />
    <slot
      name="wayPoint"
      :idx="index"
      :point="omit(point, 'turnProperties', 'turnDeleteProperties')"
      :is-selected="index === selectInfo.index"
    ></slot>
  </template>
  <template v-for="(line, index) in lines" :key="index">
    <gdu-arrow-line-string
      v-if="!isEmpty(line) && line.length > 1"
      v-bind="wayPointProps.theme?.line"
      :coordinates="line"
      :stroke-width="6"
      :stroke-outline-width="0"
    />
  </template>
</template>

<script setup lang="ts">
import { GduPoint, GduArrowLineString } from "@map/Components";
import {
  LinePointAction,
  LineStringCoordinates,
  optimizePolylineTurningPoints,
  RouteEditDrawStatus,
  RouteEditStyle,
  RoutePointStyle,
  RoutePointType,
} from "@gdu-gl/common";
import { computed } from "vue";
import { isEmpty, omit } from "lodash-es";
import SurroundRouteLine from "./SurroundRouteLine.vue";
import WayPointConfirmPopup from "./WayPointConfirmPopup.vue";
import { useWayPointEvent } from "../hooks/useWayPointEvent";
import { useRouteEditIcons } from "../../common/hooks/useRouteEditIcons";
import { useInjectWayPointProps } from "../hooks/useInjectWayPointProps";
import { WayPointSlotProps } from "../../props";

defineSlots<WayPointSlotProps>();

/**
 * 从 useInjectRouteEditProps 钩子中获取航线编辑相关的属性和状态
 * wayPointProps: 包含航线编辑组件的各种属性，如航线类型、主题样式、是否贴地等配置信息
 * wayPointEmits: 用于触发自定义事件的函数，可将组件内部的状态变化通知给父组件
 * editTurnPointList: 响应式引用，存储正在编辑的航点列表，每个元素代表一个航点的信息
 * hoverId: 响应式引用，存储当前鼠标悬停元素的唯一标识
 * selectTurnIdx: 计算属性，存储当前选中航点的索引，若未选中则为 -1
 * modifyLine: 响应式引用，存储正在编辑的航线线段数据
 */
const {
  wayPointProps,
  wayPointEmits,
  editTurnPointList,
  dataInfo,
  selectInfo,
  groupWayPointList,
} = useInjectWayPointProps();

/**
 * 从 useWayPointEvent 钩子中获取航点编辑相关的事件处理函数
 * modifyingWayPoint: 当航点处于编辑过程中触发的事件处理函数，可用于实时更新航点状态
 * modifyEndWayPoint: 当航点编辑结束时触发的事件处理函数，可用于保存航点编辑后的最终状态
 * modifyStartWayPoint: 当航点开始编辑时触发的事件处理函数，可用于记录编辑开始时的状态
 */
const {
  modifyingWayPoint,
  modifyEndWayPoint,
  modifyStartWayPoint,
  deleteWayPoint,
  clickWayPoint,
  modifyType,
  deleteSurroundPoint,
  startAddSurroundPoint,
} = useWayPointEvent(wayPointProps, wayPointEmits, dataInfo, selectInfo);

const deleteOffset = [16, 0];

// 调用 useRouteEditIcons 钩子函数，传入航线编辑属性 wayPointProps
// 从返回结果中解构出不同类型航点的图标对象
// startSafePoint: 安全起始点的图标对象，包含不同状态（如悬停、选中、正常）下的图标
// endSafePoint: 安全结束点的图标对象，包含不同状态（如悬停、选中、正常）下的图标
// turnSafePoint: 安全转弯点的图标对象，包含不同状态（如悬停、选中、正常）下的图标
// startPoint: 普通起始点的图标对象，包含不同状态（如悬停、选中、正常）下的图标
// endPoint: 普通结束点的图标对象，包含不同状态（如悬停、选中、正常）下的图标
// turnPoint: 普通转弯点的图标对象，包含不同状态（如悬停、选中、正常）下的图标
const {
  startSafePoint,
  endSafePoint,
  turnSafePoint,
  startPoint,
  endPoint,
  turnPoint,
} = useRouteEditIcons(wayPointProps);

/**
 * 计算属性，将正在编辑的航点列表转换为包含所有航点坐标的数组
 * 该数组可用于绘制航线线段，因为 gdu-arrow-line-string 组件需要坐标数组作为输入
 * @returns 包含所有航点坐标的数组
 */
const lines = computed(() => {
  const optimizePolyline: LineStringCoordinates[] = [];
  groupWayPointList.value.forEach((lineString) => {
    if (lineString.length > 1) {
      optimizePolyline.push(optimizePolylineTurningPoints(lineString).line);
    }
  });

  // 使用 map 方法遍历 editTurnPointList 中的每个航点，提取其坐标并组成新数组
  return optimizePolyline;
});

const pointListBindProperties = computed(() => {
  return editTurnPointList.value.map((item, index) => {
    return {
      ...item,
      turnProperties: {
        type: RoutePointType.TURN,
        index,
      },
      turnDeleteProperties: {
        type: RoutePointType.TURN_DELETE,
        index,
      },
    };
  });
});

/**
 * 根据航点信息和索引获取航点的图标及样式配置
 * @param point - 航点的详细信息，包含是否安全等属性
 * @param index - 航点在编辑航点列表中的索引
 * @returns 包含航点图标、文本、样式等信息的配置对象
 */
function getIcon(point: LinePointAction, index: number) {
  // 获取编辑航点列表的长度
  const { length } = editTurnPointList.value;
  // 定义普通航点的图标尺寸
  const normalPointSize = {
    iconWidth: 24,
    iconHeight: 24,
  };
  // 定义安全航点的图标尺寸
  const safePointSize = {
    iconWidth: 23,
    iconHeight: 26,
  };
  // 定义通用的航点样式
  const commonStyle = {
    // 根据航点是否安全选择对应的图标尺寸
    ...(point.isSafe ? safePointSize : normalPointSize),
    // 禁用深度测试距离
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    textSize: 14,
    textFontWeight: "bold",
  };
  // 根据航点的索引进行不同的样式处理
  switch (index) {
    // 起始航点
    case 0:
      return {
        // 起始航点文本标识为 "S"
        text: "S",
        ...commonStyle,
        // 获取起始航点的特定样式
        ...getStartPointStyle(index, point),
      };
    // 结束航点
    case length - 1:
      return {
        // 结束航点文本标识为 "E"
        text: "E",
        ...commonStyle,
        // 获取结束航点的特定样式
        ...getEndPointStyle(index, point),
      };
    // 中间航点
    default:
      return {
        // 中间航点文本标识为索引加 1
        text: `${index + 1}`,
        ...commonStyle,
        // 获取中间航点的特定样式
        ...getTurnPointStyle(index, point),
      };
  }
}

/**
 * 获取起始航点的样式配置
 * @param index - 航点在编辑航点列表中的索引
 * @param point - 航点的详细信息，包含是否安全等属性
 * @returns 包含起始航点样式信息的配置对象
 */
function getStartPointStyle(index: number, point: LinePointAction) {
  // 从主题配置中解构出安全起始航点和普通起始航点的样式
  const { safeStartPoint: safeStartPointStyle, startPoint: startPointStyle } =
    wayPointProps.theme!;
  // 根据航点是否安全选择对应的样式
  const style = point.isSafe ? safeStartPointStyle : startPointStyle;
  // 根据航点是否安全选择对应的图标
  const icon = point.isSafe ? startSafePoint.value : startPoint.value;
  // 调用通用样式获取函数获取最终样式
  return getCommonPointStyle(index, style, icon);
}

/**
 * 获取结束航点的样式配置
 * @param index - 航点在编辑航点列表中的索引
 * @param point - 航点的详细信息，包含是否安全等属性
 * @returns 包含结束航点样式信息的配置对象
 */
function getEndPointStyle(index: number, point: LinePointAction) {
  // 从主题配置中解构出安全结束航点和普通结束航点的样式
  const { safeEndPoint: safeEndPointStyle, endPoint: endPointStyle } =
    wayPointProps.theme!;
  // 根据航点是否安全选择对应的样式
  const style = point.isSafe ? safeEndPointStyle : endPointStyle;
  // 根据航点是否安全选择对应的图标
  const icon = point.isSafe ? endSafePoint.value : endPoint.value;
  // 调用通用样式获取函数获取最终样式
  return getCommonPointStyle(index, style, icon);
}

/**
 * 获取中间航点的样式配置
 * @param index - 航点在编辑航点列表中的索引
 * @param point - 航点的详细信息，包含是否安全等属性
 * @returns 包含中间航点样式信息的配置对象
 */
function getTurnPointStyle(index: number, point: LinePointAction) {
  // 从主题配置中解构出安全中间航点和普通中间航点的样式
  const { safeTurnPoint: safeTurnPointStyle, turnPoint: turnPointStyle } =
    wayPointProps.theme!;
  // 根据航点是否安全选择对应的样式
  const style = point.isSafe ? safeTurnPointStyle : turnPointStyle;
  // 根据航点是否安全选择对应的图标
  const icon = point.isSafe ? turnSafePoint.value : turnPoint.value;
  // 调用通用样式获取函数获取最终样式
  return getCommonPointStyle(index, style, icon);
}

/**
 * 获取通用的航点样式配置
 * @param index - 航点在编辑航点列表中的索引
 * @param style - 航点的主题样式配置
 * @param icon - 包含航点不同状态（悬停、选中、正常）图标的对象
 * @returns 包含航点最终样式信息的配置对象
 */
function getCommonPointStyle(
  index: number,
  style: RouteEditStyle<RoutePointStyle>,
  icon: {
    hover: string;
    select: string;
    normal: string;
  },
) {
  // 若当前航点为选中状态
  if (
    (selectInfo.value.type === RoutePointType.FOOT ||
      selectInfo.value.type === RoutePointType.TURN) &&
    index === selectInfo.value.index
  ) {
    return {
      // 设置选中状态的文本颜色
      textColor: style.select.textColor,
      // 设置选中状态的图标
      iconSrc: icon.select,
    };
  }
  // 若当前航点为鼠标悬停状态
  if (
    dataInfo.hover.index === index &&
    dataInfo.hover.type === RoutePointType.TURN
  ) {
    return {
      // 设置悬停状态的文本颜色
      textColor: style.hover.textColor,
      // 设置悬停状态的图标
      iconSrc: icon.hover,
    };
  }
  // 若航点既未选中也未悬停，返回正常状态的样式
  return {
    // 设置正常状态的文本颜色
    textColor: style.normal.textColor,
    // 设置正常状态的图标
    iconSrc: icon.normal,
  };
}
</script>
