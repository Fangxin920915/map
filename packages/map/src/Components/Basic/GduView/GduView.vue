<template>
  <slot />
</template>

<script setup lang="ts">
import { mapViewInternal } from "@gdu-gl/core";
import {
  CameraOptions,
  ExportMapToBlobOptions,
  Extent,
  FitExtentParams,
  FlyToBoundsCenterParams,
  FlyToBoundsParams,
  JumpToParams,
  SetCameraParams,
} from "@gdu-gl/common";
import { defaultMapId } from "@map/Types";
import { onBeforeMount } from "vue";
import { ViewEmits, ViewProps } from "./props";

const props = withDefaults(defineProps<ViewProps>(), { viewId: defaultMapId });

const emits = defineEmits<ViewEmits>();

const viewer = mapViewInternal.getViewer(props.viewId as string);

onBeforeMount(() => {
  emits("ready");
});

defineExpose({
  /**
   * ### 功能描述
   * 该方法用于获取当前视角的中心点坐标，当用户看向天空时，当前中心点为空。
   *
   * ### 返回值
   * - **position** `number[]`: 当前视角中心视角中心坐标。
   */
  getCenter: () =>
    viewer?.cameraDelegate.cameraManager?.getCenter() as number[],
  /**
   * ### 功能描述
   * 获取当前视角的层级。
   *
   * ### 返回值
   * - **zoom** `zoom`: 当前视角中心视角层级。
   */
  getZoom: () => viewer?.cameraDelegate.cameraManager?.getZoom() as number,
  /**
   * ### 功能描述
   * 该方法用于获取当前视角的四至范围，当用户看向天空时，当前四至范围为空。
   *
   * ### 入参
   * 该方法传入一个数组:
   * - **extent** `number[]`: 屏幕像素位置的四至范围，不传默认采用全屏像素四至范围。
   *
   * ### 返回值
   * - **extent** `number[]`: 当前视角四至范围。
   */
  getExtentByScreen: (extent?: Extent) =>
    viewer?.cameraDelegate.cameraManager?.getExtentByScreen(extent) as Extent,
  /**
   * ### 功能描述
   * 缩小地图层级。
   */
  zoomOut: () =>
    viewer?.cameraDelegate.cameraManager?.zoomOut() as Promise<boolean>,
  /**
   * ### 功能描述
   * 放大图层级。
   */
  zoomIn: () =>
    viewer?.cameraDelegate.cameraManager?.zoomIn() as Promise<boolean>,
  /**
   * ### 功能描述
   * 该方法用于获取相机的位置信息、heading、pitch、roll。
   *
   * ### 返回值
   * 返回一个对象，其中包含以下字段:
   * - **position** `number[]`: 相机当前的经纬度。
   * - **heading** `number`: 相机当前的偏航角。
   * - **pitch** `number`: 相机当前的俯仰角。
   * - **roll** `number`: 相机当前的翻滚角。
   */
  getCameraOptions: () =>
    viewer?.cameraDelegate.cameraManager?.getCameraOptions() as CameraOptions,
  /**
   * ### 功能描述
   * 传入一个坐标点位集合，相机自动调整视角，使所有点位都能完整显示。
   *
   * ### 入参
   * 该方法传入一个对象:
   * - **positions** `number[][]`: 坐标点集合。
   * - **withFootPoints** `boolean`: 跳转时，是否需要垂足点位也在视角里面。
   * - **heading** `number`: 相机的偏航角。
   * - **pitch** `number`: 相机的俯仰角。
   * - **duration** `number`: 相机的飞行动画时间，默认为1500。
   *
   * ### 返回值
   * 返回一个promise,相机完成飞行飞行resolve(true)，相机飞行被取消返回resolve(false):
   */
  flyToBounds: (params: FlyToBoundsParams) =>
    viewer?.cameraDelegate.cameraManager?.flyToBounds(
      params,
    ) as Promise<boolean>,
  /**
   * ### 功能描述
   * 传入一组坐标点，相机自动飞行到一个视角，使这些点都位于屏幕正中心区域。
   * 与 flyToBounds 的区别在于，flyToBoundsCenter 更强调让点位居中显示，
   * 并且可以通过 scale 参数控制视角的缩放程度（留白多少）。
   *
   * ### 入参
   * 该方法传入一个对象:
   * - **positions** `number[][]`: 坐标点集合。
   * - **scale** `number`: 缩放比例，默认 2.5，值越大视角越远（留白越多）。
   * - **heading** `number`: 相机的偏航角。
   * - **pitch** `number`: 相机的俯仰角。
   * - **duration** `number`: 相机的飞行动画时间，默认为1500。
   * - **debug** `boolean`: 是否开启调试模式（显示辅助矩形边框）。
   *
   * ### 返回值
   * 返回一个promise,相机完成飞行resolve(true)，相机飞行被取消返回resolve(false):
   */
  flyToBoundsCenter: (params: FlyToBoundsCenterParams) =>
    viewer?.cameraDelegate.cameraManager?.flyToBoundsCenter(
      params,
    ) as Promise<boolean>,
  /**
   * ### 功能描述
   * 该方法用于切换相机的地球模式。
   *
   * ### 入参
   * 该方法传入一个数字:
   * - **type** `number`: 地球模式类型，3为3D模式，2为2D模式。
   * - **duration** `number`: 地球模式切换动画时间，默认为1500。
   */
  toggleEarthMode: (type: 2 | 3, duration?: number) =>
    viewer?.cameraDelegate.cameraManager?.toggleEarthMode(type, duration),
  /**
   * ### 功能描述
   * 该方法用于设置相机的位置信息、姿态信息。
   *
   * ### 入参
   * 该方法传入一个对象:
   * - **position** `number[]|undefined`: 相机的经纬度,不传默认采用当前相机位置。
   * - **heading** `number`: 相机的偏航角。
   * - **pitch** `number`: 相机的俯仰角。
   * - **roll** `number`: 相机的翻滚角。
   * - **duration** `number`: 相机的飞行动画时间，默认为0。
   *
   * ### 返回值
   * 返回一个promise,相机完成飞行飞行resolve(true)，相机飞行被取消返回resolve(false):
   */
  setCameraOptions: (params: SetCameraParams) =>
    viewer?.cameraDelegate.cameraManager?.setCameraOptions(
      params,
    ) as Promise<boolean>,
  /**
   * ### 功能描述
   * 该方法用于设置相机看向指定位置。
   *
   * ### 入参
   * 该方法传入一个对象:
   * - **position** `number[]`: 目标点的经纬度。
   * - **heading** `number`: 相机的偏航角。
   * - **pitch** `number`: 相机的俯仰角。
   * - **zoom** `number`: 跳转层级，层级范围为【1-22】。
   * - **duration** `number`: 相机的飞行动画时间，默认为1500。
   *
   * ### 返回值
   * 返回一个promise,相机完成飞行飞行resolve(true)，相机飞行被取消返回resolve(false):
   */
  jumpTo: (params: JumpToParams) =>
    viewer?.cameraDelegate.cameraManager?.jumpTo(params) as Promise<boolean>,
  /**
   * ### 功能描述
   * 该方法用于设置相机看向指定四至范围。
   *
   * ### 入参
   * 该方法传入一个对象:
   * - **extent** `number[]`: 目标四至范围。
   * - **heading** `number`: 相机的偏航角。
   * - **pitch** `number`: 相机的俯仰角。
   * - **range** `number`: 相机的离目标点距离。
   * - **duration** `number`: 相机的飞行动画时间，默认为1500。
   *
   * ### 返回值
   * 返回一个promise,相机完成飞行飞行resolve(true)，相机飞行被取消返回resolve(false):
   */
  fitExtent: (params: FitExtentParams) =>
    viewer?.cameraDelegate.cameraManager?.fitExtent(params) as Promise<boolean>,
  /**
   * ### 功能描述
   * 导出地图为图片。
   *
   * ### 入参
   * 该方法传入一个对象:
   * - **format** `string`: 导出图片的格式，默认为png。
   * - **quality** `number`: 导出图片的质量，范围为【0-1】，默认为1。
   *
   * ### 返回值
   * 返回一个promise,生成快照成功返回resolve(blob)
   */
  exportMapToBlob: (params?: ExportMapToBlobOptions) =>
    viewer?.cameraDelegate.cameraManager?.exportMapToBlob(
      params,
    ) as Promise<Blob>,
  /**
   * ### 功能描述
   * 取消相机所有飞行动画。
   */
  cancelFlight: () => viewer?.cameraDelegate.cameraManager?.cancelFlight(),
  // /**
  //  * ### 功能描述
  //  * 设置相机飞行动画默认时间。
  //  *
  //  * ### 入参
  //  * - **duration** `number`: 需要设置的动画时间。
  //  */
  // setDefaultFightDuration: (duration: number) =>
  //   viewer?.cameraDelegate.cameraManager?.setDefaultFightDuration(duration),
});
</script>
