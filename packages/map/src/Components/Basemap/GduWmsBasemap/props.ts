import { BasemapProps, defaultBasemapProps } from "../../../Types";

export interface WmsBasemapProps extends BasemapProps {
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

export const defaultWmsBasemapProps = {
  ...defaultBasemapProps,
  version: "1.1.0",
  layer: "",
  tileStyle: "",
  format: "image/jpeg",
};
