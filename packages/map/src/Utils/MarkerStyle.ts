import { MarkerFeatureWithCenter } from "@map/Types";
import {
  addAlphaToHexColor,
  MapThemeColor,
  MarkerBaseStyle,
  GeoFeatureType,
  MarkerLineStringStyle,
  MarkerPointStyle,
  MarkerPolygonStyle,
  MarkerStrokeType,
  MarkerTextShapeType,
} from "@gdu-gl/common";

// 导出类型供外部使用
export type ThemeMainKey = keyof typeof MapThemeColor;
type ThemeColor = {
  normal: string;
  hover: string;
  active: string;
};

export function getThemeColor(item: Omit<MarkerFeatureWithCenter, "geometry">) {
  const {
    options: { theme },
  } = item.properties;
  // 断言 main 是 MapThemeColor 的有效键，code 是嵌套对象的有效键
  const mainKey = (theme ?? "brand") as ThemeMainKey;
  return {
    normal: MapThemeColor[mainKey]["500"],
    hover: MapThemeColor[mainKey]["400"],
    active: MapThemeColor[mainKey]["500"],
  };
}

/**
 * 获取标注文本的样式
 * @param type 标注要素类型
 * @param item 标注要素
 * @param color 标注颜色
 * @param activeIds
 * @param hoverId 悬停的标注id
 * @returns 标注文本的样式
 */
export function getMarkerTextStyle(
  type: GeoFeatureType,
  item: Omit<MarkerFeatureWithCenter, "geometry">,
  color: ThemeColor,
  activeIds: string[],
  hoverId: string | null | undefined,
) {
  const { textBackgroundShape } = item.properties.options as MarkerBaseStyle;

  if (
    // 点要素不支持圆文本背景
    type !== GeoFeatureType.Point &&
    textBackgroundShape === MarkerTextShapeType.Circle
  ) {
    return getCircleTextStyle(item, color);
  }
  return getOutlineTextStyle(item, color, activeIds, hoverId);
}

/**
 * 获取标注文本的圆样式
 * @param item 标注要素
 * @param color 标注颜色
 * @returns 标注文本的圆样式
 */
function getCircleTextStyle(
  item: Omit<MarkerFeatureWithCenter, "geometry">,
  color: ThemeColor,
) {
  const {
    options: { text, textSize },
  } = item.properties;
  return {
    text,
    textColor: MapThemeColor.neutral["100"],
    textOutlineWidth: 0,
    textSize,
    shapeType: "circle",
    shapeSize: (textSize ?? 0) + 10,
    shapeFillColor: color.normal,
    shapeOutlineWidth: 0,
  };
}

/**
 * 获取标注文本的轮廓样式
 * @param item 标注要素
 * @param color 标注颜色
 * @param activeIds
 * @param hoverId 悬停的标注id
 * @returns 标注文本的轮廓样式
 */
function getOutlineTextStyle(
  item: Omit<MarkerFeatureWithCenter, "geometry">,
  color: ThemeColor,
  activeIds: Array<string | number>,
  hoverId: string | null | undefined,
) {
  const {
    id,
    options: { text, textSize },
  } = item.properties;
  const commonStyle = {
    textOutlineWidth: 1,
    textSize,
    shapeType: "none",
  };
  if (activeIds.includes(id) || hoverId === id) {
    return {
      text,
      textColor: color.hover,
      textOutlineColor: MapThemeColor.neutral["100"],
      ...commonStyle,
    };
  }
  return {
    text,
    textColor: MapThemeColor.neutral["100"],
    textOutlineColor: MapThemeColor.neutral["900"],
    ...commonStyle,
  };
}

export function getMarkerPointStyle(
  item: Omit<MarkerFeatureWithCenter, "geometry">,
  activeIds: Array<string | number>,
  hoverId: string | null | undefined,
) {
  const { id } = item.properties;
  const { iconSize } = item.properties.options as MarkerPointStyle;
  const commonStyle = {
    iconWidth: iconSize,
    iconHeight: iconSize,
  };
  if (activeIds.includes(id)) {
    return {
      iconSrc: item.icon!.active,
      ...commonStyle,
    };
  }
  if (hoverId === id) {
    return {
      iconSrc: item.icon!.hover,
      ...commonStyle,
    };
  }
  return {
    iconSrc: item.icon!.normal,
    ...commonStyle,
  };
}

export function getMarkerLineStringStyle(
  item: Omit<MarkerFeatureWithCenter, "geometry">,
  color: ThemeColor,
  activeIds: Array<string | number>,
  hoverId: string | null | undefined,
) {
  const { id } = item.properties;
  const { strokeWidth, strokeType } = item.properties
    .options as MarkerLineStringStyle;
  const lineDash = strokeType === MarkerStrokeType.Solid ? [] : [10, 10];
  const outlineWidth = activeIds.includes(id) || id === hoverId ? 1.3 : 0;
  const width = strokeWidth + 2 * outlineWidth;
  const commonStyle = {
    strokeWidth: width,
    strokeOutlineColor: MapThemeColor.neutral["100"],
    strokeOutlineWidth: outlineWidth,
    lineDash,
  };
  if (activeIds.includes(id)) {
    return {
      ...commonStyle,
      strokeColor: color.active,
    };
  }
  if (hoverId === id) {
    return {
      ...commonStyle,
      strokeColor: color.hover,
    };
  }
  return {
    ...commonStyle,
    strokeColor: color.normal,
  };
}

export function getMarkerPolygonStyle(
  item: Omit<MarkerFeatureWithCenter, "geometry">,
  color: ThemeColor,
  activeIds: Array<string | number>,
  hoverId: string | null | undefined,
) {
  const { id } = item.properties;
  const { fillOpacity } = item.properties.options as MarkerPolygonStyle;
  const lineStyle = getMarkerLineStringStyle(item, color, activeIds, hoverId);
  if (activeIds.includes(id)) {
    return {
      ...lineStyle,
      fillColor: addAlphaToHexColor(color.active, fillOpacity / 100),
    };
  }

  if (hoverId === id) {
    return {
      ...lineStyle,
      fillColor: addAlphaToHexColor(color.hover, fillOpacity / 100),
    };
  }

  return {
    ...lineStyle,
    fillColor: addAlphaToHexColor(color.normal, fillOpacity / 100),
  };
}
