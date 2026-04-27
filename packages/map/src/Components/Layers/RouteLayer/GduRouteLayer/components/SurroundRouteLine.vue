<template>
  <!-- 当前点生成的环绕线 -->
  <template v-if="!isEmpty(arcLine) && arcLine.length > 1">
    <!-- 带箭头的环绕线，显示飞行方向 -->
    <gdu-arrow-line-string
      v-bind="routeProps.theme?.line"
      :coordinates="arcLine"
      :stroke-width="6"
      :stroke-outline-width="0"
      :progress="circleProgress"
    />
    <!-- 环绕线的投影线，用于在地面上显示 -->
    <GduLineString
      :coordinates="arcLine"
      :stroke-color="routeProps.theme!.projectionLine.fillColor"
      :stroke-width="2"
      clamp-to-ground
    />
  </template>
  <!-- 环绕线与下一个点的连接线 -->
  <template v-if="!isEmpty(concatLine) && concatLine.length > 1">
    <!-- 带箭头的连接线，显示飞行方向 -->
    <gdu-arrow-line-string
      v-bind="routeProps.theme?.line"
      :coordinates="concatLine"
      :stroke-width="6"
      :stroke-outline-width="0"
      :progress="concatLineProgress"
    />
    <!-- 连接线的投影线，用于在地面上显示 -->
    <GduLineString
      :coordinates="concatLine"
      :stroke-color="routeProps.theme!.projectionLine.fillColor"
      :stroke-width="2"
      clamp-to-ground
    />
  </template>
  <!-- 中心点到地面的辅助线 -->
  <GduLineString
    v-if="!isEmpty(vectorHelperLine.circle)"
    :stroke-color="routeProps.theme!.helperLine.fillColor"
    :coordinates="vectorHelperLine.circle"
    :stroke-width="1"
    :line-dash="lineDash"
  />
  <!-- 环绕线与连接线交点的垂直辅助线 -->
  <GduLineString
    v-if="vectorHelperLine.arc && !isEmpty(vectorHelperLine.arc)"
    :stroke-color="routeProps.theme!.helperLine.fillColor"
    :coordinates="vectorHelperLine.arc"
    :stroke-width="1"
    :line-dash="lineDash"
  />
  <!-- 环绕中心点标记 -->
  <gdu-point
    :coordinates="circleCenter"
    :icon-width="30"
    :icon-height="30"
    :icon-src="drawCenter"
  />
  <!-- 环绕圈数显示弹窗 -->
  <gdu-popup
    v-if="repeatCount"
    :view-id="routeProps.viewId"
    :coordinates="circleCenter"
    :position="PopupPosition.BOTTOM_CENTER"
    :offset="popupOffset"
  >
    <div class="gdu-edit-popup-container">
      <span class="edit-turn-point-tip">
        {{
          `${repeatCount.currentCount}/${props.repeat}${routeProps.message?.repeatCountStr ?? ""}`
        }}
      </span>
    </div>
  </gdu-popup>
</template>

<script setup lang="ts">
import {
  AltitudeMode,
  createArcFromPoints,
  getHeightByMode,
  isValidCoordinates,
  isValidLineString,
  LineStringCoordinates,
  PointCoordinates,
  PopupPosition,
  SurroundPointList,
} from "@gdu-gl/common";
import { computed } from "vue";
import { isEmpty, isNil } from "lodash-es";
import {
  GduArrowLineString,
  GduLineString,
  GduPoint,
  GduPopup,
  useInjectRouteProps,
} from "@map/Components";
import drawCenter from "@map/Assets/drag-surround-center.png";
import {
  mapViewInternal,
  getSurroundRouteLineProgress,
  getRouteLineProgress,
} from "@gdu-gl/core";

// 定义组件属性
const props = defineProps<{
  /**
   * ### 功能描述
   * 环绕线所属的父线索引
   */
  parentsIndex: number;
  /**
   * ### 功能描述
   * 环绕线索引
   */
  idx: number;
  /**
   * ### 功能描述
   * 环绕线起始坐标
   */
  startCoordinates: PointCoordinates;
  /**
   * ### 功能描述
   * 环绕线结束坐标
   */
  endCoordinates?: PointCoordinates | null;
  /**
   * ### 功能描述
   * 中心坐标
   */
  coordinates: PointCoordinates;
  /**
   * ### 功能描述
   * 是否启用逆时针时针
   */
  enableCounterclockwise: boolean;
  /**
   * ### 功能描述
   * 环绕角度,单位为度
   */
  angle: number;
  /**
   * ### 功能描述
   * 兴趣点相对于起飞点的高度
   */
  height: number;
  /**
   * ### 功能描述
   * 起飞点坐标。
   */
  takeoffPoint?: PointCoordinates | null;
  /**
   * ### 功能描述
   * 高度模式；
   * **AltitudeMode.Elevation** 海拔高度；
   * **AltitudeMode.Relative** 相对高度；
   */
  altitudeMode: AltitudeMode;
  /**
   * ### 功能描述
   * 环绕线重复次数
   */
  repeat: number;
  /**
   * ### 功能描述
   * 拍照角度步长
   */
  stepAngle: number;
  /**
   * ### 功能描述
   * 环绕点列表，每个环绕点包含坐标、高度、heading、pitch角度
   */
  surroundPointList?: SurroundPointList[] | null;
}>();

