import {
  ActualZoomParams,
  CameraConfigParams,
  LensType,
  NormalizedCamParams,
  NormalizedTeleCamParams,
} from "@gdu-gl/common";

/**
 * 双光云台 FOV 计算工具类（完整支持：广角+红外+长焦）
 * 红外镜头特性：固定焦距、仅数字变焦（1-8倍）
 * 广角镜头特性：固定焦距、仅数字变焦（1-4倍）
 * 长焦镜头特性：可变焦距、光学+数字变焦（4-160倍）
 */
export default class ARPTZFOVCalculator {
  // 归一化后的相机核心参数
  private readonly wideCam: NormalizedCamParams;

  private readonly infraredCam?: NormalizedCamParams;

  private readonly teleCam: NormalizedTeleCamParams;

  // 常量定义
  private static readonly UM_TO_MM = 1e-3; // μm → mm

  private static readonly RAD_TO_DEG = 180 / Math.PI;

  private static readonly ASPECT_TOLERANCE = 0.001; // 宽高比允许误差 0.1%

  // 各镜头变焦范围（与硬件规格严格一致）
  private static readonly LENS_ZOOM_RANGE = {
    wide: { min: 1, max: 4 }, // 广角数字变焦
    infrared: { min: 1, max: 8 }, // 红外数字变焦
    tele: { min: 4, max: 160 }, // 长焦总变焦（4-10光学，10-160混合）
  };

  /**
   * 构造函数
   * @param wideCamParams 广角相机参数（必传）
   * @param teleCamParams 长焦相机参数（必传）
   * @param infraredCamParams 红外相机参数（可选）
   * @throws 参数校验失败时抛出错误
   */
  constructor(
    wideCamParams: CameraConfigParams,
    teleCamParams: CameraConfigParams,
    infraredCamParams?: CameraConfigParams,
  ) {
    this.wideCam = this.normalizeNonTeleParams(wideCamParams, "广角", "wide");
    this.teleCam = this.normalizeTeleParams(teleCamParams);
    this.infraredCam = infraredCamParams
      ? this.normalizeNonTeleParams(infraredCamParams, "红外", "infrared")
      : undefined;

    // 长焦最小焦距必须小于最大焦距
    if (this.teleCam.focalLength >= this.teleCam.maxFocalLength) {
      throw new Error(
        `长焦最小焦距（${this.teleCam.focalLength}mm）必须小于最大焦距（${this.teleCam.maxFocalLength}mm）`,
      );
    }

    // 4倍变焦FOV一致性校验（广角↔长焦切换点）
    const wideFOVAt4x = this.calculateFOV(
      this.wideCam.sensorHorizontalWidth,
      this.wideCam.focalLength,
      4, // 广角4倍数字变焦
    );
    const teleFOVAt4x = this.calculateFOV(
      this.teleCam.sensorHorizontalWidth,
      this.teleCam.focalLength, // 长焦4倍光学变焦 = 最小焦距
      1, // 无数字变焦
    );

    // 转为度数后比较，容忍0.5度差异
    const wideFOVDeg = wideFOVAt4x * ARPTZFOVCalculator.RAD_TO_DEG;
    const teleFOVDeg = teleFOVAt4x * ARPTZFOVCalculator.RAD_TO_DEG;
    if (Math.abs(wideFOVDeg - teleFOVDeg) > 0.5) {
      console.warn(
        `警告：4倍变焦时，广角FOV（${wideFOVDeg.toFixed(2)}°）与长焦FOV（${teleFOVDeg.toFixed(2)}°）差异超过0.5°`,
      );
    }
  }

