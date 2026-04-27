import { Extent } from "./IBase";

/**
 * 底图服务类型
 */
export enum BasemapLayerType {
  WMTS = "wmts",
  WMS = "wms",
  XYZ = "xyz",
  VECTOR = "vector",
  TENCENT = "tencent",
}

/**
 * 底图服务参数
 */
export interface SourceParams {
  /**
   * 图层唯一id
   */
  id: string;
  /**
   * 图层类型
   */
  type: BasemapLayerType;
  /**
   * 底图请求url
   */
  url: string;
  /**
   * 底图可见性
   */
  visible?: boolean;
  /**
   * 地图显示顺序
   */
  zIndex?: number;
  /**
   * 透明度
   */
  alpha?: number;
  /**
   * 最大显示层级
   */
  maxZoom?: number;
  /**
   * 最小显示层级
   */
  minZoom?: number;
  /**
   * 显示四至范围
   */
  extent?: Extent;
  /**
   * 投影
   */
  projection?: string;
  /**
   * 底图图层列表
   */
  layers: any;
}
/**
 * xyz底图服务参数
 */
export interface XyzSourceParams extends SourceParams {}
/**
 * wmts底图服务参数
 */
export interface WmtsSourceParams extends SourceParams {
  /**
   * WMTS请求的TileMatrix级别的标识符列表
   */
  matrixSetLabels?: Array<string>;
  /**
   * 用于WMTS请求的TileMatrixSet的标识符
   */
  tileMatrixSetID: string;
  /**
   * WMTS请求的图层名
   */
  layer: string;
  /**
   * WMTS请求的样式名称
   */
  tileStyle: string;
  /**
   * WMTS瓦片的格式，默认'image/jpeg'
   */
  format?: string;
}
/**
 * wms底图服务参数
 */
export interface WmsSourceParams extends SourceParams {
  /**
   * WMS的版本
   */
  version?: string;
  /**
   * WMS请求的图层名
   */
  layer: string;
  /**
   * WMS请求的样式名称
   */
  tileStyle?: string;
  /**
   * WMTS瓦片的格式，默认'image/jpeg'
   */
  format?: string;
}
