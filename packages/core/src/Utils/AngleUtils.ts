/**
 * 角度处理工具类：内部计算使用0-360度，输出转换为-180到180度
 */
export default class AngleUtils {
  /**
   * 将角度转换到0-360度区间
   * @param angle 输入角度
   * @returns 转换后的角度（0-360区间）
   */
  static to0_360(angle: number): number {
    const normalized = angle % 360.0;
    return normalized !== 360.0 ? normalized : 0.0;
  }

  /**
   * 将角度转换到-180到180度区间
   * @param angle 输入角度
   * @returns 转换后的角度（-180到180区间）
   */
  static toNeg180_180(angle: number): number {
    if (angle > 180.0) {
      return angle - 360.0;
    }
    return angle;
  }

  /**
   * 计算0-360度区间内两个角度的最小差值（返回绝对值）
   * @param a 第一个角度
   * @param b 第二个角度
   * @returns 最小角度差值的绝对值
   */
  static angleDifference(a: number, b: number): number {
    const a0360 = AngleUtils.to0_360(a);
    const b0360 = AngleUtils.to0_360(b);
    const diff = Math.abs(a0360 - b0360);
    return Math.min(diff, 360.0 - diff);
  }
}
