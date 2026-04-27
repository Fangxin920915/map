import { inject, ref } from "vue";
import { LinePointAction } from "@gdu-gl/common";
import { RouteLayerKey, TurnPointListKey } from "./useProvideRouteProps";
import { defaultRouteLayerProps } from "../props";

export function useInjectRouteProps() {
  const routeProps = inject(RouteLayerKey, defaultRouteLayerProps);
  const turnPointList = inject(TurnPointListKey, ref<LinePointAction[][]>([]));
  return {
    routeProps,
    turnPointList,
  };
}
