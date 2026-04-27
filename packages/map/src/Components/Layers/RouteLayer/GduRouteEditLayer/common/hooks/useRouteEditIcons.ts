import { computed } from "vue";
import {
  getDeletePointIcon,
  getDeleteTurnPointIcon,
  getFinishPointIcon,
  getFootPointIcon,
  getInsertionPointIcon,
  getPointIcon,
  getSafePointIcon,
} from "@map/Utils";
import { RouteEditLayerProps, defaultRouteEditLayerProps } from "../../props";

export function useRouteEditIcons(props: Pick<RouteEditLayerProps, "theme">) {
  const startPoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.startPoint ?? defaultRouteEditLayerProps.theme.startPoint;
    return {
      hover: getPointIcon(hover.fillColor, hover.outlineColor),
      select: getPointIcon(select.fillColor, select.outlineColor),
      normal: getPointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const endPoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.endPoint ?? defaultRouteEditLayerProps.theme.endPoint;
    return {
      hover: getPointIcon(hover.fillColor, hover.outlineColor),
      select: getPointIcon(select.fillColor, select.outlineColor),
      normal: getPointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const turnPoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.turnPoint ?? defaultRouteEditLayerProps.theme.turnPoint;
    return {
      hover: getPointIcon(hover.fillColor, hover.outlineColor),
      select: getPointIcon(select.fillColor, select.outlineColor),
      normal: getPointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const startSafePoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.safeStartPoint ??
      defaultRouteEditLayerProps.theme.safeStartPoint;
    return {
      hover: getSafePointIcon(hover.fillColor, hover.outlineColor),
      select: getSafePointIcon(select.fillColor, select.outlineColor),
      normal: getSafePointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const endSafePoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.safeEndPoint ??
      defaultRouteEditLayerProps.theme.safeEndPoint;
    return {
      hover: getSafePointIcon(hover.fillColor, hover.outlineColor),
      select: getSafePointIcon(select.fillColor, select.outlineColor),
      normal: getSafePointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const turnSafePoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.safeTurnPoint ??
      defaultRouteEditLayerProps.theme.safeTurnPoint;
    return {
      hover: getSafePointIcon(hover.fillColor, hover.outlineColor),
      select: getSafePointIcon(select.fillColor, select.outlineColor),
      normal: getSafePointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const footPoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.footPoint ?? defaultRouteEditLayerProps.theme.footPoint;
    return {
      hover: getFootPointIcon(hover.fillColor, hover.outlineColor),
      select: getFootPointIcon(select.fillColor, select.outlineColor),
      normal: getFootPointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const errorFootPoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.errorFootPoint ??
      defaultRouteEditLayerProps.theme.errorFootPoint;
    return {
      hover: getFootPointIcon(hover.fillColor, hover.outlineColor),
      select: getFootPointIcon(select.fillColor, select.outlineColor),
      normal: getFootPointIcon(normal.fillColor, normal.outlineColor),
    };
  });

  const insertionPoint = computed(() => {
    const { hover, select, normal } =
      props.theme?.insertionPoint ??
      defaultRouteEditLayerProps.theme.insertionPoint;
    return {
      hover: getInsertionPointIcon(
        hover.fillColor,
        hover.outlineColor,
        hover.textColor,
      ),
      select: getInsertionPointIcon(
        select.fillColor,
        select.outlineColor,
        select.textColor,
      ),
      normal: getInsertionPointIcon(
        normal.fillColor,
        normal.outlineColor,
        normal.textColor,
      ),
    };
  });

  // 计算属性：生成结束点图标
  const finishPointIcon = computed(() => {
    const normal = props.theme!.finishPoint;
    return getFinishPointIcon(
      normal.fillColor,
      normal.outlineColor,
      normal.textColor,
    );
  });

  // 计算属性：生成删除点图标的不同状态
  const deletePointIcon = computed(() => {
    const { normal, hover } = props.theme!.deletePoint;
    return {
      normal: getDeletePointIcon(
        normal.fillColor,
        normal.outlineColor,
        normal.textColor,
      ),
      hover: getDeletePointIcon(
        hover.fillColor,
        hover.outlineColor,
        hover.textColor,
      ),
    };
  });

  // 计算属性：生成删除点图标的不同状态
  const deleteTurnPointIcon = computed(() => {
    const { normal, hover, select } = props.theme!.deletePoint;
    return {
      normal: getDeleteTurnPointIcon(
        normal.fillColor,
        normal.outlineColor,
        normal.textColor,
      ),
      hover: getDeleteTurnPointIcon(
        hover.fillColor,
        hover.outlineColor,
        hover.textColor,
      ),
      select: getDeleteTurnPointIcon(
        select.fillColor,
        select.outlineColor,
        select.textColor,
      ),
    };
  });

  return {
    startPoint,
    endPoint,
    turnPoint,
    startSafePoint,
    endSafePoint,
    turnSafePoint,
    footPoint,
    insertionPoint,
    errorFootPoint,
    finishPointIcon,
    deletePointIcon,
    deleteTurnPointIcon,
  };
}
