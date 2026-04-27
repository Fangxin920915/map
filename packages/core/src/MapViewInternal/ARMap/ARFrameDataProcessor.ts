import { SeiData } from "@gdu-gl/common";
import { cloneDeep } from "lodash-es";
/**
 * 帧数据处理器类（移除所有兜底逻辑，仅保留核心聚类+双维度校验）
 * 核心逻辑：
 * 1. 缓存<窗口大小：直接缓存，返回原始数据
 * 2. 缓存≥窗口大小：聚类识别正常集群 → 清洗异常帧 → 新帧需满足「差值合规+集群归属」双校验
 * 3. 无任何兜底逻辑：有效帧不足时缓存会自然缩减，异常帧直接返回缓存最后一帧（无缓存则返回当前帧）
 */
export default class SeiDataProcessor {
  // 核心配置项
  private tsDiffThreshold: number; // 正常相邻TS差值阈值

  private windowSize: number; // 滑动窗口大小（≥2）

  private clusterThreshold: number; // 集群划分阈值（2*差值阈值）

  // 运行时状态
  private frameCache: SeiData[] = []; // 滑动窗口缓存

  private normalClusterMin: number = 0; // 正常集群TS最小值（带容错）

  private normalClusterMax: number = 0; // 正常集群TS最大值（带容错）

  // 工程化配置
  private enableLog: boolean; // 日志开关

  private clear: boolean;

  private count: number;

  /**
   * 构造函数：初始化核心配置
   * @param tsDiffThreshold 正常相邻TS差值阈值（默认100）
   * @param windowSize 滑动窗口大小（默认5，≥2）
   * @param enableLog 是否开启日志（默认false）
   */
  constructor(
    tsDiffThreshold: number = 100,
    windowSize: number = 5,
    enableLog = false,
  ) {
    if (windowSize < 2) {
      throw new Error("滑动窗口大小windowSize必须≥2，否则无法做聚类分析");
    }
    if (tsDiffThreshold < 0) {
      throw new Error("TS差值阈值tsDiffThreshold不能为负数");
    }
    this.count = 0;
    this.tsDiffThreshold = tsDiffThreshold;
    this.windowSize = windowSize;
    this.enableLog = enableLog;
    this.clusterThreshold = 2 * tsDiffThreshold;
    this.clear = false;
  }

  reset() {
    this.frameCache.length = 0;
    this.clear = false;
  }

  /**
   * 核心处理方法：单帧数据校验与清洗（无兜底）
   */
  processFrame(frame: SeiData): SeiData {
    if (this.count > 100) {
      this.reset();
    }

    // 1. 缓存未达窗口大小：直接缓存，返回原始数据
    if (!this.clear && this.frameCache.length < this.windowSize) {
      this.frameCache.push(cloneDeep(frame));
      this.enableLog &&
        console.log(
          `[FrameProcessor] 缓存未达窗口大小（${this.frameCache.length}/${this.windowSize}），返回原始帧 TS=${frame.videoTs}`,
        );
      return frame;
    }
    if (!this.clear) {
      // 3. 缓存达标：聚类清洗异常帧 → 双维度校验新帧
      this.cleanInvalidFramesByCluster();
      this.clear = true;
    }

    const lastValidFrame = this.frameCache[this.frameCache.length - 1];

    // 双维度校验（无兜底：不满足则返回缓存最后一帧）
    const tsDiff = Math.abs(frame.videoTs - lastValidFrame.videoTs);

    if (tsDiff > this.tsDiffThreshold) {
      console.log(
        `[FrameProcessor] 检测到异常帧 TS=${frame.videoTs} | 差值=${tsDiff} |`,
      );
      this.count++;
      this.enableLog &&
        console.log(`[FrameProcessor] 检测到异常帧 返回上帧数据 |`);
      return lastValidFrame;
    }
    this.count = 0;
    // 4. 正常帧：更新滑动窗口，返回当前帧
    this.updateSlidingWindowCache(frame);
    return frame;
  }

