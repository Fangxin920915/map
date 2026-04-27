import { inject } from "vue";
import {
  IsPolygonSelfIntersectingKey,
  RouteAreaEditPropsKey,
  RouteAreaEditSelectDataInfoKey,
} from "../types/ProviderCommonKey";

export function useInjectAreaEditCommonProps() {
  const routeAreaEditProps = inject(RouteAreaEditPropsKey)!;
  const isPolygonSelfIntersecting = inject(IsPolygonSelfIntersectingKey)!;
  const selectInfo = inject(RouteAreaEditSelectDataInfoKey)!;
  return {
    routeAreaEditProps,
    isPolygonSelfIntersecting,
    selectInfo,
  };
}
