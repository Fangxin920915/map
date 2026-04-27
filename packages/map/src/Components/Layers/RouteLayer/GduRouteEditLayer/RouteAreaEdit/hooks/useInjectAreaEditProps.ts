import { inject } from "vue";
import {
  RouteAreaEditDataInfoKey,
  RouteAreaEditEmitsKey,
} from "./useProvideAreaEditProps";
import { useInjectAreaEditCommonProps } from "../../common/hooks/useInjectAreaEditCommonProps";

export function useInjectAreaEditProps() {
  const { routeAreaEditProps, isPolygonSelfIntersecting, selectInfo } =
    useInjectAreaEditCommonProps();
  const routeAreaEditEmits = inject(RouteAreaEditEmitsKey)!;
  const dataInfo = inject(RouteAreaEditDataInfoKey)!;
  return {
    dataInfo,
    selectInfo,
    routeAreaEditProps,
    routeAreaEditEmits,
    isPolygonSelfIntersecting,
  };
}
