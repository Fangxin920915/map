<template>
  <!-- 保留插槽，支持父组件插入内容 -->
  <slot></slot>
</template>

<script setup lang="ts">
import FPSMonitor from "./FPSMonitor";

// 1. 基础配置项转为 Props（带默认值，与FPSMonitor类默认值对齐）
const props = withDefaults(
  defineProps<{
    /** 平滑采样的帧数 */
    sampleSize?: number;
    /** 低帧率预警阈值（低于该值触发判断） */
    thresholdFPS?: number | null;
    /** 低帧率持续时间阈值（ms） */
    thresholdTime?: number;
    /** 预警触发模式：once(仅一次) | interval(间隔触发) */
    alertMode?: "once" | "interval";
    /** 间隔触发模式下的重复间隔(ms) */
    alertInterval?: number;
  }>(),
  {
    sampleSize: 10,
    thresholdFPS: null,
    thresholdTime: 2000,
    alertMode: "once",
    alertInterval: 5000,
  },
);

// 2. 回调函数转为自定义事件
const emit = defineEmits<{
  /** 帧率更新事件：触发时返回当前帧率 */
  (e: "update:fps", fps: number): void;
  /** 低帧率预警事件：触发时返回帧率+持续时长 */
  (e: "alert:low-fps", data: { fps: number; duration: number }): void;
}>();

// 3. 实例化FPSMonitor（将Props和事件绑定到配置）
const fpsMonitor = new FPSMonitor({
  sampleSize: props.sampleSize,
  thresholdFPS: props.thresholdFPS,
  thresholdTime: props.thresholdTime,
  alertMode: props.alertMode,
  alertInterval: props.alertInterval,
  // 绑定自定义事件
  onUpdate: (fps) => emit("update:fps", fps),
  alertCallback: (fps, duration) => emit("alert:low-fps", { fps, duration }),
});

// 4. 暴露start/stop方法给父组件调用
defineExpose({
  start: () => fpsMonitor.start(),
  stop: () => fpsMonitor.stop(),
  getFps: () => fpsMonitor.getFPS(),
});
</script>

<style scoped lang="scss">
/* 可根据需求添加组件样式 */
</style>
