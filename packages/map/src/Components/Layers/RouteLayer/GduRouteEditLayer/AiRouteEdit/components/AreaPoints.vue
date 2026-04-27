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
  <gdu-point
    v-if="centerPoint"
    :name="routeAreaEditProps.layerId!"
    clamp-to-ground
    :disable-depth-test-distance="Number.POSITIVE_INFINITY"
    v-bind="centerPoint"
  />
  <gdu-line-string
    v-if="props.areaLine.length === 2"
    :coordinates="props.areaLine"
    :stroke-width="polygonStyle.strokeWidth"
    :stroke-color="polygonStyle.strokeColor"
    clamp-to-ground
  />
  <gdu-polygon
    v-else-if="!isEmpty(areaLineToPolygon)"
    clamp-to-ground
    :coordinates="areaLineToPolygon"
    :name="routeAreaEditProps.layerId!"
    v-bind="polygonStyle"
  />
  <insert-points
    v-if="
      props.parentsIdx !== selectInfo.parentsIdx ||
      dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING
    "
    :parents-idx="props.parentsIdx"
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
import {
  getGroundPolygonCenter,
  LineStringCoordinates,
  MapThemeColor,
  RouteEditDrawStatus,
  RoutePointType,
} from "@gdu-gl/common";
import { GduLineString, GduPoint, GduPolygon } from "@map/Components";
import { isEmpty } from "lodash-es";
import { computed } from "vue";
import { deletePopupOffset } from "@map/Constants";
import DeletePopup from "@map/Components/Common/DeletePopup.vue";
import { useAreaPointEvent } from "../hooks/useAreaPointEvent";
import InsertPoints from "../../common/components/InsertPoints.vue";
import { useInjectAiAreaEditProps } from "../hooks/useInjectAreaEditProps";
import { useRouteEditIcons } from "../../common/hooks/useRouteEditIcons";

const props = defineProps<{
  parentsIdx: number;
  areaLine: LineStringCoordinates;
}>();

// 从注入的钩子中获取航线编辑相关属性和状态
const {
  routeAreaEditProps,
  routeAreaEditEmits,
  dataInfo,
  selectInfo,
  isPolygonSelfIntersecting,
  isPolygonIntersect,
} = useInjectAiAreaEditProps();

// 从图标钩子中获取垂足点和结束点图标
const { footPoint, finishPointIcon } = useRouteEditIcons(routeAreaEditProps);

const {
  clickAreaPoint,
  modifyStartAreaPoint,
  modifyingAreaPoint,
  modifyEndAreaPoint,
  insertAreaPoint,
  deleteAreaPoint,
  linePoints,
  transformLineToPolygon,
} = useAreaPointEvent(
  routeAreaEditProps,
  routeAreaEditEmits,
  props,
  dataInfo,
  selectInfo,
  isPolygonSelfIntersecting,
  isPolygonIntersect,
);

/**
 * 计算属性，将编辑中的面线数据转换为多边形数据。
 * 多边形要求至少有三个点才能形成封闭图形，若点数不足则返回空数组。
 * 若点数足够，会将面线的第一个点添加到末尾，从而形成封闭的多边形。
 * @returns 转换后的多边形数据，格式为二维数组，若不满足条件则返回空数组。
 */
const areaLineToPolygon = computed(() => {
  return transformLineToPolygon(props.areaLine);
});

const centerPoint = computed(() => {
  if (isEmpty(areaLineToPolygon.value)) {
    return null;
  }
  const center = getGroundPolygonCenter(areaLineToPolygon.value);
  const visible = !(
    dataInfo.drawStatus === RouteEditDrawStatus.DRAWING &&
    props.parentsIdx === selectInfo.value.parentsIdx
  );
  return {
    visible,
    coordinates: center,
    shapeSize: 24,
    shapeOutlineColor: "#ffffff",
    shapeFillColor: MapThemeColor.warning[500],
    textColor: "#ffffff",
    text: `${props.parentsIdx + 1}`,
    shapeOutlineWidth: 2,
    featureProperties: {
      type: RoutePointType.AREA,
      index: -1,
      parentsIdx: props.parentsIdx,
    },
  };
});

const linePointsBindProperties = computed(() => {
  return linePoints.value.map((point, index) => {
    return {
      coordinates: point,
      footProperties: {
        type: RoutePointType.FOOT,
        index,
        parentsIdx: props.parentsIdx,
      },
      footDeleteProperties: {
        type: RoutePointType.FOOT_DELETE,
        index,
        parentsIdx: props.parentsIdx,
      },
    };
  });
});

const polygonStyle = computed(() => {
  const { normal, error } = routeAreaEditProps.theme!.area;
  const featureProperties = {
    type: RoutePointType.AREA,
    index: -1,
    parentsIdx: props.parentsIdx,
  };
  /**
   * 若多边形自相交或与其他多边形相交，且当前选中的父索引与当前父索引匹配，返回错误样式。
   */
  if (
    (isPolygonSelfIntersecting.value || isPolygonIntersect.value) &&
    selectInfo.value.parentsIdx === props.parentsIdx
  ) {
    return {
      ...error,
      strokeWidth: 3,
      featureProperties,
    };
  }

  /**
   * 若当前选中的父索引与当前父索引匹配，且当前绘制状态为绘制中，返回正常样式(不带带边线)。
   */
  if (
    dataInfo.drawStatus === RouteEditDrawStatus.DRAWING &&
    selectInfo.value.parentsIdx === props.parentsIdx
  ) {
    return {
      ...normal,
      strokeWidth: 3,
      featureProperties,
    };
  }

  /**
   * 若当前选中的父索引与当前父索引匹配，且不再绘制中，返回选中样式(带边线)。
   */
  if (selectInfo.value.parentsIdx === props.parentsIdx) {
    return {
      ...normal,
      strokeWidth: 5,
      strokeOutlineWidth: 1,
      strokeOutlineColor: "#ffffff",
      featureProperties,
    };
  }

  /**
   * 若当前悬停的父索引与当前父索引匹配，且不再绘制中，返回悬停样式(带边线)。
   */
  if (dataInfo.hover.parentsIdx === props.parentsIdx) {
    return {
      ...normal,
      strokeWidth: 5,
      strokeColor: MapThemeColor.warning[400],
      strokeOutlineWidth: 1,
      strokeOutlineColor: "#ffffff",
      featureProperties,
    };
  }
  /**
   * 若当前悬停的父索引与当前父索引不匹配，返回正常样式(不带边线)。
   */
  return {
    ...normal,
    strokeWidth: 3,
    featureProperties,
  };
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
  if (selectInfo.value.parentsIdx !== props.parentsIdx) {
    return normal;
  }
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
  if (selectInfo.value.parentsIdx !== props.parentsIdx) {
    return false;
  }
  let visible;
  switch (dataInfo.drawStatus) {
    case RouteEditDrawStatus.DRAWING:
      visible = index === props.areaLine.length - 2;
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
    selectInfo.value.parentsIdx === props.parentsIdx &&
    selectInfo.value.type === RoutePointType.FOOT &&
    selectInfo.value.index === index
  ) {
    return select;
  }
  if (
    dataInfo.hover.parentsIdx === props.parentsIdx &&
    dataInfo.hover.type === RoutePointType.FOOT &&
    dataInfo.hover.index === index
  ) {
    return hover;
  }
  return normal;
}
</script>
