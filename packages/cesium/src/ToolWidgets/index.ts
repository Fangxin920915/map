import {
  IDragToolImp,
  IScaleToolImp,
  IWidgetManagerImp,
  WidgetType,
  ISamplerHeightWidgetImp,
  IViewerDelegateImp,
} from "@gdu-gl/common";

import DragTool from "./DragTool";
import ScaleTool from "./ScaleTool";
import SamplerHeightWidget from "./SamplerHeightWidget";

export default class WidgetsManager implements IWidgetManagerImp {
  private _viewer: IViewerDelegateImp;

  constructor(viewer: IViewerDelegateImp) {
    this._viewer = viewer;
  }

  getWidgetByType(
    type: WidgetType,
  ): IScaleToolImp | IDragToolImp | ISamplerHeightWidgetImp | undefined {
    if (type === WidgetType.DragTool) {
      return new DragTool(this._viewer.mapProviderDelegate.map);
    }
    if (type === WidgetType.ScaleTool) {
      return new ScaleTool(this._viewer);
    }
    if (type === WidgetType.SampleHeightWidget) {
      return new SamplerHeightWidget(this._viewer.mapProviderDelegate.map);
    }
    return undefined;
  }
}
