import { onBeforeUnmount, Ref, watch } from "vue";
import { mapViewInternal } from "@gdu-gl/core";
import { CommonDrawProps } from "../Common/CommonProps";

export function useMouseEvent(
  props: CommonDrawProps,
  mouseClassName: string,
  drawing: Ref<boolean>,
  hover: Ref<number>,
  cancelDraw: () => void,
) {
  // 根据传入的 viewId 获取地图视图的 viewer 实例
  const viewer = mapViewInternal.getViewer(props.viewId!)!;
  // 获取地图场景的 canvas 元素
  const canvas = viewer?.mapProviderDelegate?.map.canvas;

  watch(
    [drawing, hover],
    ([newDrawing, newHover], [oldDrawing]) => {
      removeCursorStyle();
      if (newDrawing !== oldDrawing) {
        removeEvent();
        newDrawing && addEvent();
      }
      if (newHover > -1) {
        canvas?.classList.add("gdu-draw-hover-feature-cursor");
      } else if (newDrawing) {
        canvas?.classList.add(mouseClassName);
      }
    },
    {
      immediate: true,
    },
  );

  onBeforeUnmount(() => {
    removeEvent();
    removeCursorStyle();
  });

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === "Escape" && drawing.value) {
      cancelDraw();
    }
  }

  function addEvent() {
    window.addEventListener("keydown", handleKeyPress);
  }

  function removeEvent() {
    window.removeEventListener("keydown", handleKeyPress);
  }

  function removeCursorStyle() {
    canvas?.classList.remove(mouseClassName);
    canvas?.classList.remove("gdu-draw-hover-feature-cursor");
  }
}
