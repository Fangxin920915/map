import numeric from "numeric";
import { DataFilterImp } from "@gdu-gl/common";

/**
 * 将角度严格归一化到 [-180, 180) 度区间（适配标量/数组输入）
 * @param angle 原始角度（度，支持±180、单个数值或数值数组）
 * @returns 归一化后的角度（同输入维度，范围严格在 [-180, 180)）
 * @核心处理：180° → -180°，-180° → -180°，无异常数据
 * @example
 * normalizeAngle(180) → -180，normalizeAngle(-180) → -180
 * normalizeAngle(359) → -1，normalizeAngle(-181) → 179
 */
function normalizeAngle(angle: number | number[]): number | number[] {
  const normalizeSingle = (a: number): number => {
    const mod = (a + 180) % 360;
    const adjustedMod = mod < 0 ? mod + 360 : mod;
    return adjustedMod - 180;
  };

  if (Array.isArray(angle)) {
    return angle.map(normalizeSingle);
  }
  return normalizeSingle(angle);
}

/**
 * 趋势卡尔曼滤波器配置项接口（TS类型约束）
 * 所有参数均为可选，initialAngle默认undefined（无初始角度）
 */
interface TrendKalmanFilterOptions {
  fs?: number; // 采样频率（Hz），默认30
  initialAngle?: number; // 初始角度（度），默认undefined（第一次update时初始化）
  trendWindow?: number; // 趋势判定滑动窗口帧数，默认5
  devThresh?: number; // 角度偏离阈值（度），默认2
  stableFrames?: number; // 启动卡尔曼所需连续平稳帧数，默认3
  qAngle?: number; // 角度过程噪声，默认1e-6
  qOmega?: number; // 角速度过程噪声，默认1e-6
  rAngle?: number; // 观测噪声，默认0.5
}

/**
 * 趋势卡尔曼滤波器核心类
 * 核心机制：
 * - 首次update：无初始角度时，用传入值完成卡尔曼+趋势缓存初始化
 * - 动态阶段：观测值与滑动均值偏离>阈值 → 输出原始值
 * - 平稳阶段：连续N帧平稳 → 启动卡尔曼滤波，输出平滑值
 */
export default class TrendKalmanFilter implements DataFilterImp<number> {
  // ------------------------------ 采样参数 ------------------------------
  private fs: number; // 采样频率（Hz）

  private dt: number; // 采样时间间隔（s）=1/fs

  private initialAngle?: number; // 初始角度（可选，第一次update时赋值）

  // ------------------------------ 趋势判定参数 ------------------------------
  private trendWindow: number; // 滑动窗口帧数

  private devThresh: number; // 角度偏离阈值（度）

  private stableFrames: number; // 启动卡尔曼的连续平稳帧数

  private stableFrameCount: number; // 当前连续平稳帧数计数器

  private kalmanEnabled: boolean; // 卡尔曼滤波开关

  // ------------------------------ 初始化控制 ------------------------------
  private isFirstUpdate: boolean; // 是否为第一次update（核心：延迟初始化标记）

  // ------------------------------ 趋势缓存 ------------------------------
  private trendBuffer: number[]; // 滑动窗口缓存（第一次update时填充）

  // ------------------------------ 卡尔曼滤波参数 ------------------------------
  private qAngle: number; // 角度过程噪声

  private qOmega: number; // 角速度过程噪声

  private rAngle: number; // 观测噪声

  // ------------------------------ 卡尔曼状态矩阵（非空断言） ------------------------------
  private X!: number[][]; // 状态矩阵：[[角度], [角速度]]

  private F!: number[][]; // 状态转移矩阵：[[1, dt], [0, 1]]

  private H!: number[][]; // 观测矩阵：[[1, 0]]

  private P!: number[][]; // 误差协方差矩阵

  private Q!: number[][]; // 过程噪声矩阵

  private R!: number[][]; // 观测噪声矩阵

