import { Anchor, Coordinates, ShapeType } from "@gdu-gl/common";
import { BaseProps } from "./BaseProps";

/**
 * 要素点属性
 */
export interface Features extends BaseProps {
  /** 点位名称 */
  name?: number | string;
  /** 要素附带信息,在拾取要素里面会拿到这个值 */
  featureProperties?: any;
  /** 坐标点，必传 */
  coordinates?: Coordinates | null;
  /** 该要素的在该图层内的层级 */
  zIndex?: number;
  /** 该要素的可见性 */
  visible?: boolean;
  /** 该要素是否紧贴地面 */
  clampToGround?: boolean;
}

/**
 * 线要素样式
 */
export interface LineStringProps extends Features {
  /** 线的填充色 */
  strokeColor?: string;
  /** 线的虚线间隔颜色 */
  strokeGapColor?: string;
  /** 线的宽度 */
  strokeWidth?: number;
  /** 线的边框颜色 */
  strokeOutlineColor?: string;
  /** 线的边框宽度 */
  strokeOutlineWidth?: number;
  /**
   * 虚线间隔 <br>
   * [`x:实线长度`,`y:间隔长度`]
   */
  lineDash?: Array<number>;
  /**
   * 是否绘制闭合线
   */
  ring?: boolean;
  /**
   * 是否关闭深度检测
   */
  disableDepthTest?: boolean;
}

/**
 * 面要素样式
 */
export interface PolygonProps extends Omit<LineStringProps, "ring"> {
  /** 面的填充色 */
  fillColor?: string;
}

/**
 * 点要素样式
 */
export interface PointProps extends Features {
  /**
   * 关闭深度检测的距离
   * 如果需要点位一直在最上层，可以传递`Number.POSITIVE_INFINITY`
   */
  disableDepthTestDistance?: number;

  /** 点位锚点位置 */
  anchor?: Anchor;
  /**
   * 点位偏移量（shape和icon都使用这个设置偏移量） <br>
   * [`x:水平偏移量`,`y:垂直偏移量`]
   */
  offset?: Array<number>;
  /** 点位形状，默认是圆形 */
  shapeType?: ShapeType;
  /** 点的边线的填充色 */
  shapeOutlineColor?: string;
  /** 点的边线的宽度 */
  shapeOutlineWidth?: number;
  /** 点的填充色 */
  shapeFillColor?: string;
  /** 点大小 */
  shapeSize?: number;
  /** 图标内容 */
  iconSrc?: string | Element;
  /** 图标宽度 */
  iconWidth?: number;
  /** 图标高度 */
  iconHeight?: number;
  /** 文字内容 */
  text?: string;
  /**
   * 图标偏移量 <br>
   * [`x:文字水平偏移量`,`y:文字垂直偏移量`]
   */
  textOffset?: number[];
  /** 文字颜色 */
  textColor?: string;
  /** 文字大小 */
  textSize?: number;
  /** 文字字重 */
  textFontWeight?: number | string;
  /** 文字边线颜色 */
  textOutlineColor?: string;
  /** 文字边线宽度 */
  textOutlineWidth?: number;
  /** 文字锚点位置 */
  textAnchor?: Anchor;
  /** 文字背景色 */
  textBackgroundColor?: string;
  /** 文字背景边距 */
  textBackgroundPadding?: number[];
  /** 文字背景圆角 */
  textBackgroundRadius?: number;
  /** 文字背景边框 */
  textBackgroundBorderWidth?: number;
  /** 文字边框颜色 */
  textBackgroundBorderColor?: string;
}

export interface FeatureEventEmits {
  /**
   * 左键点击要素
   */
  (event: "click", coordinates: number[]): void;
  /**
   * 左键双击要素（会触发两次单击事件）
   */
  (event: "dblclick", coordinates: number[]): void;
  /**
   * 右键点击要素
   */
  (event: "contextmenu", coordinates: number[]): void;
  /**
   * 鼠标划入要素事件
   */
  (event: "mouseEnter", coordinates: number[]): void;
  /**
   * 鼠标在要素上移动事件
   */
  (event: "mouseOver", coordinates: number[]): void;
  /**
   * 鼠标划出要素
   */
  (event: "mouseLeave", coordinates: number[]): void;
}
