import {
  MapThemeColor,
  MarkerLineStringStyle,
  MarkerPointStyle,
  MarkerPolygonStyle,
  PointerType,
  uuid,
} from "@gdu-gl/common";
import {
  getMarkerLineStringStyle,
  getMarkerPointStyle,
  getMarkerPolygonStyle,
  getThemeColor,
  ThemeMainKey,
} from "@map/Utils";
import { MarkerFeatureWithCenter } from "@map/Types";
import { cloneDeep } from "lodash-es";
import { DrawToolProps } from "@map/Components";

export function getLineStringProps(style: MarkerLineStringStyle) {
  const id = uuid();
  const properties = {
    id,
    options: style,
  };
  const item = { properties } as MarkerFeatureWithCenter;
  const themeColor = getThemeColor(item);
  const lineStyle = getMarkerLineStringStyle(item, themeColor, [id], "");
  return {
    turnPointStyle: getTurnPointStyle(item),
    errorColor: undefined,
    style: lineStyle,
  };
}

export function getPolygonProps(style: MarkerPolygonStyle) {
  const id = uuid();
  const properties = {
    id,
    options: style,
  };
  const item = { properties } as MarkerFeatureWithCenter;
  const themeColor = getThemeColor(item);
  const polygonStyle = getMarkerPolygonStyle(item, themeColor, [id], "");
  return {
    turnPointStyle: getTurnPointStyle(item),
    errorColor: themeColor.active,
    style: polygonStyle,
  };
}

export function getPointProps(feature: MarkerFeatureWithCenter) {
  const id = uuid();
  const item = cloneDeep(feature);
  item.properties.id = id;
  const { iconName } = item.properties.options as MarkerPointStyle;
  const pointStyle = getMarkerPointStyle(item, [id], "");
  const textSize = item.properties.options.textSize ?? 32;
  const iconOffsetY = iconName === PointerType.Circle ? 0 : -textSize / 2;
  return {
    style: {
      ...pointStyle,
      offset: [0, iconOffsetY],
    },
  };
}

function getTurnPointStyle(
  item: Omit<MarkerFeatureWithCenter, "geometry">,
): DrawToolProps["turnPointStyle"] {
  const {
    options: { theme },
  } = item.properties;
  // 断言 main 是 MapThemeColor 的有效键，code 是嵌套对象的有效键
  const mainKey = (theme ?? "brand") as ThemeMainKey;
  return {
    normal: {
      fillColor: MapThemeColor[mainKey]["100"],
      outlineColor: MapThemeColor[mainKey]["900"],
      textColor: "white",
    },
    hover: {
      fillColor: MapThemeColor[mainKey]["400"],
      outlineColor: MapThemeColor[mainKey]["900"],
      textColor: "white",
    },
    select: {
      fillColor: MapThemeColor[mainKey]["500"],
      outlineColor: MapThemeColor[mainKey]["900"],
      textColor: "white",
    },
  };
}
