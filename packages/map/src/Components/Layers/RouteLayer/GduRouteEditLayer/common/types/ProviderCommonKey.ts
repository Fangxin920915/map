import { InjectionKey, Ref, WritableComputedRef } from "vue";
import { RouteEditLayerProps } from "../../props";
import { RouteActiveFeature } from "./EventCommonParams";

/**
 * 绘制多边形时，是否自相交的 key 的注入键，用于注入响应式引用类型的自相交状态
 */
export const IsPolygonSelfIntersectingKey: InjectionKey<Ref<boolean>> =
  Symbol("面状航线绘制多边形时，是否自相交");

/**
 * 航点航线属性的注入键
 */
export const RouteAreaEditPropsKey: InjectionKey<
  Omit<RouteEditLayerProps, "type">
> = Symbol("面状航线航线属性的注入键");

/**
 * 面状航线选中点位信息的注入键
 */
export const RouteAreaEditSelectDataInfoKey: InjectionKey<
  WritableComputedRef<RouteActiveFeature>
> = Symbol("面状航线选中点位信息的注入键");
