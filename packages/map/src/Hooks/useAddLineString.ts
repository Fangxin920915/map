import { inject, onBeforeMount, onBeforeUnmount, watch } from "vue";
import { VectorLayerKey } from "@map/Constants";
import { useFeatureCommonProperties } from "@map/Hooks";
import {
  GeometryPropertiesAppearance,
  GeometryType,
  isValidLineString,
  LineStringCoordinates,
  MultiLineStringCoordinates,
} from "@gdu-gl/common";
import { FeatureEventEmits, Features } from "@map/Types";
import { isEqual } from "lodash-es";

/**
 * 添加线要素
 * @param props 线要素属性
 * @param emits 线要素事件
 * @param options
 */
export function useAddLineString<T extends Features>(
  props: T,
  emits: FeatureEventEmits,
  options: {
    isMultiline?: boolean;
    getLineStyle: (
      props: T,
      asynchronous: boolean,
    ) => GeometryPropertiesAppearance;
  },
) {
  const vectorLayer = inject(VectorLayerKey);

  const { styleToWatchArr, cloneFeatureProperties, ...commonProperties } =
    useFeatureCommonProperties(props, emits);

  let lineReady = false;

  watch(
    [() => props.clampToGround, cloneFeatureProperties],
    (
      [newClampToGround, newFeatureProperties],
      [oldClampToGround, oldFeatureProperties],
    ) => {
      if (!lineReady) {
        console.warn("样式设置失败，线要素未创建");
        return;
      }
      if (!!newClampToGround !== !!oldClampToGround) {
        return;
      }
      if (isEqual(newFeatureProperties, oldFeatureProperties)) {
        return;
      }
      updateLineStringStyle();
    },
    {
      deep: true,
    },
  );

  /**
   * 样式属性监听器
   * 监听线宽、颜色、虚线模式等样式属性变化
   */
  watch(
    [() => props.clampToGround, ...styleToWatchArr()],
    ([newClampToGround], [oldClampToGround]) => {
      if (!lineReady) {
        console.warn("样式设置失败，线要素未创建");
        return;
      }
      if (!!newClampToGround !== !!oldClampToGround) {
        return;
      }
      updateLineStringStyle();
    },
  );

  /**
   * 坐标数据监听器
   * 监听坐标数组变化并更新几何图形
   */
  watch(
    [() => props.coordinates?.toString(), () => props.clampToGround],
    (
      [newCoordinatesStr, newClampToGround],
      [oldCoordinatesStr, oldClampToGround],
    ) => {
      if (!!newClampToGround !== !!oldClampToGround) {
        vectorLayer?.value?.removeFeature(commonProperties.id);
        lineReady = false;
      }
      if (lineReady && newCoordinatesStr !== oldCoordinatesStr) {
        vectorLayer?.value?.updateFeatureGeometry(
          commonProperties.id,
          checkCoordinates(),
          false,
        );
      } else if (!lineReady) {
        createLineString();
      }
    },
  );

  /**
   * 组件挂载生命周期
   * 初始化时创建线要素
   */
  onBeforeMount(() => {
    createLineString();
  });

  /**
   * 组件卸载生命周期
   * 清理已创建的线要素
   */
  onBeforeUnmount(() => {
    vectorLayer?.value?.removeFeature(commonProperties.id);
  });

  function updateLineStringStyle() {
    vectorLayer?.value?.updateFeatureProperties({
      name: props.name,
      featureProperties: props.featureProperties,
      ...commonProperties,
      appearance: options.getLineStyle(props, false),
    });
  }

  /**
   * 创建线要素核心方法
   * 将校验后的坐标数据和样式配置提交到矢量图层
   * @throws 要素创建失败时抛出异常
   */
  function createLineString() {
    try {
      const multiString = options.isMultiline ? "Multi" : "";
      const groundString = props.clampToGround ? "Ground" : "";
      if (!vectorLayer?.value) {
        console.warn("矢量图层不存在，无法创建线要素");
        return;
      }
      if (!checkCoordinates()) {
        return;
      }

      vectorLayer?.value?.addFeature({
        type: "Feature",
        geometry: {
          type: `${groundString}${multiString}LineString` as GeometryType,
          coordinates: checkCoordinates(),
        },
        properties: {
          name: props.name,
          featureProperties: props.featureProperties,
          ...commonProperties,
          appearance: options.getLineStyle(props, true),
        },
      });

      lineReady = true;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * 坐标数据校验器
   * @returns 符合 GeoJSON 规范的坐标数组（自动修复非法数据）
   */
  function checkCoordinates() {
    if (options.isMultiline) {
      const lines = props.coordinates as MultiLineStringCoordinates;
      return lines.map((coordinates) => isValidLineString(coordinates));
    }
    return isValidLineString(props.coordinates as LineStringCoordinates);
  }
}
