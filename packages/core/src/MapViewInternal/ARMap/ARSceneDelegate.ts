import {
  ARSceneDelegateImp,
  EngineType,
  ARSceneImp,
  IViewerDelegateImp,
} from "@gdu-gl/common";
import { ARScene as CesiumARScene } from "@gdu-gl/cesium";

export default class ARSceneDelegate implements ARSceneDelegateImp {
  private arScene: ARSceneImp;

  constructor(options: {
    engineType: EngineType;
    viewer: IViewerDelegateImp;
    mvtUrl?: string;
    demUrl?: string;
    styleUrl?: string;
  }) {
    const { engineType, viewer, mvtUrl, demUrl, styleUrl } = options;
    this.arScene = this.getClassByEngineType(engineType, {
      viewer: viewer.mapProviderDelegate.map,
      mvtUrl,
      demUrl,
      styleUrl,
    });
  }

  setTerrainHeight(lon: number, lat: number): void {
    this.arScene.setTerrainHeight(lon, lat);
  }

  get demHeight() {
    if (this.arScene) {
      return this.arScene.demHeight;
    }
    return 0;
  }

  setSceneOpacity(opacity: number, roadOpacity: number): void {
    this.arScene.setSceneOpacity(opacity, roadOpacity);
  }

  /**
   * 设置POI数据
   * @param lon 经度
   * @param lat 纬度
   */
  setPoiData(lon: number, lat: number): void {
    this.arScene.setPoiData(lon, lat);
  }

  getClassByEngineType(_engineType: EngineType, options?: any): ARSceneImp {
    return new CesiumARScene(options);
  }

  init(): void {
    this.arScene.init();
  }

  destroy(): void {
    this.arScene.destroy();
  }
}
