import { Extent } from "./IBase";
import { PointCoordinates } from "./IGeojson";

/**
 * 相机姿态信息（偏航角、俯仰角、翻滚角）
 */
export type CameraAttitude = {
  /** 偏航角（水平旋转角度，单位：弧度） */
  heading: number;
  /** 俯仰角（垂直旋转角度，单位：弧度） */
  pitch: number;
  /** 翻滚角（横向倾斜角度，单位：弧度） */
  roll: number;
};

/**
 * 相机完整配置（包含姿态和位置）
 */
export type CameraOptions = CameraAttitude & {
  /** 相机位置（经纬度坐标，格式：[经度, 纬度, 高度]） */
  position: PointCoordinates;
  fov?: number;
};

/**
 * 设置相机参数的入参
 */
export type SetCameraParams = Partial<CameraOptions> & {
  /** 动画时长（单位：秒，默认值根据实现而定） */
  duration?: number;
  /** 相机视野角度（单位：弧度） */
  fov?: number;
};

/**
 * 相机飞行/跳转的通用配置
 */
export type CameraAnimationOptions = Partial<CameraAttitude> & {
  /** 动画时长（单位：秒） */
  duration?: number;
  /** 屏幕边距（像素值，用于调整视野边界，[上, 右, 下, 左]） */
  padding?: number[];
  /** 相机与目标点的距离（仅Cesium适用，单位：米） */
  range?: number;
  /** 地图缩放层级（仅MapboxGL适用） */
  zoom?: number;
};

/**
 * 跳转至指定点的参数
 */
export type JumpToParams = {
  /** 目标点位置（经纬度坐标） */
  position: PointCoordinates;
} & Omit<CameraAnimationOptions, "range">; // 跳转不需要距离参数

/**
 * 导出地图图片格式
 */
export enum ExportMapToBlobFormat {
  /** 图片格式: png */
  PNG = "image/png",
  /** 图片格式: jpeg */
  JPEG = "image/jpeg",
  /** 图片格式: webp */
  WEBP = "image/webp",
}
/**
 * 导出地图图片参数
 * @param format 导出的图片格式, 默认值: ExportMapToBlobFormat.PNG
 * @param quality 导出的图片质量, 默认值: 1
 */
export type ExportMapToBlobOptions = {
  format?: ExportMapToBlobFormat;
  /** 导出的图片质量 */
  quality?: number;
};

/**
 * 适配至指定四至范围的参数
 */
export type FitExtentParams = {
  /** 目标四至范围（[最小经度, 最小纬度, 最大经度, 最大纬度]） */
  extent: Extent;
  /** 目标高度（单位：米，默认值：0） */
  height?: number;
} & CameraAnimationOptions;

/**
 * 飞行至多个点覆盖范围的参数
 */
export type FlyToBoundsParams = {
  /** 目标点集合（用于计算视野范围） */
  positions?: PointCoordinates[];
  /** 是否包含地面点（用于优化地形适配，默认：false） */
  withFootPoints?: boolean;
} & Partial<Omit<CameraAttitude, "roll">> & // 飞行时通常不需要翻滚角
  Pick<CameraAnimationOptions, "duration">; // 仅保留时长参数

/**
 * 飞行至多个点覆盖范围（居中模式）的参数
 * 与 FlyToBoundsParams 不同，该方法通过矩形放大 + 双层实体实现更精确的居中显示
 */
export type FlyToBoundsCenterParams = {
  /** 目标点集合（用于计算矩形包围盒） */
  positions?: PointCoordinates[];
  /** 缩放比例因子（默认：2.5，值越大视角越远、留白越多） */
  scale?: number;
  /** 是否开启调试模式（显示辅助矩形边框） */
  debug?: boolean;
} & Partial<Omit<CameraAttitude, "roll">> &
  Pick<CameraAnimationOptions, "duration">;

/**
 * 相机管理器接口
 * 负责相机控制（位置、姿态、视野范围等）及动画操作
 */
export interface ICameraManagerImp {
  /** 默认动画时长（单位：秒） */
  defaultDuration: number;

  /**
   * 获取当前视角中心点坐标
   * @returns 中心点坐标（[经度, 纬度, 高度]），无有效视角时返回undefined
   */
  getCenter(): PointCoordinates | undefined;

  /**
   * 根据屏幕范围计算对应的地理四至范围
   * @param screenExtent 屏幕范围（可选，默认取全屏），格式：[左, 上, 右, 下]（像素值）
   * @returns 对应的地理四至范围，计算失败时返回undefined
   */
  getExtentByScreen(screenExtent?: Extent): Extent | undefined;

  /**
   * 缩小地图视角（降低缩放层级）
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  zoomOut(): Promise<boolean>;

  /**
   * 放大地图视角（提高缩放层级）
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  zoomIn(): Promise<boolean>;

  /**
   * 获取当前相机完整配置
   * @returns 包含姿态和位置的相机配置
   */
  getCameraOptions(): CameraOptions;

  /**
   * 设置相机参数（支持部分更新）
   * @param params 相机参数（支持部分字段，配合duration可实现动画过渡）
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  setCameraOptions(params: SetCameraParams): Promise<boolean>;

  /**
   * 跳转至指定点（支持动画过渡）
   * @param params 包含目标点和动画配置的参数
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  jumpTo(params: JumpToParams): Promise<boolean>;

  /**
   * 适配至指定四至范围（让范围完全显示在视野内）
   * @param params 包含目标范围和动画配置的参数
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  fitExtent(params: FitExtentParams): Promise<boolean>;

  /**
   * 飞行至多个点的覆盖范围（自动计算视野以包含所有点）
   * @param params 包含点集合和动画配置的参数
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  flyToBounds(params: FlyToBoundsParams): Promise<boolean>;

  /**
   * 飞行至多个点的覆盖范围（居中模式，点位更精确地显示在屏幕中心）
   * @param params 包含点集合、缩放比例和动画配置的参数
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  flyToBoundsCenter(params: FlyToBoundsCenterParams): Promise<boolean>;

  /**
   * 获取当前地图缩放层级
   * @returns 缩放层级（整数或浮点数，根据地图引擎而定）
   */
  getZoom(): number;

  /**
   * 切换地球显示模式（2D/3D）
   * @param mode 目标模式（2：2D模式，3：3D模式）
   * @param duration 切换动画时长（单位：秒，可选，默认使用defaultDuration）
   * @returns 操作结果Promise（true：成功，false：失败）
   */
  toggleEarthMode(mode: 2 | 3, duration?: number): Promise<boolean>;

  /**
   * 停止当前所有飞行动画
   */
  cancelFlight(): void;

  /** 获取截图 */
  exportMapToBlob(params?: ExportMapToBlobOptions): Promise<Blob>;

  destroy(): void;
}
