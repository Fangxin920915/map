import {
  ISamplerHeightWidgetImp,
  Coordinate,
  HeightDataObserver,
  HeightDataSubject,
  BaseHeightSampler,
  SamplerMode,
  CallbackObserver,
} from "@common/Interfaces";

import { uuid } from "@common/Utils";

/**
 * 抽象高度采样器组件基类
 * 提取了Cesium和Mapbox实现中的共同逻辑
 */
export abstract class SamplerHeightWidgetAbstract<T>
  implements ISamplerHeightWidgetImp
{
  protected subject: HeightDataSubject;

  protected readonly samplers: Map<SamplerMode, BaseHeightSampler>;

  viewer: T;

  constructor(subject: HeightDataSubject, viewer: T) {
    this.subject = subject;
    this.samplers = new Map<SamplerMode, BaseHeightSampler>();
    this.viewer = viewer;
    this.initializeSamplers();
  }

  /**
   * 初始化采样器，由子类实现具体逻辑
   */
  protected abstract initializeSamplers(): void;

  observeSamplerHeightTask(
    coordinate: Coordinate,
    mode: SamplerMode,
    callback: (coordinate: Coordinate) => void,
  ): void {
    this.validateCoordinate(coordinate);
    const sampler = this.samplers.get(mode);
    if (sampler) {
      callback(sampler.sampleHeight(coordinate));
    }
  }

  observeSamplerHeightTaskRefresh(
    coordinate: Coordinate,
    mode: SamplerMode,
    callback: (coordinate: Coordinate & { height: number }) => void,
  ): void {
    this.validateCoordinate(coordinate);
    const id = uuid();
    const observer = new CallbackObserver(id, coordinate, mode, callback);
    this.subject.registerObserver(coordinate, mode, observer);
    const sampler = this.samplers.get(mode);
    if (sampler) {
      sampler.sampleHeightRefresh(coordinate);
    }
  }

  unObserveSamplerHeightTaskRefresh(
    coordinate: Coordinate,
    mode: SamplerMode,
    callback: (coordinate: Coordinate & { height: number }) => void,
  ): void {
    this.validateCoordinate(coordinate);
    const hash = this.subject.getHash(coordinate, mode);
    const observer = this.findObserver(coordinate, mode, callback);
    observer && this.subject.removeObserver(observer);
    const observers = this.subject.getObservations(hash);
    if (observers.length === 0) {
      this.samplers.get(mode)?.removeSamplerRefresh(coordinate, mode);
    }
  }

  destroy(): void {
    this.subject.clear();
    this.samplers.forEach((sampler) => sampler.destroy());
    this.samplers.clear();
  }

  protected validateCoordinate(coordinate: Coordinate): void {
    if (!coordinate.longitude || !coordinate.latitude) {
      throw new Error(
        "Invalid coordinate: longitude and latitude are required",
      );
    }
  }

  protected findObserver(
    coordinate: Coordinate,
    mode: SamplerMode,
    callback: (coordinate: Coordinate & { height: number }) => void,
  ): HeightDataObserver | null {
    const hash = this.subject.getHash(coordinate, mode);
    const observers = this.subject.observers.get(hash) || [];
    return observers.find((obs: any) => obs.callback === callback) || null;
  }
}