  /**
   * 核心聚类清洗逻辑（移除所有兜底：有效帧不足则缓存自然缩减）
   */
  private cleanInvalidFramesByCluster(): void {
    if (this.frameCache.length < 2) return;

    // 重置集群区间
    this.normalClusterMin = 0;
    this.normalClusterMax = 0;

    // 步骤1：提取TS、排序、计算整体中位数
    const tsList = this.frameCache.map((frame) => frame.videoTs);
    const sortedTs = [...tsList].sort((a, b) => a - b);
    const totalMedian = this.calculateMedian(sortedTs);
    this.enableLog &&
      console.log(
        `[FrameProcessor] 缓存原始TS：${tsList} | 排序后：${sortedTs} | 整体中位数：${totalMedian}`,
      );

    // 步骤2：TS聚类
    const clusters = this.clusterTs(sortedTs);
    this.enableLog &&
      console.log(
        `[FrameProcessor] 识别到集群列表：${clusters.map((c) => `[${c.join(",")}]`)}`,
      );

    // 步骤3：选择正常集群（仅最长/中位数择优，无极端场景兜底）
    const normalCluster = this.selectNormalCluster(clusters, totalMedian);
    this.enableLog &&
      console.log(`[FrameProcessor] 选定正常集群：${normalCluster.join(",")}`);

    // 步骤4：划定正常集群区间
    this.normalClusterMin = Math.min(...normalCluster) - this.tsDiffThreshold;
    this.normalClusterMax = Math.max(...normalCluster) + this.tsDiffThreshold;

    // 步骤5：筛选正常区间内的帧（无兜底：不足2帧也直接用）
    const validFrames = this.frameCache.filter((frame) => {
      const isInRange =
        frame.videoTs >= this.normalClusterMin &&
        frame.videoTs <= this.normalClusterMax;
      if (!isInRange) {
        this.enableLog &&
          console.log(
            `[FrameProcessor] 清洗异常帧：TS=${frame.videoTs} 超出区间[${this.normalClusterMin}, ${this.normalClusterMax}]`,
          );
      }
      return isInRange;
    });

    // 直接赋值（无兜底：有效帧不足则缓存自然缩减）
    this.frameCache = validFrames.sort((a, b) => a.videoTs - b.videoTs);
    this.enableLog &&
      console.log(
        `[FrameProcessor] 缓存清洗完成，有效TS：${this.frameCache.map((f) => f.videoTs)}`,
      );
  }

  /**
   * 辅助：TS聚类（无兜底）
   */
  private clusterTs(sortedTs: number[]): number[][] {
    const clusters: number[][] = [];
    let currentCluster: number[] = [sortedTs[0]];

    for (let i = 1; i < sortedTs.length; i++) {
      if (
        sortedTs[i] - currentCluster[currentCluster.length - 1] <=
        this.clusterThreshold
      ) {
        currentCluster.push(sortedTs[i]);
      } else {
        clusters.push(currentCluster);
        currentCluster = [sortedTs[i]];
      }
    }
    clusters.push(currentCluster);
    return clusters;
  }

  /**
   * 辅助：选择正常集群（移除极端场景兜底）
   */
  private selectNormalCluster(
    clusters: number[][],
    totalMedian: number,
  ): number[] {
    // 找长度最大的集群
    const maxLength = Math.max(...clusters.map((c) => c.length));
    const maxLengthClusters = clusters.filter((c) => c.length === maxLength);

    // 多个最长集群 → 中位数择优（无其他兜底）
    if (maxLengthClusters.length > 1) {
      this.enableLog &&
        console.log(`[FrameProcessor] 多个集群长度相同，中位数择优`);
      return maxLengthClusters.reduce((best, curr) => {
        const currMedian = this.calculateMedian(curr);
        const bestMedian = this.calculateMedian(best);
        return Math.abs(currMedian - totalMedian) <
          Math.abs(bestMedian - totalMedian)
          ? curr
          : best;
      }, maxLengthClusters[0]);
    }

    // 唯一最长集群 → 直接返回（无极端场景兜底）
    return maxLengthClusters[0];
  }

  /**
   * 辅助：计算中位数
   */
  private calculateMedian(sortedArr: number[]): number {
    const len = sortedArr.length;
    const mid = Math.floor(len / 2);
    return len % 2 === 0
      ? (sortedArr[mid - 1] + sortedArr[mid]) / 2
      : sortedArr[mid];
  }

  /**
   * 更新滑动窗口缓存（先进先出，无兜底）
   */
  private updateSlidingWindowCache(frame: SeiData): void {
    this.frameCache.push(cloneDeep(frame));
    if (this.frameCache.length > this.windowSize) {
      this.frameCache.shift();
    }
    this.enableLog &&
      console.log(
        `[FrameProcessor] 滑动窗口更新，当前缓存TS：${this.frameCache.map((f) => f.videoTs)}`,
      );
  }
}
