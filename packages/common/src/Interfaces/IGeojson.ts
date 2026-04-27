import { PopupPosition } from "@common/Types";

/**
 * 要素类型
 */
export type FeatureType = "Feature" | "FeatureCollection";

/**
 * 几何类型
 * 支持多边形
 */
export type GeometryType =
  | "Polygon"
  | "Point"
  | "LineString"
  | "MultiPolygon"
  | "MultiLineString"
  | "MultiPoint"
  | "GroundPolygon"
  | "GroundPoint"
  | "GroundLineString"
  | "GroundMultiPolygon"
  | "GroundMultiLineString"
  | "GroundMultiPoint"
  | "Wall"
  | "Popup";

// 定义坐标对类型，通常表示为 [经度, 纬度, 高度?]
export type CoordinatePair = [number, number, number?];

// 定义 Point 类型的 coordinates 属性，是一个坐标对
export type PointCoordinates = CoordinatePair;

// 定义 MultiPoint 类型的 coordinates 属性，是坐标对的数组
export type MultiPointCoordinates = CoordinatePair[];

// 定义 LineStringChild 类型的 coordinates 属性，是坐标对的数组
export type LineStringCoordinates = CoordinatePair[];

// 定义 MultiLineStringChild 类型的 coordinates 属性，是线串（坐标对数组）的数组
export type MultiLineStringCoordinates = LineStringCoordinates[];

// 定义单个环的类型，是由坐标对组成的数组
export type Ring = CoordinatePair[];

// 定义 Polygon 类型的 coordinates 属性，是环的数组
export type PolygonCoordinates = Ring[];

// 定义 MultiPolygonChild 类型的 coordinates 属性，是多边形（环数组）的数组
export type MultiPolygonCoordinates = PolygonCoordinates[];

/**
 * 坐标类型
 */
export type Coordinates =
  | MultiPolygonCoordinates
  | PolygonCoordinates
  | MultiLineStringCoordinates
  | LineStringCoordinates
  | MultiPointCoordinates
  | PointCoordinates;

// export type Coordinates =
//   | Array<Array<Array<Array<number>>>>
//   | Array<Array<Array<number>>>
//   | Array<Array<number>>
//   | Array<number>;

/**
 * 外观类型，对应cesium的appearance构造函数
 */
export type AppearanceType =
  | "MaterialAppearance"
  | "PerInstanceColorAppearance"
  | "PolylineMaterialAppearance";

/**
 * 材质类型，对应cesium和各类拓展材质类型
 */
export type MaterialType =
  | "Color"
  | "Grid"
  | "Image"
  | "PolylineGlow"
  | "PolylineDash"
  | "PolylineArrow"
  | "PolylineOutline"
  | "ArrowLineString"
  | "OutlineDashLineString"
  | "FadeWall";
/**
 * 顶点数据类型，定义了与顶点相关的各种属性。
 */
export type AttributeProperties = {
  /**
   * 顶点的颜色属性，通常表示为十六进制颜色代码或颜色名称的字符串。
   */
  color?: string;

  /**
   * 一个布尔值，用于指示顶点是否应当在渲染时被显示。
   */
  show?: boolean;

  /**
   * 定义了一个近距离阈值，通常用于范围检测或视锥体裁剪。此数值表示顶点到观察者的最小距离。
   */
  near?: number;

  /**
   * 定义了一个远距离阈值，也常用于范围检测或视锥体裁剪。此数值表示顶点到观察者的最大距离。
   */
  far?: number;
  /**
   * 禁止深度检查距离
   */
  disableDepthTestDistance?: number;
  /**
   * 透明度距离变化近面距离
   */
  translucencyNear?: number;
  /**
   * 透明度距离变化近面透明度
   */
  translucencyNearValue?: number;
  /**
   * 透明度距离变化远面距离
   */
  translucencyFar?: number;
  /**
   * 透明度距离变化远面透明度
   */
  translucencyFarValue?: number;
};

export type AppearanceProperties = {
  /**
   * 是否透明
   */
  translucent?: boolean;
  /**
   * 是否顶部底部闭合
   */
  closed?: boolean;
  /**
   * 材质对象
   */
  material?: any;
  /**
   * 顶点着色器
   */
  vertexShaderSource?: string;
  /**
   * 片元着色器
   */
  fragmentShaderSource?: string;
  /**
   * 渲染参数
   */
  renderState?: any;
};
export type PrimitiveProperties = {
  /**
   * 异步加载
   */
  asynchronous?: boolean;
  /**
   * 是否允许被选取
   */
  allowPicking?: boolean;
};
export type LineStringProperties = {
  loop?: boolean;
  width?: number;
};

