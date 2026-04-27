import {
  LineStringCoordinates,
  MarkerFeature,
  GeoFeatureType,
  PointCoordinates,
  RoutePointType,
} from "@gdu-gl/common";
import { ExtractPropTypes } from "vue";
import { GduLineString, GduPoint, GduPolygon } from "@map/Components";

/**
 * 定义带有中心点坐标的标记要素类型，继承自 MarkerFeature 接口
 */
export interface MarkerFeatureWithCenter extends MarkerFeature {
  /**
   * 要素的中心点坐标
   */
  centerCoordinates?: PointCoordinates;
  helperLine?: LineStringCoordinates;
  featureInfo: {
    id: string | number;
    type?: RoutePointType | null;
  };
  icon?: {
    hover: string;
    normal: string;
    active: string;
  };
}

/**
 * 定义带有样式信息的标记要素类型，这个主要给展示组件内部使用，不建议外部使用
 */
export type MarkerFeatureWithStyle = {
  /**
   * 几何类型，取值为 GeoFeatureType 枚举中的值
   */
  type: GeoFeatureType;
  /**
   * 要素的唯一标识，类型可以是字符串或数字
   */
  id: string | number;
  visible: boolean;
  helperLine?: LineStringCoordinates;
  /**
   * 点要素的样式信息，类型为 GduPoint 组件属性的提取类型，可选属性
   */
  pointStyle?: ExtractPropTypes<typeof GduPoint>;
  /**
   * 线要素的样式信息，类型为 GduLineString 组件属性的提取类型，可选属性
   */
  lineStyle?: ExtractPropTypes<typeof GduLineString>;
  featureInfo?: {
    id: string | number;
    type?: RoutePointType | null;
  };
  /**
   * 面要素的样式信息，类型为 GduPolygon 组件属性的提取类型，可选属性
   */
  polygonStyle?: ExtractPropTypes<typeof GduPolygon>;
};
