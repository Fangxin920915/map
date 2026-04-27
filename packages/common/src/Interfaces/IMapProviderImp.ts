import { IQueryAltitudes } from "@common/Interfaces";
import { IBase } from "./IBase";

/**
 * 地图提供者接口
 */
export interface IMapProviderImp extends IBase {
  deckOverlay?: any;
  /**
   * 地图对象
   */
  map?: any;
  /**
   * 地图是否初始化加载完成
   */
  ready: boolean;

  /**
   * 在垂直视角是否自动切换正交投影
   */
  autoOrthographic?: boolean;

  /**
   * 控制深度检测开关
   */
  get enableDepthTestAgainstTerrain(): boolean;
  /**
   * 控制深度检测开关
   */
  set enableDepthTestAgainstTerrain(value: boolean);

  /**
   * 控制相机可使层级
   */
  get enableScrollZoom(): boolean;
  /**
   * 控制相机可使层级
   */
  set enableScrollZoom(value: boolean);

  /**
   * 控制是否允许地图拖拽平移
   */
  get enableDragPan(): boolean;
  /**
   * 控制是否允许地图拖拽平移
   */
  set enableDragPan(value: boolean);

  /**
   * 控制地图是否允许旋转
   */
  get enableDragRotate(): boolean;
  /**
   * 控制地图是否允许旋转
   */
  set enableDragRotate(value: boolean);

  // 最大缩放级别
  set maxZoom(value: number);

  // 最小缩放级别
  set minZoom(value: number);

  /**
   * 控制地图debugger开关
   */
  get enableDebugger(): boolean;
  /**
   * 控制地图debugger开关
   */
  set enableDebugger(value: boolean);
  /**
   * 查询地形高度
   */
  queryAltitudes?: IQueryAltitudes;
  // /**
  //  * 初始化地图
  //  */
  // init(options: EngineOptions): Promise<void>;
}
