import { BasemapProps } from "@map/Types";
import { computed, onBeforeUnmount, onMounted, watch } from "vue";
import {
  BasemapLayerType,
  uuid,
  SourceParams,
  BasemapLayerAbstract,
} from "@gdu-gl/common";
import { mapViewInternal } from "@gdu-gl/core";
import { isEqual } from "lodash-es";

export function useAddBasemap(props: BasemapProps, type: BasemapLayerType) {
  const viewer = mapViewInternal.getViewer(props.viewId as string);

  const id = uuid();

  let layer: BasemapLayerAbstract | null | undefined = null;

  const params = computed(() => {
    const { viewId, zIndex, visible, alpha, ...other } = props;
    return {
      ...other,
      id,
      type,
    };
  });

  watch(
    params,
    () => {
      if (!layer) {
        return;
      }
      if (!isEqual(layer.getConfig(), params.value)) {
        layer.updateParams(params.value as SourceParams);
      }
    },
    { deep: true },
  );

  watch(
    [() => props.alpha, () => props.visible, () => props.zIndex],
    ([alpha, visible, zIndex], [oldAlpha, oldVisible, oldZIndex]) => {
      if (!layer) {
        return;
      }
      if (zIndex !== oldZIndex) {
        layer.setZIndex(props.zIndex ?? 0);
      }
      if (alpha !== oldAlpha) {
        layer.setAlpha(props.alpha ?? 1);
      }
      if (visible !== oldVisible) {
        layer.setVisible(props.visible ?? false);
      }
    },
  );

  onMounted(() => {
    layer = viewer?.basemapsDelegate.basemapCollection.add({
      ...(params.value as SourceParams),
      zIndex: props.zIndex ?? 0,
      visible: props.visible ?? true,
      alpha: props.alpha ?? 1,
    });
  });

  onBeforeUnmount(() => {
    if (layer) {
      viewer?.basemapsDelegate.basemapCollection.remove(layer.getId()!);
      layer = null;
    }
  });
}
