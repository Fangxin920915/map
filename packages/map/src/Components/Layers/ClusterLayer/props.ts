import { PointCoordinates, ShapeType } from "@gdu-gl/common";
import { BaseProps } from "../../../Types";

/**
 * 聚合点样式配置
 */
export interface ClusterStyleConfig {
  /** 填充色 */
  color?: string;
  /** 边框色 */
  outlineColor?: string;
  /** 边框宽度 */
  outlineWidth?: number;
  /** 大小(像素) */
  size?: number;
  /** 图标 URL（传入后 color/size 等形状配置不生效） */
  iconUrl?: string;
  /** 图标宽度 */
  iconWidth?: number;
  /** 图标高度 */
  iconHeight?: number;
  /** 聚合数字文字颜色 */
  textColor?: string;
  /** 聚合数字文字大小 */
  textSize?: number;
}

/**
 * 散点样式配置
 */
export interface PointStyleConfig {
  /** 形状类型 */
  shapeType?: ShapeType;
  /** 填充色 */
  color?: string;
  /** 边框色 */
  outlineColor?: string;
  /** 边框宽度 */
  outlineWidth?: number;
  /** 大小(像素) */
  size?: number;
  /** 图标 URL */
  iconUrl?: string;
  /** 图标宽度 */
  iconWidth?: number;
  /** 图标高度 */
  iconHeight?: number;
  /** 文字内容 */
  text?: string;
  /** 文字颜色 */
  textColor?: string;
  /** 文字大小 */
  textSize?: number;
}

/**
 * 聚合图层数据项
 */
export interface ClusterDataItem {
  /** 坐标 [lng, lat] 或 [lng, lat, alt] */
  coordinates: PointCoordinates;
  /** 业务属性（透传到事件回调） */
  properties?: Record<string, any>;
}

/**
 * 聚合图层 Props
 */
export interface ClusterLayerProps extends BaseProps {
  /**
   * 点位数据数组 <br>
   * 每项包含坐标和可选的自定义属性
   */
  data: ClusterDataItem[];
  /**
   * 聚合半径（像素），同一半径内的点会被合并为一个聚合点 <br>
   * 值越大聚合程度越高
   */
  clusterRadius?: number;
  /**
   * 最小聚合层级 <br>
   * 低于此层级时所有点合并为少量聚合点
   */
  minZoom?: number;
  /**
   * 最大聚合层级 <br>
   * 超过此层级后不再聚合，所有点独立显示
   */
  maxZoom?: number;
  /**
   * 聚合点样式回调 <br>
   * 接收聚合点数量和聚合 ID，返回样式配置
   */
  clusterStyle?: (count: number, clusterId: number) => ClusterStyleConfig;
  /**
   * 散点样式回调 <br>
   * 接收原始数据项，返回样式配置
   */
  pointStyle?: (item: ClusterDataItem) => PointStyleConfig;
  /**
   * 是否显示聚合数量文字
   */
  showClusterCount?: boolean;
  /**
   * 点击聚合点时是否自动飞入展开到下一级 <br>
   * 开启后点击聚合点会自动缩放到该聚合拆分的层级，实现逐级展开
   */
  expandOnClick?: boolean;
  /**
   * 关闭深度检测的距离 <br>
   * 传递 `Number.POSITIVE_INFINITY` 使点位始终在最上层
   */
  disableDepthTestDistance?: number;
}

/**
 * 聚合图层事件
 */
export interface ClusterLayerEmits {
  /**
   * 点击聚合点
   */
  (
    event: "clickCluster",
    info: {
      center: PointCoordinates;
      count: number;
      items: ClusterDataItem[];
    },
  ): void;
  /**
   * 点击散点
   */
  (event: "clickPoint", item: ClusterDataItem): void;
  /**
   * 聚合计算完成，返回聚合点数和散点数
   */
  (event: "clusterChange", clusters: number, singles: number): void;
}

export function defaultClusterStyle(count: number): ClusterStyleConfig {
  if (count <= 10) {
    return {
      color: "#3388ff",
      outlineColor: "#fff",
      outlineWidth: 2,
      size: 36,
      textColor: "#fff",
      textSize: 13,
    };
  }
  if (count <= 50) {
    return {
      color: "#2ecc71",
      outlineColor: "#fff",
      outlineWidth: 2,
      size: 44,
      textColor: "#fff",
      textSize: 14,
    };
  }
  if (count <= 100) {
    return {
      color: "#f39c12",
      outlineColor: "#fff",
      outlineWidth: 2,
      size: 52,
      textColor: "#fff",
      textSize: 15,
    };
  }
  return {
    color: "#e74c3c",
    outlineColor: "#fff",
    outlineWidth: 2,
    size: 60,
    textColor: "#fff",
    textSize: 16,
  };
}

export function defaultPointStyle(): PointStyleConfig {
  return {
    shapeType: "circle" as ShapeType,
    color: "#409EFF",
    outlineColor: "#fff",
    outlineWidth: 2,
    size: 20,
  };
}

export const defaultClusterLayerProps = {
  data: [] as ClusterDataItem[],
  clusterRadius: 120,
  minZoom: 0,
  maxZoom: 18,
  showClusterCount: true,
  expandOnClick: true,
  disableDepthTestDistance: Number.POSITIVE_INFINITY,
};
