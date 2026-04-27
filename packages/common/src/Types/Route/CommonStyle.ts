import { addAlphaToHexColor } from "@common/Utils";
import { MapThemeColor } from "../MapThemeColor";

export const defaultNormalRouteTheme = {
  startPoint: {
    fillColor: MapThemeColor.execute[500],
    outlineColor: MapThemeColor.execute[900],
    textColor: "#FFFFFF",
  },
  endPoint: {
    fillColor: MapThemeColor.execute[800],
    outlineColor: MapThemeColor.execute[400],
    textColor: "#FFFFFF",
  },
  turnPoint: {
    fillColor: MapThemeColor.success[500],
    outlineColor: MapThemeColor.success[900],
    textColor: "#FFFFFF",
  },
  safeStartPoint: {
    fillColor: MapThemeColor.execute[100],
    outlineColor: MapThemeColor.execute[900],
    textColor: MapThemeColor.execute[500],
  },
  safeEndPoint: {
    fillColor: MapThemeColor.execute[100],
    outlineColor: MapThemeColor.execute[500],
    textColor: MapThemeColor.execute[800],
  },
  safeTurnPoint: {
    fillColor: MapThemeColor.success[100],
    outlineColor: MapThemeColor.success[900],
    textColor: MapThemeColor.success[600],
  },
  deletePoint: {
    fillColor: "rgba(23, 26, 31, 0.70)",
    outlineColor: "rgba(136, 136, 143, 0.20)",
    textColor: MapThemeColor.neutral[100],
  },
  line: {
    strokeColor: MapThemeColor.success[500],
    strokeOutlineColor: MapThemeColor.success[900],
  },
  helperLine: {
    fillColor: "rgba(255,255,255,0.5)",
  },
  footPoint: {
    fillColor: MapThemeColor.warning[100],
    outlineColor: MapThemeColor.warning[900],
  },
  projectionLine: {
    fillColor: MapThemeColor.warning[500],
  },
  area: {
    fillColor: addAlphaToHexColor(MapThemeColor.warning[500], 0.15),
    strokeColor: MapThemeColor.warning[500],
  },
};

export const defaultHoverRouteTheme = {
  startPoint: {
    ...defaultNormalRouteTheme.startPoint,
    fillColor: MapThemeColor.execute[400],
  },
  endPoint: {
    ...defaultNormalRouteTheme.endPoint,
    fillColor: MapThemeColor.execute[600],
  },
  turnPoint: {
    ...defaultNormalRouteTheme.turnPoint,
    fillColor: MapThemeColor.success[400],
  },
  safeStartPoint: {
    ...defaultNormalRouteTheme.safeStartPoint,
    fillColor: MapThemeColor.execute[200],
  },
  safeEndPoint: {
    ...defaultNormalRouteTheme.safeEndPoint,
    fillColor: MapThemeColor.execute[200],
  },
  deletePoint: {
    ...defaultNormalRouteTheme.deletePoint,
    textColor: MapThemeColor.danger[400],
  },
  safeTurnPoint: {
    ...defaultNormalRouteTheme.safeTurnPoint,
    fillColor: MapThemeColor.success[200],
  },
  helperLine: {
    fillColor: addAlphaToHexColor(MapThemeColor.warning[400], 0.5),
  },
  footPoint: {
    ...defaultNormalRouteTheme.footPoint,
    fillColor: MapThemeColor.warning[400],
  },
};

export const defaultSelectRouteTheme = {
  startPoint: {
    ...defaultNormalRouteTheme.startPoint,
    outlineColor: MapThemeColor.warning[900],
    fillColor: MapThemeColor.warning[500],
  },
  endPoint: {
    ...defaultNormalRouteTheme.endPoint,
    fillColor: MapThemeColor.warning[500],
    outlineColor: MapThemeColor.warning[900],
  },
  turnPoint: {
    ...defaultNormalRouteTheme.turnPoint,
    fillColor: MapThemeColor.warning[500],
    outlineColor: MapThemeColor.warning[900],
  },
  safeStartPoint: {
    fillColor: MapThemeColor.warning[100],
    outlineColor: MapThemeColor.warning[900],
    textColor: MapThemeColor.warning[500],
  },
  safeEndPoint: {
    fillColor: MapThemeColor.warning[100],
    outlineColor: MapThemeColor.warning[900],
    textColor: MapThemeColor.warning[500],
  },
  deletePoint: {
    fillColor: MapThemeColor.danger[500],
    outlineColor: MapThemeColor.danger[500],
    textColor: MapThemeColor.neutral[100],
  },
  safeTurnPoint: {
    fillColor: MapThemeColor.warning[100],
    outlineColor: MapThemeColor.warning[900],
    textColor: MapThemeColor.warning[500],
  },
  helperLine: {
    fillColor: addAlphaToHexColor(MapThemeColor.warning[500], 0.5),
  },
  footPoint: {
    outlineColor: MapThemeColor.warning[900],
    fillColor: MapThemeColor.warning[500],
  },
};

export const RouteEditLayerStyle = {
  finishPoint: {
    outlineColor: MapThemeColor.warning[900],
    fillColor: MapThemeColor.warning[500],
    textColor: "#FFFFFF",
  },
  insertPoint: {
    normal: {
      outlineColor: MapThemeColor.success[900],
      fillColor: MapThemeColor.neutral[100],
      textColor: MapThemeColor.success[500],
    },
    hover: {
      outlineColor: MapThemeColor.success[900],
      fillColor: MapThemeColor.success[400],
      textColor: "#FFFFFF",
    },
    select: {
      outlineColor: MapThemeColor.success[900],
      fillColor: MapThemeColor.success[500],
      textColor: "#FFFFFF",
    },
  },
  errorFootPoint: {
    normal: {
      outlineColor: MapThemeColor.danger[900],
      fillColor: MapThemeColor.danger[100],
    },
    hover: {
      outlineColor: MapThemeColor.danger[900],
      fillColor: MapThemeColor.danger[400],
    },
    select: {
      outlineColor: MapThemeColor.danger[900],
      fillColor: MapThemeColor.danger[500],
    },
  },
  errorArea: {
    strokeColor: MapThemeColor.danger[500],
    fillColor: "rgba(204, 20, 20, 0)",
  },
};
