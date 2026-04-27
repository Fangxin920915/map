import {
  BasemapLayerAbstract,
  BasemapLayerType,
  getSubdomains,
  normalizationExtent,
  SourceParams,
  WmsSourceParams,
  WmtsSourceParams,
  XyzSourceParams,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import BasemapImageryLayer from "@cesium-engine/BasicWidgets/Basemaps/Layers/BasemapImageryLayer";
import GCJ02TilingScheme from "@cesium-engine/BasicWidgets/Basemaps/TilingScheme/GCJ02TilingScheme";
import { clamp } from "lodash-es";

type ExtraParams = {
  url: string;
  subdomains: Array<string>;
  rectangle: Cesium.Rectangle;
  tilingScheme: Cesium.TilingScheme;
};

export class CesiumBasemapLayer extends BasemapLayerAbstract {
  declare map: Cesium.Viewer; // 地图实例

  declare nativeLayer: BasemapImageryLayer | null;

  protected createNativeLayer() {
    if (!this.config) {
      throw new Error("未提供图层配置信息");
    }
    const extraParams = this.getExtraParams(this.config);
    let provider: Cesium.ImageryProvider;
    switch (this.config.type) {
      case BasemapLayerType.WMS:
        provider = this.addWms(this.config as WmsSourceParams, extraParams);
        break;
      case BasemapLayerType.WMTS:
        provider = this.addWmts(this.config as WmtsSourceParams, extraParams);
        break;
      case BasemapLayerType.XYZ:
        provider = this.addXyz(this.config as XyzSourceParams, extraParams);
        break;
      case BasemapLayerType.TENCENT:
        provider = this.addTencent(this.config as XyzSourceParams, extraParams);
        break;
      default:
        throw new Error(`Unsupported type "${this.config.type}"`);
    }
    const imageryLayer = new BasemapImageryLayer(provider, {
      show: this.config.visible,
      zIndex: this.config.zIndex,
      alpha: this.config.alpha,
    });
    this.map.imageryLayers.add(imageryLayer);
    this.sortLayersByZIndex();
    return imageryLayer;
  }

  updateParams(config: SourceParams): void {
    if (this.nativeLayer) {
      this.map.imageryLayers.remove(this.nativeLayer, false);
    }
    this.config = config;
    this.nativeLayer = this.createNativeLayer();
  }

  setZIndex(zIndex: number): void {
    if (this.nativeLayer && this.config) {
      this.config.zIndex = zIndex;
      this.nativeLayer.zIndex = this.config.zIndex;
      this.sortLayersByZIndex();
    }
  }

  setVisible(visible: boolean): void {
    if (this.nativeLayer && this.config) {
      this.config.visible = visible;
      this.nativeLayer.show = this.config.visible;
    }
  }

  setAlpha(alpha: number): void {
    if (this.nativeLayer && this.config) {
      this.config.alpha = clamp(alpha, 0, 1);
      this.nativeLayer.alpha = this.config.alpha;
    }
  }

  private addXyz(params: XyzSourceParams, extraParams: ExtraParams) {
    return new Cesium.UrlTemplateImageryProvider({
      url: extraParams.url,
      maximumLevel: params.maxZoom,
      minimumLevel: params.minZoom,
      rectangle: extraParams.rectangle,
      subdomains: extraParams.subdomains,
      tilingScheme: extraParams.tilingScheme,
    });
  }

  private addTencent(params: XyzSourceParams, extraParams: ExtraParams) {
    return new Cesium.UrlTemplateImageryProvider({
      url: extraParams.url,
      maximumLevel: params.maxZoom,
      minimumLevel: params.minZoom,
      subdomains: extraParams.subdomains,
      rectangle: extraParams.rectangle,
      tilingScheme: new GCJ02TilingScheme(),
      customTags: {
        // @ts-ignore
        sx(imageryProvider: any, x: number) {
          return x >> 4;
        },
        // @ts-ignore
        sy(imageryProvider: any, x: number, y: number, level: number) {
          return ((1 << level) - y) >> 4;
        },
      },
    });
  }

  addWmts(params: WmtsSourceParams, extraParams: ExtraParams) {
    return new Cesium.WebMapTileServiceImageryProvider({
      url: extraParams.url,
      layer: params.layer,
      maximumLevel: params.maxZoom,
      minimumLevel: params.minZoom,
      rectangle: extraParams.rectangle,
      subdomains: extraParams.subdomains,
      tileMatrixSetID: params.tileMatrixSetID,
      tileMatrixLabels: params.matrixSetLabels,
      tilingScheme: extraParams.tilingScheme,
      style: params.tileStyle,
      format: params.format,
    });
  }

  addWms(params: WmsSourceParams, extraParams: ExtraParams) {
    return new Cesium.WebMapServiceImageryProvider({
      url: extraParams.url,
      layers: params.layer,
      maximumLevel: params.maxZoom,
      minimumLevel: params.minZoom,
      rectangle: extraParams.rectangle,
      subdomains: extraParams.subdomains,
      tilingScheme: extraParams.tilingScheme,
      parameters: {
        transparent: true,
        STYLES: params.tileStyle,
        VERSION: params.version,
        FORMAT: params.format,
        tiled: true,
      },
    });
  }

  /**
   * 获取处理过后的参数
   * 这里主要是将url中{1-3}转换为{s}，
   * 并设置参数{s}对应的属性为subdomains:[1,2,3]
   * 获取四至范围
   * @param params
   */
  getExtraParams(params: SourceParams) {
    const { url, subdomains } = getSubdomains(params.url);
    const [west, south, east, north] = normalizationExtent(params.extent);
    const rectangle = Cesium.Rectangle.fromDegrees(west, south, east, north);
    let tilingScheme: Cesium.TilingScheme;
    switch (params.projection?.toUpperCase()) {
      case "EPSG:4326":
        tilingScheme = new Cesium.GeographicTilingScheme();
        break;
      case "GCJ02":
        tilingScheme = new GCJ02TilingScheme();
        break;
      default:
        tilingScheme = new Cesium.WebMercatorTilingScheme();
        break;
    }

    return { url, subdomains, rectangle, tilingScheme };
  }

  /**
   * 根据zIndex对imagerLayer图层进行排序
   */
  sortLayersByZIndex() {
    const imageryLayers: BasemapImageryLayer[] =
      // @ts-ignore
      this.map.imageryLayers._layers;
    imageryLayers.forEach((_, j) => {
      for (let i = 0; i < imageryLayers.length - 1 - j; i++) {
        const current = imageryLayers[i].zIndex ?? Number.MIN_SAFE_INTEGER;
        const next = imageryLayers[i + 1].zIndex ?? Number.MIN_SAFE_INTEGER;
        if (current > next) {
          const temp = imageryLayers[i];
          imageryLayers[i] = imageryLayers[i + 1];
          imageryLayers[i + 1] = temp;
          // @ts-ignore
          this.map.imageryLayers._update();
          this.map.imageryLayers.layerMoved.raiseEvent(temp, [i + 1], i);
        }
      }
    });
  }

  remove(): void {
    if (this.nativeLayer) {
      this.map.imageryLayers.remove(this.nativeLayer, true);
      this.nativeLayer = null;
    }
  }
}
