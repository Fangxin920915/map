<template>
  <template
    v-for="({ coordinates, footProperties }, index) in linePointsBindProperties"
    :key="index"
  >
    <gdu-point
      :coordinates="coordinates"
      :icon-height="16"
      :icon-width="17"
      :icon-src="getIcon(index)"
      :name="routeAreaEditProps.layerId!"
      :feature-properties="footProperties"
      clamp-to-ground
      :disable-depth-test-distance="Number.POSITIVE_INFINITY"
      :enable-modify="
        routeAreaEditProps.active &&
        dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING
      "
      modify-type="ground"
      @click="clickAreaPoint(index)"
      @modify-start="modifyStartAreaPoint(index)"
      @modifying="modifyingAreaPoint(index, $event)"
      @modify-end="modifyEndAreaPoint(index)"
    />
    <delete-popup
      :view-id="routeAreaEditProps.viewId"
      :coordinates="coordinates"
      clamp-to-ground
      :visible="getDeletePointVisible(index)"
      :offset="deletePopupOffset"
      :message="routeAreaEditProps.message"
      @click="deleteAreaPoint(index)"
    />
  </template>
  <gdu-line-string
    v-if="dataInfo.modifyAreaLine.length === 2"
    :coordinates="dataInfo.modifyAreaLine"
    :stroke-width="3"
    :stroke-color="routeAreaEditProps.theme!.area.normal.strokeColor"
    clamp-to-ground
  />
  <gdu-polygon
    v-else-if="!isEmpty(areaLineToPolygon)"
    clamp-to-ground
    :coordinates="areaLineToPolygon"
    :stroke-width="3"
    v-bind="polygonStyle"
  />
  <insert-points
    v-if="dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING"
    :line="areaLineToPolygon[0] ?? []"
    :select="selectInfo"
    :hover="dataInfo.hover"
    :theme="routeAreaEditProps.theme"
    :layer-id="routeAreaEditProps.layerId!"
    :view-id="routeAreaEditProps.viewId!"
    @click="insertAreaPoint"
  />
</template>

<script setup lang="ts">
import { RouteEditDrawStatus, RoutePointType } from "@gdu-gl/common";
import { GduLineString, GduPoint, GduPolygon } from "@map/Components";
import { isEmpty } from "lodash-es";
import { computed } from "vue";
import { deletePopupOffset } from "@map/Constants";
import InsertPoints from "../../common/components/InsertPoints.vue";
import { useAreaPointEvent } from "../hooks/useAreaPointEvent";
import { useInjectAreaEditProps } from "../hooks/useInjectAreaEditProps";
import { useRouteEditIcons } from "../../common/hooks/useRouteEditIcons";
import DeletePopup from "../../../../../Common/DeletePopup.vue";

// 从注入的钩子中获取航线编辑相关属性和状态
const {
  routeAreaEditProps,
  routeAreaEditEmits,
  dataInfo,
  selectInfo,
  isPolygonSelfIntersecting,
} = useInjectAreaEditProps();

// 从图标钩子中获取垂足点和结束点图标
const { footPoint, finishPointIcon } = useRouteEditIcons(routeAreaEditProps);

// 从区域点事件钩子中获取区域点相关处理函数和计算属性
const {
  areaLineToPolygon,
  modifyStartAreaPoint,
  modifyingAreaPoint,
  modifyEndAreaPoint,
  linePoints,
  deleteAreaPoint,
  clickAreaPoint,
  insertAreaPoint,
} = useAreaPointEvent(
  routeAreaEditProps,
  routeAreaEditEmits,
  dataInfo,
  selectInfo,
  isPolygonSelfIntersecting,
);

const linePointsBindProperties = computed(() => {
  return linePoints.value.map((point, index) => {
    return {
      coordinates: point,
      footProperties: {
        type: RoutePointType.FOOT,
        index,
      },
      footDeleteProperties: {
        type: RoutePointType.FOOT_DELETE,
        index,
      },
    };
  });
});

const polygonStyle = computed(() => {
  const { normal, error } = routeAreaEditProps.theme!.area;
  return isPolygonSelfIntersecting.value ? error : normal;
});

/**
 * 根据索引获取点的图标
 * @param index - 点的索引
 * @returns 包含图标名称和图标的对象
 */
function getIcon(index: number) {
  // 生成点的名称
  // 若处于绘制状态，调用获取绘制状态图标的函数
  if (dataInfo.drawStatus === RouteEditDrawStatus.DRAWING) {
    return getDrawingIcon(index);
  }
  // 若处于绘制结束状态，调用获取绘制结束状态图标的函数
  return getDrawEndIcon(index);
}

/**
 * 获取绘制状态下点的图标
 * @param index - 点的索引
 * @returns 包含图标名称和图标的对象
 */
function getDrawingIcon(index: number) {
  // 获取正常状态下的垂足点图标
  const { normal, select } = footPoint.value;
  if (
    dataInfo.drawStatus === RouteEditDrawStatus.DRAWING &&
    linePoints.value.length <= 2 &&
    index === linePoints.value.length - 1
  ) {
    return select;
  }
  // 若编辑面线数组长度大于 2 且点击的是最后一个点，返回结束点图标
  if (linePoints.value.length > 2 && index === linePoints.value.length - 1) {
    return finishPointIcon.value;
  }
  // 否则返回正常状态的图标
  return normal;
}

function getDeletePointVisible(index: number) {
  let visible;
  switch (dataInfo.drawStatus) {
    case RouteEditDrawStatus.DRAWING:
      visible = index === dataInfo.modifyAreaLine.length - 2;
      break;
    default:
      visible =
        selectInfo.value.type === RoutePointType.FOOT &&
        selectInfo.value.index === index;
      break;
  }
  return !!visible;
}

/**
 * 获取绘制结束状态下点的图标
 * @param index - 点的下标
 * @returns 包含图标名称和图标的对象
 */
function getDrawEndIcon(index: number) {
  // 获取悬停、正常和选中状态下的垂足点图标
  const { hover, normal, select } = footPoint.value;
  if (
    selectInfo.value.type === RoutePointType.FOOT &&
    selectInfo.value.index === index
  ) {
    return select;
  }
  if (
    dataInfo.hover.type === RoutePointType.FOOT &&
    dataInfo.hover.index === index
  ) {
    return hover;
  }
  return normal;
}
</script>
