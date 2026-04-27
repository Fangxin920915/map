import { Viewer } from "@gdu-gl/core";
import { EngineType, MouseEventParams, PointCoordinates } from "@gdu-gl/common";
import { BaseProps } from "../../../Types";

export interface MapProps extends BaseProps {
  engineType?: EngineType;
  /**
   * 设置最大缩放级别
   */
  maxZoom?: number;
  /**
   * 设置最小缩放级别
   */
  minZoom?: number;
  /**
   * 设置初始航向角
   */
  heading?: number;
  /**
   * 设置初始俯仰角
   */
  pitch?: number;
  /**
   * 设置初始俯仰角
   */
  zoom?: number;
  /**
   * 默认视角，这里默认是用的全国视角
   */
  center?: PointCoordinates;
  /**
   * 在俯视时，自动切换为正交投影
   */
  autoOrthographic?: boolean;
  /**
   * 是否允许滚动层级
   */
  enableScrollZoom?: boolean;
  /**
   * 是否允许拖拽
   */
  enableDragPan?: boolean;
  /**
   * 是否允许旋转
   */
  enableDragRotate?: boolean;
  /**
   * 是否允许开启调试窗口
   */
  enableDebugger?: boolean;
  /**
   * 是否允许开启地形深度检测
   */
  enableDepthTestAgainstTerrain?: boolean;
  /**
   * 引擎初始化参数配置
   */
  mapInitialOptions?: any;
  /**
   * 是否为armap容器
   */
  isArMap?: boolean;
}

export interface MapEmits {
  /**
   * ### 功能描述
   * 地图加载成功时触发该事件。
   *
   * ### 返回值
   * - **map** `Viewer`: 当前地图对象。
   */
  (event: "ready", map?: Viewer): void;
  /**
   * ### 功能描述
   * 地图销毁之前触发该事件。
   */
  (event: "beforeDestroy"): void;
  /**
   * ### 功能描述
   * 用户点击地图时触发该事件。
   *
   * ### 返回值
   * - **coordinates** `number[]`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]
   * - **cartesian** `Cesium.Cartesian3`: 鼠标拾取的三维空间坐标（笛卡尔坐标系）。
   * - **pixel** `Cesium.Cartesian2`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]。
   * - **pickObj** `any`: 鼠标拾取的原生对象。
   * - **feature** `Feature`: 鼠标拾取的要素，格式化后的数据，vue端请使用这个数据。
   */
  (event: "click", params: MouseEventParams): void;
  /**
   * ### 功能描述
   * 用户双击地图时触发该事件。
   *
   * ### 返回值
   * - **coordinates** `number[]`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]
   * - **cartesian** `Cesium.Cartesian3`: 鼠标拾取的三维空间坐标（笛卡尔坐标系）。
   * - **pixel** `Cesium.Cartesian2`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]。
   * - **pickObj** `any`: 鼠标拾取的原生对象。
   * - **feature** `Feature`: 鼠标拾取的要素，格式化后的数据，vue端请使用这个数据。
   */
  (event: "dblclick", params: MouseEventParams): void;
  /**
   * ### 功能描述
   * 用户右击地图时触发该事件。
   *
   * ### 返回值
   * - **coordinates** `number[]`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]
   * - **cartesian** `Cesium.Cartesian3`: 鼠标拾取的三维空间坐标（笛卡尔坐标系）。
   * - **pixel** `Cesium.Cartesian2`: 鼠标的屏幕像素位置坐标。
   * - **pickObj** `any`: 鼠标拾取的原生对象。
   * - **feature** `Feature`: 鼠标拾取的要素，格式化后的数据，vue端请使用这个数据。
   */
  (event: "contextmenu", params: MouseEventParams): void;
  /**
   * ### 功能描述
   * 用户鼠标移动时触发该事件。
   *
   * ### 返回值
   * - **coordinates** `number[]`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]
   * - **cartesian** `Cesium.Cartesian3`: 鼠标拾取的三维空间坐标（笛卡尔坐标系）。
   * - **pixelStart** `Cesium.Cartesian2`: 鼠标移动的开始屏幕像素位置坐标。
   * - **pixelEnd** `Cesium.Cartesian2`: 鼠标移动的结束屏幕像素位置坐标。
   * - **pickObj** `any`: 鼠标拾取的原生对象。
   * - **feature** `Feature`: 鼠标拾取的要素，格式化后的数据，vue端请使用这个数据。
   */
  (event: "mouseMove", params: MouseEventParams): void;
}

export const defaultMapProps = {
  engineType: EngineType.CESIUM,
  center: [114.3055, 30.5928] as PointCoordinates,
  zoom: 12,
  enableScrollZoom: true,
  enableDragPan: true,
  enableDragRotate: true,
  enableDebugger: true,
  autoOrthographic: true,
  enableDepthTestAgainstTerrain: true,
  heading: 0,
  pitch: -90,
  maxZoom: 25,
  minZoom: 1,
  isArMap: false,
};
