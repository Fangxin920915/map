import { computed } from "vue";
import { getFootPointIcon, getPointIcon, getSafePointIcon } from "@map/Utils";
import { RouteLayerProps, defaultRouteLayerProps } from "../props";

export function useRouteIcons(props: RouteLayerProps) {
  const startPoint = computed(() => {
    const { fillColor, outlineColor } =
      props.theme?.startPoint ?? defaultRouteLayerProps.theme.startPoint;
    return getPointIcon(fillColor, outlineColor);
  });

  const endPoint = computed(() => {
    const { fillColor, outlineColor } =
      props.theme?.endPoint ?? defaultRouteLayerProps.theme.endPoint;
    return getPointIcon(fillColor, outlineColor);
  });

  const turnPoint = computed(() => {
    const { fillColor, outlineColor } =
      props.theme?.turnPoint ?? defaultRouteLayerProps.theme.turnPoint;
    return getPointIcon(fillColor, outlineColor);
  });

  const startSafePoint = computed(() => {
    const { fillColor, outlineColor } =
      props.theme?.safeStartPoint ??
      defaultRouteLayerProps.theme.safeStartPoint;
    return getSafePointIcon(fillColor, outlineColor);
  });

  const endSafePoint = computed(() => {
    const { fillColor, outlineColor } =
      props.theme?.safeEndPoint ?? defaultRouteLayerProps.theme.safeEndPoint;
    return getSafePointIcon(fillColor, outlineColor);
  });

  const turnSafePoint = computed(() => {
    const { fillColor, outlineColor } =
      props.theme?.safeTurnPoint ?? defaultRouteLayerProps.theme.safeTurnPoint;
    return getSafePointIcon(fillColor, outlineColor);
  });

  const footPoint = computed(() => {
    const { fillColor, outlineColor } =
      props.theme?.footPoint ?? defaultRouteLayerProps.theme.footPoint;
    return getFootPointIcon(fillColor, outlineColor);
  });

  return {
    startPoint,
    endPoint,
    turnPoint,
    startSafePoint,
    endSafePoint,
    turnSafePoint,
    footPoint,
  };
}