  /**
   * 构造函数：初始化基础参数，延迟卡尔曼+趋势缓存初始化
   * @param options 配置项（可选，initialAngle默认undefined）
   */
  constructor(options: TrendKalmanFilterOptions = {}) {
    // 初始化采样参数
    this.fs = options.fs ?? 30;
    this.dt = 1.0 / this.fs;
    this.initialAngle = options.initialAngle; // 无初始角度则为undefined

    // 初始化趋势判定参数
    this.trendWindow = options.trendWindow ?? 5;
    this.devThresh = options.devThresh ?? 2.0;
    this.stableFrames = options.stableFrames ?? 3;
    this.stableFrameCount = 0;
    this.kalmanEnabled = false;

    // 初始化首次更新标记 + 空趋势缓存（第一次update时填充）
    this.isFirstUpdate = true;
    this.trendBuffer = [];

    // 初始化卡尔曼噪声参数
    this.qAngle = options.qAngle ?? 1e-6;
    this.qOmega = options.qOmega ?? 1e-6;
    this.rAngle = options.rAngle ?? 0.5;
  }

  /**
   * 初始化/重启卡尔曼滤波器（首次update或平稳阶段重启时调用）
   * @param initAngle 初始化角度（已归一化，范围[-180, 180)）
   * @private 内部方法
   */
  private _initKalman(initAngle: number): void {
    // 确保角度已归一化（兼容输入±180°）
    initAngle = normalizeAngle(initAngle) as number;

    // 手动创建矩阵（无numeric.array依赖）
    this.X = [[initAngle], [0.0]]; // 状态矩阵：初始角速度为0
    this.F = [
      [1, this.dt],
      [0, 1],
    ]; // 匀速模型状态转移矩阵
    this.H = [[1, 0]]; // 仅观测角度
    this.P = [
      [1, 0],
      [0, 1],
    ]; // 2x2单位矩阵（初始无误差）
    this.Q = [
      [this.qAngle, 0],
      [0, this.qOmega],
    ]; // 过程噪声（极小）
    this.R = [[this.rAngle]]; // 观测噪声（适度）
  }

  /**
   * 填充趋势缓存（首次update时调用，保证窗口大小）
   * @param initAngle 初始角度（已归一化）
   * @private 内部方法
   */
  private _initTrendBuffer(initAngle: number): void {
    // 用初始角度填充整个滑动窗口（保证趋势判定的初始基准）
    this.trendBuffer = Array(this.trendWindow).fill(initAngle);
  }

  /**
   * 计算当前观测值与滑动窗口均值的偏离度（趋势判定核心）
   * @param currentMeas 当前观测角度（已归一化）
   * @returns [偏离度绝对值, 滑动窗口均值]
   * @private 内部方法
   */
  private _calcTrendDeviation(currentMeas: number): [number, number] {
    // 更新滑动窗口：移除最旧值，添加最新值
    this.trendBuffer.shift();
    this.trendBuffer.push(currentMeas);

    // 计算滑动均值（趋势基准线）
    const sum = this.trendBuffer.reduce((acc, val) => acc + val, 0);
    const trendMean = sum / this.trendBuffer.length;

    // 归一化偏离值（避免360°环绕干扰，如1°和359°偏离为2°）
    const deviation = normalizeAngle(currentMeas - trendMean) as number;
    const devAbs = Math.abs(deviation);

    return [devAbs, trendMean];
  }

  predict() {
    // 预测阶段：X = F * X，P = F*P*F^T + Q
    this.X = numeric.dot(this.F, this.X) as number[][];
    this.X[0][0] = normalizeAngle(this.X[0][0]) as number;

    const FPT = numeric.dot(this.F, this.P) as number[][];
    const FPTFT = numeric.dot(
      FPT,
      numeric.transpose(this.F) as number[][],
    ) as number[][];
    this.P = numeric.add(FPTFT, this.Q) as number[][];
  }

