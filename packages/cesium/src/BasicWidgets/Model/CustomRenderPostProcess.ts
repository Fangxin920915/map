import * as Cesium from "cesium";
import { isNil } from "lodash-es";

/**
 * 拷贝项
 */
type CopyPrimitiveItem = {
  /**
   * id
   */
  id: string;
  /**
   * 拷贝项
   */
  primitive: Cesium.Model;
  /**
   * 渲染命令集合
   */
  // @ts-ignore
  commandList: Cesium.DrawCommand[];
  /**
   * 是否需要更新
   */
  dirty: boolean;
  /**
   * 禁止深度测试距离
   */
  disableDepthTestDistance: number;
};
export interface CustomRenderPostProcessImp {
  /**
   * 添加拷贝项
   * @param id
   * @param primitive 拷贝项
   * @param disableDepthTestDistance
   */
  addCopyPrimitive(
    id: string,
    primitive: Cesium.Model,
    disableDepthTestDistance?: number,
  ): void;
  /**
   * 移除拷贝项
   * @param id 拷贝项id
   */
  remove(id: string): void;
  /**
   * 获取拷贝项
   * @param id
   */
  getCopyPrimitiveItem(id: string): CopyPrimitiveItem | undefined;
  /**
   * 更新禁止深度测试距离
   * @param id
   * @param disableDepthTestDistance
   */
  updateCopyPrimitiveDisableDepthTestDistance(
    id: string,
    disableDepthTestDistance?: number,
  ): void;
  /**
   * 销毁
   */
  destroy(): void;
}
/**
 * 自定义渲染后处理，解决深度测试问题，使得模型可以显示最上层
 * @constructor
 * @param viewer 场景对象
 * @example
 *  const customRender = new CustomRenderPostProcess(viewer)
 *  const model = await Cesium.Model.fromGltfAsync({
 *         url: "/Cesium_Air.glb",
 *         modelMatrix,
 *         silhouetteColor:Cesium.Color.YELLOW,
 *         silhouetteSize:10,
 *     });
 *     viewer.scene.primitives.add(model);
 *     model.readyEvent.addEventListener(() => {
 *         customRender.addCopyPrimitive(model)
 *     });
 */