  /**
   * 归一化广角/红外参数（无光学变焦，无maxFocalLength）
   */
  private normalizeNonTeleParams(
    params: CameraConfigParams,
    camType: string,
    lensType: "wide" | "infrared",
  ): NormalizedCamParams {
    // 1. 有效像素校验（正整数）
    if (
      !Number.isInteger(params.effectivePixelWidth) ||
      params.effectivePixelWidth <= 0
    ) {
      throw new Error(`${camType}相机有效像素宽度必须为正整数（单位：像素）`);
    }
    if (
      !Number.isInteger(params.effectivePixelHeight) ||
      params.effectivePixelHeight <= 0
    ) {
      throw new Error(`${camType}相机有效像素高度必须为正整数（单位：像素）`);
    }

    // 2. 像素尺寸+焦距校验（正数）
    if (params.pixelSize <= 0) {
      throw new Error(`${camType}相机必须传入正数的像素尺寸（单位：μm）`);
    }
    if (params.focalLength <= 0) {
      throw new Error(`${camType}相机必须传入正数的焦距（单位：mm）`);
    }

    // 3. 禁止传入maxFocalLength（仅支持数字变焦）
    if (params.maxFocalLength !== undefined) {
      throw new Error(`${camType}相机仅支持数字变焦，无需传入maxFocalLength`);
    }

    // 4. 宽高比处理（推导+校验一致性）
    const pixelAspect = {
      width: params.effectivePixelWidth,
      height: params.effectivePixelHeight,
    };
    const finalAspect =
      params.aspectRatio ||
      this.simplifyAspectRatio(pixelAspect.width, pixelAspect.height);
    this.validateAspectConsistency(
      pixelAspect.width,
      pixelAspect.height,
      finalAspect.width,
      finalAspect.height,
      camType,
    );

    // 5. 推导传感器物理尺寸（mm）
    const sensorHorizontalWidth =
      params.effectivePixelWidth *
      params.pixelSize *
      ARPTZFOVCalculator.UM_TO_MM;
    const sensorVerticalHeight =
      params.effectivePixelHeight *
      params.pixelSize *
      ARPTZFOVCalculator.UM_TO_MM;

    return {
      sensorHorizontalWidth,
      sensorVerticalHeight,
      aspectRatio: finalAspect,
      focalLength: params.focalLength,
      zoomRange: ARPTZFOVCalculator.LENS_ZOOM_RANGE[lensType],
    };
  }

  /**
   * 归一化长焦参数（支持光学变焦，maxFocalLength必选）
   */
  private normalizeTeleParams(
    params: CameraConfigParams,
  ): NormalizedTeleCamParams {
    // 1. 基础参数校验
    if (
      !Number.isInteger(params.effectivePixelWidth) ||
      params.effectivePixelWidth <= 0
    ) {
      throw new Error(`长焦相机有效像素宽度必须为正整数（单位：像素）`);
    }
    if (
      !Number.isInteger(params.effectivePixelHeight) ||
      params.effectivePixelHeight <= 0
    ) {
      throw new Error(`长焦相机有效像素高度必须为正整数（单位：像素）`);
    }
    if (params.pixelSize <= 0) {
      throw new Error(`长焦相机必须传入正数的像素尺寸（单位：μm）`);
    }
    if (params.focalLength <= 0) {
      throw new Error(`长焦相机必须传入正数的焦距（单位：mm）`);
    }

    // 2. 最大焦距必传且为正数
    if (params.maxFocalLength === undefined || params.maxFocalLength <= 0) {
      throw new Error(`长焦相机必须传入正数的最大焦距（单位：mm）`);
    }

    // 3. 宽高比处理
    const pixelAspect = {
      width: params.effectivePixelWidth,
      height: params.effectivePixelHeight,
    };
    const finalAspect =
      params.aspectRatio ||
      this.simplifyAspectRatio(pixelAspect.width, pixelAspect.height);
    this.validateAspectConsistency(
      pixelAspect.width,
      pixelAspect.height,
      finalAspect.width,
      finalAspect.height,
      "长焦",
    );

    // 4. 传感器物理尺寸
    const sensorHorizontalWidth =
      params.effectivePixelWidth *
      params.pixelSize *
      ARPTZFOVCalculator.UM_TO_MM;
    const sensorVerticalHeight =
      params.effectivePixelHeight *
      params.pixelSize *
      ARPTZFOVCalculator.UM_TO_MM;

    return {
      sensorHorizontalWidth,
      sensorVerticalHeight,
      aspectRatio: finalAspect,
      focalLength: params.focalLength,
      maxFocalLength: params.maxFocalLength,
      zoomRange: ARPTZFOVCalculator.LENS_ZOOM_RANGE.tele,
    };
  }

