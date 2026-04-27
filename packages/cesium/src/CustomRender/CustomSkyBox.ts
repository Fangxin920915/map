import * as Cesium from "cesium";

// 定义构造函数选项的接口，匹配原代码中options的结构
export interface CustomSkyBoxOptions {
  widthRatio?: number;
  source?: string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement;
  repeat?: Cesium.Cartesian2;
}

const fs = `
  in vec2 v_textureCoordinates;
  uniform sampler2D u_texture;
  uniform vec2 u_repeat;
  // 宽度比例，用于计算左右边界, 默认为 1.0
  // 宽度比例是指，视频纹理时，原视频尺寸和输出视频尺寸比例不一致，导致出现两边黑边
  // 默认为 1.0 时，视频纹理时，原视频尺寸和输出视频尺寸比例一致，不会出现黑边
  // 通过该值映射剪裁原视频纹理内容到纹理指定范围内
  // 同样适配变形图片
  // 默认高度自适应，宽度留黑边
  uniform float u_widthRatio;
  // 将 [0, 1] 范围内的 x 映射到 [a, b] 区间（a、b ∈ [0, 1]）
  float map01ToRange(float x, float a, float b) {
      return (b - a) * x + a;
  }
  void main()
  { 
    float left = (1.0 - u_widthRatio)/2.0;
    float right = u_widthRatio+left;
    float x = map01ToRange(v_textureCoordinates.x, left, right);
    out_FragColor = texture(u_texture,vec2(fract(x * u_repeat.x), fract(v_textureCoordinates.y * u_repeat.y)));
    // out_FragColor = texture(u_texture,vec2(fract(v_textureCoordinates.x * u_repeat.x), fract(v_textureCoordinates.y * u_repeat.y)));
  }
`;

export default class CustomSkyBox {
  // 为类私有属性添加类型注解，匹配原代码中的属性类型
  // @ts-ignore
  private _command?: Cesium.DrawCommand;

  // @ts-ignore
  private _texture?: Cesium.Texture;

  private _source:
    | string
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
    | undefined;

  private _repeat: Cesium.Cartesian2;

  private _initial: boolean;

  private _loading: boolean;

  // @ts-ignore
  private _context?: Cesium.Context;

  private _widthRatio: number;

  constructor(options: CustomSkyBoxOptions) {
    // 完全保留原构造函数逻辑，仅添加参数类型
    this._command = undefined;
    this._texture = undefined;
    this._source = options.source;
    this._repeat = options.repeat ?? new Cesium.Cartesian2(1, 1);
    this._widthRatio = options.widthRatio ?? 1.0;
    this._initial = false;
    this._loading = false;
    this._context = undefined;
  }

  set widthRatio(value: number) {
    this._widthRatio = value;
  }

  // Getter：保留原逻辑，添加返回值类型
  get source():
    | string
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
    | undefined {
    return this._source;
  }

  // Setter：保留原逻辑，添加参数类型
  set source(
    value:
      | string
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement
      | undefined,
  ) {
    if (value !== this._source && this._context) {
      this._source = value;
      this.loadImage(this._source, this._context);
    }
  }

  // Getter：保留原逻辑，添加返回值类型
  get repeat(): Cesium.Cartesian2 {
    return this._repeat;
  }

  // Setter：保留原逻辑，添加参数类型
  set repeat(value: Cesium.Cartesian2) {
    this._repeat = Cesium.Cartesian2.clone(value);
  }

  // 保留原方法逻辑，添加参数类型和返回值类型
  createTexture(
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    // @ts-ignore
    context: Cesium.Context,
    // @ts-ignore
  ): Cesium.Texture {
    // @ts-ignore
    return new Cesium.Texture({
      context,
      width: context._canvas.width, // 保留原代码中访问私有属性的逻辑
      height: context._canvas.height, // 保留原代码中访问私有属性的逻辑
      pixelFormat: Cesium.PixelFormat.RGBA,
      // @ts-ignore
      sampler: new Cesium.Sampler({
        minificationFilter: Cesium.TextureMinificationFilter.LINEAR,
        magnificationFilter: Cesium.TextureMagnificationFilter.LINEAR,
        // wrapS:Cesium.TextureWrap.REPEAT,
        // wrapT:Cesium.TextureWrap.REPEAT
      }),
      source: image,
    });
  }

  // 保留原方法逻辑，添加参数类型
  bindTexture(
    image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    // @ts-ignore
    context: Cesium.Context,
  ): void {
    if (Cesium.defined(this._texture)) {
      this._texture.destroy();
    }
    const texture = this.createTexture(image, context);
    this._initial = true;
    this._texture = texture;
    this._loading = false;
  }

  // 保留原方法逻辑，添加参数类型
  loadImage(
    uniformValue:
      | string
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement
      | undefined,
    // @ts-ignore
    context: Cesium.Context,
  ): void {
    if (this._loading) return;
    if (
      uniformValue instanceof HTMLImageElement ||
      uniformValue instanceof HTMLCanvasElement
    ) {
      this.bindTexture(uniformValue, context);
      this._loading = true;
    } else if (uniformValue instanceof HTMLVideoElement) {
      if (uniformValue.readyState >= 2) {
        this._loading = true;
        this.bindTexture(uniformValue, context);
      }
    } else if (typeof uniformValue === "string") {
      // @ts-ignore
      Cesium.Resource.fetchImage({
        url: uniformValue,
      }).then((image) => {
        this._loading = true;
        this.bindTexture(image as HTMLImageElement, context); // 原代码未处理image为null的情况，此处仅添加类型断言
      });
    }
  }

  // 保留原方法逻辑，添加参数类型
  // @ts-ignore
  createDrawCommand(context: Cesium.Context): void {
    if (!Cesium.defined(this._command)) {
      this._command = context.createViewportQuadCommand(fs, {
        uniformMap: {
          u_texture: () => {
            return this._texture ? this._texture : context.defaultTexture;
          },
          u_repeat: () => {
            return this._repeat;
          },
          u_widthRatio: () => {
            return this._widthRatio;
          },
        },
      });
    }
  }

  // 保留原方法逻辑，添加参数类型和返回值类型
  // @ts-ignore
  update(frameState: Cesium.FrameState): Cesium.DrawCommand | undefined {
    const { context } = frameState;
    this._context = context;
    console.log(this._source);
    // 判断是否有资源
    if (!Cesium.defined(this._source)) return;
    console.log(111);
    // 判断资源是否在加载中，没有加载则开始加载资源
    if (!this._loading) {
      this.loadImage(this._source, context);
    } else if (
      this._initial &&
      this._source instanceof HTMLVideoElement &&
      this._texture
    ) {
      // 资源加载完成，并且为视频纹理时需要更新纹理
      this._texture.copyFrom({
        source: this._source,
      });
    }
    // 资源并未加载完成则返回
    if (this._loading) return;

    if (!Cesium.defined(this._command)) {
      this.createDrawCommand(context);
    }

    if (this._command && this._texture) {
      return this._command;
    }
    return undefined;
  }

  // 保留原方法逻辑
  destroy(): void {
    if (Cesium.defined(this._texture)) {
      this._texture.destroy();
    }
    Cesium.destroyObject(this);
  }

  // 保留原方法逻辑，添加返回值类型
  isDestroyed(): boolean {
    return false;
  }
}
