import { PointCoordinates } from "./IGeojson";

export enum ModelType {
  /**
   * GLTF模型类型
   */
  GLTF = "GLTF_Model",
  /**
   * 3dTile模型类型
   */
  TILES = "3D_TILE_MODEL",
}

/**
 * 高度参考类型
 * 定义点、模型等对象的高度计算方式
 */
export enum HeightReferenceType {
  /** 无高度参考（绝对高度） */
  NONE = 1,
  /** 相对地面高度 */
  CLAMP_TO_GROUND = 2,
  /** 相对地形高度（添加偏移量） */
  RELATIVE_TO_GROUND = 3,
  /** 相对海面高度 */
  RELATIVE_TO_SEA_LEVEL = 4,
}
/**
 * 模型
 */
export interface ModelFeature {
  /**
   * 模型类型
   */
  type: ModelType;
  /**
   * 模型几何
   */
  geometry: {
    /**
     * 坐标
     */
    coordinates?: PointCoordinates;
    /**
     * 偏移
     */
    offset?: [number, number, number];
    /**
     * 旋转
     */
    rotation?: [number, number, number];
    /**
     * 缩放
     */
    scale?: [number, number, number];
  };
  properties: {
    id: string;
    url: string;
    /**
     * 是否自动缩放模型到合适大小
     */
    autoZoom?: boolean;
    /**
     * 模型贴地方式
     */
    heightReferenceProperties?: {
      heightReference?: HeightReferenceType;
    };
    /**
     * 模型轮廓线
     */
    outlineProperties?: {
      outlineWidth?: number;
      outlineColor?: string;
    };
    /**
     * 模型属性设置，可见性，深度检测，近远裁剪
     */
    attributesProperties?: {
      show?: boolean;
      near?: number;
      far?: number;
      disableDepthTestDistance?: number;
    };
    /**
     * 模型颜色设置，透明度设置，混合模式设置
     */
    appearanceProperties?: {
      color?: string;
      opacity?: number;
      colorBlendMode?: string;
    };
    /**
     * 模型图元设置，最小像素大小，异步加载
     */
    primitiveProperties?: {
      minimumPixelSize?: number;
      asynchronous?: boolean;
      disableDepthTestDistance?: number;
    };
    /**
     * 模型动画属性设置，播放，循环，速度，动画节点名称
     */
    animateProperties?: {
      play: boolean;
      loop: boolean;
      speed: number;
      animateNodeName: string;
    };
    /**
     * 3dtile属性设置，预加载，动态屏幕空间误差，最大屏幕空间误差，最大加载瓦片数，跳过层级，加载兄弟层级，立即加载所需层级
     */
    tilesetProperties?: {
      preloadWhenHidden?: boolean;
      dynamicScreenSpaceError?: boolean;
      maximumScreenSpaceError?: number;
      maximumNumberOfLoadedTiles?: number;
      skipLevels?: number;
      loadSiblings?: boolean;
      immediatelyLoadDesiredLevelOfDetail?: boolean;
    };
    [key: string]: any;
  };
}

export interface ModelFeatureCollection {
  type: "ModelFeatureCollection";
  features: Array<ModelFeature>;
}

/**
 * 模型类接口
 */
export interface ModelImp {
  /**
   * 模型是否加载完成
   */
  ready: boolean;
  /**
   * 模型显示隐藏
   */
  show: boolean;
  /**
   * 模型id
   */
  bucketId: string;
  /**
   * 模型类型
   */
  modelType: ModelType;
  /**
   * 模型初始化
   */
  init(): void;
  /**
   * 更新模型位置
   * @param modelFeature 模型属性
   * @returns
   */
  updateModelMatrix(modelFeature: ModelFeature): void;
  /**
   * 更新模型外边框属性
   * @param modelFeature 模型属性
   * @returns
   */
  updateOutlineProperties(modelFeature: ModelFeature): void;
  /**
   * 更新模型颜色属性
   * @param modelFeature 模型属性
   * @returns
   */
  updateAppearanceProperties(modelFeature: ModelFeature): void;
  /**
   * 更新模型属性
   * @param modelFeature 模型属性
   * @returns
   */
  updateAttributesProperties(modelFeature: ModelFeature): void;
  /**
   * 更新模型贴地方式
   * @param modelFeature 模型属性
   * @returns
   */
  updateHeightReferenceProperties(modelFeature: ModelFeature): void;
  /**
   * 更新模型动画属性
   * @param modelFeature 模型属性
   * @returns
   */
  updateAnimationProperties(modelFeature: ModelFeature): void;
  /**
   * 更新模型图元属性
   * @param modelFeature 模型属性
   * @returns
   */
  updatePrimitiveProperties(modelFeature: ModelFeature): void;
  /**
   * 更新模型图元属性
   * @param modelFeature 模型属性
   * @returns
   */
  updateTilesetProperties(modelFeature: ModelFeature): void;
  /**
   * 销毁模型
   */
  destroy(): void;

  update(frameState: any): void;
}
export interface ModelCollectionImp {
  addModel(layerId: string, model: ModelFeature): void;
  removeModel(id: string): void;
  update(frameState: any): void;
  /**
   * 更新模型外边框属性
   * @returns
   * @param id
   * @param outlineProperties
   */
  updateOutlineProperties(
    id: string,
    outlineProperties?: ModelFeature["properties"]["outlineProperties"],
  ): void;
  /**
   * 更新模型颜色属性
   * @returns
   * @param id
   * @param appearanceProperties
   */
  updateAppearanceProperties(
    id: string,
    appearanceProperties: ModelFeature["properties"]["appearanceProperties"],
  ): void;
  /**
   * 更新模型属性
   * @returns
   * @param id
   * @param attributesProperties
   */
  updateAttributesProperties(
    id: string,
    attributesProperties: ModelFeature["properties"]["attributesProperties"],
  ): void;
  /**
   * 更新模型贴地方式
   * @returns
   * @param id
   * @param heightReferenceProperties
   */
  updateHeightReferenceProperties(
    id: string,
    heightReferenceProperties: ModelFeature["properties"]["heightReferenceProperties"],
  ): void;
  /**
   * 更新模型动画属性
   * @returns
   * @param id
   * @param animateProperties
   */
  updateAnimationProperties(
    id: string,
    animateProperties: ModelFeature["properties"]["animateProperties"],
  ): void;
  /**
   * 更新模型图元属性
   * @returns
   * @param id
   * @param primitiveProperties
   */
  updatePrimitiveProperties(
    id: string,
    primitiveProperties: ModelFeature["properties"]["primitiveProperties"],
  ): void;
  /**
   * 更新模型图元属性
   * @returns
   * @param id
   * @param tilesetProperties
   */
  updateTilesetProperties(
    id: string,
    tilesetProperties: ModelFeature["properties"]["tilesetProperties"],
  ): void;

  destroy(): void;
}
