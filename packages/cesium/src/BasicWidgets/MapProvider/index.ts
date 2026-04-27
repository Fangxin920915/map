import * as Cesium from "cesium";
import { IMapProviderImp, ViewerOptions } from "@gdu-gl/common";
import {
  ArrowLineStringMaterial,
  FadePolylineMaterial,
  FadeWallMaterial,
  OutlineDashLineStringMaterial,
  PolylineDashArrowMaterial,
} from "@cesium-engine/Materials";
import {
  calculateHeightByLevel,
  getZoomLevelHeights,
  is2dMode,
} from "@cesium-engine/Utils";
import { CesiumQueryAltitudes } from "./CesiumQueryAltitudes";
import CameraController from "../CameraManager";

export class CesiumMapProvider implements IMapProviderImp {
  private _map?: Cesium.Viewer;

  private _queryAltitudes: CesiumQueryAltitudes | null = null;

  autoOrthographic = true;

  _zoomHeightMapping?: Map<number, number>;

  _cameraController?: CameraController;

  /**
   * 地图初始化选项
   */
  options: ViewerOptions;

  ready: boolean;

  get map() {
    if (!this._map) {
      throw Error("地图未创建");
    }
    return this._map;
  }

  get queryAltitudes() {
    if (!this._queryAltitudes) {
      throw Error("查询高度工具未创建");
    }
    return this._queryAltitudes;
  }

  // 监听地图dom变化
  private _resizeObserver: ResizeObserver | null;

  constructor(options: ViewerOptions) {
    this._resizeObserver = new ResizeObserver(() => {
      this.setHdpi();
    });

    this.options = options;
    this._map = undefined;
    this.ready = false;
  }

  init(): Promise<void> {
    return new Promise((resolve) => {
      try {
        this.addCustomMaterials();
        const options: Cesium.Viewer.ConstructorOptions = {
          /**
           * Cesium WebGL上下文核心配置项
           * 作用：定制WebGL渲染上下文的功能开关、性能策略和兼容性规则，
           * 直接影响3D地球的渲染效果、算力开销、内存占用和跨设备兼容性
           */
          contextOptions: {
            /**
             * 各向异性纹理过滤开关（Anisotropic Texture Filtering）
             * 作用：控制是否开启倾斜视角下的纹理清晰度优化（比如地形/模型纹理的拉伸模糊修复）
             * 性能影响：开启后会增加纹理采样的算力开销（集显/低配GPU尤为明显），
             * 关闭后牺牲轻微纹理画质，换取显著的帧率提升
             * 取值：false（关闭，性能优先）| true（开启，画质优先）
             */
            allowTextureFilterAnisotropic:
              this.options.mapInitialOptions?.contextOptions
                ?.allowTextureFilterAnisotropic ?? false,

            /**
             * WebGL上下文的底层配置子集
             * 覆盖缓冲区管理、抗锯齿、GPU调度、容错逻辑等核心渲染规则
             */
            webgl: {
              /**
               * Alpha缓冲区开关
               * 作用：控制Canvas画布是否保留透明度通道（用于画布整体透明叠加场景）
               * 性能影响：关闭后减少约1字节/像素的内存占用，降低集显共享内存的带宽压力
               * 场景说明：Cesium绝大多数场景无需画布透明，关闭为最优选择
               * 取值：false（关闭）| true（开启）
               */
              alpha: true,

              /**
               * 深度缓冲区开关（Depth Buffer）
               * 作用：开启3D渲染的深度测试（判断像素的前后遮挡关系），是3D场景渲染的必需项
               * 性能影响：高分辨率下占用约3字节/像素的内存（24位深度），但无关闭的可行性（关闭会导致渲染错乱）
               * 取值：true（必须开启）| false（禁用，3D渲染失效）
               */
              depth: true,

              /**
               * 模板缓冲区开关（Stencil Buffer）
               * 作用：用于模板测试（如模型轮廓渲染、区域遮挡裁剪、自定义遮罩等）
               * 性能影响：关闭后节省1~8字节/像素的内存占用，Cesium默认场景极少用到模板缓冲区
               * 场景说明：非定制化遮罩/轮廓需求下，关闭为最优选择
               * 取值：false（关闭）| true（开启）
               */
              stencil: false,

              /**
               * MSAA抗锯齿开关（Multisample Anti-Aliasing）
               * 作用：平滑3D模型/地形边缘的锯齿感，提升画质
               * 性能影响：集显/低配GPU的“性能杀手”——开启后每个像素的采样计算量翻倍/数倍，帧率暴跌
               * 场景说明：性能优先场景（如集显、低带宽设备）必须关闭，画质优先场景可开启
               * 取值：false（关闭，性能优先）| true（开启，画质优先）
               */
              antialias: true,

              /**
               * 预乘Alpha开关（Premultiplied Alpha）
               * 作用：控制Alpha透明度混合的底层计算逻辑（是否将RGB通道预先乘以Alpha通道）
               * 性能影响：额外计算量可忽略不计，几乎无性能损耗
               * 场景说明：仅影响透明材质的混合效果，Cesium默认无需开启
               * 取值：false（关闭）| true（开启）
               */
              premultipliedAlpha: true,

              /**
               * 绘制缓冲区保留开关（Preserve Drawing Buffer）
               * 作用：帧渲染完成后是否保留GPU绘制缓冲区（不自动清空）
               * 核心用途：保留缓冲区才能通过canvas.toDataURL()等API实现截图/像素读取
               * 性能影响：持续占用大量内存（分辨率越高占用越多），集显共享内存场景下易导致带宽不足、卡顿
               * 取值：true（保留，支持截图）| false（不保留，性能最优）
               */
              preserveDrawingBuffer: true,

              /**
               * GPU性能偏好提示（Power Preference）
               * 作用：向浏览器/系统发起GPU调度偏好请求（软提示，非强制指令）
               * 取值说明：
               * - "high-performance"：优先调度高性能GPU（独显），插电场景下大概率生效
               * - "low-power"：优先调度低功耗GPU（集显），节能场景适用
               * 注意：最终GPU调度由系统电源策略、显卡驱动规则决定，此配置仅为“建议”
               */
              powerPreference: "high-performance",

              /**
               * 重大性能缺陷时的上下文创建策略
               * 作用：检测到GPU存在重大性能问题（如驱动不兼容、算力严重不足）时，是否终止WebGL上下文创建
               * 容错性：false表示忽略性能警告，尽可能创建上下文（兼容低配/异常设备）；true表示严格校验，失败则不创建
               * 性能影响：仅控制上下文创建逻辑，不影响运行时性能
               * 取值：false（容错优先）| true（性能严格校验）
               */
              failIfMajorPerformanceCaveat: false,
              ...(this.options.mapInitialOptions?.contextOptions?.webgl ?? {}),
            },
          },
          fullscreenButton: false, // 隐藏界面右下角全屏按钮
          homeButton: false, // 隐藏界面右上角初始化地球位置按钮
          animation: false, // 隐藏界面左下角控制动画的面板
          geocoder: false, // 右上角 搜索
          sceneModePicker: false, // 右上角 2D/3D切换
          baseLayerPicker: false, // 隐藏界面左上角地图底图的切换按钮
          navigationHelpButton: false, // 右上角 Help
          shouldAnimate: true,
          selectionIndicator: false, // 隐藏双击entity时候的聚焦框
          infoBox: false, // 点击地球后的信息框
          timeline: false, // 隐藏正下方时间线
          scene3DOnly: true,
          orderIndependentTranslucency: true,
          shadows: false,
          // terrain: Cesium.Terrain.fromWorldTerrain(),
          baseLayer: false,
          msaaSamples: 1,
        };
        this._map = new Cesium.Viewer(this.options.viewerId, options);
        this._cameraController = new CameraController(this._map);
        this.bindUtils();
        this.initMapView();
        this.setHdpi();
        this.setEnvironment();
        this.bindEvents();
        this._resizeObserver?.observe(this.map.container);

        resolve();
      } catch (error) {
        console.error(error);
      }
    });
  }

