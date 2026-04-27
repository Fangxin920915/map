<template>
  <template
    v-for="(
      { line, featureProperties }, index
    ) in footPointsByTurns.indicatorLines"
    :key="index"
  >
    <GduLineString
      v-bind="getLineStyle(index)"
      :coordinates="line"
      :stroke-width="1"
      :line-dash="lineDash"
    />
    <GduPoint
      :coordinates="line[1]"
      :visible="!wayPointProps.clampToGround"
      v-bind="getIcon(index)"
      :name="wayPointProps.layerId"
      :icon-height="16"
      :icon-width="17"
      clamp-to-ground
      :enable-modify="wayPointProps.active"
      modify-type="ground"
      :feature-properties="featureProperties"
      @modify-start="modifyStartWayPoint(index, RoutePointType.FOOT)"
      @modifying="modifyingWayPoint(index, $event)"
      @modify-end="modifyEndWayPoint(index)"
      @click="clickWayPoint(index)"
    />
  </template>
  <template v-for="(projectionLine, index) in groupWayPointList" :key="index">
    <GduLineString
      v-if="!isEmpty(projectionLine) && projectionLine.length > 1"
      :coordinates="projectionLine"
      :stroke-color="wayPointProps.theme!.projectionLine.fillColor"
      :stroke-width="2"
      clamp-to-ground
    />
  </template>
  <insert-points
    :line="footPointsByTurns.projectionLine"
    :visible-arr="footPointsByTurns.insertPoints"
    :select="selectInfo"
    :hover="dataInfo.hover"
    :theme="wayPointProps.theme"
    :layer-id="wayPointProps.layerId!"
    :view-id="wayPointProps.viewId!"
    @click="insertWayPoint"
  />
</template>

<script setup lang="ts">
import { GduLineString, GduPoint } from "@map/Components";
import { LineStringCoordinates, RoutePointType } from "@gdu-gl/common";
import { computed } from "vue";
import { isEmpty } from "lodash-es";
import InsertPoints from "../../common/components/InsertPoints.vue";
import { useWayPointEvent } from "../hooks/useWayPointEvent";
import { useRouteEditIcons } from "../../common/hooks/useRouteEditIcons";
import { useInjectWayPointProps } from "../hooks/useInjectWayPointProps";

/**
 * 从 useInjectAreaEditProps 钩子中获取航线编辑相关属性和状态
 * editTurnPointList: 编辑的航点列表
 * wayPointProps: 航线编辑的属性
 * wayPointEmits: 航线编辑的事件发射器
 * selectTurnIdx: 选中的航点索引
 * hoverId: 鼠标悬停的元素 ID
 * modifyLine: 编辑中的航线数据
 */
const {
  editTurnPointList,
  wayPointEmits,
  wayPointProps,
  dataInfo,
  selectInfo,
  groupWayPointList,
} = useInjectWayPointProps();

/**
 * 从 useWayPointEvent 钩子中获取航点编辑事件处理函数
 * modifyingWayPoint: 航点编辑中事件处理函数
 * modifyEndWayPoint: 航点编辑结束事件处理函数
 * modifyStartWayPoint: 航点编辑开始事件处理函数
 */
const {
  modifyingWayPoint,
  modifyEndWayPoint,
  modifyStartWayPoint,
  clickWayPoint,
  insertWayPoint,
} = useWayPointEvent(wayPointProps, wayPointEmits, dataInfo, selectInfo);

/**
 * 定义线的虚线样式
 */
const lineDash = [10, 3];

/**
 * 从 useRouteEditIcons 钩子中获取垂足点图标
 */
const { footPoint } = useRouteEditIcons(wayPointProps);

/**
 * 监听编辑的航点列表变化
 * 当航点列表为空时，清空指示线、投影线和插入点
 * 否则，根据航点列表计算指示线、投影线和插入点
 */
const footPointsByTurns = computed<{
  indicatorLines: Array<{
    line: LineStringCoordinates;
    featureProperties: any;
  }>;
  projectionLine: LineStringCoordinates;
  insertPoints: Array<boolean>;
}>(() => {
  // 若编辑的航点列表为空，清空指示线
  if (isEmpty(editTurnPointList.value)) {
    return {
      indicatorLines: [],
      projectionLine: [],
      insertPoints: [],
    };
  }
  // 临时数组，用于存储计算后的指示线
  const arr: Array<{
    line: LineStringCoordinates;
    featureProperties: any;
  }> = [];
  // 临时数组，用于存储投影线
  const line = [] as LineStringCoordinates;
  // 临时数组，用于存储插入点
  const inserts: Array<boolean> = [];
  // 遍历编辑的航点列表
  for (let i = 0; i < editTurnPointList.value.length; i++) {
    // 获取当前航点的坐标
    const { coordinates, surroundPoint } = editTurnPointList.value[i];
    const [lon, lat] = coordinates;
    // 将当前航点坐标添加到投影线数组
    line.push(coordinates);
    // 生成指示线并添加到指示线数组
    arr.push({
      line: [coordinates, [lon, lat]],
      featureProperties: {
        type: RoutePointType.FOOT,
        index: i,
      },
    });

    // 若不是最后一个航点，计算相邻航点的中点作为插入点
    if (i <= editTurnPointList.value.length - 2) {
      inserts.push(!surroundPoint?.coordinates);
    }
  }
  return {
    indicatorLines: arr,
    projectionLine: line,
    insertPoints: inserts,
  };
});

/**
 * 根据索引获取线的样式
 * @param index - 线的索引
 * @returns 线的样式对象
 */
function getLineStyle(index: number) {
  // 从主题中获取选中和正常状态下的辅助线样式
  const { select, normal } = wayPointProps.theme!.helperLine;
  // 若当前索引为选中的航点索引，返回选中状态的样式
  if (index === selectInfo.value.index) {
    return {
      strokeColor: select.fillColor,
    };
  }
  // 否则返回正常状态的样式
  return {
    strokeColor: normal.fillColor,
  };
}

/**
 * 根据索引获取垂足点的图标
 * @param index - 垂足点的索引
 * @returns 包含图标名称和图标的对象
 */
function getIcon(index: number) {
  // 生成垂足点的名称
  // 若当前索引为选中的航点索引，返回选中状态的图标
  if (
    (selectInfo.value.type === RoutePointType.FOOT ||
      selectInfo.value.type === RoutePointType.TURN) &&
    index === selectInfo.value.index
  ) {
    return {
      iconSrc: footPoint.value.select,
    };
  }
  // 若当前名称为鼠标悬停的元素 ID，返回悬停状态的图标
  if (
    dataInfo.hover.type === RoutePointType.FOOT &&
    index === dataInfo.hover.index
  ) {
    return {
      iconSrc: footPoint.value.hover,
    };
  }
  // 否则返回正常状态的图标
  return {
    iconSrc: footPoint.value.normal,
  };
}
</script>
