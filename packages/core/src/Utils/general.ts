import { GeometryManager, Viewer } from "@core/MapViewInternal";
import mapViewInternal from "@core/MapViewInternal/MapViewInternal";
import {
  EngineType,
  FeatureCollection,
  POLYGON_OUTLINE_PREFIX,
  RouteProgressParams,
  SurroundRouteProgressParams,
  isValidCoordinates,
  isValidLineString,
  OptimizePolyline,
} from "@gdu-gl/common";
import {
  getCesiumOptimizePolylineProgress,
  getCesiumRouteLineProgress,
  getCesiumSurroundRouteLineProgress,
} from "@gdu-gl/cesium";
import { isNil } from "lodash-es";

/**
 * 检测地图是否示例化完成
 * @param viewId
 * @param name
 */
export function existsMapInstance(viewId: string, name: string) {
  const viewer = mapViewInternal.getViewer(viewId);
  if (viewer && viewer.mapProviderDelegate?.map) {
    return viewer;
  }
  console.warn(`${name}:创建失败，未获取到地图示例`);
  return null;
}

/**
 * 通过properties.name名称去判断拾取到要素是外包围线还是真正要素
 * 带有POLYGON_OUTLINE_PREFIX前缀，这个是外包围线。我们不需要触
 * 发的各种事件，需要通过绑定在name上id去找到polygon，触发他的各
 * 种回调事件
 * @param geometryManager
 * @param pickObj
 */
export function getFeatureByName(
  geometryManager: GeometryManager,
  pickObj: any,
) {
  if (!geometryManager || !pickObj) {
    return undefined;
  }
  const feature = geometryManager.featureCache?.getFeatureIdByInstanceId(
    pickObj.id,
  );
  if (!feature) {
    return undefined;
  }

  /**
   * 如果查询到feature他的name字段有POLYGON_OUTLINE_PREFIX这个标识，代表这个feature是面的外包围框
   * 面这个feature的id就绑定在name里面，我们需要通过图层去查找这个外包围线的polygon，在去触发polygon
   * 的各种事件
   */
  if (
    feature.properties.name &&
    feature.properties.name.startsWith(POLYGON_OUTLINE_PREFIX)
  ) {
    // 通过拾取id查找到外包围线所在图层
    const layerId = geometryManager.featureCache?.getLayerIdByInstanceId(
      pickObj.id,
    );
    const layer = geometryManager.getLayer(layerId as string);
    // 拿到图层上的featureCollection
    const featureCollection = layer?.feature as FeatureCollection;
    // name字段删除外包围线的前缀，就是polygon的要素id
    const [, id] = feature.properties.name.split(POLYGON_OUTLINE_PREFIX);
    // 通过绑定在name上的polygon的id，去查询polygon这个要素
    return featureCollection?.features?.find(
      ({ properties }) => properties.id === id,
    );
  }

  return feature;
}

/**
 * 获取航线的进度
 * 通过core，抹平各个引擎获取航线进度的差异
 * @param viewer
 * @param params
 */
export function getRouteLineProgress(
  viewer: Viewer,
  params: RouteProgressParams,
) {
  try {
    isValidCoordinates(params?.uavPosition);
    isValidLineString(params?.line);
    if (isNil(params?.flyToPointIndex)) {
      return 0;
    }
    switch (viewer.engineType) {
      case EngineType.CESIUM:
        return getCesiumRouteLineProgress(params);
      default:
        return 0;
    }
  } catch (error) {
    return 0;
  }
}

export function getSurroundRouteLineProgress(
  viewer: Viewer,
  params: SurroundRouteProgressParams,
) {
  try {
    isValidCoordinates(params?.uavPosition);
    isValidLineString(params?.line);
    switch (viewer.engineType) {
      case EngineType.CESIUM:
        return getCesiumSurroundRouteLineProgress(params);
      default:
        return 0;
    }
  } catch (error) {
    return 0;
  }
}

/**
 * 获取cesium经过平滑后的线的进度
 * @param viewer
 * @param params
 */
export function getFakeRouteLineProgress(
  viewer: Viewer,
  params: RouteProgressParams & { optimizePolyline: OptimizePolyline },
) {
  try {
    isValidCoordinates(params?.uavPosition);
    isValidLineString(params?.line);
    if (isNil(params?.flyToPointIndex)) {
      return 0;
    }
    switch (viewer.engineType) {
      case EngineType.CESIUM:
        return getCesiumOptimizePolylineProgress(params);
      default:
        return 0;
    }
  } catch (error) {
    console.warn("获取航线进度失败", error);
    return 0;
  }
}

/**
 * 严格判断是否为数字
 * @param value
 * @returns {boolean} 是否为严格数字
 */
export function isStrictNumber(value: any): boolean {
  // 1. 类型必须是 number（排除字符串、布尔值等）
  // 2. 不能是 NaN（因为 NaN 的 typeof 也是 'number'）
  return typeof value === "number" && !Number.isNaN(value);
}
