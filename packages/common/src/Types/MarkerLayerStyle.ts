// 导入坐标类型定义（用于描述地理要素的坐标信息）
import { Coordinates } from "@common/Interfaces";

/**
 * 标准图标名称
 */
export enum PointerType {
  Anchor = "anchor",
  Flag = "flag",
  Pin = "pin",
  Location = "location",
  Circle = "circle",
}

/**
 * 标记要素的几何类型枚举
 * 用于指定标记要素是点、线还是面类型
 */
export enum GeoFeatureType {
  Point = "Point", // 点类型要素
  LineString = "LineString", // 线类型要素
  Polygon = "Polygon", // 面类型要素
  Circle = "Circle", // 圆类型要素
}

/**
 * 标记要素的线条样式枚举
 * 用于指定线要素或面要素边界的线条类型
 */
export enum MarkerStrokeType {
  Solid = "solid", // 实线
  Dashed = "dashed", // 虚线
}

/**
 * 用于指定文本背景形状
 */
export enum MarkerTextShapeType {
  Outline = "outline", // 文字有描边
  Circle = "circle", // 文字有背景圆
}

/**
 * 标记要素的基础样式接口
 * 所有标记要素（点、线、面）共有的样式属性
 */
export interface MarkerBaseStyle {
  textBackgroundShape?: MarkerTextShapeType; // 文本背景形状，默认是有文字描边
  textSize?: number; // 文本大小（可选，单位：像素）
  text?: string; // 要素上显示的文本内容（可选）
  theme: string; // 样式主题（必填，用于统一控制样式风格）
  visible?: boolean; // 是否可见（可选，默认为true）
  remark?: string; // 备注（可选）
}

/**
 * 点标记样式接口
 * 继承基础样式，并添加点要素特有的图标属性
 */
export interface MarkerPointStyle
  extends Omit<MarkerBaseStyle, "textBackgroundShape"> {
  iconSize: number; // 图标大小（必填，单位：像素）
  iconName: PointerType; // 图标名称（必填，用于关联具体图标资源）
}

/**
 * 线标记样式接口
 * 定义线要素的线条样式属性
 */
export interface MarkerLineStringStyle extends MarkerBaseStyle {
  strokeType: MarkerStrokeType; // 线条类型（必填，取自MarkerStrokeType枚举）
  strokeWidth: number; // 线条宽度（必填，单位：像素）
}

/**
 * 面标记样式接口
 * 定义面要素的样式属性（包含边界线条和填充样式）
 */
export interface MarkerPolygonStyle extends MarkerBaseStyle {
  strokeType: MarkerStrokeType; // 边界线条类型（必填，取自MarkerStrokeType枚举）
  strokeWidth: number; // 边界线条宽度（必填，单位：像素）
  fillOpacity: number; // 填充透明度（必填，取值范围：0-1，0为完全透明，1为完全不透明）
}

/**
 * 圆标记样式接口
 * 定义圆要素的样式属性（包含边界线条和填充样式）
 */
export interface MarkerCircleStyle extends MarkerPolygonStyle {}

/**
 * 标记要素接口
 * 完整描述一个标记要素的结构，包含几何信息和属性信息
 */
export interface MarkerFeature {
  geometry: {
    type: GeoFeatureType; // 几何类型（必填，指定是点/线/面）
    coordinates: Coordinates; // 坐标信息（必填，符合Coordinates类型格式的地理坐标）
    radius?: number; // 圆半径（为圆类型时必填，单位：km ）
  };
  properties: {
    id: string | number; // 要素唯一标识（必填，可用于要素定位和管理）
    // 样式配置（必填，根据几何类型匹配对应样式接口）
    options:
      | MarkerPointStyle
      | MarkerLineStringStyle
      | MarkerPolygonStyle
      | MarkerCircleStyle;
  };
}

/**
 * 绘制工具配置选项接口
 * 用于初始化绘制工具时指定绘制类型和对应样式
 */
export interface DrawToolOptions {
  type: GeoFeatureType; // 绘制类型（必填，指定要绘制的要素几何类型）
  // 绘制样式（必填，与绘制类型匹配的样式配置）
  style:
    | MarkerPointStyle
    | MarkerLineStringStyle
    | MarkerPolygonStyle
    | MarkerCircleStyle;
}
