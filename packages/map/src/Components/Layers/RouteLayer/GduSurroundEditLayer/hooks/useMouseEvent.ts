import { Viewer } from "@gdu-gl/core";
import {
  PointCoordinates,
  RouteEditDrawStatus,
  RoutePointType,
} from "@gdu-gl/common";
import { onBeforeUnmount, ref, watch } from "vue";

export function useMouseEvent(viewer: Viewer) {
  // 获取地图场景的 canvas 元素
  const canvas = viewer?.mapProviderDelegate?.map.canvas;
  const mousePosition = ref<PointCoordinates | null>(null);

  const status = ref<RouteEditDrawStatus>(RouteEditDrawStatus.DRAW_END);

  const hoverInfo = ref<{ type: RoutePointType | null }>({
    type: null,
  });

  /**
   * 监听 hoverId、props.type 和 drawStatus 的变化
   * 根据不同的状态为 canvas 添加或移除对应的光标样式类
   */
  watch(
    [() => hoverInfo.value.type, () => status.value],
    ([newHoverType, newDrawStatus]) => {
      // 移除所有可能的光标样式类
      removeCursorStyle();
      if (newDrawStatus === RouteEditDrawStatus.DRAWING) {
        canvas?.classList.add("gdu-draw-point-cursor");
      } else if (
        (newDrawStatus as RouteEditDrawStatus) !==
          RouteEditDrawStatus.DRAWING &&
        newHoverType === RoutePointType.FOOT
      ) {
        canvas?.classList.add("gdu-drag-horizontal-cursor");
      } else if (newHoverType !== null) {
        canvas?.classList.add("gdu-draw-hover-feature-cursor");
      }
    },
    {
      // 立即执行一次回调
      immediate: true,
    },
  );

  onBeforeUnmount(() => {
    status.value = RouteEditDrawStatus.DRAW_END;
    removeCursorStyle();
  });

  function removeCursorStyle() {
    canvas?.classList.remove("gdu-draw-point-cursor");
    canvas?.classList.remove("gdu-drag-horizontal-cursor");
    canvas?.classList.remove("gdu-draw-hover-feature-cursor");
  }

  return {
    mousePosition,
    status,
    hoverInfo,
  };
}
