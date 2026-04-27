import { PolygonCoordinates } from "@common/Interfaces";
import { LinePointAction } from "@common/index";

export enum RoutePointType {
  /**
   * 航线的拐点
   */
  TURN = 1,
  /**
   * 航线的投影点
   */
  FOOT = 2,
  /**
   * 航线的插入点
   */
  INSERT = 3,
  /**
   * 航线的删除点
   */
  TURN_DELETE = 4,
  /**
   * 航线的删除点
   */
  FOOT_DELETE = 5,
  /**
   * 航线的起飞点
   */
  TAKEOFF = 6,
  /**
   * 航线面
   */
  AREA = 7,
  /**
   * 环绕点
   */
  SURROUND = 8,
}

/**
 * 出发changed事件的类型
 */
export enum RouteEditEventType {
  /**
   * 新增点位类型
   */
  ADD,
  /**
   * 删除点位类型
   */
  REMOVE,
  /**
   * 编辑点位类型
   */
  MODIFY,
  /**
   * 插入点位类型
   */
  INSERT,
  /**
   * 清空点位类型
   */
  CLEAR,
  /**
   * 绘制结束类型
   */
  CREATE,
  /**
   * 刷新航线数据
   */
  REFRESH,
  /**
   * 新增环绕点类型
   */
  ADD_SURROUND,
  /**
   * 删除环绕点类型
   */
  REMOVE_SURROUND,
  /**
   * 修改环绕点类型
   */
  MODIFY_SURROUND,
}

export enum RouteEditDrawStatus {
  DRAWING,
  DRAW_END,
  MODIFY,
  DRAW_TAKEOFF,
  DRAW_SURROUND,
  MODIFY_SURROUND,
}

export interface RouterEditChangeParams {
  /**
   * 编辑事件数据更改的操作类型
   */
  type: RouteEditEventType;
  /**
   * 航线所在父级索引
   * @description 该属性只有在五向倾斜摄影中有用，其他航线直接取idx即可
   */
  parentsIdx?: number;
  /**
   * 触发事件的点位的索引
   */
  idx?: number;
  /**
   * 航线更新后的数据
   */
  lines?: LinePointAction[][];
  /**
   * 测面更新后的数据
   */
  area?: PolygonCoordinates | PolygonCoordinates[] | null;
}

export interface RouterEditModifyEventParams
  extends Omit<RouterEditChangeParams, "type"> {}
