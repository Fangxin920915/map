import { computed, ComputedRef, InjectionKey, provide } from "vue";
import { LinePointAction } from "@gdu-gl/common";
import { isEmpty } from "lodash-es";
import { transformRoutePointHeightByMode } from "@map/Utils";
import { RouteLayerProps } from "../props";

export const RouteLayerKey: InjectionKey<RouteLayerProps> =
  Symbol("RouteLayerKey");

export const TurnPointListKey: InjectionKey<ComputedRef<LinePointAction[][]>> =
  Symbol("TurnPointListKey");

export function useProvideRouteProps(props: RouteLayerProps) {
  /**
   * 计算转向点列表
   * 从路线数据中提取所有标记为转向点的点，并根据高度模式计算实际高度
   */
  const turnPointList = computed<LinePointAction[][]>(() => {
    // 如果没有路线数据，返回空数组
    if (isEmpty(props.lines)) {
      return [];
    }

    // 存储计算后的所有路线的转向点
    const lines: LinePointAction[][] = [];

    // 遍历每一条路线
    props.lines!.forEach((line) => {
      // 存储当前路线的转向点
      const points = transformRoutePointHeightByMode(
        props.altitudeMode,
        line,
        props.takeoffPoint,
      );

      // 如果当前路线有转向点，则添加到结果列表中
      if (!isEmpty(points)) {
        lines.push(points);
      }
    });

    // 返回计算后的所有转向点列表
    return lines;
  });

  provide(RouteLayerKey, props);
  provide(TurnPointListKey, turnPointList);

  return { turnPointList };
}
