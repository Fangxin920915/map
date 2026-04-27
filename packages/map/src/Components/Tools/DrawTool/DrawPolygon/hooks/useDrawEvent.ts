import { computed, toRaw } from "vue";
import {
  LineStringCoordinates,
  MouseEventParams,
  PolygonCoordinates,
} from "@gdu-gl/common";
import { isEmpty } from "lodash-es";
import * as turf from "@turf/turf";
import { useDrawShapeEvent } from "../../Hooks/useDrawShapeEvent";
import { DrawPolygonToolEmits, DrawPolygonToolProps } from "../props";

export function useDrawEvent(
  props: DrawPolygonToolProps,
  emits: DrawPolygonToolEmits,
) {
  const {
    points,
    drawing,
    mousePosition,
    turnPoints,
    hover,
    mouseMoveMap,
    deletePoint,
    startDraw,
    cancelDraw,
    handleMouseClickMap,
  } = useDrawShapeEvent(props, emits);
  // 从图标钩子中获取垂足点和结束点图标
  const polygon = computed<PolygonCoordinates>(() => {
    const pointArr = points.value;
    return pointsToPolygon(pointArr);
  });

  const isPolygonSelfIntersecting = computed(() => {
    // 检查面线的点数是否少于 3 个，少于 3 个点无法构成多边形
    if (turnPoints.value.length < 2) {
      return false;
    }

    if (drawing.value && hover.value === turnPoints.value.length - 1) {
      return false;
    }

    if (!isEmpty(polygon.value)) {
      const { length } = turf.kinks(
        turf.polygon(polygon.value as number[][][]),
      ).features;
      return length > 0;
    }
    return false;
  });

  function mouseClickMap(params: MouseEventParams) {
    // 获取点击要素的名称
    const name = params.feature?.properties.name;
    if (name !== props.layerId && !isPolygonSelfIntersecting.value) {
      hover.value = turnPoints.value.length;
    }
    // 检查当前绘制状态是否为绘制结束，若是则直接返回
    if (isPolygonSelfIntersecting.value) {
      return;
    }

    handleMouseClickMap(params);
  }

  function pointsToPolygon(pointArr: LineStringCoordinates) {
    if (pointArr.length > 2) {
      const [startPoint] = pointArr;
      const toRawArr = pointArr.map((point) => toRaw(point));
      toRawArr.push(toRaw(startPoint));
      return [toRawArr];
    }
    return [];
  }

  function finishDraw() {
    if (turnPoints.value.length > 2) {
      emits("finish", pointsToPolygon(turnPoints.value));
    } else {
      emits("finish", [] as PolygonCoordinates);
    }
    drawing.value = false;
    points.value = [];
    hover.value = -1;
  }

  return {
    points,
    drawing,
    hover,
    mouseClickMap,
    mouseMoveMap,
    isPolygonSelfIntersecting,
    startDraw,
    cancelDraw,
    finishDraw,
    polygon,
    turnPoints,
    deletePoint,
    mousePosition,
  };
}
