// 基础类
import { IBase } from "@gdu-gl/common";

export default interface ICesiumBase extends Pick<IBase, "destroy"> {
  // 销毁事件
  destroy(): void;
}
