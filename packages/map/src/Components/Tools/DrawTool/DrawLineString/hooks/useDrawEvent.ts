import { toRaw } from "vue";
import { LineStringCoordinates, MouseEventParams } from "@gdu-gl/common";
import { DrawLineStringToolEmits, DrawLineStringToolProps } from "../props";
import { useDrawShapeEvent } from "../../Hooks/useDrawShapeEvent";

export function useDrawEvent(
  props: DrawLineStringToolProps,
  emits: DrawLineStringToolEmits,
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
    handleMouseClickMap,
    cancelDraw,
  } = useDrawShapeEvent(props, emits);

  function mouseClickMap(params: MouseEventParams) {
    // 获取点击要素的名称
    const name = params.feature?.properties.name;
    if (name !== props.layerId) {
      hover.value = turnPoints.value.length;
    }

    handleMouseClickMap(params);
  }

  function finishDraw() {
    if (turnPoints.value.length > 1) {
      emits("finish", toRaw(turnPoints.value));
    } else {
      emits("finish", [] as LineStringCoordinates);
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
    startDraw,
    cancelDraw,
    finishDraw,
    turnPoints,
    deletePoint,
    mousePosition,
  };
}
