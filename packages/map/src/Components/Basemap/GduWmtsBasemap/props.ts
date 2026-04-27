import { BasemapProps, defaultBasemapProps } from "../../../Types";

export interface WmtsBasemapProps extends BasemapProps {
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
  tileStyle?: string;
  /**
   * WMTS瓦片的格式，默认'image/jpeg'
   */
  format?: string;
}

export const defaultWmtsBasemapProps = {
  ...defaultBasemapProps,
  tileMatrixSetID: "",
  layer: "",
  tileStyle: "default",
  format: "image/jpeg",
};