export type WallProperties = {
  maxHeight?: number;
  minHeight?: number;
};

export type PolygonProperties = {
  height?: number;
  extrudedHeight?: number;
};

export type PopupProperties = {
  /** 弹框dom的层级 */
  zIndex?: number;
  contentDom?: HTMLElement;
  clampToGround?: boolean;
  offset?: [number, number];
  anchor?: PopupPosition;
};

// 定义锚点位置联合类型
type HorizontalAnchor = "left" | "center" | "right";
type VerticalAnchor = "top" | "center" | "bottom";

// 组合成有效格式 (自动提示所有可能组合)
export type Anchor = `${HorizontalAnchor}-${VerticalAnchor}` | "center"; // 简写形式 (等价于 center-center)

export type SymbolProperties = {
  clampToGround?: boolean;
  /**
   * 文字内容
   */
  textContent?: string;
  /**
   * 文字颜色
   */
  textColor?: string;
  /**
   * 文字大小
   */
  textSize?: number;
  /**
   * 文字字重
   */
  textFontWeight?: number | string;
  /**
   * 文字描边
   */
  textHalo?: {
    /**
     * 描边颜色
     */
    color?: string;
    /**
     * 描边宽度
     */
    width?: number;
  };
  /**
   * 文字偏移
   */
  textOffset?: [number, number];
  /**
   * 图标尺寸
   */
  iconSize?: [number, number];
  /**
   * 几何形状
   */
  shapeType?: "circle" | "rect" | "none";
  /**
   * 几何颜色
   */
  shapeColor?: string;
  /**
   * 几何边框宽度
   */
  borderWidth?: number;
  /**
   * 几何边框颜色
   */
  borderColor?: string;
  /**
   * 图标偏移
   */
  iconOffset?: [number, number];
  /**
   * 图标对齐锚点
   */
  iconAnchor?: Anchor;
  /**
   * 文字对齐锚点
   */
  textAnchor?: Anchor;
  /**
   * 图标图片地址
   */
  iconUrl?: string;
  /**
   * 文字背景色
   */
  textBackgroundColor?: string;
  /**
   * 文字背景边距
   */
  textBackgroundPadding?: [number, number];
  /**
   * 文字背景圆角
   */
  textBackgroundRadius?: number;
  /**
   * 文字背景边框
   */
  textBackgroundBorderWidth?: number;
  /**
   * 文字边框颜色
   */
  textBackgroundBorderColor?: string;
};
export type IconProperties = {
  icon?: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  width?: number;
  height?: number;
};

export type GeometryPropertiesAppearance = {
  /**
   * 外观类型
   */
  appearanceType: AppearanceType;
  /**
   * 材质类型
   */
  materialType: MaterialType;
  /**
   * 顶点属性
   */
  attributeProperties: AttributeProperties;
  /**
   * 材质属性
   */
  materialProperties?: any;
  /**
   * 外观参数
   */
  appearanceProperties?: AppearanceProperties;
  /**
   * 图元参数
   */
  primitiveProperties?: PrimitiveProperties;
  /**
   * 线属性
   */
  lineStringProperties?: LineStringProperties;
  /**
   * 线属性
   */
  wallProperties?: WallProperties;
  /**
   * 面属性
   */
  polygonProperties?: PolygonProperties;
  /**
   * 图标属性
   */
  symbolProperties?: SymbolProperties;
  /**
   * 弹出层属性
   */
  popUpProperties?: PopupProperties;
  /**
   * 图标属性
   */
  iconProperties?: IconProperties;
};

/**
 * 几何属性
 */
export type GeometryProperties = {
  /**
   * id属性，必须唯一
   */
  id: string;
  /**
   * 外观属性
   */
  appearance: GeometryPropertiesAppearance;
  [key: string]: any;
};

/**
 * 要素
 */
export type Feature = {
  /**
   * 要素类型
   */
  type: FeatureType;
  /**
   * 几何类型
   */
  geometry: {
    /**
     * 几何类型
     */
    type: GeometryType;
    /**
     * 坐标参数
     */
    coordinates: Coordinates;
  };
  /**
   * 属性
   */
  properties: GeometryProperties;
};

export type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<Feature>;
};
