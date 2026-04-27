import { inject, onBeforeMount, onBeforeUnmount, ref, watch } from "vue";
import { VectorLayerKey } from "@map/Constants";
import { useFeatureCommonProperties } from "@map/Hooks";
import {
  GeometryPropertiesAppearance,
  isValidPolygon,
  PolygonCoordinates,
  MultiPolygonCoordinates,
  GeometryType,
} from "@gdu-gl/common";
import { isEqual } from "lodash-es";
import { VectorPolygonEmits, VectorPolygonProps } from "../props";

export function useAddPolygon(
  props: VectorPolygonProps,
  emits: VectorPolygonEmits,
  isMultiPolygon?: boolean,
) {
  const vectorLayer = inject(VectorLayerKey);

  const { cloneFeatureProperties, ...commonProperties } =
    useFeatureCommonProperties(props, emits);

  const outlines = ref([] as PolygonCoordinates);

  let polygonReady = false;

  watch(
    [() => props.clampToGround, cloneFeatureProperties],
    (
      [newClampToGround, newFeatureProperties],
      [oldClampToGround, oldFeatureProperties],
    ) => {
      if (!polygonReady) {
        console.warn("样式设置失败，面要素未创建");
        return;
      }
      if (!!newClampToGround !== !!oldClampToGround) {
        return;
      }
      if (isEqual(newFeatureProperties, oldFeatureProperties)) {
        return;
      }
      updatePolygonStyle();
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
      () => props.clampToGround,
      () => props.height,
      () => props.extrudedHeight,
      () => props.fillColor,
      () => props.visible,
      () => props.name,
      () => props.zIndex,
    ],
    ([newClampToGround, newHeight], [oldClampToGround, oldHeight]) => {
      if (!polygonReady) {
        console.warn("样式设置失败，面要素未创建");
        return;
      }
      if (!!newClampToGround !== !!oldClampToGround) {
        return;
      }
      updatePolygonStyle();
      if (newHeight !== oldHeight) {
        refreshOutlines();
      }
    },
  );

  /**
   * 坐标数据监听器
   * 监听坐标变化并更新几何图形和轮廓线
   */
  watch(
    [() => props.coordinates?.toString(), () => props.clampToGround],
    (
      [newCoordinatesStr, newClampToGround],
      [oldCoordinatesStr, oldClampToGround],
    ) => {
      if (!!newClampToGround !== !!oldClampToGround) {
        vectorLayer?.value?.removeFeature(commonProperties.id);
        polygonReady = false;
      }
      if (polygonReady && newCoordinatesStr !== oldCoordinatesStr) {
        vectorLayer?.value?.updateFeatureGeometry(
          commonProperties.id,
          checkCoordinates(),
          false,
        );
        refreshOutlines();
      } else if (!polygonReady) {
        createPolygon();
      }
    },
  );

  /**
   * 组件挂载钩子
   * 初始化时创建面要素
   */
  onBeforeMount(() => {
    createPolygon();
  });

  /**
   * 组件卸载钩子
   * 清理已创建的面要素
   */
  onBeforeUnmount(() => {
    vectorLayer?.value?.removeFeature(commonProperties.id);
  });

  function updatePolygonStyle() {
    vectorLayer?.value?.updateFeatureProperties({
      name: props.name,
      featureProperties: props.featureProperties,
      ...commonProperties,
      appearance: getPolygonStyle(false),
    });
  }

  /**
   * 创建面要素核心方法
   * @throws 要素创建失败时抛出异常
   */
  function createPolygon() {
    try {
      const multiString = isMultiPolygon ? "Multi" : "";
      const groundString = props.clampToGround ? "Ground" : "";
      vectorLayer?.value?.addFeature({
        type: "Feature",
        geometry: {
          type: `${groundString}${multiString}Polygon` as GeometryType,
          coordinates: checkCoordinates(),
        },
        properties: {
          name: props.name,
          featureProperties: props.featureProperties,
          ...commonProperties,
          appearance: getPolygonStyle(true),
        },
      });
      refreshOutlines();
      polygonReady = true;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * 更新轮廓线数据
   * 从多边形坐标中提取边界线（自动去除闭合点）
   */
  function refreshOutlines() {
    if (!isMultiPolygon) {
      const coordinates = props.coordinates as PolygonCoordinates;
      outlines.value = coordinates.map((line) => {
        return line
          .slice(0, line.length - 1)
          .map(([lon, lat]) => [lon, lat, props.height]);
      }) as PolygonCoordinates;
    } else {
      const coordinates = props.coordinates as MultiPolygonCoordinates;
      const lines = [] as PolygonCoordinates;
      coordinates.forEach((polygon) => {
        polygon.forEach((line) => {
          lines.push(
            line
              .slice(0, line.length - 1)
              .map(([lon, lat]) => [lon, lat, props.height]),
          );
        });
      });
      outlines.value = lines;
    }
  }

  /**
   * 生成面要素样式配置
   * @returns 包含颜色和可见性配置的样式对象
   */
  function getPolygonStyle(asynchronous: boolean = true) {
    return {
      appearanceType: "MaterialAppearance",
      materialType: "Color",
      attributeProperties: {
        show: props.visible,
      },
      materialProperties: {
        color: props.fillColor,
      },
      primitiveProperties: {
        asynchronous,
      },
      polygonProperties: {
        height: props.height,
        extrudedHeight: props.extrudedHeight,
      },
    } as GeometryPropertiesAppearance;
  }

  /**
   * 坐标数据校验器
   * @returns 符合 GeoJSON 规范的坐标数组（自动修复非法数据）
   */
  function checkCoordinates() {
    if (isMultiPolygon) {
      const polygons = props.coordinates as MultiPolygonCoordinates;
      return polygons.map((coordinates) => isValidPolygon(coordinates));
    }
    return isValidPolygon(props.coordinates as PolygonCoordinates);
  }

  return {
    outlines,
    commonProperties,
  };
}
