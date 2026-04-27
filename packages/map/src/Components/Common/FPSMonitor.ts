/**
 * 帧率监测配置项接口
 * @interface FPSMonitorOptions
 */
interface FPSMonitorOptions {
  /** 平滑采样的帧数，默认10 */
  sampleSize?: number;
  /** 帧率更新回调函数，参数为当前帧率 */
  onUpdate?: (fps: number) => void;
  /** 低帧率预警阈值（低于该值触发判断），不配置则关闭预警 */
  thresholdFPS?: number | null;
  /** 低帧率持续时间阈值（ms），默认2000 */
  thresholdTime?: number;
  /** 低帧率预警回调函数，参数：当前帧率、持续低帧率时长(ms) */
  alertCallback?: (fps: number, duration: number) => void;
  /** 预警触发模式：once(仅一次) | interval(间隔触发)，默认once */
  alertMode?: "once" | "interval";
  /** 间隔触发模式下的重复间隔(ms)，默认5000 */
  alertInterval?: number;
}

/**
 * 完整配置类型（所有属性非可选）
 */
interface Config {
  sampleSize: number;
  onUpdate?: (fps: number) => void;
  thresholdFPS: number | null; // 明确非可选（允许null）
  thresholdTime: number;
  alertCallback?: (fps: number, duration: number) => void;
  alertMode: "once" | "interval";
  alertInterval: number;
}

/**
 * 动画帧回调函数类型（兼容TS内置）
 * @typedef {Function} FrameRequestCallback
 */
type FrameRequestCallback = (timestamp: number) => void;

/**
 * 网页帧率（FPS）监测工具类（TS 增强版）
 * @class FPSMonitor
 * @export
 */
export default class FPSMonitor {
  // 配置项（带默认值）
  private readonly config: Config;

  // 基础状态
  private frameTimes: number[] = [];

  private lastTime: number | null = null;

  private requestId: number | null = null;

  private isRunning = false;

  // 预警状态
  private lowFPSStartTime: number | null = null;

  private lastAlertTime = 0;

  private hasTriggeredOnce = false;

  // 兼容动画帧API的私有方法（修复上下文绑定）
  private readonly _requestAnimFrame: (
    callback: FrameRequestCallback,
  ) => number;

  private readonly _cancelAnimFrame: (id: number) => void;

  // 页面可见性变化处理函数（绑定上下文，避免this丢失）
  private readonly _handleVisibilityChange: () => void;

  /**
   * 构造函数
   * @param {FPSMonitorOptions} [options={}] 配置项
   */
  constructor(options: FPSMonitorOptions = {}) {
    // 初始化页面可见性处理函数（提前绑定上下文）
    this._handleVisibilityChange = this._onVisibilityChange.bind(this);

    // 校验 alertMode 合法性（避免any类型）
    const validAlertModes: Array<"once" | "interval"> = ["once", "interval"];
    const alertMode = (
      validAlertModes.includes(options.alertMode as "once" | "interval")
        ? options.alertMode
        : "once"
    ) as "once" | "interval";

    // 初始化配置（填充默认值，严格类型）
    this.config = {
      sampleSize: options.sampleSize ?? 10,
      onUpdate: options.onUpdate,
      // 修复Bug1：区分undefined和null，仅undefined时用默认值30
      thresholdFPS:
        options.thresholdFPS === undefined ? 30 : options.thresholdFPS,
      thresholdTime: options.thresholdTime ?? 2000,
      alertCallback: options.alertCallback,
      alertMode,
      alertInterval: options.alertInterval ?? 5000,
    };

    // 修复：绑定内置 API 上下文，避免 Illegal invocation
    this._requestAnimFrame = this._initRequestAnimFrame();
    this._cancelAnimFrame = this._initCancelAnimFrame();

    // 移除：构造函数中不再提前添加监听，移到start方法中
  }

