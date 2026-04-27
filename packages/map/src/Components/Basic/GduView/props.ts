import { BaseProps } from "../../../Types";

export interface ViewProps extends BaseProps {}

export interface ViewEmits {
  /**
   * ### 功能描述
   * 视角控制器加载成功时的回调事件。
   */
  (event: "ready"): void;
}