export default class CustomRenderPostProcess
  implements CustomRenderPostProcessImp
{
  private _viewer: Cesium.Viewer;

  private _scene: Cesium.Scene;

  // @ts-ignore
  private _context: Cesium.Context;

  // @ts-ignore
  private _copyPrimitiveList: CopyPrimitiveItem[];

  private _viewPort: Cesium.BoundingRectangle;

  // @ts-ignore
  private _texture: Cesium.Texture;

  // @ts-ignore
  private _colorFramebufferManager: Cesium.FramebufferManager;

  // @ts-ignore
  private _clearDrawCommand: Cesium.ClearCommand;

  // @ts-ignore
  private _passState: Cesium.PassState;

  private _postStage: Cesium.PostProcessStage | undefined;

  private isDestroyed: boolean;

  constructor(viewer: Cesium.Viewer) {
    this._viewer = viewer;
    this._scene = this._viewer.scene;
    // @ts-ignore
    this._context = this._scene.context;
    this._copyPrimitiveList = [];
    // @ts-ignore
    this._viewPort = this._scene._view.viewport;
    // @ts-ignore
    this._texture = new Cesium.Texture({
      context: this._context,
      width: this._viewPort.width,
      height: this._viewPort.height,
      pixelFormat: Cesium.PixelFormat.RGBA,
      pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
      flipY: true,
    });
    // @ts-ignore
    this._colorFramebufferManager = new Cesium.FramebufferManager({
      depthStencil: true,
      supportsDepthTexture: false,
    });

    // @ts-ignore
    this._clearDrawCommand = new Cesium.ClearCommand({
      color: new Cesium.Color(0.0, 0.0, 0.0, 0.0),
      depth: 1.0,
    });
    // @ts-ignore
    const passState = new Cesium.PassState(this._context);
    passState.viewport = Cesium.BoundingRectangle.clone(
      // @ts-ignore
      this._scene._view.viewport,
    );
    this._passState = passState;
    this._postStage = undefined;
    this.isDestroyed = false;
    this._createCopyPostprocessStage();
  }

  _updateViewPort() {
    const {
      // @ts-ignore
      view: { viewport },
    } = this._scene;
    const context = this._context;
    const { width } = viewport;
    const { height } = viewport;
    this._colorFramebufferManager.update(context, width, height);
    this._passState.viewport.width = width;
    this._passState.viewport.height = height;
    this._passState.framebuffer = this._colorFramebufferManager.framebuffer;
  }

  update() {
    try {
      if (
        !this.isDestroyed &&
        !this._scene.isDestroyed() &&
        // @ts-ignore
        this._scene._frameState.passes.render
      ) {
        this._updateViewPort();
        this._clearDrawCommand.execute(this._context, this._passState);
        this._renderCopyPrimitive();
      }
    } catch (e) {
      console.log(e);
    }
  }

  _createCopyPostprocessStage() {
    this._postStage = new Cesium.PostProcessStage({
      fragmentShader: `
                uniform sampler2D u_texture;
                uniform sampler2D colorTexture;
                in vec2 v_textureCoordinates;
        
                void main() {
                                     
                    // 采样两个纹理
                    vec4 textureColor = texture(u_texture, v_textureCoordinates);
                    vec4 colorTextureColor = texture(colorTexture, v_textureCoordinates);

                    // 实现混合逻辑
                    if (textureColor == vec4(0.0)) {
                        // 情况1：u_texture为全黑时使用u_colorTexture
                        out_FragColor = colorTextureColor;
                    } else if (textureColor.a == 1.0) {
                        // 情况2：u_texture alpha为1时完全使用u_texture
                        out_FragColor = textureColor;
                    } else {
                        // 情况3：其他情况进行混合
                        // 这里使用简单的线性混合，可根据需求调整混合方式
                        out_FragColor = textureColor * 0.5 + colorTextureColor * 0.5;
                    }
                }
            `,
      uniforms: {
        u_texture: () => {
          if (this._texture.isDestroyed()) {
            // @ts-ignore
            this._texture = new Cesium.Texture({
              context: this._context,
              // @ts-ignore
              width: this._scene._view.viewport.width,
              // @ts-ignore
              height: this._scene._view.viewport.height,
              pixelFormat: Cesium.PixelFormat.RGBA,
              pixelDatatype: Cesium.PixelDatatype.UNSIGNED_BYTE,
            });
          }
          return this._texture;
        },
      },
    });

    this._viewer.postProcessStages.add(this._postStage);
  }

  _renderCopyPrimitive() {
    if (this.isDestroyed || this._copyPrimitiveList.length === 0) {
      return;
    }
    this._passState.blendingEnabled = false;

    this._copyPrimitiveList.forEach((copyPrimitiveItem) => {
      if (!this._checkVisible(copyPrimitiveItem)) {
        return;
      }
      if (copyPrimitiveItem.dirty || this._checkDirty(copyPrimitiveItem)) {
        this._executeCopyPrimitiveDrawCommand(copyPrimitiveItem);
      } else {
        copyPrimitiveItem.commandList.forEach((command) => {
          if (!copyPrimitiveItem.primitive.show) {
            return;
          }
          if (command._vertexArray.isDestroyed()) {
            copyPrimitiveItem.dirty = true;
            console.log("vertexArray is destroyed");
            return;
          }
          // @ts-ignore
          const copyCommand = Cesium.DrawCommand.shallowClone(command);
          // @ts-ignore
          copyCommand.renderState = new Cesium.RenderState({
            ...command.renderState,
            depthTest: {
              enabled: true,
              func: Cesium.DepthFunction.LESS,
            },
          });
          copyCommand.execute(this._context, this._passState);
        });
      }
    });
    this._texture = this._passState.framebuffer.getColorTexture(0);
  }

  remove(id: string) {
    const index = this._copyPrimitiveList.findIndex(
      (copyPrimitiveItem) => copyPrimitiveItem.id === id,
    );
    if (index >= 0) {
      this._copyPrimitiveList.splice(index, 1);
    }
  }

  getCopyPrimitiveItem(id: string): CopyPrimitiveItem | undefined {
    return this._copyPrimitiveList.find((item) => item.id === id);
  }

  _checkDirty(copyPrimitiveItem: CopyPrimitiveItem) {
    let flag = false;
    for (let i = 0; i < copyPrimitiveItem.commandList.length; i++) {
      const command = copyPrimitiveItem.commandList[i];
      if (command._vertexArray.isDestroyed()) {
        flag = true;
        break;
      }
    }
    return flag;
  }

  _checkVisible(copyPrimitiveItem: CopyPrimitiveItem): boolean {
    const { primitive, disableDepthTestDistance } = copyPrimitiveItem;
    if (disableDepthTestDistance === 0) {
      return false;
    }
    if (
      disableDepthTestDistance === Number.POSITIVE_INFINITY ||
      isNil(disableDepthTestDistance)
    ) {
      return true;
    }
    const position = Cesium.Matrix4.getTranslation(
      primitive.modelMatrix,
      new Cesium.Cartesian3(),
    );
    const distance = Cesium.Cartesian3.distance(
      position,
      this._scene.camera.positionWC,
    );
    return distance < disableDepthTestDistance;
  }

  addCopyPrimitive(
    id: string,
    primitive: Cesium.Model,
    disableDepthTestDistance: number,
  ): void {
    const copyPrimitiveItem: CopyPrimitiveItem = {
      id,
      primitive,
      // @ts-ignore
      commandList: [],
      dirty: true,
      disableDepthTestDistance,
    };
    if (this._copyPrimitiveList.find((item) => item.id === id)) {
      return;
    }
    this._copyPrimitiveList.push(copyPrimitiveItem);
  }

  updateCopyPrimitiveDisableDepthTestDistance(
    id: string,
    disableDepthTestDistance: number,
  ) {
    const copyPrimitiveItem: CopyPrimitiveItem | undefined =
      this._copyPrimitiveList.find((item) => item.id === id);
    if (copyPrimitiveItem) {
      copyPrimitiveItem.disableDepthTestDistance = disableDepthTestDistance;
    }
  }

  _executeCopyPrimitiveDrawCommand(copyPrimitiveItem: CopyPrimitiveItem) {
    const { primitive, commandList } = copyPrimitiveItem;
    commandList.length = 0;
    if (primitive && primitive.ready) {
      // @ts-ignore
      primitive.sceneGraph._runtimeNodes.forEach((runtimeNode) => {
        // @ts-ignore
        runtimeNode.runtimePrimitives.forEach((runtimePrimitive) => {
          const { drawCommand } = runtimePrimitive;
          if (drawCommand && !drawCommand.command._vertexArray.isDestroyed()) {
            commandList.push(drawCommand.command);
          }
        });
      });
      copyPrimitiveItem.dirty = false;
    }
  }

  destroy() {
    if (this._viewer.isDestroyed()) return;
    if (this._postStage) {
      this._viewer.postProcessStages.remove(this._postStage);
    }
    this._colorFramebufferManager.destroy();
    this._colorFramebufferManager = undefined;
    this._texture.destroy();
    this._texture = undefined;
    this._copyPrimitiveList.length = 0;
    this.isDestroyed = true;
    Cesium.destroyObject(this);
  }
}
