import { computed, toRaw, WritableComputedRef } from "vue";
import {
  getHeightByMode,
  ModifyType,
  PointCoordinates,
  RouteEditDrawStatus,
  RouteEditEventType,
  RoutePointType,
  transformEllipsoidHeightByMode,
} from "@gdu-gl/common";
import { getLinePointHeightByMode } from "@map/Utils";
import {
  WayPointDataInfo,
  WayPointEditEmits,
  WayPointEditProps,
} from "../props";
import { RouteActiveFeature } from "../../common/types/EventCommonParams";

export function useWayPointEvent(
  props: WayPointEditProps,
  emits: WayPointEditEmits,
  dataInfo: WayPointDataInfo,
  selectInfo: WritableComputedRef<RouteActiveFeature>,
) {
  const modifyType = computed<ModifyType | undefined>(() => {
    /**
     * 如果满足以下条件，返回 "vertical" 表示垂直修改模式：
     *     1. 不贴地
     *     2. 当前不是绘制状态
     *     3. 按下 Alt 键
     *     4. 当前 hover 的元素是转向点
     */
    if (
      !props.clampToGround &&
      dataInfo.altPress &&
      dataInfo.hover.type === RoutePointType.TURN
    ) {
      return "vertical";
    }
    // // 如果不贴地，返回 "horizontal" 表示水平修改模式
    // if (!props.clampToGround) {
    //   return "horizontal";
    // }
    // // 默认返回 "ground" 表示贴地模式
    // return "ground";
    return "horizontal";
  });

  /**
   * 记录修改前的状态，如果是绘制起飞点状态，在编辑完成后需要恢复到绘制起飞点状态
   */
  let beforeModifyStatus = dataInfo.drawStatus;

  /**
   * 向航线中添加一个新的航点
   * @param coordinates - 新航点的坐标，格式为 [经度, 纬度]
   */
  function addWayPoint(coordinates: PointCoordinates) {
    const {
      coordinates: newCoordinates,
      elevationHeight,
      relativeHeight,
    } = getHeightByMode({
      mode: props.altitudeMode!,
      takeoffPoint: props.takeoffPoint!,
      height: props.defaultPointHeight!,
      coordinates,
    });

    // 向 modifyLine 数组中添加一个新的航点对象
    dataInfo.modifyLine.push({
      // 航点坐标，包含经度、纬度和默认高度
      coordinates: newCoordinates,
      height: getLinePointHeightByMode(
        props.altitudeMode,
        relativeHeight,
        elevationHeight,
      ),
      // 标记该点为拐点
      isTurn: true,
      // 标记该点为非安全点
      isSafe: false,
    });
    selectInfo.value = {
      type: RoutePointType.TURN,
      index: dataInfo.modifyLine.length - 1,
    };
    dataInfo.selectDeleteIndex = -1;
    // 触发 'changed' 事件，通知外部有新航点添加
    emits("changed", {
      // 事件类型为添加
      type: RouteEditEventType.ADD,
      // 新航点的索引
      idx: dataInfo.modifyLine.length - 1,
      // 当前完整的航线数据
      line: toRaw(dataInfo.modifyLine),
    });
  }

  /**
   * 开始修改指定索引位置的航点
   * @param index - 要修改的航点的索引
   * @param type
   * @param drawStatus
   */
  function modifyStartWayPoint(
    index: number,
    type: RoutePointType,
    drawStatus?: RouteEditDrawStatus,
  ) {
    beforeModifyStatus = dataInfo.drawStatus;
    selectInfo.value = {
      type,
      index,
    };
    dataInfo.drawStatus = drawStatus ?? RouteEditDrawStatus.MODIFY;
    dataInfo.hover = {
      type,
      index,
    };
    dataInfo.selectDeleteIndex = -1;

    // 触发 'startModify' 事件，通知外部开始修改指定索引的航点
    emits("startModify", {
      // 要修改的航点的索引
      idx: index,
      // 当前完整的航线数据
      line: toRaw(dataInfo.modifyLine),
    });
  }

  /**
   * 在指定索引位置插入一个新的航点
   * @param index - 插入位置的索引，新航点将插入到该索引的下一个位置
   * @param coordinates - 新航点的坐标，格式为 [经度, 纬度]
   */
  function insertWayPoint(index: number, coordinates: PointCoordinates) {
    if (!props.active) {
      return;
    }
    selectInfo.value = {
      type: RoutePointType.TURN,
      index: index + 1,
    };
    dataInfo.selectDeleteIndex = -1;
    const {
      coordinates: newCoordinates,
      relativeHeight,
      elevationHeight,
    } = getHeightByMode({
      mode: props.altitudeMode!,
      takeoffPoint: props.takeoffPoint!,
      height: props.defaultPointHeight!,
      coordinates,
    });
    // 在指定索引位置的下一个位置插入一个新的航点对象
    dataInfo.modifyLine.splice(index + 1, 0, {
      // 航点坐标，包含经度、纬度和默认高度
      coordinates: newCoordinates,
      height: getLinePointHeightByMode(
        props.altitudeMode,
        relativeHeight,
        elevationHeight,
      ),
      // 标记该点为拐点
      isTurn: true,
      // 标记该点为非安全点
      isSafe: false,
    });
    // 触发 'changed' 事件，通知外部有新航点插入
    emits("changed", {
      // 事件类型为插入
      type: RouteEditEventType.INSERT,
      // 新航点的索引
      idx: index + 1,
      // 当前完整的航线数据
      line: toRaw(dataInfo.modifyLine),
    });
  }

  /**
   * 修改指定索引位置航点的坐标
   * @param index - 要修改的航点的索引
   * @param coordinates - 新的坐标，格式为 [经度, 纬度]
   */
  function modifyingWayPoint(index: number, coordinates: PointCoordinates) {
    // 从原航点坐标中提取高度信息
    // const [, , height] = dataInfo.modifyLine[index].coordinates;
    // 解构出坐标中的经度和纬度
    const [lon, lat, pickHeight] = coordinates;
    const selectLineAction = dataInfo.modifyLine[index];
    if (modifyType.value === "vertical") {
      // 垂直拖动，椭球高度改变，反算海拔高度和相对高度
      const position = [lon, lat, pickHeight] as PointCoordinates;
      selectLineAction.coordinates = position;
      const { relativeHeight, elevationHeight } =
        transformEllipsoidHeightByMode({
          coordinates: position,
          takeoffPoint: props.takeoffPoint!,
        });
      selectLineAction.height = getLinePointHeightByMode(
        props.altitudeMode,
        relativeHeight,
        elevationHeight,
      );
    } else {
      // 如果是水平拖动，海拔高度和相对高度不变，反算椭球高度
      const {
        coordinates: newCoordinates,
        elevationHeight,
        relativeHeight,
      } = getHeightByMode({
        mode: props.altitudeMode!,
        takeoffPoint: props.takeoffPoint!,
        coordinates,
        height: selectLineAction.height,
      });

      // 更新指定索引位置航点的坐标，保留原高度
      selectLineAction.coordinates = newCoordinates;
      selectLineAction.height = getLinePointHeightByMode(
        props.altitudeMode,
        relativeHeight,
        elevationHeight,
      );
    }
  }

  /**
   * 结束对指定索引位置航点的修改
   * @param index - 已修改的航点的索引
   * @param pointType
   */
  function modifyEndWayPoint(index: number, pointType?: RoutePointType) {
    if (beforeModifyStatus !== RouteEditDrawStatus.DRAW_TAKEOFF) {
      dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
    } else {
      dataInfo.drawStatus = beforeModifyStatus;
    }
    // const currentTurnPoint = dataInfo.modifyLine[index];
    // dataInfo.modifyLine[index].surroundPoint =
    //   refreshSurroundPointListByTurn(currentTurnPoint);
    // 触发 'changed' 事件，通知外部完成对指定索引航点的修改
    emits("changed", {
      // 事件类型为修改
      type:
        pointType === RoutePointType.SURROUND
          ? RouteEditEventType.MODIFY_SURROUND
          : RouteEditEventType.MODIFY,
      // 已修改的航点的索引
      idx: index,
      // 当前完整的航线数据
      line: toRaw(dataInfo.modifyLine),
    });
  }

  function deleteWayPoint(index: number) {
    selectInfo.value = {
      type: null,
      index: -1,
    };
    dataInfo.selectDeleteIndex = -1;
    dataInfo.modifyLine.splice(index, 1);
    emits("changed", {
      type: RouteEditEventType.REMOVE,
      idx: index,
      line: toRaw(dataInfo.modifyLine),
    });
  }

  function clickWayPoint(index: number) {
    if (!props.active) {
      return;
    }
    const { type: oldType, index: oldIndex } = selectInfo.value;
    // 点击的航点不是当前选中的航点或类型不同，切换到环绕点新增模式
    if (
      dataInfo.drawStatus === RouteEditDrawStatus.DRAW_SURROUND &&
      (oldIndex !== index || oldType !== RoutePointType.TURN)
    ) {
      dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
    }
    selectInfo.value = {
      type: RoutePointType.TURN,
      index,
    };
    dataInfo.selectDeleteIndex = -1;
  }

  /**
   * 添加环绕点中心
   * @param point
   */
  function addSurroundCenterPoint(point: PointCoordinates) {
    if (!props.active) {
      return;
    }
    dataInfo.selectDeleteIndex = -1;
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_END;
    const { index } = selectInfo.value;
    const currentTurnPoint = dataInfo.modifyLine[index];
    currentTurnPoint.surroundPoint = {
      enableCounterclockwise: false,
      angle: 360,
      repeat: 1,
      coordinates: point,
      height: 0,
      stepAngle: 15,
      pointList: [],
    };
    // dataInfo.modifyLine[index].surroundPoint =
    //   refreshSurroundPointListByTurn(currentTurnPoint);
    emits("changed", {
      type: RouteEditEventType.ADD_SURROUND,
      idx: index,
      line: toRaw(dataInfo.modifyLine),
    });
  }

  /**
   * 进入环绕点新增模式
   * @param index
   */
  function startAddSurroundPoint(index: number) {
    if (!props.active) {
      return;
    }
    selectInfo.value = {
      type: RoutePointType.TURN,
      index,
    };
    dataInfo.selectDeleteIndex = -1;
    dataInfo.drawStatus = RouteEditDrawStatus.DRAW_SURROUND;
    dataInfo.modifyLine[index].surroundPoint = undefined;
  }

  /**
   * 删除环绕点中心
   * @param index
   */
  function deleteSurroundPoint(index: number) {
    if (!props.active) {
      return;
    }
    selectInfo.value = {
      type: RoutePointType.TURN,
      index,
    };
    dataInfo.selectDeleteIndex = -1;
    dataInfo.drawStatus = RouteEditDrawStatus.DRAWING;
    dataInfo.modifyLine[index].surroundPoint = undefined;
    emits("changed", {
      type: RouteEditEventType.REMOVE_SURROUND,
      idx: index,
      line: toRaw(dataInfo.modifyLine),
    });
  }

  function modifySurroundPoint(index: number, position: PointCoordinates) {
    dataInfo.modifyLine[index].surroundPoint!.coordinates = position;
  }

  return {
    modifyType,
    modifyStartWayPoint,
    addWayPoint,
    insertWayPoint,
    modifyEndWayPoint,
    modifyingWayPoint,
    deleteWayPoint,
    clickWayPoint,
    startAddSurroundPoint,
    deleteSurroundPoint,
    addSurroundCenterPoint,
    modifySurroundPoint,
  };
}
