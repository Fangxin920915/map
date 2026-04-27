import { EventData, EventName } from "@gdu-gl/common";
import { BaseProps } from "../../../Types";

export interface MapEventProps extends BaseProps {
  /**
   * ### 功能描述
   * 监听地图瓦片加载进度。
   *
   * ### 返回值
   * - **progress** `number`: 瓦片进度百分比
   */
  onTileLoadProgress?: EventData[EventName.TILE_LOAD_PROGRESS];
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
  onClick?: EventData[EventName.CLICK];
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
  onDblClick?: EventData[EventName.DOUBLE_CLICK];
  /**
   * ### 功能描述
   * 用户右击地图时触发该事件。
   *
   * ### 返回值
   * - **coordinates** `number[]`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]
   * - **cartesian** `Cesium.Cartesian3`: 鼠标拾取的三维空间坐标（笛卡尔坐标系）。
   * - **pixel** `Cesium.Cartesian2`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]。
   * - **pickObj** `any`: 鼠标拾取的原生对象。
   * - **feature** `Feature`: 鼠标拾取的要素，格式化后的数据，vue端请使用这个数据。
   */
  onContextmenu?: EventData[EventName.CONTEXTMENU];
  /**
   * ### 功能描述
   * 用户鼠按下时触发该事件。
   *
   * ### 返回值
   * - **coordinates** `number[]`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]
   * - **cartesian** `Cesium.Cartesian3`: 鼠标拾取的三维空间坐标（笛卡尔坐标系）。
   * - **pixel** `Cesium.Cartesian2`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]。
   * - **pickObj** `any`: 鼠标拾取的原生对象。
   * - **feature** `Feature`: 鼠标拾取的要素，格式化后的数据，vue端请使用这个数据。
   */
  onMouseDown?: EventData[EventName.MOUSE_DOWN];
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
  onMouseMove?: EventData[EventName.MOUSE_MOVE];
  /**
   * ### 功能描述
   * 用户鼠标抬起时触发该事件。
   *
   * ### 返回值
   * - **coordinates** `number[]`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]
   * - **cartesian** `Cesium.Cartesian3`: 鼠标拾取的三维空间坐标（笛卡尔坐标系）。
   * - **pixel** `Cesium.Cartesian2`: 鼠标的经纬度坐标，格式为[经度, 纬度, 高程]。
   * - **pickObj** `any`: 鼠标拾取的原生对象。
   * - **feature** `Feature`: 鼠标拾取的要素，格式化后的数据，vue端请使用这个数据。
   */
  onMouseUp?: EventData[EventName.MOUSE_UP];
  /**
   * ### 功能描述
   * 相机开始移动时触发该事件。
   *
   * ### 返回值
   * 返回一个对象，其中包含以下字段:
   * - **position** `number[]`: 相机当前的经纬度。
   * - **heading** `number`: 相机当前的偏航角。
   * - **pitch** `number`: 相机当前的俯仰角。
   * - **roll** `number`: 相机当前的翻滚角。
   */
  onCameraMoveStart?: EventData[EventName.CAMERA_MOVE_START];
  /**
   * ### 功能描述
   * 相机移动中触发该事件。
   *
   * ### 返回值
   * 返回一个对象，其中包含以下字段:
   * - **position** `number[]`: 相机当前的经纬度。
   * - **heading** `number`: 相机当前的偏航角。
   * - **pitch** `number`: 相机当前的俯仰角。
   * - **roll** `number`: 相机当前的翻滚角。
   */
  onCameraMoving?: EventData[EventName.CAMERA_MOVING];
  /**
   * ### 功能描述
   * 相机停止移动触发该事件。
   *
   * ### 返回值
   * 返回一个对象，其中包含以下字段:
   * - **position** `number[]`: 相机当前的经纬度。
   * - **heading** `number`: 相机当前的偏航角。
   * - **pitch** `number`: 相机当前的俯仰角。
   * - **roll** `number`: 相机当前的翻滚角。
   */
  onCameraMoveEnd?: EventData[EventName.CAMERA_MOVE_END];
  /** 渲染前事件监听 */
  onPreRender?: EventData[EventName.PRE_RENDER];
  /** 渲染后事件监听 */
  onPostRender?: EventData[EventName.POST_RENDER];
}
