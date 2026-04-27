/* eslint-disable @typescript-eslint/naming-convention */
import { mapViewInternal } from "@gdu-gl/core";

declare global {
  const __APP_VERSION__: string;
  const __BUILD_TIME__: string;

  interface Window {
    __GDU_MAP_LIB__: {
      mapViewInternal: typeof mapViewInternal;
      version: string;
      buildTime: string;
      cesiumVersion: string;
    };
  }
}

// 确保这个文件被视为模块
export {};
