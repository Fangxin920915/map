import { mapViewInternal } from "@gdu-gl/core";
import * as Cesium from "cesium";

export function mountedDebugger() {
  window.__GDU_MAP_LIB__ = {
    mapViewInternal,
    version: __APP_VERSION__,
    buildTime: __BUILD_TIME__,
    // @ts-ignore
    cesiumVersion: Cesium.VERSION,
  };
}
