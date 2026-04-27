import { inject } from "vue";
import {
  AiRouteEditEmitsKey,
  AiRouteEditDataInfoKey,
  AiRouteEditPolygonIntersectKey,
} from "./useProvideAreaEditProps";
import { useInjectAreaEditCommonProps } from "../../common/hooks/useInjectAreaEditCommonProps";

export function useInjectAiAreaEditProps() {
  const { routeAreaEditProps, isPolygonSelfIntersecting, selectInfo } =
    useInjectAreaEditCommonProps();
  const isPolygonIntersect = inject(AiRouteEditPolygonIntersectKey)!;
  const routeAreaEditEmits = inject(AiRouteEditEmitsKey)!;
  const dataInfo = inject(AiRouteEditDataInfoKey)!;
  return {
    dataInfo,
    selectInfo,
    isPolygonIntersect,
    routeAreaEditProps,
    routeAreaEditEmits,
    isPolygonSelfIntersecting,
  };
}
