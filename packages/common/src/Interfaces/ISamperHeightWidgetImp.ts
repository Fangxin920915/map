export enum SamplerMode {
  MODEL = "MODEL",
  TERRAIN = "TERRAIN",
}
export type SamplerTask = {
  coordinate: [number, number, number];
  samplerMode: SamplerMode;
  callback: (coordinate: [number, number, number]) => void;
};
export interface Coordinate {
  longitude: number;
  latitude: number;
  height?: number;
}
export interface ISamplerHeightWidgetImp {
  observeSamplerHeightTask(
    coordinate: Coordinate,
    mode: SamplerMode,
    callback: (coordinate: Coordinate) => void,
  ): void;
  observeSamplerHeightTaskRefresh(
    coordinate: Coordinate,
    mode: SamplerMode,
    callback: (coordinate: Coordinate & { height: number }) => void,
  ): void;
  unObserveSamplerHeightTaskRefresh(
    coordinate: Coordinate,
    mode: SamplerMode,
    callback: (coordinate: Coordinate & { height: number }) => void,
  ): void;

  destroy(): void;
}
// 高度数据观察者接口
export interface HeightDataObserver {
  id: string;
  coordinate: Coordinate;
  mode: SamplerMode;
  update(coordinate: Coordinate & { height: number }): void;
}

// 主题接口 - 高度数据主题
export interface HeightDataSubject {
  observers: Map<string, HeightDataObserver[]>;
  registerObserver(
    coordinate: Coordinate,
    mode: SamplerMode,
    observer: HeightDataObserver,
  ): void;
  removeObserver(observer: HeightDataObserver): void;
  notifyObservers(
    coordinate: Coordinate,
    mode: SamplerMode,
    height: number,
  ): void;
  getObservations(key: string): HeightDataObserver[];
  hasObserver(coordinate: Coordinate, mode: SamplerMode): boolean;
  getHash(coordinate: Coordinate, mode: SamplerMode): string;
  clear(): void; // 添加 clear 方法声明
}

// 具体主题实现
export class HeightDataSubjectImpl implements HeightDataSubject {
  getObservations(key: string): HeightDataObserver[] {
    return this.observers.get(key) || [];
  }

  observers: Map<string, HeightDataObserver[]> = new Map();

  getHash(coordinate: Coordinate, mode: SamplerMode): string {
    return `${coordinate.longitude.toFixed(6)}_${coordinate.latitude.toFixed(6)}_${mode}`;
  }

  public registerObserver(
    coordinate: Coordinate,
    mode: SamplerMode,
    observer: HeightDataObserver,
  ): void {
    const hash = this.getHash(coordinate, mode);
    if (!this.observers.has(hash)) this.observers.set(hash, []);
    const observers = this.observers.get(hash)!;
    observers.push(observer);
  }

  public removeObserver(observer: HeightDataObserver): void {
    const { coordinate, mode, id } = observer;
    const hash = this.getHash(coordinate, mode);
    const observers = this.observers.get(hash);
    if (observers) {
      const index = observers.findIndex((item) => item.id === id);
      if (index !== -1) {
        observers.splice(index, 1);
        if (observers.length === 0) {
          this.observers.delete(hash);
        }
      }
    }
  }

  public notifyObservers(
    coordinate: Coordinate,
    mode: SamplerMode,
    height: number,
  ): void {
    const hash = this.getHash(coordinate, mode);
    const observers = this.observers.get(hash);
    observers?.forEach((observer) =>
      observer.update({ ...coordinate, height }),
    );
  }

  public hasObserver(coordinate: Coordinate, mode: SamplerMode): boolean {
    const hash = this.getHash(coordinate, mode);
    return !!this.observers.get(hash);
  }

  // 清除实际使用的 observers 映射
  public clear(): void {
    this.observers.clear();
  }
}

// 回调观察者（简化实现）
export class CallbackObserver implements HeightDataObserver {
  constructor(
    readonly id: string,
    readonly coordinate: Coordinate,
    readonly mode: SamplerMode,
    readonly callback: (coordinate: Coordinate & { height: number }) => void,
  ) {}

  update(coordinate: Coordinate & { height: number }): void {
    this.callback(coordinate);
  }
}

// 高度采样器基类（泛型增强）
export abstract class BaseHeightSampler<T extends Coordinate = Coordinate> {
  protected constructor(
    protected viewer: any,
    protected subject: HeightDataSubject,
    protected mode: SamplerMode,
  ) {}

  abstract sampleHeight(coordinate: T): T;
  abstract sampleHeightRefresh(coordinate: T): void;
  abstract destroy(): void;
  abstract removeSamplerRefresh(coordinate: T, mode: SamplerMode): void;
}
