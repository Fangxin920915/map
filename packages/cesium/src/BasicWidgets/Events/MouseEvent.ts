import { cartesian2Coordinates, getPickPosition } from "@cesium-engine/Utils";
import {
  EventBasic,
  EventName,
  IGeometryManagerImp,
  IModelManagerImp,
  IViewerDelegateImp,
  MouseEventParams,
} from "@gdu-gl/common";
import * as Cesium from "cesium";
import { isNil, throttle } from "lodash-es";

export default class MouseEvent extends EventBasic {
  private readonly map: Cesium.Viewer;

  private geometryManager: IGeometryManagerImp;

  private modelManager: IModelManagerImp;

  private _eventHandler: Cesium.ScreenSpaceEventHandler;

  private _eventMap: Record<number, (e: any) => void>;

  /**
   * 上一次点击的id
   * @private
   */
  private _lastPickId: any;

  /**
   * 上一次点击的图层id
   * @private
   */
  private _lastLayerId: any;

  /**
   * 上一次点击的特征
   * @private
   */
  private _lastFeature: any;

  private readonly _mouseMove = (
    e: Cesium.ScreenSpaceEventHandler.MotionEvent,
  ) => {
    this.trigger(EventName.MOUSE_MOVE, e.endPosition);
  };

  private readonly _mouseDown = (
    e: Cesium.ScreenSpaceEventHandler.PositionedEvent,
  ) => {
    this.trigger(EventName.MOUSE_DOWN, e.position);
  };

  private readonly _mouseUp = (
    e: Cesium.ScreenSpaceEventHandler.PositionedEvent,
  ) => {
    this.trigger(EventName.MOUSE_UP, e.position);
  };

  private readonly _click = throttle(
    (e: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      this.trigger(EventName.CLICK, e.position);
    },
    160, // 220毫秒内不允许再次触发
    { leading: true, trailing: false }, // 立即执行第一次调用，不执行最后一次调用
  );

  private readonly _doubleClick = (
    e: Cesium.ScreenSpaceEventHandler.PositionedEvent,
  ) => {
    this.trigger(EventName.DOUBLE_CLICK, e.position);
  };

  private readonly _contextmenu = throttle(
    (e: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      this.trigger(EventName.CONTEXTMENU, e.position);
    },
    160, // 220毫秒内不允许再次触发
    { leading: true, trailing: false }, // 立即执行第一次调用，不执行最后一次调用
  );

  constructor(viewer: IViewerDelegateImp) {
    super();
    this.map = viewer.mapProviderDelegate.map;
    this.geometryManager = viewer.geometryManagerDelegate;
    this.modelManager = viewer.modelManagerDelegate;
    this._eventHandler = new Cesium.ScreenSpaceEventHandler(
      this.map.scene.canvas,
    );
    this._eventMap = {
      [Cesium.ScreenSpaceEventType.MOUSE_MOVE]: this._mouseMove,
      [Cesium.ScreenSpaceEventType.LEFT_CLICK]: this._click,
      [Cesium.ScreenSpaceEventType.LEFT_UP]: this._mouseUp,
      [Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK]: this._doubleClick,
      [Cesium.ScreenSpaceEventType.RIGHT_CLICK]: this._contextmenu,
      [Cesium.ScreenSpaceEventType.LEFT_DOWN]: this._mouseDown,
    };
  }

  trigger(event: string, windowCoordinate: Cesium.Cartesian2): void {
    this.map.scene
      .pickAsync(windowCoordinate)
      .then((pickObj: any) => {
        const samplerObj = this.getSamplePosition(pickObj, windowCoordinate);
        const parma: MouseEventParams = {
          coordinates: samplerObj.coordinates,
          pixel: [windowCoordinate.x, windowCoordinate.y],
          feature: undefined,
          layerId: undefined,
          pickObj,
        };
        if (pickObj && !isNil(pickObj.id)) {
          // 检查当前pickObj.id是否与上次相同
          if (pickObj.id === this._lastPickId) {
            // 如果相同，直接使用缓存的结果
            parma.layerId = this._lastLayerId;
            parma.feature = this._lastFeature;
          } else {
            // 如果不同，重新查询并更新缓存
            const layerId =
              this.modelManager.featureCache?.getLayerIdByModelId(pickObj.id) ??
              this.geometryManager.featureCache?.getLayerIdByInstanceId(
                pickObj.id,
              );
            // 更新缓存的layerId
            parma.layerId = layerId;
            this._lastLayerId = layerId;
            const currentFeature =
              this.modelManager.featureCache?.getFeatureIdByModelId(
                pickObj.id,
              ) ??
              this.geometryManager.featureCache?.getFeatureIdByInstanceId(
                pickObj.id,
              );
            // 更新缓存的feature
            parma.feature = currentFeature;
            this._lastFeature = currentFeature;
            // 更新缓存的pickId
            this._lastPickId = pickObj.id;
          }
        } else {
          // 当pickObj或pickObj.id不存在时，重置缓存
          this._lastPickId = undefined;
          this._lastLayerId = undefined;
          this._lastFeature = undefined;
        }
        this.triggerListener(event, parma);
      })
      .catch((error) => {
        console.log("pickAsync 错误:", error);
      });
  }

  /**
   * 获取拾取点与拾取点的高程信息
   * @param pickObj
   * @param pixel
   */
  getSamplePosition(pickObj: any, pixel: Cesium.Cartesian2) {
    // 拾取笛卡尔坐标点
    const cartesian = getPickPosition(this.map, pickObj, pixel);
    // 拾取笛卡尔坐标点转换成经纬度
    const coordinates = cartesian2Coordinates(cartesian);

    return {
      cartesian,
      coordinates,
    };
  }

  init(): void {
    Object.keys(this._eventMap).forEach((key) => {
      const type = Number(key);
      this._eventHandler.setInputAction(this._eventMap[type]!, type);
      this._eventHandler.setInputAction(
        this._eventMap[type]!,
        type,
        Cesium.KeyboardEventModifier.ALT,
      );
    });
  }

  destroy(): void {
    super.destroy();
    // 取消 throttle 内部定时器，防止泄漏
    (this._click as any)?.cancel?.();
    (this._contextmenu as any)?.cancel?.();
    this._eventMap = {};
    this._lastPickId = undefined;
    this._lastLayerId = undefined;
    this._lastFeature = undefined;
    this._eventHandler.destroy();
    (this as any).map = null;
    (this as any).geometryManager = null;
    (this as any).modelManager = null;
  }
}
