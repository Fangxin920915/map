import { SymbolProperties } from "@common/Interfaces";

export class CanvasDrawer {
  /**
   * 静态绘制方法：仅处理图形绘制，iconUrl有值时直接返回URL和尺寸
   * @param {Object} config 配置参数
   * @param {[number, number]} config.iconSize 基础尺寸（圆形/矩形宽高必相等）
   * @param {string} [config.shapeType] 图形类型：'圆形' | '矩形'（仅shapeType生效时绘制Canvas）
   * @param {string} [config.shapeColor='#ffffff'] 图形填充色
   * @param {number} [config.borderWidth=0] 边框宽度
   * @param {string} [config.borderColor='#000000'] 边框颜色
   * @param {string} [config.iconUrl] 图标URL（有值时直接返回该值和尺寸，不绘制Canvas）
   * @returns {HTMLCanvasElement | {iconUrl: string, iconWidth: number, iconHeight: number}}
   *          图形场景返回Canvas元素，图标场景返回URL+尺寸对象
   */
  static draw(
    config: SymbolProperties,
  ):
    | HTMLCanvasElement
    | { iconUrl: string; iconWidth: number; iconHeight: number } {
    // 1. 参数解构与默认值
    const {
      iconSize = [24, 24],
      shapeType,
      shapeColor = "#ffffff",
      borderWidth = 0,
      borderColor = "#000000",
      iconUrl,
    } = config;

    // 2. 图标场景：直接返回URL和尺寸（适配Cesium Billboard）
    if (iconUrl) {
      return {
        iconUrl,
        iconWidth: iconSize[0],
        iconHeight: iconSize[1],
      };
    }

    // 4. 计算画布实际尺寸（基础尺寸 + 2倍边框宽度）
    const canvasWidth = iconSize[0] + 2 * borderWidth;
    const canvasHeight = iconSize[1] + 2 * borderWidth;

    // 5. 创建Canvas并初始化上下文
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d")!;

    // 6. 绘制图形（带边框）
    this._drawShape(ctx, {
      shapeType,
      shapeColor,
      borderWidth,
      borderColor,
      iconSize,
      canvasWidth,
      canvasHeight,
    });

    return canvas;
  }

  /**
   * 内部方法：绘制圆形/矩形（带边框）
   * @param {CanvasRenderingContext2D} ctx Canvas 2D上下文
   * @param {Object} options 绘制参数
   */
  static _drawShape(
    ctx: CanvasRenderingContext2D,
    options: {
      shapeType: SymbolProperties["shapeType"];
      shapeColor: string;
      borderWidth: number;
      borderColor: string;
      iconSize: [number, number];
      canvasWidth: number;
      canvasHeight: number;
    },
  ) {
    const {
      shapeType,
      shapeColor,
      borderWidth,
      borderColor,
      iconSize,
      canvasWidth,
      canvasHeight,
    } = options;

    // 保存上下文状态，避免污染外部
    ctx.save();

    // ========== 绘制图形主体 ==========
    ctx.fillStyle = shapeColor;
    if (shapeType === "circle") {
      // 圆形：圆心在画布中心，半径为基础尺寸的一半
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = iconSize[0] / 2;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2); // 绘制圆形路径
      ctx.fill(); // 填充颜色
    } else if (shapeType === "rect") {
      // 矩形：位置为边框宽度（留出边框空间），尺寸为基础尺寸
      ctx.fillRect(
        borderWidth, // x起点（左边框宽度）
        borderWidth, // y起点（上边框宽度）
        iconSize[0], // 宽度
        iconSize[1], // 高度
      );
    }

    // ========== 绘制边框（宽度>0时） ==========
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth; // 设置边框宽度

      if (shapeType === "circle") {
        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;
        // 边框半径：基础半径 + 边框宽度的一半（让边框居中显示）
        const borderRadius = iconSize[0] / 2 + borderWidth / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, borderRadius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shapeType === "rect") {
        // 矩形边框：路径向外扩展borderWidth/2，避免覆盖主体
        const rectX = borderWidth - borderWidth / 2;
        const rectY = borderWidth - borderWidth / 2;
        const rectWidth = iconSize[0] + borderWidth;
        const rectHeight = iconSize[1] + borderWidth;

        ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);
      }
    }

    // 恢复上下文状态
    ctx.restore();
  }
}
