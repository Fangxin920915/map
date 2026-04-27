import { inject, onBeforeMount, onBeforeUnmount, watch } from "vue";
import { ModelLayerKey } from "@map/Constants";
import {
  HeightReferenceType,
  isValidCoordinates,
  ModelFeature,
  ModelType,
} from "@gdu-gl/common";
import { isEqual } from "lodash-es";
import { useFeatureCommonProperties } from "@map/Hooks";
import { ModelFeatureProps, ModelFeatureEmits } from "../props";

export function useAddModel(
  props: ModelFeatureProps,
  emits: ModelFeatureEmits,
) {
  const modelLayer = inject(ModelLayerKey);

  const { cloneFeatureProperties, ...commonProperties } =
    useFeatureCommonProperties(props, emits);

  /**
   * 判断点位是否有加载好
   */
  let modelReady = false;

  watch(
    cloneFeatureProperties,
    (newValue, oldValue) => {
      if (!modelReady) {
        console.warn("样式设置失败，点要素未创建");
        return;
      }
      if (isEqual(newValue, oldValue)) {
        return;
      }
      modelLayer?.value?.updateModelProperties(getModelProperties());
    },
    {
      deep: true,
    },
  );

  watch(
    [
      () => props.url,
      () => props.clampToGround,
      () => props.minimumPixelSize,
      () => props.name,
      () => props.disableDepthTestDistance,
      () => props.visible,
      () => props.color,
    ],
    ([url, oldUrl]) => {
      if (!modelReady) {
        return;
      }
      if (url !== oldUrl) {
        modelReady = false;
        modelLayer?.value?.removeModel(commonProperties.id);
        createModel();
      } else {
        modelLayer?.value?.updateModelProperties(getModelProperties());
      }
    },
  );

  watch(
    [
      () => props.coordinates?.toString(),
      () => props.scale,
      () => props.heading,
      () => props.pitch,
      () => props.roll,
      () => props.animate?.loop,
      () => props.animate?.speed,
      () => props.animate?.animateNodeName,
      () => props.animate?.play,
    ],
    () => {
      if (modelReady) {
        modelLayer?.value?.updateModelGeometry(
          commonProperties.id,
          getModelFeature(),
        );
      }
    },
  );

  onBeforeMount(() => {
    createModel();
  });

  onBeforeUnmount(() => {
    modelLayer?.value?.removeModel(commonProperties.id);
  });

  function createModel() {
    try {
      modelLayer?.value?.addModel(getModelFeature());
      modelReady = true;
    } catch (e) {
      console.error(e);
    }
  }

  function getModelFeature() {
    const scale: [number, number, number] = [
      props.scale ?? 1,
      props.scale ?? 1,
      props.scale ?? 1,
    ];
    const rotation: [number, number, number] = [
      degreesToRadians((props.heading ?? 0) + 90),
      degreesToRadians(props.pitch ?? 0),
      degreesToRadians(props.roll ?? 0),
    ];
    return {
      type: ModelType.GLTF,
      geometry: {
        coordinates: isValidCoordinates(props.coordinates),
        scale,
        rotation,
      },
      properties: getModelProperties(),
    };
  }

  function getModelProperties() {
    const animate = props.animate
      ? {
          play: props.animate?.play ?? false,
          loop: props.animate?.loop ?? false,
          speed: props.animate?.speed ?? 1,
          animateNodeName: props.animate?.animateNodeName ?? "",
        }
      : undefined;
    return {
      name: props.name,
      featureProperties: props.featureProperties,
      url: props.url,
      appearanceProperties: {
        color: props.color,
      },
      primitiveProperties: {
        minimumPixelSize: props.minimumPixelSize,
        asynchronous: true,
        disableDepthTestDistance: props.disableDepthTestDistance,
      },
      attributesProperties: {
        show: props.visible,
      },
      animateProperties: animate,
      heightReferenceProperties: {
        heightReference: props.clampToGround
          ? HeightReferenceType.CLAMP_TO_GROUND
          : HeightReferenceType.NONE,
      },
      ...commonProperties,
    } as ModelFeature["properties"];
  }

  /**
   * 将度数转换为弧度
   * @param degrees 角度值(度数)
   * @returns 对应的弧度值
   */
  function degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
