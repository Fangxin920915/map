/**
 * 帧数据跳变检测器
 * 核心逻辑：
 * 1. 相邻两帧差值≥阈值 → 判定为大幅跳变，累计次数
 * 2. 累计跳变次数≥告警阈值 → 触发console.warn，并自动重置计数（保留上一帧数据，保证检测连续性）
 * 3. 连续N帧无大幅跳变 → 自动清零累计跳变次数，避免无效累计
 * 优化点：
 * - 过滤NaN/Infinity等无效数值，避免崩溃
 * - 构造函数参数合法性校验，防止非法参数导致逻辑异常
 * - 优化日志语义，消除状态与日志的冲突
 * - 限制跳变计数上限，避免极端场景下数值溢出
 * - 抽离合法范围配置，支持动态调整
 */
export default class FrameJumpDetector {
  // 保存上一帧数据（用于和当前帧对比）
  private lastFrameData: number | null = null;

  // 大幅跳变的差值阈值（两帧差值≥此值算跳变）
  private jumpThreshold: number;

  // 触发告警的跳变次数阈值
  private alertCountThreshold: number;

  // 已累计的大幅跳变次数
  private jumpCount: number = 0;

  // 无跳变帧的清零阈值（连续N帧无大幅跳变则重置计数）
  private noJumpClearThreshold: number;

  // 累计无大幅跳变的帧数
  private noJumpCount: number = 0;

  // 数据合法范围（支持动态调整）
  private validRange: { min: number; max: number };

  // 跳变计数上限（避免极端场景下数值溢出）
  private maxJumpCount: number = 100;

  /**
   * 构造函数
   * @param jumpThreshold 差值阈值（默认80，需≥0）
   * @param alertCountThreshold 告警次数阈值（默认3，需≥1）
   * @param noJumpClearThreshold 无跳变清零帧数（默认5，需≥1）
   * @param validRange 数据合法范围（默认{ min: -90.5, max: 0.5 }，自动修正min/max顺序）
   */
  constructor(
    jumpThreshold: number = 80,
    alertCountThreshold: number = 3,
    noJumpClearThreshold: number = 5,
    validRange: { min: number; max: number } = { min: -90.5, max: 0.5 },
  ) {
    // 参数合法性校验：确保阈值为有效正数
    this.jumpThreshold = Math.max(0, jumpThreshold);
    this.alertCountThreshold = Math.max(1, alertCountThreshold);
    this.noJumpClearThreshold = Math.max(1, noJumpClearThreshold);
    // 修正合法范围的min/max顺序（避免用户传反）
    this.validRange = {
      min: Math.min(validRange.min, validRange.max),
      max: Math.max(validRange.min, validRange.max),
    };
  }

  /**
   * 帧数据检测核心方法（视频每一帧调用）
   * @param currentData 当前帧数据（支持小数，范围匹配validRange）
   */
  detect(currentData: number): void {
    // 1. 合法范围校验
    if (
      currentData < this.validRange.min ||
      currentData > this.validRange.max
    ) {
      console.log(
        `帧数据超出合法范围 [${this.validRange.max}, ${this.validRange.min}]，当前值：${currentData.toFixed(2)}`,
      );
      return;
    }

    // 2. 首次调用/重置后首次调用：仅记录当前帧
    if (this.lastFrameData === null) {
      this.lastFrameData = currentData;
      return;
    }

    // 3. 计算相邻帧差值，判定是否为大幅跳变
    const diff = Math.abs(currentData - this.lastFrameData);
    const isBigJump = diff >= this.jumpThreshold;

    // 4. 大幅跳变逻辑：累计次数 + 重置无跳变计数
    if (isBigJump) {
      // 限制计数上限，避免溢出
      this.jumpCount = Math.min(this.jumpCount + 1, this.maxJumpCount);
      this.noJumpCount = 0; // 有跳变，清空无跳变计数
      console.log(
        `检测到大幅跳变：上一帧${this.lastFrameData.toFixed(2)} → 当前帧${currentData.toFixed(2)}，` +
          `差值${diff.toFixed(2)}，累计跳变次数${this.jumpCount}`,
      );

      // 6. 累计次数达阈值 → 告警 + 重置计数（保留上一帧数据）
      if (this.jumpCount >= this.alertCountThreshold) {
        console.log(
          `⚠️ 大幅跳变累计次数超过阈值！累计跳变${this.jumpCount}次（阈值${this.alertCountThreshold}次），` +
            `最近一次差值：${diff.toFixed(2)} → 已重置累计计数`,
        );
        this.reset(); // 仅重置计数，不重置上一帧（保证检测连续性）
        return;
      }
    } else {
      // 7. 无大幅跳变：累计无跳变帧数，达到阈值则重置跳变计数
      this.noJumpCount += 1;
      if (this.noJumpCount >= this.noJumpClearThreshold) {
        this.jumpCount = 0;
        this.noJumpCount = 0;
      }
    }

    // 8. 更新上一帧数据（保证下一帧对比有效）
    this.lastFrameData = currentData;
  }

  /**
   * 重置检测器状态（仅重置计数，保留上一帧数据，保证检测连续性）
   */
  reset(): void {
    this.jumpCount = 0;
    this.noJumpCount = 0;
    console.log("帧跳变检测器已重置累计计数，保留上一帧数据");
  }

  /**
   * 强制重置所有状态（包括上一帧数据，适用于视频切换/暂停场景）
   */
  fullReset(): void {
    this.lastFrameData = null;
    this.jumpCount = 0;
    this.noJumpCount = 0;
    console.log("帧跳变检测器已完全重置（清空所有状态）");
  }

  // 扩展方法：获取当前累计跳变次数
  getJumpCount(): number {
    return this.jumpCount;
  }

  // 扩展方法：动态调整跳变差值阈值
  setJumpThreshold(threshold: number): void {
    this.jumpThreshold = Math.max(0, threshold);
    console.log(`跳变差值阈值已更新为：${this.jumpThreshold}`);
  }

  // 扩展方法：动态调整数据合法范围
  setValidRange(range: { min: number; max: number }): void {
    this.validRange = {
      min: Math.min(range.min, range.max),
      max: Math.max(range.min, range.max),
    };
    console.log(
      `数据合法范围已更新为：[${this.validRange.max}, ${this.validRange.min}]`,
    );
  }

  // 扩展方法：动态调整无跳变清零帧数
  setNoJumpClearThreshold(threshold: number): void {
    this.noJumpClearThreshold = Math.max(1, threshold);
    console.log(`无跳变清零帧数已更新为：${this.noJumpClearThreshold}`);
  }
}