  /**
   * 简化宽高比（如4000:2250 → 16:9）
   */
  private simplifyAspectRatio(
    width: number,
    height: number,
  ): { width: number; height: number } {
    const gcd = this.calculateGCD(width, height);
    return { width: width / gcd, height: height / gcd };
  }

  /**
   * 计算最大公约数（欧几里得算法）
   */
  private calculateGCD(a: number, b: number): number {
    return b === 0 ? a : this.calculateGCD(b, a % b);
  }

  /**
   * 校验有效像素宽高比与传入宽高比的一致性
   */
  private validateAspectConsistency(
    pixelWidth: number,
    pixelHeight: number,
    aspectWidth: number,
    aspectHeight: number,
    camType: string,
  ): void {
    const pixelRatio = pixelWidth / pixelHeight;
    const inputRatio = aspectWidth / aspectHeight;
    if (
      Math.abs(pixelRatio - inputRatio) > ARPTZFOVCalculator.ASPECT_TOLERANCE
    ) {
      throw new Error(
        `${camType}相机宽高比不一致：有效像素比例（${pixelWidth}:${pixelHeight}=${pixelRatio.toFixed(4)}）与传入比例（${aspectWidth}:${aspectHeight}=${inputRatio.toFixed(4)}）误差超出${ARPTZFOVCalculator.ASPECT_TOLERANCE}`,
      );
    }
  }

  // ------------------------------------------------------------------------
  // FOV 核心计算
  // ------------------------------------------------------------------------

  /**
   * 计算水平FOV（弧度）
   */
  private calculateFOV(
    sensorWidth: number,
    focalLength: number,
    digitalZoomFactor: number,
  ): number {
    return 2 * Math.atan(sensorWidth / (2 * focalLength * digitalZoomFactor));
  }

  /**
   * 获取数字变焦系数（按镜头类型区分）
   */
  private getDigitalZoomFactor(zoomRatio: number, lensType: LensType): number {
    const zoomRange = ARPTZFOVCalculator.LENS_ZOOM_RANGE[lensType];

    // 变焦倍率必须在有效区间内（由公共方法调用前保证，此处二次防御）
    if (zoomRatio < zoomRange.min || zoomRatio > zoomRange.max) {
      throw new Error(
        `${lensType}镜头变焦倍率必须在${zoomRange.min}-${zoomRange.max}之间，当前输入：${zoomRatio}`,
      );
    }

    switch (lensType) {
      case "wide":
      case "infrared":
        // 广角/红外：纯数字变焦，系数 = 倍率
        return zoomRatio;
      case "tele":
        // 长焦：4-10倍纯光学变焦（数字变焦系数=1），>10倍混合变焦
        return zoomRatio <= 10 ? 1 : Math.min(16, zoomRatio / 10);
    }
  }

  /**
   * 水平FOV转垂直FOV（按宽高比）
   */
  private convertHorizontalToVerticalFOV(
    horizontalFOVRad: number,
    aspectRatio: { width: number; height: number },
  ): number {
    return (
      2 *
      Math.atan(
        Math.tan(horizontalFOVRad / 2) *
          (aspectRatio.height / aspectRatio.width),
      )
    );
  }

  /**
   * 获取指定镜头的参数（含空值校验）
   */
  private getLensParams(
    lensType: LensType,
  ): NormalizedCamParams | NormalizedTeleCamParams {
    switch (lensType) {
      case "wide":
        return this.wideCam;
      case "infrared":
        if (!this.infraredCam)
          throw new Error(`未配置红外相机参数，无法计算红外镜头FOV`);
        return this.infraredCam;
      case "tele":
        return this.teleCam;
    }
  }

