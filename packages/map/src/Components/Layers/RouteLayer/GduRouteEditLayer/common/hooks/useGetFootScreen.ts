import {
  IDragToolImp,
  LineStringCoordinates,
  WidgetType,
} from "@gdu-gl/common";
import { onBeforeUnmount, ref, watch } from "vue";
import { mapViewInternal } from "@gdu-gl/core";

/**
 * 自定义钩子函数：用于计算路线线段端点在屏幕上的可见性
 * 主要功能是检测路线中相邻两个坐标点在屏幕上的距离是否大于阈值
 * 如果距离大于阈值，则认为该路段的"脚"需要显示
 */
export function useGetFootScreen(props: {
  line: LineStringCoordinates;
  viewId: string;
}) {
  const viewer = mapViewInternal.getViewer(props.viewId as string);
  // 初始化拖拽工具实例
  const dragUtils = viewer?.widgetsDelegate.widgets.getWidgetByType(
    WidgetType.DragTool,
  ) as IDragToolImp;
  // 响应式数组，存储每段线段的可见状态
  const footVisibleCollection = ref<boolean[]>([]);

  // 监听line属性变化，当line变化时重新计算屏幕坐标可见性
  watch(
    () => props.line,
    () => getFootScreen(),
    { deep: true, immediate: true }, // 深度监听并立即执行一次
  );

  /**
   * 计算路线中每段线段端点在屏幕上的可见性
   * 对于每对相邻坐标点，将地理坐标转换为屏幕坐标，计算两点间距离
   * 当距离大于40像素时，认为该路段需要显示"脚"标记
   */
  function getFootScreen() {
    const status: boolean[] = [];
    // 遍历所有相邻坐标点对
    for (let i = 0; i < props.line.length - 1; i++) {
      // 将当前点地理坐标转换为屏幕坐标
      const current = dragUtils.transformScreenByCoordinate(props.line[i]);
      // 将下一个点地理坐标转换为屏幕坐标
      const next = dragUtils.transformScreenByCoordinate(props.line[i + 1]);

      // 如果两个点都成功转换为屏幕坐标
      if (current && next) {
        const [currentX, currentY] = current;
        const [nextX, nextY] = next;
        // 计算两点在屏幕上的欧氏距离
        const distance = Math.sqrt(
          (nextX - currentX) ** 2 + (nextY - currentY) ** 2,
        );
        // 当距离大于40像素时，标记为true（表示需要显示脚）
        status.push(distance > 40);
      } else {
        // 如果任一点无法转换为屏幕坐标（可能在视口外），默认标记为true
        status.push(true);
      }
    }
    // 更新响应式数组，触发视图更新
    footVisibleCollection.value = status;
  }

  onBeforeUnmount(() => {
    dragUtils?.destroy();
  });

  // 返回响应式状态和方法供组件使用
  return {
    footVisibleCollection, // 每段线段的可见状态数组
    getFootScreen, // 手动触发计算的方法
  };
}
