import { Viewer } from "@core/MapViewInternal";
import {
  pickPositionByPixel as pickPositionByPixelCesium,
  pickPositionByDirection as pickPositionByDirectionCesium,
} from "@gdu-gl/cesium";
import { EngineType, PointCoordinates } from "@gdu-gl/common";

export function pickPositionByPixel(
  viewer: Viewer,
  pixel: { x: number; y: number },
) {
  if (viewer.engineType === EngineType.CESIUM) {
    return pickPositionByPixelCesium(
      viewer.mapProviderDelegate.map,
      pixel as any,
    );
  }
  return undefined;
}

/**
 * 根据方向获取该点姿态与地球的交点坐标
 * @param viewer
 * @param direction
 */
export function pickPositionByDirection(
  viewer: Viewer,
  direction: {
    position: PointCoordinates;
    heading: number;
    pitch: number;
    roll: number;
  },
) {
  if (viewer.engineType === EngineType.CESIUM) {
    return pickPositionByDirectionCesium(
      viewer.mapProviderDelegate.map,
      direction,
    );
  }
  return undefined;
}