  // ------------------------------------------------------------------------
  // 长焦专用焦距计算
  // ------------------------------------------------------------------------

  /**
   * 计算长焦当前变倍倍率下的实际焦距（mm）
   * @param zoomRatio 变倍倍率（4-160）
   * @returns 实际焦距（保留2位小数）
   */
  public calculateTeleFocalLength(zoomRatio: number): number {
    const teleParams = this.teleCam;
    const zoomMin = 4;
    const zoomMax = 10;

    // 边界处理
    if (zoomRatio <= zoomMin) return teleParams.focalLength; // 4倍及以下
    if (zoomRatio >= zoomMax) return teleParams.maxFocalLength; // 10倍及以上

    // 4-10倍线性插值
    const focalLength =
      teleParams.focalLength +
      ((zoomRatio - zoomMin) / (zoomMax - zoomMin)) *
        (teleParams.maxFocalLength - teleParams.focalLength);
    return Number(focalLength.toFixed(2));
  }

  // ------------------------------------------------------------------------
  // 对外核心方法（FOV计算）
  // ------------------------------------------------------------------------

  /**
   * 按变倍倍率计算水平FOV
   * @param zoomRatio 变倍倍率（对应镜头有效区间）
   * @param lensType 镜头类型（默认：wide）
   * @returns 水平FOV（度，保留2位小数）
   */
  public calculateHorizontalFOV(
    zoomRatio: number,
    lensType: LensType = "wide",
  ): number {
    const lensParams = this.getLensParams(lensType);
    const digitalZoomFactor = this.getDigitalZoomFactor(zoomRatio, lensType);

    // 实际焦距（长焦：根据倍率计算；广角/红外：固定焦距）
    let actualFocalLength: number;
    if (lensType === "tele") {
      actualFocalLength = this.calculateTeleFocalLength(zoomRatio);
    } else {
      actualFocalLength = lensParams.focalLength;
    }

    const horizontalFOVRad = this.calculateFOV(
      lensParams.sensorHorizontalWidth,
      actualFocalLength,
      digitalZoomFactor,
    );
    return Number(
      (horizontalFOVRad * ARPTZFOVCalculator.RAD_TO_DEG).toFixed(2),
    );
  }

  /**
   * 按变倍倍率计算垂直FOV
   */
  public calculateVerticalFOV(
    zoomRatio: number,
    lensType: LensType = "wide",
  ): number {
    const lensParams = this.getLensParams(lensType);
    const digitalZoomFactor = this.getDigitalZoomFactor(zoomRatio, lensType);

    let actualFocalLength: number;
    if (lensType === "tele") {
      actualFocalLength = this.calculateTeleFocalLength(zoomRatio);
    } else {
      actualFocalLength = lensParams.focalLength;
    }

    const horizontalFOVRad = this.calculateFOV(
      lensParams.sensorHorizontalWidth,
      actualFocalLength,
      digitalZoomFactor,
    );
    const verticalFOVRad = this.convertHorizontalToVerticalFOV(
      horizontalFOVRad,
      lensParams.aspectRatio,
    );
    return Number((verticalFOVRad * ARPTZFOVCalculator.RAD_TO_DEG).toFixed(2));
  }

  /**
   * 按实际焦距+变倍倍率计算水平FOV（适配实时参数）
   */
  public calculateHorizontalFOVByActual(
    actualParams: ActualZoomParams,
  ): number {
    this.validateActualParams(actualParams);
    const { zoomRatio, actualFocalLength, lensType } = actualParams;
    const lensParams = this.getLensParams(lensType);
    const digitalZoomFactor = this.getDigitalZoomFactor(zoomRatio, lensType);

    const horizontalFOVRad = this.calculateFOV(
      lensParams.sensorHorizontalWidth,
      actualFocalLength,
      digitalZoomFactor,
    );
    return Number(
      (horizontalFOVRad * ARPTZFOVCalculator.RAD_TO_DEG).toFixed(2),
    );
  }

