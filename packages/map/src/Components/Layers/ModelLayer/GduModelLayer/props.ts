import { BaseProps } from "../../../../Types";

export interface ModelLayerProps extends BaseProps {
  /** 图层id */
  layerId?: string;
}

export interface ModelLayerEmits {
  /** 图层创建完毕事件 `layer：图层` */
  (event: "ready", layer: any): void;
  /** 图层销毁事件 */
  (event: "beforeDestroy"): void;
}
