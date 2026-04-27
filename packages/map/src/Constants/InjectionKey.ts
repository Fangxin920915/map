import { InjectionKey, ShallowRef } from "vue";
import { IVectorLayerImp, ModelLayerImp } from "@gdu-gl/common";

export const VectorLayerKey: InjectionKey<
  ShallowRef<IVectorLayerImp | undefined>
> = Symbol("VectorLayerKey");

export const ModelLayerKey: InjectionKey<
  ShallowRef<ModelLayerImp | undefined>
> = Symbol("ModelLayerKey");
