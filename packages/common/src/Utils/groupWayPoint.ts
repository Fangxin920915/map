import { LineStringCoordinates } from "@common/Interfaces";
import { LinePointAction } from "@common/Types";

/**
 * 根据环绕点对路径点进行分组
 *
 * 该函数将路径点数组按照环绕点标记进行分组，每遇到一个带有环绕点的路径点
 * 就将当前已收集的路径点作为一组，并开始新的分组。
 *
 *
 * @param turnPointList 路径点数组，包含坐标信息和环绕点标记
 * @returns 分组后的路径点数组，每个元素是一组连续的路径点坐标
 *
 *
 * 为什么需要分组？
 * 在地图导航或路径规划中，路径点通常是连续的坐标点序列。但在某些情况下，我们需要对路径进行分段处理，例如：
 *
 * 环绕障碍物：当路径需要环绕某个障碍物时，会产生一系列特殊的路径点
 * 路径优化：不同路段可能需要不同的处理策略
 * 可视化需求：不同路段可能需要不同的渲染样式
 *
 * @example
 * // 输入:
 * const points = [
 *   { coordinates: [100, 30], surroundPoint: undefined },
 *   { coordinates: [101, 31], surroundPoint: { coordinates: [101, 31] } },
 *   { coordinates: [102, 32], surroundPoint: { coordinates: [101, 31] } }
 *   { coordinates: [103, 33], surroundPoint: undefined },
 *   { coordinates: [104, 34], surroundPoint: undefined }
 * ];
 *
 * // 输出:
 * // [[[100, 30], [101, 31]], [[102, 32]], [[103, 33],[104, 34]]]
 */
export function groupWayPointBySurround(turnPointList: LinePointAction[]) {
  // 1. 初始化结果数组，用于存储分组后的路径点
  const lineArr: LineStringCoordinates[] = [];

  // 2. 初始化临时分组数组，用于收集当前分组的路径点
  let tempGroup: LineStringCoordinates = [];

  // 3. 遍历输入的路径点数组
  turnPointList.forEach((item) => {
    // 4. 将当前路径点的坐标添加到临时分组中
    tempGroup.push(item.coordinates);

    // 5. 检查当前路径点是否带有环绕点（通过检查 surroundPoint.coordinates 是否存在）
    if (item.surroundPoint?.coordinates) {
      // 6. 如果临时分组不为空，则将其添加到结果数组中
      if (tempGroup.length > 0) {
        lineArr.push(tempGroup);
      }
      // 7. 清空临时分组，准备开始新的分组
      tempGroup = [];
    }
  });

  // 8. 遍历结束后，如果临时分组中还有剩余的路径点，则将其添加到结果数组中
  if (tempGroup.length > 0) {
    lineArr.push(tempGroup);
  }

  // 9. 返回分组后的结果数组
  return lineArr;
}