  /** ==================控制深度检测开关=================== */
  get enableDepthTestAgainstTerrain() {
    return this.map.scene.globe.depthTestAgainstTerrain;
  }

  set enableDepthTestAgainstTerrain(value: boolean) {
    this.map.scene.globe.depthTestAgainstTerrain = value;
  }

  /** ===================控制缩放======================== */
  get enableScrollZoom() {
    return this.map.scene.screenSpaceCameraController.enableZoom;
  }

  set enableScrollZoom(value: boolean) {
    this.map.scene.screenSpaceCameraController.enableZoom = value;
  }

  /** ====================控制拖拽====================== */
  get enableDragPan() {
    return this.map.scene.screenSpaceCameraController.enableRotate;
  }

  set enableDragPan(value: boolean) {
    this.map.scene.screenSpaceCameraController.enableRotate = value;
  }

  /** =====================控制旋转====================== */
  get enableDragRotate() {
    return this.map.scene.screenSpaceCameraController.enableTilt;
  }

  set enableDragRotate(value: boolean) {
    this.map.scene.screenSpaceCameraController.enableTilt = value;
  }

  /** ==================开启帧率调试窗口=================== */
  get enableDebugger() {
    return this.map.scene.debugShowFramesPerSecond;
  }

  set enableDebugger(value: boolean) {
    this.map.scene.debugShowFramesPerSecond = value;
  }

  set maxZoom(value: number) {
    if (!this._zoomHeightMapping) {
      return;
    }
    this.map.scene.screenSpaceCameraController.minimumZoomDistance =
      calculateHeightByLevel(this._zoomHeightMapping, value ?? 18)!;
  }

  set minZoom(value: number) {
    if (!this._zoomHeightMapping) {
      return;
    }
    this.map.scene.screenSpaceCameraController.maximumZoomDistance =
      calculateHeightByLevel(this._zoomHeightMapping, value ?? 1)!;
  }