  /**
   * 按实际焦距+变倍倍率计算垂直FOV（适配实时参数）
   */
  public calculateVerticalFOVByActual(actualParams: ActualZoomParams): number {
    this.validateActualParams(actualParams);
    const { zoomRatio, actualFocalLength, lensType } = actualParams;
    const lensParams = this.getLensParams(lensType);
    const digitalZoomFactor = this.getDigitalZoomFactor(zoomRatio, lensType);

    const horizontalFOVRad = this.calculateFOV(
      lensParams.sensorHorizontalWidth,
      actualFocalLength,
      digitalZoomFactor,
    );
    const verticalFOVRad = this.convertHorizontalToVerticalFOV(
      horizontalFOVRad,
      lensParams.aspectRatio,
    );
    return Number((verticalFOVRad * ARPTZFOVCalculator.RAD_TO_DEG).toFixed(2));
  }

  /**
   * 校验实际参数的合法性（焦距+倍率+镜头类型匹配）
   */
  public validateActualParams(actualParams: ActualZoomParams): void {
    const { zoomRatio, actualFocalLength, lensType } = actualParams;
    const lensParams = this.getLensParams(lensType);
    const tolerance = 0.01; // 焦距允许±0.01mm误差
    const zoomRange = ARPTZFOVCalculator.LENS_ZOOM_RANGE[lensType];

    // 1. 变焦倍率区间校验
    if (zoomRatio < zoomRange.min || zoomRatio > zoomRange.max) {
      throw new Error(
        `${lensType}镜头变焦倍率必须在${zoomRange.min}-${zoomRange.max}之间，当前输入：${zoomRatio}`,
      );
    }

    // 2. 焦距合法性校验
    if (lensType === "wide" || lensType === "infrared") {
      // 广角/红外：焦距固定
      if (Math.abs(actualFocalLength - lensParams.focalLength) > tolerance) {
        throw new Error(
          `${lensType}镜头（${zoomRatio}倍）：实际焦距必须等于固定焦距（${lensParams.focalLength}mm），当前输入：${actualFocalLength}mm`,
        );
      }
    } else if (lensType === "tele") {
      const teleParams = lensParams as NormalizedTeleCamParams;

      if (zoomRatio <= 10) {
        // 4-10倍光学变焦：焦距应在最小~最大之间，并建议与理论插值值接近
        if (
          actualFocalLength < teleParams.focalLength - tolerance ||
          actualFocalLength > teleParams.maxFocalLength + tolerance
        ) {
          throw new Error(
            `长焦镜头（${zoomRatio}倍）：实际焦距必须在${teleParams.focalLength}~${teleParams.maxFocalLength}mm之间，当前输入：${actualFocalLength}mm`,
          );
        }
        // 非阻塞警告：若实际焦距偏离理论线性插值较大，提示检查
        const theoreticalFL = this.calculateTeleFocalLength(zoomRatio);
        if (Math.abs(actualFocalLength - theoreticalFL) > 0.1) {
          console.warn(
            `长焦镜头（${zoomRatio}倍）：实际焦距（${actualFocalLength}mm）与理论焦距（${theoreticalFL}mm）偏差超过0.1mm`,
          );
        }
      } else if (
        Math.abs(actualFocalLength - teleParams.maxFocalLength) > tolerance
      ) {
        // >10倍：焦距必须等于最大焦距（混合变焦时数字变焦已启用）
        throw new Error(
          `长焦镜头（${zoomRatio}倍）：实际焦距必须等于最大焦距（${teleParams.maxFocalLength}mm），当前输入：${actualFocalLength}mm`,
        );
      }
    }
  }

  // ------------------------------------------------------------------------
  // 放大倍数计算
  // ------------------------------------------------------------------------

