import { BaseProps } from "../../../../Types";

export interface TilesetFeatureProps extends BaseProps {
  /** 点位名称 */
  name?: number | string;
  /** 该要素的可见性 */
  visible?: boolean;
  /**
   * 模型的url地址，必传
   */
  url?: string;
  /**
   *  自动定位到模型位置
   */
  autoZoom?: boolean;
}

export const defaultTilesetFeatureProps = {
  url: "",
  visible: true,
  name: "",
  autoZoom: false,
};
