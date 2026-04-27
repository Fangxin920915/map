import * as Cesium from "cesium";

export default class PrimitiveId {
  layerId?: string;

  id?: string;

  private readonly _uuid: string;

  [key: string]: any;

  get uuid(): string {
    return this._uuid;
  }

  constructor(params?: { layerId?: string; id?: string }) {
    this.layerId = params?.layerId;
    this.id = params?.id;
    this._uuid = Cesium.createGuid();
  }

  set(key: string, value: any) {
    this[key] = value;
  }

  get(key: string) {
    return this[key];
  }

  isSelect(id: string) {
    return id === this._uuid;
  }
}
