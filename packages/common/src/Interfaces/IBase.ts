import { EngineType } from "@common/Types";
import { PointCoordinates } from "./IGeojson";

export type Position = PointCoordinates;

export type Extent = [number, number, number, number];

/**
 * 基础接口
 */
export interface IBase {
  // /**
  //  *  初始化函数
  //  */
  // init(...params: any[]): void;
  /**
   *  初始化函数
   */
  init(...params: any[]): Promise<void> | undefined | void;
  /**
   *  销毁函数
   */
  destroy(): void;
}

/**
 * 基础代理层接口
 */
export interface IBaseDelegateImp<T> extends IBase {
  /**
   * 根据引擎类型获取对应的地图服务类
   * @param engineType 引擎类型
   * @param options
   */
  getClassByEngineType(engineType: EngineType, options?: any): T;
}