// 虚线样式数组，定义虚线的线段长度和间隔，[实线长度, 间隔长度]
const lineDash = [10, 5];

// 弹窗偏移量，用于调整弹窗位置
const popupOffset = [0, -15];

// 注入路由属性
const { routeProps } = useInjectRouteProps();

// 获取地图视图实例
const viewer = mapViewInternal.getViewer(routeProps.viewId as string);

/**
 * ### 功能描述
 * 计算环绕中心点的坐标（考虑高度模式）
 */
const circleCenter = computed(() => {
  // 根据高度模式计算中心点的坐标和高度
  const { coordinates } = getHeightByMode({
    mode: props.altitudeMode,
    takeoffPoint: props.takeoffPoint,
    height: props.height,
    coordinates: props.coordinates,
  });
  return coordinates;
});

/**
 * ### 功能描述
 * 环绕线
 */
const arcLine = computed(() => {
  // 根据起始点、中心点、角度和方向生成环绕线
  return createArcFromPoints(
    props.startCoordinates as number[],
    circleCenter.value as number[],
    props.angle,
    props.enableCounterclockwise,
  );
});

/**
 * ### 功能描述
 * 辅助线，包括中心点到地面的垂线和环绕线终点的垂直线
 */
const vectorHelperLine = computed(() => {
  const [centerLon, centerLat] = circleCenter.value;
  // 中心点到地面的垂线
  const circle = [
    circleCenter.value,
    [centerLon, centerLat],
  ] as LineStringCoordinates;

  // 如果环绕线点数不足或角度大于等于360度，只返回中心点到地面的垂线
  if (arcLine.value.length < 2 || props.angle >= 360) {
    return {
      circle,
      arc: [] as LineStringCoordinates,
    };
  }

  // 环绕线终点的垂直线
  const lastPoint = arcLine.value[arcLine.value.length - 1];
  const [lastLon, lastLat] = lastPoint;
  return {
    circle,
    arc: [lastPoint, [lastLon, lastLat]] as LineStringCoordinates,
  };
});

/**
 * ### 功能描述
 * 环绕线与下一个点的连接线
 */
const concatLine = computed(() => {
  // 如果没有结束坐标或环绕线点数不足，返回空数组
  if (
    isEmpty(props.endCoordinates) ||
    isNil(props.endCoordinates) ||
    arcLine.value.length < 2
  ) {
    return [];
  }
  // 获取环绕线的最后一个点，与结束坐标连接
  const lastPoint = arcLine.value[arcLine.value.length - 1];
  return [lastPoint, props.endCoordinates];
});

/**
 * ### 功能描述
 * 计算环绕线和连接线的索引范围
 *
 * 该计算属性用于确定环绕线和连接线在整个航线中的索引范围，
 * 以便后续计算进度时使用。
 */
const flyToIndexRange = computed(() => {
  let flyToIndex = 0; // 飞行索引
  let surroundStartIndex = 0; // 环绕线起始索引
  let surroundEndIndex = 0; // 环绕线结束索引

  // 遍历当前点之前的所有点，计算索引范围
  for (let i = 0; i <= props.idx; i++) {
    const currentPoint = routeProps.lines![props.parentsIndex][i];
    flyToIndex++;
    // 如果当前点是环绕点，计算环绕线的索引范围
    if (
      currentPoint.surroundPoint &&
      currentPoint.surroundPoint.pointList.length > 0
    ) {
      surroundStartIndex = flyToIndex + 1;
      flyToIndex += currentPoint.surroundPoint.pointList.length;
      surroundEndIndex = flyToIndex;
    }
  }

  // 环绕线索引范围
  let surroundRange = null;
  // 连接线索引范围
  let concatRange = null;
  // 如果环绕线的索引范围有效
  if (
    surroundStartIndex > 0 &&
    surroundEndIndex > 0 &&
    surroundStartIndex < surroundEndIndex
  ) {
    surroundRange = [surroundStartIndex, surroundEndIndex];
    // 如果有结束坐标，计算连接线的索引范围
    if (props.endCoordinates) {
      concatRange = [surroundEndIndex, surroundEndIndex + 1];
    }
  }
  return {
    surroundRange,
    concatRange,
  };
});

