import { ModelFeature, ModelFeatureCollection } from "./IModel";

export interface ModelLayerImp {
  /**
   * 图层id
   */
  layerId: string;
  /**
   * 模型集合
   */
  feature: ModelFeatureCollection;
  /**
   * 添加模型
   * @param model 模型
   */
  addModel(model: ModelFeature): void;
  /**
   * 删除模型
   * @param modelId 模型id
   */
  removeModel(modelId: string): void;
  /**
   * 更新模型属性
   * @param modelFeatureProperties
   */
  updateModelProperties(
    modelFeatureProperties: ModelFeature["properties"] & Record<string, any>,
  ): void;
  /**
   * 更新模型几何
   * @param modelId 模型id
   * @param model 模型
   */
  updateModelGeometry(modelId: string, model: ModelFeature): void;
  /**
   * 删除全部
   */
  removeAll(): void;
  /**
   * 卸载
   */
  destroy(): void;
}
