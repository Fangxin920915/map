import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  PointCoordinates,
  RouteEditDrawStatus,
  RoutePointType,
} from "@gdu-gl/common";
import { Viewer } from "@gdu-gl/core";
import { WayPointDataInfo, WayPointEditProps } from "../props";

export function useMouseEvent(
  viewer: Viewer,
  props: WayPointEditProps,
  dataInfo: WayPointDataInfo,
) {
  // 获取地图场景的 canvas 元素
  const canvas = viewer?.mapProviderDelegate?.map.canvas;
  const mousePosition = ref<PointCoordinates | undefined>(undefined);
  const showTakeoffSelectTip = ref<boolean>(false);

  const showModifyPopup = computed(() => {
    if (!dataInfo.hover.type) {
      return (
        mousePosition.value &&
        dataInfo.drawStatus === RouteEditDrawStatus.DRAW_SURROUND
      );
    }
    return (
      mousePosition.value &&
      (dataInfo.drawStatus === RouteEditDrawStatus.DRAW_END ||
        dataInfo.drawStatus === RouteEditDrawStatus.DRAW_SURROUND) &&
      (dataInfo.hover.type === RoutePointType.TURN ||
        dataInfo.hover.type === RoutePointType.TAKEOFF)
    );
  });

  const showVerticalModifyPopup = computed(() => {
    return showModifyPopup.value && !props.clampToGround;
  });

  /**
   * 监听 hoverId、props.type 和 drawStatus 的变化
   * 根据不同的状态为 canvas 添加或移除对应的光标样式类
   */
  watch(
    [
      () => dataInfo.hover.index,
      () => dataInfo.hover.type,
      () => dataInfo.drawStatus,
      () => dataInfo.altPress,
      () => props.active,
    ],
    ([, newHoverType, newDrawStatus, newAltPress]) => {
      // 移除所有可能的光标样式类
      removeCursorStyle();
      if (!props.active) {
        return;
      }
      if (
        newDrawStatus === RouteEditDrawStatus.DRAW_TAKEOFF &&
        newHoverType === null
      ) {
        canvas?.classList.add("gdu-reference-point-cursor");
      }
      // 如果拖拽类型为垂直，添加垂直光标样式类
      else if (
        !props.clampToGround &&
        (newHoverType === RoutePointType.TURN ||
          newHoverType === RoutePointType.TAKEOFF) &&
        newAltPress
      ) {
        canvas?.classList.add("gdu-drag-vertical-cursor");
      }
      // 如果没有绘制状态且鼠标悬停在拐点或垂足点上，并且航线类型为航点航线类型，添加水平光标样式类
      else if (
        newHoverType === RoutePointType.TURN ||
        newHoverType === RoutePointType.SURROUND ||
        newHoverType === RoutePointType.FOOT ||
        newHoverType === RoutePointType.TAKEOFF
      ) {
        canvas?.classList.add("gdu-drag-horizontal-cursor");
      }
      // 如果鼠标在当前图层上悬停，添加普通光标样式类
      else if (newHoverType !== null) {
        canvas?.classList.add("gdu-draw-hover-feature-cursor");
      }
      // 如果当前类型为航点航线类型，添加绘制点光标样式类
      else {
        canvas?.classList.add("gdu-draw-point-cursor");
      }
    },
    {
      // 立即执行一次回调
      immediate: true,
    },
  );

  onMounted(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
    removeCursorStyle();
  });

  function handleKeyDown(event: KeyboardEvent) {
    // ESC 键退出环绕航线添加模式
    if (
      event.key === "Escape" &&
      dataInfo.drawStatus === RouteEditDrawStatus.DRAW_SURROUND
    ) {
      dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
      return;
    }

    const types = [RoutePointType.TURN, RoutePointType.TAKEOFF];
    if (
      event.altKey &&
      !props.clampToGround &&
      types.includes(dataInfo.hover.type!) &&
      dataInfo.hover.index > -1
    ) {
      event.preventDefault();
      dataInfo.altPress = event.altKey;
    }
  }

  function handleKeyUp() {
    dataInfo.altPress = false;
  }

  function removeCursorStyle() {
    canvas?.classList.remove("gdu-reference-point-cursor");
    canvas?.classList.remove("gdu-drag-horizontal-cursor");
    canvas?.classList.remove("gdu-drag-vertical-cursor");
    canvas?.classList.remove("gdu-draw-point-cursor");
    canvas?.classList.remove("gdu-draw-hover-feature-cursor");
  }

  return {
    mousePosition,
    showModifyPopup,
    showVerticalModifyPopup,
    showTakeoffSelectTip,
  };
}
