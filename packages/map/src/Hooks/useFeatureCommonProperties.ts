import { uuid } from "@gdu-gl/common";
import { FeatureEventEmits, Features } from "@map/Types";
import { computed } from "vue";
import { cloneDeep } from "lodash-es";

/**
 * 要素通用属性处理Hook
 * @param props
 * @param emits Vue组件事件发射器
 * @returns 包含要素通用属性和事件处理方法的对象
 * @description
 * 1. 生成要素唯一ID
 * 2. 封装要素通用事件处理函数
 * 3. 统一事件参数格式为坐标数组
 */
export function useFeatureCommonProperties(
  props: Features,
  emits?: FeatureEventEmits,
) {
  /** 自动生成的要素唯一标识符 */
  const id = uuid();
  /**
   * 要素的单击事件
   */
  function clickHandler(coordinates: number[]) {
    if (emits) {
      emits("click", coordinates);
    }
  }

  function dblclickHandler(coordinates: number[]) {
    if (emits) {
      emits("dblclick", coordinates);
    }
  }

  function contextmenuHandler(coordinates: number[]) {
    if (emits) {
      emits("contextmenu", coordinates);
    }
  }

  function mouseEnterHandler(coordinates: number[]) {
    if (emits) {
      emits("mouseEnter", coordinates);
    }
  }

  function mouseOverHandler(coordinates: number[]) {
    if (emits) {
      emits("mouseOver", coordinates);
    }
  }

  function mouseLeaveHandler(coordinates: number[]) {
    if (emits) {
      emits("mouseLeave", coordinates);
    }
  }

  /**
   * 监听要素样式变化的数组（排除coordinates、clampToGround两个关键属性）
   * @returns 包含所有需要监听的样式属性的函数数组
   */
  function styleToWatchArr() {
    const { coordinates, clampToGround, featureProperties, ...other } = props;
    return Object.keys(other).map((key) => {
      return () =>
        props[
          key as keyof Omit<
            Features,
            "coordinates" | "clampToGround" | "featureProperties"
          >
        ]?.toString();
    });
  }

  /**
   * 克隆的要素属性,避免在watch中拿到的newValue和oldValue是同一个对象
   */
  const cloneFeatureProperties = computed(() =>
    cloneDeep(props.featureProperties),
  );

  return {
    id,
    clickHandler,
    dblclickHandler,
    contextmenuHandler,
    mouseEnterHandler,
    mouseOverHandler,
    mouseLeaveHandler,
    styleToWatchArr,
    cloneFeatureProperties,
  };
}
