import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  WritableComputedRef,
} from "vue";
import {
  PointCoordinates,
  PolygonCoordinates,
  RouteEditDrawStatus,
  RouteEditEventType,
  RoutePointType,
} from "@gdu-gl/common";
import { Viewer } from "@gdu-gl/core";
import { isNil } from "lodash-es";
import { RouteActiveFeature } from "../../common/types/EventCommonParams";
import {
  AiRouteEditDataInfo,
  AiRouteEditEmits,
  AiRouteEditProps,
} from "../props";

export function useMouseEvent(
  props: AiRouteEditProps,
  emits: AiRouteEditEmits,
  viewer: Viewer,
  dataInfo: AiRouteEditDataInfo,
  selectInfo: WritableComputedRef<RouteActiveFeature>,
) {
  // 获取地图场景的 canvas 元素
  const canvas = viewer?.mapProviderDelegate?.map.canvas;
  const mousePosition = ref<PointCoordinates | undefined>(undefined);
  const showTakeoffSelectTip = ref<boolean>(false);

  const showModifyPopup = computed(() => {
    return (
      mousePosition.value &&
      dataInfo.drawStatus === RouteEditDrawStatus.DRAW_END &&
      dataInfo.hover.type === RoutePointType.TAKEOFF
    );
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
        newHoverType === RoutePointType.TAKEOFF &&
        newAltPress
      ) {
        canvas?.classList.add("gdu-drag-vertical-cursor");
      }
      // 如果没有绘制状态且鼠标悬停在拐点或垂足点上，并且航线类型为航点航线类型，添加水平光标样式类
      else if (
        newDrawStatus !== RouteEditDrawStatus.DRAWING &&
        (newHoverType === RoutePointType.FOOT ||
          newHoverType === RoutePointType.TAKEOFF)
      ) {
        canvas?.classList.add("gdu-drag-horizontal-cursor");
      }
      // 如果鼠标在当前图层上悬停，添加普通光标样式类
      else if (newHoverType !== null) {
        canvas?.classList.add("gdu-draw-hover-feature-cursor");
      }
      // 如果当前类型为航点航线类型，添加绘制点光标样式类
      else if (
        [RouteEditDrawStatus.DRAWING, RouteEditDrawStatus.DRAW_END].includes(
          newDrawStatus,
        )
      ) {
        canvas?.classList.add("gdu-draw-area-cursor");
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
    const types = [RoutePointType.TAKEOFF];
    if (
      event.altKey &&
      !props.clampToGround &&
      types.includes(dataInfo.hover.type!) &&
      dataInfo.hover.index > -1
    ) {
      event.preventDefault();
      dataInfo.altPress = event.altKey;
    }

    if (
      event.key === "Escape" &&
      dataInfo.drawStatus === RouteEditDrawStatus.DRAWING
    ) {
      const idx = dataInfo.modifyMultiAreaLine.length - 1;
      dataInfo.modifyMultiAreaLine.splice(idx, 1);
      dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
      selectInfo.value = {
        type: null,
        index: -1,
        parentsIdx: -1,
      };
    }

    if (
      ["Backspace", "Delete"].includes(event.key) &&
      dataInfo.drawStatus !== RouteEditDrawStatus.DRAWING &&
      !isNil(selectInfo.value.parentsIdx) &&
      selectInfo.value.parentsIdx > -1
    ) {
      // 2. 获取当前焦点元素
      const activeElement = document.activeElement as HTMLElement | null;

      if (!activeElement) {
        return;
      }
      // 2. 判断是否需要排除（3种情况：可编辑输入框、contenteditable 嵌套、iframe 内输入框）
      const shouldExclude =
        isEditableInput(activeElement) ||
        isDescendantOfContentEditable(activeElement);

      // 3. 需要排除则不执行自定义逻辑，否则执行
      if (shouldExclude) return;

      const area = props.area!.filter((_, i) => {
        return i !== selectInfo.value?.parentsIdx;
      }) as PolygonCoordinates[];
      emits("changed", {
        type: RouteEditEventType.CLEAR,
        idx: selectInfo.value.index,
        parentsIdx: selectInfo.value.parentsIdx,
        area,
      });
      dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
      selectInfo.value = {
        type: null,
        index: -1,
        parentsIdx: -1,
      };
    }
  }

  function handleKeyUp() {
    dataInfo.altPress = false;
  }

  function removeCursorStyle() {
    canvas?.classList.remove("gdu-reference-point-cursor");
    canvas?.classList.remove("gdu-drag-horizontal-cursor");
    canvas?.classList.remove("gdu-draw-area-cursor");
    canvas?.classList.remove("gdu-draw-hover-feature-cursor");
    canvas?.classList.remove("gdu-drag-vertical-cursor");
  }

  /**
   * 辅助函数：判断元素或其祖先是否有 contenteditable="true"（解决嵌套问题）
   * @param el 目标元素
   * @returns 是否为可编辑元素（含祖先）
   */
  function isDescendantOfContentEditable(el: HTMLElement): boolean {
    let current: HTMLElement | null = el;
    while (current) {
      if (current.isContentEditable) return true;
      current = current.parentElement; // 向上遍历祖先
    }
    return false;
  }

  /**
   * 辅助函数：判断元素是否为“可输入且可编辑”的输入框（过滤 disabled/readonly/特殊类型）
   * @param el 目标元素
   * @returns 是否需要排除（即：按删除键会删除文字）
   */
  function isEditableInput(el: HTMLElement): boolean {
    if (
      el.tagName !== "INPUT" &&
      el.tagName !== "TEXTAREA" &&
      el.tagName !== "SELECT"
    ) {
      return false;
    }

    // 1. 过滤特殊 input 类型（这些类型无法输入文字）
    const excludedInputTypes = [
      "hidden",
      "button",
      "reset",
      "submit",
      "checkbox",
      "radio",
      "file",
    ];
    if (
      el.tagName === "INPUT" &&
      excludedInputTypes.includes((el as HTMLInputElement).type)
    ) {
      return false;
    }

    // 2. 过滤 disabled/readonly（这些元素无法编辑文字）
    if (el.hasAttribute("disabled") || el.hasAttribute("readonly")) {
      return false;
    }

    return true;
  }

  return {
    mousePosition,
    showModifyPopup,
    showTakeoffSelectTip,
  };
}
