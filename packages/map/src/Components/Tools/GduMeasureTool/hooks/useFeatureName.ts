import { computed } from "vue";
import { PointActionType } from "@gdu-gl/common";
import { MeasureLayerProps } from "../props";

/**
 * @function useFeatureName
 * @description 用于生成测量工具相关要素名称的钩子函数
 * @param props - 测量图层属性，包含groupId等信息
 * @returns 包含多个生成要素名称的函数
 * @property lineStringId - 线要素的唯一标识符
 * @property polygonId - 面要素的唯一标识符
 * @property getInsertNameByIndex - 根据索引生成插入点名称
 * @property getTurnNameByIndex - 根据索引生成转折点名称
 * @property getDeleteNameByIndex - 根据索引生成删除点名称
 * @property getFinishNameByIndex - 根据索引生成结束点名称
 */
export function useFeatureName(props: MeasureLayerProps) {
  /**
   * @description 生成线要素的唯一标识符
   * @returns {string} 由groupId和Line类型拼接而成的字符串
   */
  const lineStringId = computed(() => {
    return `${props.groupId}_${PointActionType.Line}`;
  });

  /**
   * @description 生成面要素的唯一标识符
   * @returns {string} 由groupId和Polygon类型拼接而成的字符串
   */
  const polygonId = computed(() => {
    return `${props.groupId}_${PointActionType.Polygon}`;
  });

  /**
   * @description 根据索引生成插入点名称
   * @param {number} index - 插入点的索引
   * @returns 由groupId、Insert类型和索引拼接而成的字符串
   */
  function getInsertNameByIndex(index: number) {
    return `${props.groupId}_${PointActionType.Insert}_${index}`;
  }

  /**
   * @description 根据索引生成转折点名称
   * @param index - 转折点的索引
   * @returns 由groupId、Turn类型和索引拼接而成的字符串
   */
  function getTurnNameByIndex(index: number) {
    return `${props.groupId}_${PointActionType.Turn}_${index}`;
  }

  /**
   * @description 根据索引生成删除点名称
   * @param index - 删除点的索引
   * @returns 由groupId、Delete类型和索引拼接而成的字符串
   */
  function getDeleteNameByIndex(index: number) {
    return `${props.groupId}_${PointActionType.Delete}_${index}`;
  }

  /**
   * @description 根据索引生成结束点名称
   * @param index - 结束点的索引
   * @returns 由groupId、Finish类型和索引拼接而成的字符串
   */
  function getFinishNameByIndex(index: number) {
    return `${props.groupId}_${PointActionType.Finish}_${index}`;
  }

  return {
    lineStringId,
    polygonId,
    getInsertNameByIndex,
    getTurnNameByIndex,
    getDeleteNameByIndex,
    getFinishNameByIndex,
  };
}
