/**
 * 这里是cesium各种类型判断
 */

import * as Cesium from "cesium";

/**
 * 判断点是否在地球的背面
 * @param viewer
 * @param coordinates
 */
export function isPointBehindCamera(
  viewer: Cesium.Viewer,
  coordinates: Cesium.Cartesian3,
) {
  // 如何不是三维模式永远不会在背面
  if (viewer.scene.mode !== Cesium.SceneMode.SCENE3D) return false;
  // 不存在目标点，隐藏弹框
  if (!coordinates) return true;
  const cameraPosition = viewer.camera.position; // 获取相机位置（世界坐标系）
  const targetPosition = coordinates; // 转换目标点为世界坐标系

  const target = Cesium.Cartesian3.subtract(
    targetPosition,
    cameraPosition,
    new Cesium.Cartesian3(),
  );

  const dotProduct = Cesium.Cartesian3.dot(target, targetPosition);
  return dotProduct > 0; // 如果点积大于0，说明目标点在相机的背面
}
