import {
  addAlphaToHexColor,
  ElectronicFenceFeature,
  ElectronicFenceType,
  LineStringCoordinates,
  MapThemeColor,
  PointCoordinates,
  PolygonCoordinates,
} from "@gdu-gl/common";
import {
  ElectronicFenceFeatureStyle,
  ElectronicFenceFeatureWithCenter,
} from "../props";

/**
 * 围栏数据包含中心坐标,根据围栏类型返回不同的样式
 * @param item 围栏数据
 * @param activeBaseColor 激活的围栏颜色
 * @param hoverBaseColor 悬停的围栏颜色
 * @param active 激活的围栏id
 * @param hover 悬停的围栏id
 */
export function getElectronicFencePolygonStyle(
  item: ElectronicFenceFeature,
  activeBaseColor: string,
  hoverBaseColor: string,
  active?: string | number | null,
  hover?: string | number | null,
) {
  const commonStyle = {
    strokeWidth: 8,
    strokeOutlineColor: "transparent",
    strokeOutlineWidth: 3,
    lineDash: [10, 2],
  };
  switch (item.properties.id) {
    case active:
      return {
        ...commonStyle,
        fillColor: addAlphaToHexColor(activeBaseColor, 0.5),
        strokeOutlineColor: "#ffffff",
        strokeColor: activeBaseColor,
        strokeGapColor: activeBaseColor,
      };
    case hover:
      return {
        ...commonStyle,
        fillColor: addAlphaToHexColor(hoverBaseColor, 0.3),
        strokeColor: hoverBaseColor,
        strokeGapColor: hoverBaseColor,
      };
    default:
      return {
        ...commonStyle,
        fillColor: addAlphaToHexColor(activeBaseColor, 0.3),
        strokeColor: activeBaseColor,
        strokeGapColor: activeBaseColor,
      };
  }
}

/**
 * 根据围栏类型返回不同的颜色
 * @param type 围栏类型
 * @returns 激活的围栏颜色和悬停的围栏颜色
 */
export function getBaseColorByType(type?: ElectronicFenceType | null) {
  switch (type) {
    case ElectronicFenceType.NO_FLY:
      return {
        key: "danger",
        activeColor: MapThemeColor.danger[500],
        hoverColor: MapThemeColor.danger[400],
      };
    case ElectronicFenceType.HEIGHT_LIMIT:
      return {
        key: "warning",
        activeColor: MapThemeColor.warning[500],
        hoverColor: MapThemeColor.warning[400],
      };
    case ElectronicFenceType.APPROPRIATE_FLY:
      return {
        key: "success",
        activeColor: MapThemeColor.success[500],
        hoverColor: MapThemeColor.success[400],
      };
    default:
      return {
        key: "neutral",
        activeColor: MapThemeColor.neutral[300],
        hoverColor: MapThemeColor.neutral[200],
      };
  }
}

/**
 * 电子围栏数据包含中心坐标,根据围栏类型返回不同的样式
 * @param item 电子围栏数据
 * @param active 激活的围栏id
 * @param hover 悬停的围栏id
 */
export function getElectronicFenceStyle(
  item: ElectronicFenceFeatureWithCenter,
  active?: string | number | null,
  hover?: string | number | null,
) {
  const { height, disabled, type, name, visible } = item.properties.options;
  const commonStyle: ElectronicFenceFeatureStyle = {
    id: item.properties.id,
    featureInfo: item.featureInfo,
    pointStyle: {
      textBackgroundColor: "rgba(45, 45, 46, 0.8)",
      textBackgroundPadding: [6, 3],
      textBackgroundRadius: 6,
      textSize: 12,
      text: name ?? "",
      coordinates: item.centerCoordinates as PointCoordinates,
      visible: active === item.properties.id && visible,
    },
    polygonStyle: {
      coordinates: item.geometry.coordinates as PolygonCoordinates,
    },
    wallStyle: {
      coordinates: item.geometry.coordinates[0] as LineStringCoordinates,
    },
  };
  const { activeColor, hoverColor } = getBaseColorByType(
    disabled ? undefined : type,
  );
  Object.assign(
    commonStyle.polygonStyle,
    getElectronicFencePolygonStyle(
      item,
      activeColor,
      hoverColor,
      active,
      hover,
    ),
  );
  Object.assign(
    commonStyle.wallStyle,
    getElectronicFenceWallStyle(
      commonStyle.polygonStyle.fillColor!,
      type,
      height ?? 0,
    ),
  );
  return commonStyle;
}

export function getElectronicFenceWallStyle(
  fillColor: string,
  type: ElectronicFenceType,
  height: number,
) {
  switch (type) {
    case ElectronicFenceType.NO_FLY:
      return {
        fadeInColor: fillColor,
        fadeOutColor: "transparent",
        maxHeight: 1000,
        minHeight: 0,
      };
    default:
      return {
        fadeInColor: fillColor,
        fadeOutColor: fillColor,
        maxHeight: height,
        minHeight: 0,
      };
  }
}

/**
 * 获取点位编辑时的拐点样式
 * @param mainKey
 */
export function getElectronicFenceTurnPointStyle(
  mainKey: keyof typeof MapThemeColor,
) {
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