  /**
   * 计算画面放大倍数（相对于对应镜头的1倍变焦）
   * @param input 支持两种输入形式：
   *              - 纯数字：变倍倍率，镜头类型默认为 wide
   *              - ActualZoomParams：完整参数对象
   * @returns 放大倍数（保留2位小数）
   */
  public calculateZoomMagnification(input: number | ActualZoomParams): number {
    let zoomRatio: number;
    let lensType: LensType;
    let actualFocalLength: number | undefined;

    if (typeof input === "number") {
      // 纯数字形式：使用默认镜头类型 wide
      zoomRatio = input;
      lensType = "wide";
    } else {
      // 完整参数对象
      zoomRatio = input.zoomRatio;
      lensType = input.lensType;
      actualFocalLength = input.actualFocalLength;
      this.validateActualParams(input); // 校验合法性
    }

    const lensParams = this.getLensParams(lensType);
    // 基准FOV：对应镜头1倍变焦的水平FOV（广角/红外1倍，长焦4倍光学）
    const baseFocalLength =
      lensType === "tele"
        ? this.teleCam.focalLength // 长焦基准焦距 = 最小焦距（4倍光学）
        : lensParams.focalLength;
    const baseFOVRad = this.calculateFOV(
      lensParams.sensorHorizontalWidth,
      baseFocalLength,
      1, // 无数字变焦
    );

    // 当前FOV
    let currentFOVRad: number;
    if (actualFocalLength !== undefined) {
      // 使用传入的实际焦距（通常来自设备反馈）
      const digitalZoomFactor = this.getDigitalZoomFactor(zoomRatio, lensType);
      currentFOVRad = this.calculateFOV(
        lensParams.sensorHorizontalWidth,
        actualFocalLength,
        digitalZoomFactor,
      );
    } else {
      // 根据倍率推算焦距
      const digitalZoomFactor = this.getDigitalZoomFactor(zoomRatio, lensType);
      const focalLength =
        lensType === "tele"
          ? this.calculateTeleFocalLength(zoomRatio)
          : lensParams.focalLength;
      currentFOVRad = this.calculateFOV(
        lensParams.sensorHorizontalWidth,
        focalLength,
        digitalZoomFactor,
      );
    }

    // 放大倍数 = 基准FOV / 当前FOV（FOV越小，放大倍数越大）
    return Number((baseFOVRad / currentFOVRad).toFixed(2));
  }

  // ------------------------------------------------------------------------
  // 辅助/调试方法
  // ------------------------------------------------------------------------

  /**
   * 获取变焦区间描述（便于调试/日志）
   */
  public getZoomRangeDesc(
    zoomRatio: number,
    lensType: LensType = "wide",
  ): string {
    const zoomRange = ARPTZFOVCalculator.LENS_ZOOM_RANGE[lensType];
    if (zoomRatio < zoomRange.min || zoomRatio > zoomRange.max) {
      return `${lensType}镜头超出有效变焦范围（${zoomRange.min}-${zoomRange.max}倍）`;
    }

    switch (lensType) {
      case "wide":
        return `广角数字变焦（${zoomRange.min}-${zoomRange.max}倍）`;
      case "infrared":
        return `红外数字变焦（${zoomRange.min}-${zoomRange.max}倍）`;
      case "tele":
        return zoomRatio <= 10
          ? `长焦光学变焦（4-10倍）`
          : `长焦混合变焦（10-${zoomRange.max}倍）`;
    }
  }

  /**
   * 对外暴露传感器物理尺寸（调试用）
   */
  public getSensorSize(lensType: LensType): {
    horizontalWidth: number;
    verticalHeight: number;
  } {
    const lensParams = this.getLensParams(lensType);
    return {
      horizontalWidth: Number(lensParams.sensorHorizontalWidth.toFixed(3)),
      verticalHeight: Number(lensParams.sensorVerticalHeight.toFixed(3)),
    };
  }
}