  /**
   * 初始化requestAnimationFrame（兼容+上下文绑定）
   * @private
   * @returns {(callback: FrameRequestCallback) => number} 绑定上下文后的RAF方法
   */
  private _initRequestAnimFrame(): (callback: FrameRequestCallback) => number {
    const win = window as Window &
      typeof globalThis & {
        webkitRequestAnimationFrame?: FrameRequestCallback;
        mozRequestAnimationFrame?: FrameRequestCallback;
      };

    const nativeRAF =
      win.requestAnimationFrame ||
      win.webkitRequestAnimationFrame ||
      win.mozRequestAnimationFrame;

    if (nativeRAF) {
      // 强制绑定this到window，解决Illegal invocation
      return nativeRAF.bind(win);
    }

    // 降级方案：箭头函数保留实例this指向
    return (callback: FrameRequestCallback): number => {
      return win.setTimeout(() => {
        callback(this._getNow());
      }, 1000 / 60) as unknown as number;
    };
  }

  /**
   * 初始化cancelAnimationFrame（兼容+上下文绑定）
   * @private
   * @returns {(id: number) => void} 绑定上下文后的CAF方法
   */
  private _initCancelAnimFrame(): (id: number) => void {
    const win = window as Window &
      typeof globalThis & {
        webkitCancelAnimationFrame?: (id: number) => void;
        mozCancelAnimationFrame?: (id: number) => void;
      };

    const nativeCAF =
      win.cancelAnimationFrame ||
      win.webkitCancelAnimationFrame ||
      win.mozCancelAnimationFrame;

    if (nativeCAF) {
      return nativeCAF.bind(win);
    }

    // 绑定clearTimeout上下文到window
    return win.clearTimeout.bind(win);
  }

  /**
   * 获取高精度时间戳（兼容老浏览器）
   * @private
   * @returns {number} 时间戳（ms）
   */
  private _getNow(): number {
    const win = window as Window & typeof globalThis;
    if (win.performance && typeof win.performance.now === "function") {
      return win.performance.now();
    }
    return Date.now(); // 降级为毫秒级时间戳
  }

  /**
   * 处理页面可见性变化（失焦/聚焦）
   * @private
   * @returns {void}
   */
  private _onVisibilityChange(): void {
    if (document.hidden) {
      // 页面失焦：重置所有计算状态，避免回来后计算异常帧率
      this.frameTimes = []; // 清空历史帧时间
      this.lastTime = null; // 重置上一帧时间
      this.lowFPSStartTime = null; // 重置低帧率计时起点
      this.hasTriggeredOnce = false; // 重置单次预警状态
      this.lastAlertTime = 0; // 重置最后预警时间
    } else if (this.isRunning) {
      // 页面聚焦：如果监测仍在运行，重新发起RAF请求（修复失焦导致的RAF暂停）
      // 修复Bug3：先取消旧请求，避免重复回调
      if (this.requestId !== null) {
        this._cancelAnimFrame(this.requestId);
        this.requestId = null;
      }
      this.requestId = this._requestAnimFrame(this._calculateFPS.bind(this));
    }
  }

  /**
   * 低帧率预警逻辑判断
   * @private
   * @param {number} currentFPS 当前帧率
   * @param {number} timestamp 当前时间戳
   * @returns {void}
   */
  private _checkLowFPSAlert(currentFPS: number, timestamp: number): void {
    const {
      thresholdFPS = 30,
      alertCallback,
      thresholdTime,
      alertMode,
      alertInterval,
    } = this.config;

    // 未配置预警阈值/回调，直接返回
    if (thresholdFPS === null || typeof alertCallback !== "function") {
      return;
    }

    // 当前帧率低于阈值
    if (currentFPS < thresholdFPS) {
      if (!this.lowFPSStartTime) {
        this.lowFPSStartTime = timestamp;
      }

      // 计算持续低帧率时长（严格类型）
      const lowFPSDuration = timestamp - (this.lowFPSStartTime as number);

      // 持续时长达到阈值，触发预警判断
      if (lowFPSDuration >= thresholdTime) {
        const now = timestamp;

        // 模式1：仅触发一次
        if (alertMode === "once" && !this.hasTriggeredOnce) {
          alertCallback(currentFPS, lowFPSDuration);
          this.stop();
          this.hasTriggeredOnce = true;
          this.lastAlertTime = now;
        }

        // 模式2：间隔触发（首次或达到间隔时间）
        if (alertMode === "interval") {
          const timeSinceLastAlert = now - this.lastAlertTime;
          if (this.lastAlertTime === 0 || timeSinceLastAlert >= alertInterval) {
            alertCallback(currentFPS, lowFPSDuration);
            this.lastAlertTime = now;
          }
        }
      }
    } else {
      // 帧率恢复，重置预警状态
      this.lowFPSStartTime = null;
      this.hasTriggeredOnce = false;
    }
  }

