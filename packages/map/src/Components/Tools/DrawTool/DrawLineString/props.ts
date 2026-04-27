import { LineStringCoordinates, MapThemeColor } from "@gdu-gl/common";
import {
  CommonDrawEmits,
  CommonDrawProps,
  defaultCommonProps,
} from "../Common/CommonProps";
import { LineStringProps } from "../../../../Types";

/**
 * 线串绘制工具相关的属性与事件定义
 * 包含绘制/编辑线串时的配置项、事件接口及默认属性值
 */

/**
 * 线串绘制工具属性接口
 * 继承通用绘制属性，扩展线样式配置
 */
export interface DrawLineStringToolProps extends CommonDrawProps {
  /**
   * 线串样式配置
   * 可选配置线颜色、宽度、轮廓等视觉属性
   */
  lineStringStyle?: Pick<
    LineStringProps,
    | "strokeOutlineWidth" // 轮廓宽度
    | "strokeOutlineColor" // 轮廓颜色
    | "strokeColor" // 线颜色
    | "strokeWidth" // 线宽度
    | "lineDash" // 虚线样式（如 [5,5] 表示5px实线5px空白）
    | "strokeGapColor"
  >;
}

/**
 * 线串绘制工具事件接口
 * 继承通用绘制事件，扩展绘制完成事件
 */
export interface DrawLineStringToolEmits extends CommonDrawEmits {
  /**
   * 绘制完成事件
   * @param e 事件名 "finish"
   * @param value 绘制完成的线串坐标数组（LineString格式）
   */
  (e: "finish", value: LineStringCoordinates): void;
}

/**
 * 线串编辑工具属性接口
 * 继承绘制工具属性，增加待编辑的初始坐标
 */
export interface EditLineStringToolProps extends DrawLineStringToolProps {
  /**
   * 待编辑的线串坐标数组
   * 编辑过程中通过事件同步更新
   */
  coordinates: LineStringCoordinates;
  featureId?: any;
}

/**
 * 线串编辑工具事件接口
 * 定义编辑过程中的关键事件
 */
export interface EditLineStringToolEmits {
  /**
   * 编辑开始事件
   * @param e 事件名 "modifyStart"
   * 触发时机：用户开始拖拽编辑线串顶点时
   */
  (e: "modifyStart"): void;
  /**
   * 编辑完成事件
   * @param e 事件名 "modifyEnd"
   * @param value 编辑完成后的线串坐标数组
   * 触发时机：用户结束拖拽或完成编辑操作时
   */
  (e: "modifyEnd", value: LineStringCoordinates): void;
}

/**
 * 线串绘制工具默认属性
 * 合并通用默认属性，设置默认线样式
 */
export const defaultDrawLineStringProps = {
  ...defaultCommonProps,
  lineStringStyle: {
    strokeColor: MapThemeColor.brand[500], // 默认线颜色：橙色
    strokeWidth: 5, // 默认线宽：5px
    strokeOutlineColor: MapThemeColor.neutral[100], // 默认轮廓颜色：浅灰色
    strokeOutlineWidth: 1, // 默认轮廓宽度：1px
  },
};

/**
 * 线串编辑工具默认属性
 * 合并通用默认属性，设置默认线样式及初始坐标
 */
export const defaultEditLineStringProps = {
  ...defaultDrawLineStringProps,
  coordinates: [], // 默认初始坐标：空数组（编辑前需传入实际坐标）
};
