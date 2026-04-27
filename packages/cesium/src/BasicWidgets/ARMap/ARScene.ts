import * as Cesium from "cesium";
import { ARSceneImp } from "@gdu-gl/common";
import { GridBasedLabelManager, PointData } from "./GridBaseLabelManager";

export default class ARScene implements ARSceneImp {
  private _viewer: Cesium.Viewer;

  private _demHeight: number;

  private _demUrl: string | undefined;

  private _mvtUrl: string | undefined;

  private _gridBaseLabelManager: GridBasedLabelManager;

  constructor(options: {
    viewer: Cesium.Viewer;
    mvtUrl?: string;
    demUrl?: string;
  }) {
    this._viewer = options.viewer;
    this._demUrl = options.demUrl;
    this._mvtUrl = options.mvtUrl;
    this._demHeight = 0;

    this._gridBaseLabelManager = new GridBasedLabelManager(this._viewer, {
      gridSize: 300,
      collisionDetectorOptions: {
        padding: 0,
        prioritizeCloser: true,
        maxOverlapRatio: 0,
      },
    });
  }

  get demHeight() {
    return this._demHeight;
  }

  async setTerrainHeight(lon: number, lat: number) {
    if (!this._demUrl) return;
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(
      this._demUrl,
      {
        requestWaterMask: false,
      },
    );
    const positions = [Cesium.Cartographic.fromDegrees(lon, lat)];
    const updatedPositions = await Cesium.sampleTerrainMostDetailed(
      terrainProvider,
      positions,
    );
    if (updatedPositions && updatedPositions.length > 0) {
      this._demHeight = updatedPositions[0].height;
    }
  }

  /**
   * 派发爬虫任务，爬取数据
   * @param lon
   * @param lat
   */
  setCategoryTileTask(lon: string | number, lat: string | number) {
    Cesium.Resource.fetch({
      url: `${this._mvtUrl}/api/v1/search/category_tile`,
      queryParameters: {
        lon,
        lat,
      },
    })?.catch((e) => console.warn(e));
  }

  setPoiData(lon: number, lat: number): void {
    // this.setCategoryTileTask(lon, lat);
    // @ts-ignore
    Cesium.Resource.fetch({
      url: `${this._mvtUrl}/api/v1/search/query_poi_by_tile`,
      queryParameters: {
        lon,
        lat,
      },
    })
      .then((res: any) => {
        const r: any = JSON.parse(res);
        if (!r.data || !r.data) return;

        const points: PointData[] = [];
        r.data.forEach((v: any) => {
          if (v.location && v.location.lng && v.location.lat) {
            points.push({
              id: v.id,
              lng: v.location.lng,
              lat: v.location.lat,
              title: v.title,
            });
          }
        });

        this._gridBaseLabelManager.addPoints(points);
      })
      .catch((e: any) => {
        console.error(e);
      });
    // @ts-ignore
    Cesium.Resource.fetch({
      url: `${this._mvtUrl}/api/v1/search/query_poi_by_point`,
      queryParameters: {
        lon,
        lat,
      },
    })
      .then((res: any) => {
        const r: any = JSON.parse(res);
        console.log(r);
        if (!r.data) return;
        const pois: PointData[] = [];
        r.data.forEach((v: any) => {
          pois.push({
            ...v,
            title: v.name,
          });
        });
        this._gridBaseLabelManager.addPoints(pois);
      })
      .catch((e: any) => {
        console.error(e);
      });
  }

  setSceneOpacity(opacity: number, roadOpacity: number): void {
    const imageLayer = this._viewer.imageryLayers.get(0);
    if (imageLayer) {
      imageLayer.alpha = opacity * roadOpacity;
    }
    for (
      let i = 0;
      i < this._gridBaseLabelManager.labelCollection.length;
      i++
    ) {
      const label = this._gridBaseLabelManager.labelCollection.get(i);
      label.fillColor = label.fillColor.withAlpha(opacity);
    }
  }

  destroy(): void {
    this._gridBaseLabelManager.destroy();
  }

  init() {
    this.globeSetting();
  }

  globeSetting() {
    if (this._viewer.isDestroyed()) return;
    this._viewer.imageryLayers.removeAll();
    const mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;

    // mapbox://styles/gongruiqiang/cm48dyqo7019101r21n5k5xzs
    // mapbox://styles/gdu/cmhmw8l1x001w01sc1klf27om
    // 创建MapboxStyleImageryProvider实例
    const layer = new Cesium.MapboxStyleImageryProvider({
      url: "https://api.mapbox.com/styles/v1/",
      username: "gdu",
      styleId: "cmhmw8l1x001w01sc1klf27om",
      scaleFactor: true,
      // minimumLevel: 10,
      maximumLevel: 18,
      accessToken: mapboxAccessToken,
    });
    this._viewer.imageryLayers.addImageryProvider(layer);
    // 禁用所有鼠标交互
    this._viewer.scene.screenSpaceCameraController.enableRotate = false; // 禁止旋转（左键拖动）
    this._viewer.scene.screenSpaceCameraController.enableZoom = false; // 禁止缩放（滚轮/右键拖动）
    this._viewer.scene.screenSpaceCameraController.enableTranslate = false; // 禁止平移（中键/Shift+左键）
    this._viewer.scene.screenSpaceCameraController.enableTilt = false; // 禁止倾斜（Ctrl+左键）
    this._viewer.scene.screenSpaceCameraController.enableLook = false; // 禁止视角调整（辅助控制）
  }
}
