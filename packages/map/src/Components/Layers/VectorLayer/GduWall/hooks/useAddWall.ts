import { inject, onBeforeMount, onBeforeUnmount, watch } from "vue";
import { VectorLayerKey } from "@map/Constants";
import { useFeatureCommonProperties } from "@map/Hooks";
import {
  GeometryPropertiesAppearance,
  GeometryType,
  LineStringCoordinates,
  isValidLineString,
} from "@gdu-gl/common";
import { isEqual } from "lodash-es";
import { VectorWallEmits, VectorWallProps } from "../props";

export function useAddWall(props: VectorWallProps, emits: VectorWallEmits) {
  const vectorLayer = inject(VectorLayerKey);

  const { cloneFeatureProperties, ...commonProperties } =
    useFeatureCommonProperties(props, emits);

  let wallReady = false;

  watch(
    [cloneFeatureProperties],
    ([newFeatureProperties], [oldFeatureProperties]) => {
      if (!wallReady) {
        console.warn("样式设置失败，面要素未创建");
        return;
      }
      if (isEqual(newFeatureProperties, oldFeatureProperties)) {
        return;
      }
      updateWallStyle();
    },
    {
      deep: true,
    },
  );

  /**
   * 样式属性监听器
   * 监听填充色、可见性等样式属性变化
   */
  watch(
    [
      () => props.fadeInColor,
      () => props.fadeOutColor,
      () => props.maxHeight,
      () => props.minHeight,
      () => props.visible,
      () => props.name,
      () => props.zIndex,
    ],
    () => {
      if (!wallReady) {
        console.warn("样式设置失败，面要素未创建");
        return;
      }
      updateWallStyle();
    },
  );

  /**
   * 坐标数据监听器
   * 监听坐标变化并更新几何图形和轮廓线
   */
  watch(
    [() => props.coordinates?.toString()],
    ([newCoordinatesStr], [oldCoordinatesStr]) => {
      if (wallReady && newCoordinatesStr !== oldCoordinatesStr) {
        vectorLayer?.value?.updateFeatureGeometry(
          commonProperties.id,
          checkCoordinates(),
          false,
        );
      } else if (!wallReady) {
        createWall();
      }
    },
  );

  /**
   * 组件挂载钩子
   * 初始化时创建面要素
   */
  onBeforeMount(() => {
    createWall();
  });

  /**
   * 组件卸载钩子
   * 清理已创建的面要素
   */
  onBeforeUnmount(() => {
    vectorLayer?.value?.removeFeature(commonProperties.id);
  });

  function updateWallStyle() {
    vectorLayer?.value?.updateFeatureProperties({
      name: props.name,
      featureProperties: props.featureProperties,
      ...commonProperties,
      appearance: getWallStyle(false),
    });
  }

  /**
   * 创建面要素核心方法
   * @throws 要素创建失败时抛出异常
   */
  function createWall() {
    try {
      vectorLayer?.value?.addFeature({
        type: "Feature",
        geometry: {
          type: `Wall` as GeometryType,
          coordinates: checkCoordinates(),
        },
        properties: {
          name: props.name,
          featureProperties: props.featureProperties,
          ...commonProperties,
          appearance: getWallStyle(true),
        },
      });
      wallReady = true;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * 生成面要素样式配置
   * @returns 包含颜色和可见性配置的样式对象
   */
  function getWallStyle(asynchronous: boolean = true) {
    return {
      wallProperties: {
        maxHeight: props.maxHeight,
        minHeight: props.minHeight,
      },
      appearanceType: "MaterialAppearance",
      materialType: "FadeWall",
      attributeProperties: {
        show: props.visible,
      },
      materialProperties: {
        fadeInColor: props.fadeInColor,
        fadeOutColor: props.fadeOutColor,
      },
      primitiveProperties: {
        asynchronous,
      },
    } as GeometryPropertiesAppearance;
  }

  /**
   * 坐标数据校验器
   * @returns 符合 GeoJSON 规范的坐标数组（自动修复非法数据）
   */
  function checkCoordinates() {
    return isValidLineString(props.coordinates as LineStringCoordinates);
  }

  return {
    commonProperties,
  };
}