  /**
   * 添加自定义材质
   * @private
   */
  private addCustomMaterials() {
    ArrowLineStringMaterial.init();
    OutlineDashLineStringMaterial.init();
    FadeWallMaterial.init();
    FadePolylineMaterial.init();
    PolylineDashArrowMaterial.init();
  }

  private setEnvironment() {
    this.map.scene.useDepthPicking = false;
    this.enableDepthTestAgainstTerrain = true;
    this.map.scene.logarithmicDepthBuffer = false;
    // 关闭太阳
    if (this.map?.scene?.sun) {
      this.map.scene.sun.show = false;
    }
    // 关闭月亮
    if (this.map?.scene?.moon) {
      this.map.scene.moon.show = false;
    }
    this.map.scene.globe.showGroundAtmosphere = false;
    // armap 需要同步设置以下属性避免黑屏闪现问题
    if (this.options.isArMap) {
      this.map.scene.globe.baseColor = Cesium.Color.TRANSPARENT;
      this.map.scene.globe.translucency.enabled = true;
      this.map.scene.globe.translucency.backFaceAlpha = 0;
      this.map.scene.globe.undergroundColor = Cesium.Color.TRANSPARENT;
      this.map.scene.globe.backFaceCulling = true;
      if (this.map?.scene?.skyBox) {
        this.map.scene.skyBox.show = false;
      }
      this.map.scene.backgroundColor = Cesium.Color.TRANSPARENT;
      if (this.map?.scene?.skyAtmosphere) {
        this.map.scene.skyAtmosphere.show = false;
      }
      const { canvas } = this.map.scene;
      canvas.style.backgroundColor = "transparent";
    } else {
      // 非armap 模式下，添加默认图层,用于外层瓦片事件监听
      this.map.imageryLayers.add(
        Cesium.ImageryLayer.fromProviderAsync(
          Cesium.TileMapServiceImageryProvider.fromUrl(
            Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII"),
          ),
          {},
        ),
      );
    }
  }

  /**
   * 初始化地图视图
   * @private
   */
  private initMapView() {
    if (!this._zoomHeightMapping) {
      return;
    }
    const { center, heading, pitch, zoom } = this.options;
    const [lon, lat, alt] = center;
    this.map.scene.camera.flyToBoundingSphere(
      new Cesium.BoundingSphere(Cesium.Cartesian3.fromDegrees(lon, lat, alt)),
      {
        offset: new Cesium.HeadingPitchRange(
          heading,
          pitch,
          calculateHeightByLevel(this._zoomHeightMapping, zoom ?? 16),
        ),
        duration: 0,
      },
    );
  }

  /**
   * 绑定工具
   * 如：查询高度工具等
   * @private
   */
  private bindUtils() {
    this._queryAltitudes = new CesiumQueryAltitudes(this.map);
    this.map.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );
    this._zoomHeightMapping = getZoomLevelHeights(this.map.scene, 1);
  }

  private bindEvents() {
    this.map.scene.preRender.addEventListener(this._preRenderFuc);
    this.map.camera.moveEnd.addEventListener(this.onCameraMoveEnd);
  }

  /**
   * 开启cesium高保真
   * @private
   */
  private setHdpi() {
    this.map.resolutionScale = window.devicePixelRatio;
    // 开启抗锯齿
    this.map.scene.postProcessStages.fxaa.enabled = true;
  }

  /**
   * 地图渲染前事件，用于设置场景光照
   */
  private _directionalLight: Cesium.DirectionalLight | undefined;

  private _preRenderFuc = () => {
    if (!this._directionalLight) {
      this._directionalLight = new Cesium.DirectionalLight({
        direction: this.map.scene.camera.directionWC,
        intensity: 3.0,
      });
    } else {
      this._directionalLight.direction = this.map.scene.camera.directionWC;
    }
    this.map.scene.light = this._directionalLight;
  };

  /**
   * 相机停止后，若处于「类2D俯视」但 pitch 未完全垂直，自动补正到完全垂直
   */
  private onCameraMoveEnd = () => {
    if (!this.autoOrthographic) {
      return;
    }
    const { camera } = this.map.scene;
    const pitch = Math.abs(Cesium.Math.toDegrees(camera.pitch));
    if (is2dMode(camera) && pitch < 89.8) {
      this._cameraController?.toggleEarthMode(2, 150);
    }
  };

  destroy() {
    try {
      this.map.scene.preRender.removeEventListener(this._preRenderFuc);
      this.map.camera.moveEnd.removeEventListener(this.onCameraMoveEnd);
      this._resizeObserver?.unobserve(this.map.container);
      this._cameraController?.destroy();
      this._cameraController = undefined;
      this._queryAltitudes = null;
      this._zoomHeightMapping = undefined;
      const context =
        this.map.canvas.getContext("webgl2") ??
        this.map.canvas.getContext("webgl");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      this.map.destroy();
    } finally {
      this._resizeObserver?.disconnect();
      this._resizeObserver = null;
      this._map = undefined;
      this._queryAltitudes = null;
      this._cameraController = undefined;
      this._zoomHeightMapping = undefined;
      this._directionalLight = undefined;
    }
  }
}
