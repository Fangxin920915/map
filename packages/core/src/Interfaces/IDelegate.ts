import { EngineType } from "@gdu-gl/common";

// 通过引擎拿到原生实现类
export interface IDelegate {
  // 通过引擎类型获取代理的原生类
  getClassByEngineType(engineType: EngineType): any;
}
