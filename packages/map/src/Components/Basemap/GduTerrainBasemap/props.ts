import { BaseProps } from "../../../Types";

export interface TerrainBasemapProps extends BaseProps {
  /**
   * 地形请求链接
   */
  url: string | Promise<any>;
}

export interface TerrainBasemapEmit {
  /**
   * ### 功能描述
   * 地形加载成功时触发该事件。
   *
   * ### 返回值
   * - **terrain** `Terrain`: 当前地形。
   */
  (event: "ready", terrain?: any): void;
  /**
   * ### 功能描述
   * 地形瓦片加载失败时触发该事件。
   *
   * ### 返回值
   * - **error** `对象`: 错误瓦片对象。
   */
  (event: "error", error?: any): void;
}

export const defaultTerrainBasemapProps = {
  url: "",
};
