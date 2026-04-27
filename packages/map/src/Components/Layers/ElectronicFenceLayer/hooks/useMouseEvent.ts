import {
  MouseEventParams,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import {
  nextTick,
  onBeforeUnmount,
  ref,
  Ref,
  useTemplateRef,
  watch,
  WritableComputedRef,
} from "vue";
import { mapViewInternal } from "@gdu-gl/core";
import { isNil } from "lodash-es";
import {
  ElectronicFenceFeatureInfo,
  ElectronicFenceLayerProps,
} from "../props";

export function useMouseEvent(
  props: ElectronicFenceLayerProps,
  hoverId: Ref<ElectronicFenceFeatureInfo | null>,
  activeId: WritableComputedRef<
    ElectronicFenceFeatureInfo | null,
    ElectronicFenceFeatureInfo | null
  >,
  editing: Ref<boolean>,
) {
  const editToolRef = useTemplateRef<any>("editToolRef");
  // 根据传入的 viewId 获取地图视图的 viewer 实例
  const viewer = mapViewInternal.getViewer(props.viewId!)!;
  // 获取地图场景的 canvas 元素
  const canvas = viewer?.mapProviderDelegate.mapProvider?.map.canvas;

  const mousePosition = ref<PointCoordinates | null | undefined>(null);

  watch(
    [hoverId, () => props.enableSelect],
    ([newHoverId, newEnableSelect]) => {
      removeCursorStyle();
      if (!newEnableSelect || isNil(newHoverId?.id)) {
        return;
      }
      if (
        newHoverId?.type === RoutePointType.FOOT ||
        newHoverId?.type === RoutePointType.TURN
      ) {
        canvas?.classList.add("gdu-drag-horizontal-cursor");
      } else {
        canvas?.classList.add("gdu-draw-hover-feature-cursor");
      }
    },
    {
      immediate: true,
    },
  );

  onBeforeUnmount(() => {
    removeCursorStyle();
  });

  function mouseMove(params: MouseEventParams) {
    if (!props.enableSelect) {
      hoverId.value = null;
      return;
    }
    if (editing.value) {
      return;
    }
    mousePosition.value = params.coordinates;
    const { properties } = params.feature ?? {};
    if (properties?.name === props.layerId) {
      hoverId.value = properties?.featureProperties;
    } else {
      hoverId.value = null;
    }
  }

  function mouseClick(params: MouseEventParams) {
    if (!props.enableSelect) {
      hoverId.value = null;
      return;
    }
    if (editing.value) {
      return;
    }
    // 点击的标注不是当前图层的标注，且不允许多选，清空选中标注
    if (params.feature?.properties?.name !== props.layerId) {
      activeId.value = null;
      return;
    }
    if (!params.feature?.properties?.featureProperties) {
      return;
    }
    if (
      activeId.value?.id !== params.feature?.properties?.featureProperties?.id
    ) {
      activeId.value = params.feature?.properties?.featureProperties;
      nextTick().then(() => {
        if (editToolRef.value?.refreshId) {
          editToolRef.value?.refreshId();
        }
      });
    }
  }

  function removeCursorStyle() {
    canvas?.classList.remove("gdu-draw-hover-feature-cursor");
    canvas?.classList.remove("gdu-drag-horizontal-cursor");
  }

  return {
    mousePosition,
    mouseMove,
    mouseClick,
  };
}