/**
 * ### 功能描述
 * 计算当前环绕的圈数
 *
 * 该计算属性用于显示当前飞行的环绕圈数，
 * 当环绕重复次数大于1时使用。
 */
const repeatCount = computed(() => {
  const { surroundRange } = flyToIndexRange.value;
  const flyToPointIndex = routeProps.flyToPointIndex ?? 0;

  // 如果飞行索引有效、环绕范围有效、重复次数大于1且环绕点列表非空
  if (
    flyToPointIndex &&
    surroundRange &&
    props.repeat &&
    props.repeat > 1 &&
    props.surroundPointList &&
    props.surroundPointList.length > 0
  ) {
    const [start, end] = surroundRange;
    const { length } = props.surroundPointList;
    // 计算每圈的点数
    const per = Math.floor(length / props.repeat);

    // 如果飞行索引小于等于环绕线起始索引，返回第0圈
    if (flyToPointIndex <= start) {
      return {
        currentCount: 0,
        per,
      };
    }
    // 如果飞行索引大于环绕线结束索引，返回最后一圈
    if (flyToPointIndex > end) {
      return {
        currentCount: props.repeat,
        per,
      };
    }
    // 计算当前圈数
    const currentCount = Math.ceil((flyToPointIndex - start) / per) - 1;
    return {
      currentCount,
      per,
    };
  }
  return null;
});

/**
 * ### 功能描述
 * 计算环绕线的进度
 *
 * 该计算属性用于确定无人机在环绕线中的飞行进度，
 * 范围在0到1之间。
 */
const circleProgress = computed(() => {
  const { surroundRange } = flyToIndexRange.value;
  // 如果环绕范围无效，返回0
  if (!surroundRange) {
    return 0;
  }
  const [start, end] = surroundRange;
  const flyToPointIndex = routeProps.flyToPointIndex ?? 0;

  // 如果飞行索引小于等于环绕线起始索引，返回0
  if (flyToPointIndex <= start) {
    return 0;
  }
  // 如果飞行索引超过一圈的范围，返回1
  if (repeatCount.value && flyToPointIndex > start + repeatCount.value.per) {
    return 1;
  }
  // 如果飞行索引大于环绕线结束索引，返回1
  if (flyToPointIndex > end) {
    return 1;
  }

  try {
    // 验证无人机位置和环绕线坐标
    const point = isValidCoordinates(routeProps.uavPosition);
    isValidLineString(arcLine.value);
    const endIndex = flyToPointIndex - start;
    const startIndex = endIndex - 1;
    const startPoint = props.surroundPointList![startIndex].coordinates;
    const endPoint = props.surroundPointList![endIndex].coordinates;
    const startAngle = startIndex * (props.stepAngle ?? 0);
    const endAngle = Math.min(endIndex * (props.stepAngle ?? 0), 360);
    // 计算环绕线进度
    return getSurroundRouteLineProgress(viewer!, {
      angle: props.angle,
      uavPosition: point,
      line: arcLine.value,
      enableCounterclockwise: props.enableCounterclockwise,
      center: props.coordinates,
      startPoint,
      endPoint,
      startAngle,
      endAngle,
    });
  } catch (e) {
    // 出错时返回0
    return 0;
  }
});

/**
 * ### 功能描述
 * 计算连接线的进度
 *
 * 该计算属性用于确定无人机在连接线中的飞行进度，
 * 范围在0到1之间。
 */
const concatLineProgress = computed(() => {
  const { concatRange } = flyToIndexRange.value;
  // 如果连接范围无效，返回0
  if (!concatRange) {
    return 0;
  }
  const [start, end] = concatRange;
  const flyToPointIndex = routeProps.flyToPointIndex ?? 0;

  // 如果飞行索引小于等于连接线起始索引，返回0
  if (flyToPointIndex <= start) {
    return 0;
  }
  // 如果飞行索引大于连接线结束索引，返回1
  if (flyToPointIndex > end) {
    return 1;
  }

  try {
    // 验证无人机位置和连接线坐标
    const point = isValidCoordinates(routeProps.uavPosition);
    isValidLineString(concatLine.value);
    // 计算连接线进度
    return getRouteLineProgress(viewer!, {
      clampToGround: false,
      line: concatLine.value,
      uavPosition: point,
      flyToPointIndex: 2,
    });
  } catch (e) {
    // 出错时返回0
    return 0;
  }
});
</script>
