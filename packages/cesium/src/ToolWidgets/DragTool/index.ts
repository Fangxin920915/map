import {
  PointCoordinates,
  altitudeAccuracy,
  DragGroundParams,
  DragHorizontalParams,
  IDragToolImp,
} from "@gdu-gl/common";
import * as Cesium from "cesium";

import {
  cartesian2Coordinates,
  getPickPosition,
  isPointBehindCamera,
} from "@cesium-engine/Utils";

export default class DragTool implements IDragToolImp {
  _viewer: Cesium.Viewer;

  constructor(viewer: Cesium.Viewer) {
    this._viewer = viewer;
  }

  init(): void {}

  /**
   * 水平拖拽方法（在XY平面移动）
   * @param horizontalParams 拖拽参数，包含鼠标位置和当前物体位置
   * @returns 新的经纬度坐标数组 [经度, 纬度, 高度] 或 undefined
   */
  dragHorizontal(
    horizontalParams: DragHorizontalParams,
  ): PointCoordinates | undefined {
    // 获取从相机位置穿过鼠标位置的射线
    const ray = this._viewer.camera.getPickRay(
      horizontalParams.mousePosition as Cesium.Cartesian2,
    );
    if (!ray) {
      return undefined;
    }

    // 解构当前物体位置参数
    const [longitude, latitude, height] = horizontalParams.position;
    // 将经纬度转换为笛卡尔坐标（三维空间坐标）
    const center = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);

    // 计算平面法向量（这里使用物体到地心的方向作为法向量，创建水平平面）
    const normal = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());

    // 创建平面对象（由中心点和法向量定义）
    const plane = Cesium.Plane.fromPointNormal(center, normal);

    // 计算射线与平面的交点（即新的位置）
    const newCenter = Cesium.IntersectionTests.rayPlane(ray, plane);
    if (!newCenter) {
      return undefined;
    }

    // 将三维坐标转换为地理坐标（弧度值）
    const cartographic = Cesium.Cartographic.fromCartesian(newCenter);

    // 检查新位置是否在相机后方（避免物体被拖到屏幕外）
    const isBehind = isPointBehindCamera(
      this._viewer,
      Cesium.Cartesian3.fromRadians(
        cartographic.longitude,
        cartographic.latitude,
        height,
      ),
    );
    if (isBehind) {
      return undefined;
    }

    // 返回新的经纬度坐标（转换为度数）并保持原有高度
    return [
      Cesium.Math.toDegrees(cartographic.longitude),
      Cesium.Math.toDegrees(cartographic.latitude),
      altitudeAccuracy(height),
    ];
  }

  /**
   * 垂直拖拽方法（沿Z轴移动）
   * @param verticalParams 拖拽参数，包含鼠标位置和当前物体位置
   * @returns 新的经纬度坐标数组 [经度, 纬度, 高度] 或 undefined
   */
  dragVertical(
    verticalParams: DragHorizontalParams,
  ): PointCoordinates | undefined {
    // 获取从相机位置穿过鼠标位置的射线
    const ray = this._viewer.camera.getPickRay(
      verticalParams.mousePosition as Cesium.Cartesian2,
    );
    if (!ray) {
      return undefined;
    }

    const [longitude, latitude, height] = verticalParams.position;
    const center = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);

    // 计算从物体中心到相机的向量
    const center2camera = Cesium.Cartesian3.subtract(
      this._viewer.camera.position,
      center,
      new Cesium.Cartesian3(),
    );

    // 获取物体到地心的方向向量（归一化）
    const direct = Cesium.Cartesian3.normalize(center, new Cesium.Cartesian3());

    // 计算投影到垂直方向的距离（点积运算）
    const dot = Cesium.Cartesian3.dot(center2camera, direct);

    // 计算垂直方向的投影向量（沿地心方向的向量）
    const directVector = Cesium.Cartesian3.multiplyByScalar(
      direct,
      dot,
      new Cesium.Cartesian3(),
    );

    // 计算平面方向向量（垂直于Z轴的方向）
    const planeDirect = Cesium.Cartesian3.subtract(
      center2camera,
      directVector,
      new Cesium.Cartesian3(),
    );

    // 创建垂直平面（由中心点和平面方向的法向量定义）
    const plane = Cesium.Plane.fromPointNormal(
      center,
      Cesium.Cartesian3.normalize(planeDirect, new Cesium.Cartesian3()),
    );

    // 计算射线与平面的交点
    const newCenter = Cesium.IntersectionTests.rayPlane(ray, plane);

    // 转换坐标并返回新高度（保持经纬度不变）
    const cartographic = Cesium.Cartographic.fromCartesian(newCenter);
    return [longitude, latitude, altitudeAccuracy(cartographic.height)];
  }

  /**
   * 地面拖拽方法（直接贴地移动）
   * @param groundParams 拖拽参数，包含鼠标位置和可拾取对象
   * @returns 新的经纬度坐标数组 [经度, 纬度, 高度] 或 undefined
   */
  dragGround(groundParams: DragGroundParams): PointCoordinates | undefined {
    // 获取鼠标位置对应的地面三维坐标
    const cartesian3 = getPickPosition(
      this._viewer,
      groundParams.pickObj,
      groundParams.mousePosition as Cesium.Cartesian2,
    );
    // 将三维坐标转换为经纬度坐标
    return cartesian2Coordinates(cartesian3);
  }

  transformScreenByCoordinate(
    coordinate: PointCoordinates,
  ): number[] | undefined {
    const [lon, lat] = coordinate;
    // 将经纬度转换为笛卡尔坐标（三维空间坐标）
    const cartesian3 = Cesium.Cartesian3.fromDegrees(lon, lat);
    if (!cartesian3) {
      return undefined;
    }
    // 将笛卡尔坐标转换为屏幕坐标
    const cartesian2 =
      this._viewer.scene.cartesianToCanvasCoordinates(cartesian3);
    if (cartesian2) {
      // 返回屏幕坐标数组 [x, y]
      return [cartesian2.x, cartesian2.y];
    }
    return undefined;
  }

  // 清理资源方法（当前为空实现）
  destroy() {
    this._viewer = null as any;
  }
}
