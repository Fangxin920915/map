<template>
  <template v-for="(point, index) in props.routeLine" :key="index">
    <GduPoint
      v-if="[0, props.routeLine.length - 1].includes(index)"
      v-bind="getIcon(point, index)"
      :name="routeAreaEditProps.layerId"
      :coordinates="point.coordinates"
    />
  </template>

  <gdu-arrow-line-string
    v-if="!isEmpty(line) && line.length > 1"
    v-bind="routeAreaEditProps.theme?.line"
    :coordinates="line"
    :stroke-width="6"
    :stroke-outline-width="0"
  />
</template>

<script setup lang="ts">
import { GduPoint, GduArrowLineString } from "@map/Components";
import { LinePointAction, optimizePolylineTurningPoints } from "@gdu-gl/common";
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import { useInjectAreaEditCommonProps } from "../hooks/useInjectAreaEditCommonProps";
import { useRouteEditIcons } from "../hooks/useRouteEditIcons";

const props = defineProps<{ routeLine: LinePointAction[] }>();

const { routeAreaEditProps } = useInjectAreaEditCommonProps();

const {
  startSafePoint,
  endSafePoint,
  turnSafePoint,
  startPoint,
  endPoint,
  turnPoint,
} = useRouteEditIcons(routeAreaEditProps);

/**
 * 计算属性，将正在编辑的航点列表转换为包含所有航点坐标的数组
 * 该数组可用于绘制航线线段，因为 gdu-arrow-line-string 组件需要坐标数组作为输入
 * @returns 包含所有航点坐标的数组
 */
const line = computed(() => {
  // 使用 map 方法遍历 editTurnPointList 中的每个航点，提取其坐标并组成新数组
  return optimizePolylineTurningPoints(
    props.routeLine.map((item) => item.coordinates),
  ).line;
});

/**
 * 根据航点信息和索引获取航点的图标及样式配置
 * @param point - 航点的详细信息，包含是否安全等属性
 * @param index - 航点在编辑航点列表中的索引
 * @returns 包含航点图标、文本、样式等信息的配置对象
 */
function getIcon(point: LinePointAction, index: number) {
  // 获取编辑航点列表的长度
  const { length } = props.routeLine;
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
        ...getStartPointStyle(point),
      };
    // 结束航点
    case length - 1:
      return {
        // 结束航点文本标识为 "E"
        text: "E",
        ...commonStyle,
        // 获取结束航点的特定样式
        ...getEndPointStyle(point),
      };
    // 中间航点
    default:
      return {
        // 中间航点文本标识为索引加 1
        text: `${index + 1}`,
        ...commonStyle,
        // 获取中间航点的特定样式
        ...getTurnPointStyle(point),
      };
  }
}

/**
 * 获取起始航点的样式配置
 * @param point - 航点的详细信息，包含是否安全等属性
 * @returns 包含起始航点样式信息的配置对象
 */
function getStartPointStyle(point: LinePointAction) {
  // 从主题配置中解构出安全起始航点和普通起始航点的样式
  const { safeStartPoint: safeStartPointStyle, startPoint: startPointStyle } =
    routeAreaEditProps.theme!;
  // 根据航点是否安全选择对应的样式
  const style = point.isSafe ? safeStartPointStyle : startPointStyle;
  // 根据航点是否安全选择对应的图标
  const icon = point.isSafe ? startSafePoint.value : startPoint.value;
  // 调用通用样式获取函数获取最终样式
  return {
    // 设置正常状态的文本颜色
    textColor: style.normal.textColor,
    // 设置正常状态的图标
    iconSrc: icon.normal,
  };
}

/**
 * 获取结束航点的样式配置
 * @param point - 航点的详细信息，包含是否安全等属性
 * @returns 包含结束航点样式信息的配置对象
 */
function getEndPointStyle(point: LinePointAction) {
  // 从主题配置中解构出安全结束航点和普通结束航点的样式
  const { safeEndPoint: safeEndPointStyle, endPoint: endPointStyle } =
    routeAreaEditProps.theme!;
  // 根据航点是否安全选择对应的样式
  const style = point.isSafe ? safeEndPointStyle : endPointStyle;
  // 根据航点是否安全选择对应的图标
  const icon = point.isSafe ? endSafePoint.value : endPoint.value;
  // 调用通用样式获取函数获取最终样式
  return {
    // 设置正常状态的文本颜色
    textColor: style.normal.textColor,
    // 设置正常状态的图标
    iconSrc: icon.normal,
  };
}

/**
 * 获取中间航点的样式配置
 * @param point - 航点的详细信息，包含是否安全等属性
 * @returns 包含中间航点样式信息的配置对象
 */
function getTurnPointStyle(point: LinePointAction) {
  // 从主题配置中解构出安全中间航点和普通中间航点的样式
  const { safeTurnPoint: safeTurnPointStyle, turnPoint: turnPointStyle } =
    routeAreaEditProps.theme!;
  // 根据航点是否安全选择对应的样式
  const style = point.isSafe ? safeTurnPointStyle : turnPointStyle;
  // 根据航点是否安全选择对应的图标
  const icon = point.isSafe ? turnSafePoint.value : turnPoint.value;
  // 调用通用样式获取函数获取最终样式
  return {
    // 设置正常状态的文本颜色
    textColor: style.normal.textColor,
    // 设置正常状态的图标
    iconSrc: icon.normal,
  };
}
</script>