  update(zMeas: number) {
    // 更新阶段：计算残差→卡尔曼增益→更新状态/协方差
    const predAngle = (numeric.dot(this.H, this.X) as number[][])[0][0];
    const yVal = normalizeAngle(zMeas - predAngle) as number;
    const y = [[yVal]];

    const HPT = numeric.dot(this.H, this.P) as number[][];
    const HPTHT = numeric.dot(
      HPT,
      numeric.transpose(this.H) as number[][],
    ) as number[][];
    const S = numeric.add(HPTHT, this.R) as number[][];

    // 矩阵求逆容错（避免奇异矩阵）
    let SInv: number[][];
    try {
      SInv = numeric.inv(S) as number[][];
    } catch (e) {
      console.warn("卡尔曼滤波：矩阵求逆失败，使用单位矩阵容错");
      SInv = [
        [1, 0],
        [0, 1],
      ];
    }

    const PHT = numeric.dot(
      this.P,
      numeric.transpose(this.H) as number[][],
    ) as number[][];
    const K = numeric.dot(PHT, SInv) as number[][];

    const KY = numeric.dot(K, y) as number[][];
    this.X = numeric.add(this.X, KY) as number[][];

    // 更新误差协方差
    const I = [
      [1, 0],
      [0, 1],
    ]; // 2x2单位矩阵
    const KH = numeric.dot(K, this.H) as number[][];
    const IKH = numeric.sub(I, KH) as number[][];
    this.P = numeric.dot(IKH, this.P) as number[][];

    return normalizeAngle(this.X[0][0]) as number;
  }

  /**
   * 卡尔曼滤波核心更新逻辑（仅平稳阶段调用）
   * @param zMeas 当前观测角度（已归一化）
   * @returns 滤波后的角度（[-180, 180)）
   * @private 内部方法
   */
  private _kalmanUpdate(zMeas: number): number {
    this.predict();
    return this.update(zMeas);
  }

  /**
   * 滤波器核心更新接口（外部唯一调用入口）
   * @param zMeas 原始观测角度（支持±180°，无需提前归一化）
   * @returns 滤波结果：
   * - 首次调用：返回归一化后的初始角度（无滤波）
   * - 动态阶段：返回原始观测值（归一化后）
   * - 平稳阶段：返回卡尔曼滤波值（归一化后）
   */
  filter(zMeas: number): number {
    // 1. 归一化输入角度（兼容±180°，确保在[-180, 180)区间）
    const normalizedZMeas = normalizeAngle(zMeas) as number;

    // 2. 首次update：完成卡尔曼+趋势缓存初始化
    if (this.isFirstUpdate) {
      // 用当前输入作为初始角度
      this.initialAngle = normalizedZMeas;
      // 初始化卡尔曼矩阵
      this._initKalman(this.initialAngle);
      // 初始化趋势缓存（填充整个窗口）
      this._initTrendBuffer(this.initialAngle);
      // 标记首次更新完成
      this.isFirstUpdate = false;
      // 首次调用直接返回归一化后的初始角度（无滤波）
      return this.initialAngle;
    }

    // 3. 非首次update：计算偏离度，判定趋势
    const [devAbs] = this._calcTrendDeviation(normalizedZMeas);

    // 4. 平稳帧数计数（连续N帧平稳才启动卡尔曼）
    if (devAbs < this.devThresh) {
      this.stableFrameCount += 1;
    } else {
      this.stableFrameCount = 0;
      this.kalmanEnabled = false;
    }

    // 5. 卡尔曼开关控制 + 结果输出
    let output: number;
    if (this.stableFrameCount >= this.stableFrames) {
      // 平稳阶段：启动/重启卡尔曼，输出滤波值
      if (!this.kalmanEnabled) {
        this._initKalman(normalizedZMeas);
        this.kalmanEnabled = true;
      }
      output = this._kalmanUpdate(normalizedZMeas);
    } else {
      // 动态阶段：输出归一化后的原始值（快速响应）
      output = normalizedZMeas;
    }

    return output;
  }
}