  /**
   * 核心计算逻辑：每帧调用，计算帧率 + 预警判断
   * @private
   * @param {number} timestamp 当前帧时间戳
   * @returns {void}
   */
  private _calculateFPS(timestamp: number): void {
    const now = this._getNow();

    // 初始化第一帧时间（兜底）
    if (!this.lastTime) {
      this.lastTime = now;
      this.requestId = this._requestAnimFrame(this._calculateFPS.bind(this));
      return;
    }

    // 计算单帧耗时（严格类型，兜底处理timestamp为空）
    const frameTime = (timestamp || now) - (this.lastTime as number);
    this.lastTime = timestamp || now;
    this.frameTimes.push(frameTime);

    // 只保留最近sampleSize帧的数据
    if (this.frameTimes.length > this.config.sampleSize) {
      this.frameTimes.shift();
    }

    // 防御性代码：避免除以0（理论上不会触发，frameTimes至少有1帧）
    if (this.frameTimes.length === 0) {
      this.requestId = this._requestAnimFrame(this._calculateFPS.bind(this));
      return;
    }

    // 计算平均帧率（修复reduce初始值类型）
    const avgFrameTime =
      this.frameTimes.reduce((sum, time) => sum + time, 0) /
      this.frameTimes.length;
    const currentFPS = Math.round(1000 / avgFrameTime);

    // 执行帧率更新回调
    if (typeof this.config.onUpdate === "function") {
      this.config.onUpdate(currentFPS);
    }

    // 执行低帧率预警判断
    this._checkLowFPSAlert(currentFPS, timestamp || now);

    // 持续监测
    if (this.isRunning) {
      this.requestId = this._requestAnimFrame(this._calculateFPS.bind(this));
    }
  }

  /**
   * 启动帧率监测
   * @public
   * @returns {void}
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    // 启动时重置所有状态
    this.frameTimes = [];
    this.lastTime = null;
    this.lowFPSStartTime = null;
    this.lastAlertTime = 0;
    this.hasTriggeredOnce = false;

    // 修复Bug2：start时添加页面可见性监听（防御重复添加）
    document.addEventListener("visibilitychange", this._handleVisibilityChange);

    // 调用修复后的RAF，无Illegal invocation
    this.requestId = this._requestAnimFrame(this._calculateFPS.bind(this));
  }

  /**
   * 停止帧率监测
   * @public
   * @returns {void}
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.requestId !== null) {
      this._cancelAnimFrame(this.requestId);
      this.requestId = null;
    }

    // 移除页面可见性监听，避免内存泄漏
    document.removeEventListener(
      "visibilitychange",
      this._handleVisibilityChange,
    );

    // 停止时重置预警状态
    this.lowFPSStartTime = null;
    this.lastAlertTime = 0;
    this.hasTriggeredOnce = false;
  }

  /**
   * 手动获取当前帧率（未运行时返回null）
   * @public
   * @returns {number | null} 当前帧率（取整）| null
   */
  public getFPS(): number | null {
    if (!this.isRunning || this.frameTimes.length === 0) {
      return null;
    }

    // 修复reduce初始值类型，避免ESLint警告
    const avgFrameTime =
      this.frameTimes.reduce((sum, time) => sum + time, 0) /
      this.frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }

  /**
   * 手动重置预警状态（比如需要重新触发once模式）
   * @public
   * @returns {void}
   */
  public resetAlertStatus(): void {
    this.lowFPSStartTime = null;
    this.lastAlertTime = 0;
    this.hasTriggeredOnce = false;
  }
}

/**
 * 导出类型（支持模块化使用）
 */
export type { FPSMonitorOptions };
