import { BaseProps } from "../../../../Types";

export interface VectorLayerProps extends BaseProps {
  /** 图层id */
  layerId?: string;
  /** 图层顺序 */
  zIndex?: number;
  /** 图层透明度 */
  opacity?: number;
  /** 图层显示与隐藏 */
  visible?: boolean;
  /** 最小可见层级 */
  minZoom?: number;
  /** 最大可见层级 */
  maxZoom?: number;
  /** 允许响应地图事件 */
  enableEvent?: boolean;
  /** 开启编辑模式 */
  enableModify?: boolean;
}

export interface VectorLayerEmits {
  /** 图层创建完毕事件 `layer：图层` */
  (event: "ready", layer: any): void;
  /** 图层销毁事件 */
  (event: "beforeDestroy"): void;
}

export const defaultVectorLayerProps = {
  zIndex: 1,
  opacity: 1,
  visible: true,
  minZoom: 28,
  maxZoom: 0,
  enableEvent: false,
  enableModify: false,
};
