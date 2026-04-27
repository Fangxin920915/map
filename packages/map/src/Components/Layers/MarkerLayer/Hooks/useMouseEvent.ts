import {
  MarkerFeature,
  MouseEventParams,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
  useTemplateRef,
  watch,
  WritableComputedRef,
} from "vue";
import { mapViewInternal } from "@gdu-gl/core";
import { isNil } from "lodash-es";
import {
  MarkerFeatureInfo,
  MarkerLayerEmits,
  MarkerLayerProps,
} from "../props";

export function useMouseEvent(
  props: MarkerLayerProps,
  emits: MarkerLayerEmits,
  hoverId: Ref<MarkerFeatureInfo | null>,
  activeIds: WritableComputedRef<MarkerFeatureInfo[], MarkerFeatureInfo[]>,
  editing: Ref<boolean>,
  altPress: Ref<boolean>,
) {
  const editToolRef = useTemplateRef<any>("editToolRef");
  // 根据传入的 viewId 获取地图视图的 viewer 实例
  const viewer = mapViewInternal.getViewer(props.viewId!)!;
  // 获取地图场景的 canvas 元素
  const canvas = viewer?.mapProviderDelegate?.map.canvas;

  const mousePosition = ref<PointCoordinates | null | undefined>(null);

  let markerFeature: MarkerFeature | null | undefined = null;

  watch(
    [
      hoverId,
      altPress,
      () => props.clampToGround,
      () => props.enableAiMouseStyle,
      () => props.enableModify,
    ],
    ([newHoverId, newAltPress, newClampToGround]) => {
      removeCursorStyle();
      if (isNil(newHoverId?.id)) {
        return;
      }
      if (
        newHoverId?.type === RoutePointType.FOOT ||
        (newHoverId?.type === RoutePointType.TURN && !newAltPress)
      ) {
        canvas?.classList.add("gdu-drag-horizontal-cursor");
      } else if (
        newHoverId?.type === RoutePointType.TURN &&
        newAltPress &&
        !newClampToGround
      ) {
        canvas?.classList.add("gdu-drag-vertical-cursor");
      } else if (props.enableAiMouseStyle && !props.enableModify) {
        canvas?.classList.add("gdu-draw-select-cursor");
      } else {
        canvas?.classList.add("gdu-draw-hover-feature-cursor");
      }
    },
    {
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
  });

  function handleKeyDown(event: KeyboardEvent) {
    if (event.altKey && hoverId.value?.id) {
      event.preventDefault();
      altPress.value = event.altKey;
    }
  }

  function handleKeyUp() {
    altPress.value = false;
  }

  function mouseMove(params: MouseEventParams) {
    if (editing.value) {
      return;
    }
    mousePosition.value = params.coordinates;
    const { properties } = params.feature ?? {};
    if (properties?.name === props.layerId) {
      // 如果id发生更改，在去查找数据源，优化查询性能
      if (hoverId.value?.id !== properties?.featureProperties?.id) {
        markerFeature = props.dataSource.find(
          (item) => item.properties.id === properties?.featureProperties?.id,
        );
      }
      hoverId.value = properties?.featureProperties;
    } else {
      markerFeature = null;
      hoverId.value = null;
    }
    emits("mouseMove", params.coordinates, markerFeature);
  }

  function mouseClick(params: MouseEventParams) {
    if (editing.value) {
      return;
    }
    // 点击的标注不是当前图层的标注，且不允许多选，清空选中标注
    if (params.feature?.properties?.name !== props.layerId) {
      // 不允许多选时，清空选中标注
      if (!props.enableMultiSelect) {
        activeIds.value = [];
      }
      return;
    }
    const idx = activeIds.value.findIndex(
      (active) =>
        active.id === params.feature?.properties?.featureProperties?.id,
    );

    if (props.enableMultiSelect) {
      multipleSelectClickMap(idx, params);
    } else {
      singleSelectClickMap(idx, params);
    }
  }

  /**
   * 单选点击
   * @param idx 选中的标注索引
   * @param params 点击事件参数
   */
  function singleSelectClickMap(idx: number, params: MouseEventParams) {
    if (!params.feature?.properties?.featureProperties) {
      return;
    }
    if (idx === -1) {
      activeIds.value = [params.feature?.properties?.featureProperties];
      nextTick().then(() => {
        if (editToolRef.value?.refreshId) {
          editToolRef.value?.refreshId();
        }
      });
    }
  }

  /**
   * 多选点击
   * @param idx 选中的标注索引
   * @param params 点击事件参数
   */
  function multipleSelectClickMap(idx: number, params: MouseEventParams) {
    if (!params.feature?.properties?.featureProperties) {
      return;
    }
    if (idx === -1) {
      activeIds.value = [
        ...activeIds.value,
        params.feature?.properties?.featureProperties,
      ];
    } else {
      activeIds.value = activeIds.value.filter((_, index) => index !== idx);
    }
    nextTick().then(() => {
      if (editToolRef.value?.refreshId) {
        editToolRef.value?.refreshId();
      }
    });
  }

  function removeCursorStyle() {
    canvas?.classList.remove("gdu-draw-hover-feature-cursor");
    canvas?.classList.remove("gdu-drag-horizontal-cursor");
    canvas?.classList.remove("gdu-drag-vertical-cursor");
    canvas?.classList.remove("gdu-draw-select-cursor");
  }

  return {
    mousePosition,
    mouseMove,
    mouseClick,
  };
}
