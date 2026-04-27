/**
 * 将透明度值转换为十六进制 alpha 通道
 * @param opacity 透明度（0-1，0 完全透明，1 完全不透明）
 * @returns 两位十六进制 alpha 字符串（如 0.5 → "80"）
 */
export function convertOpacityToHexAlpha(opacity: number): string {
  // 限制透明度在 0-1 范围内，转换为 0-255 整数
  const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  // 转换为两位十六进制（不足两位补前导 0）
  return alpha.toString(16).padStart(2, "0").toUpperCase();
}

/**
 * 为 RGB 十六进制颜色添加 alpha 透明度通道
 * @param rgbHex RGB 颜色（如 "#FFFFFF"）
 * @param opacity 透明度（0-1）
 * @returns 带 alpha 的十六进制颜色（如 "#FFFFFF80"）
 */
export function addAlphaToHexColor(rgbHex: string, opacity: number): string {
  // 移除 # 并截取前 6 位 RGB 部分
  const cleanRgb = rgbHex.replace(/^#/, "").slice(0, 6);
  // 获取 alpha 十六进制分量
  const alphaHex = convertOpacityToHexAlpha(opacity);
  return `#${cleanRgb}${alphaHex}`;
}

/**
 * 判断一个颜色值是否是透明的（仅处理指定的三种格式）
 * @param color 颜色值字符串
 * @returns 返回true表示颜色是透明的，false表示不透明
 */
export function isTransparentColor(color?: string | null) {
  // 空值处理
  if (!color) {
    return true;
  }

  const normalizedColor = color.trim().toLowerCase();

  // 1. 直接匹配透明关键字 'transparent'
  if (normalizedColor === "transparent") {
    return true;
  }

  // 2. 处理 RGBA 格式 (rgba(r,g,b,a))
  if (normalizedColor.startsWith("rgba")) {
    // 使用正则表达式提取alpha通道值
    const rgbaMatch = normalizedColor.match(
      /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/,
    );
    if (rgbaMatch && rgbaMatch[1]) {
      const alpha = parseFloat(rgbaMatch[1]);
      // alpha值为0表示完全透明
      return alpha === 0;
    }
  }

  // 3. 处理 8位十六进制格式 (#RRGGBBAA)
  if (normalizedColor.length === 9 && normalizedColor.startsWith("#")) {
    // 提取最后两位（Alpha通道值）
    const alphaHex = normalizedColor.slice(7, 9);
    // 将十六进制转换为十进制（0-255）
    const alpha = parseInt(alphaHex, 16);
    // alpha值为0表示完全透明
    return alpha === 0;
  }

  // 默认情况：不是透明色
  return false;
}

/**
 * 生成虚线模式数值
 * @param lineDash - 虚线模式数组 [实线长度, 间隔长度]
 * @returns 符合 Cesium 虚线规范的 16 位模式数值
 */
export function createDashLine(lineDash: Array<number>) {
  const [x, y = 0] = lineDash;
  const total = x + y;
  const xPercent = x / total;
  const xBits = Math.round(xPercent * 16); // 14 位实线
  const yBits = 16 - xBits; // 2 位间隙（总位数保持 16）
  // 生成 14 个 1 和 2 个 0
  const pattern = "1".repeat(xBits) + "0".repeat(yBits); // "1111111111111100"
  // 转换为十六进制
  const hexPattern = parseInt(pattern, 2).toString(16).padStart(4, "0");
  return parseInt(hexPattern, 16);
}
