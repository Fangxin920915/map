import { WidgetsManager as CesiumWidgetManager } from "@gdu-gl/cesium";
import {
  IViewerDelegateImp,
  IDragToolImp,
  IScaleToolImp,
  WidgetType,
  EngineType,
  IWidgetDelegateImp,
  IWidgetManagerImp,
  ISamplerHeightWidgetImp,
} from "@gdu-gl/common";

export default class WidgetsManager implements IWidgetDelegateImp {
  private _widgets: IWidgetManagerImp | undefined;

  constructor() {
    this._widgets = undefined;
  }

  get widgets(): IWidgetManagerImp {
    if (!this._widgets) {
      throw new Error("WidgetsManager not initialized");
    }
    return this._widgets;
  }

  init(engineType: EngineType, viewer: IViewerDelegateImp): void {
    this._widgets = this.getClassByEngineType(engineType, viewer);
  }

  getClassByEngineType(
    _engineType: EngineType,
    options?: any,
  ): IWidgetManagerImp {
    return new CesiumWidgetManager(options);
  }

  getWidgetByType(
    type: WidgetType,
    options?: any,
  ): IScaleToolImp | IDragToolImp | ISamplerHeightWidgetImp | undefined {
    if (!this._widgets) {
      return undefined;
    }
    return this._widgets.getWidgetByType(type, options);
  }

  destroy(): void {
    // throw new Error("Method not implemented.");
  }
}
