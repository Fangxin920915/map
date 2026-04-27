<template>
  <div class="playground">
    <div class="toolbar">
      <div class="logo-area">
        <svg class="logo-icon" viewBox="0 0 24 24" width="20" height="20" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="#28a745" stroke-width="2"/>
          <path d="M8 12 L11 15 L16 9" stroke="#28a745" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="logo">GDU Map Playground</span>
      </div>
      <div class="actions">
        <!-- 示例选择器 -->
        <select v-model="selectedExample" class="example-select" @change="loadExample">
          <option value="">选择示例</option>
          <option v-for="example in exampleList" :key="example.name" :value="example.name">
            {{ example.label }}
          </option>
        </select>
        <button class="btn btn-run" @click="runCode" :disabled="!previewReady">
          <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
            <path d="M4 2.5v11l9-5.5z"/>
          </svg>
          运行
        </button>
      </div>
    </div>
    <div class="body" ref="bodyRef">
      <!-- 拖拽时的透明遮罩，防止 iframe 吞掉鼠标事件 -->
      <div v-if="isDragging" class="drag-overlay"></div>
      <CodeEditor ref="editorRef" v-model="code" :style="{ width: leftWidth + 'px' }" @compile-error="onCompileError" />
      <div
        class="resizer"
        :class="{ 'resizer--active': isDragging }"
        @mousedown="onDragStart"
      >
        <div class="resizer-line"></div>
      </div>
      <PreviewPane ref="previewPane" @ready="previewReady = true" @runtime-error="onRuntimeError" />
    </div>
    <div v-if="errors.length" class="error-panel">
      <div class="error-header">
        <div class="error-header-left">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" class="error-icon">
            <path d="M8 1L15 14H1L8 1Z" fill="none" stroke="currentColor" stroke-width="1.5"/>
            <line x1="8" y1="5" x2="8" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <circle cx="8" cy="11.5" r="0.8" fill="currentColor"/>
          </svg>
          <span class="error-title">错误 ({{ errors.length }})</span>
        </div>
        <div class="error-header-actions">
          <button class="btn btn-run-small" @click="runCode" :disabled="!previewReady">
            <svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor">
              <path d="M4 2.5v11l9-5.5z"/>
            </svg>
            重新运行
          </button>
          <button class="btn btn-clear-small" @click="clearErrors">清除</button>
        </div>
      </div>
      <div class="error-body">
        <div v-for="(err, i) in errors" :key="i" class="error-item">
          <span class="error-badge">{{ err.source === "compile" ? "编译" : "运行时" }}</span>
          <pre>{{ err.message }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import CodeEditor from "./components/CodeEditor.vue";
import PreviewPane from "./components/PreviewPane.vue";
import { compileSFC } from "./compiler/transform";

// ========================================
// 示例文件加载
// ========================================

/**
 * 使用 Vite 的 import.meta.glob 批量加载示例文件
 * `?raw` 后缀将文件内容读取为字符串
 * `eager: true` 表示在编译时同步加载，而不是运行时异步加载
 *
 * 返回的对象格式：
 * {
 *   "./examples/GduMap.vue": "文件内容字符串",
 *   ...
 * }
 */
const exampleModules = import.meta.glob("./examples/*.vue", {
  query: "?raw",
  eager: true,
}) as Record<string, { default: string }>;

/**
 * 示例列表
 * 从文件路径提取示例名称和标签
 *
 * 示例名称：文件名（不含扩展名），如 "Counter"、"GduMap"
 * 示例标签：用于显示的可读名称
 */
const exampleList = Object.keys(exampleModules).map((path) => {
  const name = path.match(/\.\/examples\/(.+)\.vue$/)?.[1] || path;
  return {
    name,
    label: name, // 可以根据需要自定义标签
    path,
  };
});

// ========================================
// 响应式状态
// ========================================

/** 当前编辑器代码 */
const code = ref("");

/** 错误列表 */
const errors = ref<{ source: string; message: string }[]>([]);

/** 预览面板组件引用 */
const previewPane = ref<InstanceType<typeof PreviewPane>>();

/** 代码编辑器组件引用 */
const editorRef = ref<InstanceType<typeof CodeEditor>>();

/** 预览是否就绪 */
const previewReady = ref(false);

/** 当前选中的示例名称 */
const selectedExample = ref("");

// 当预览就绪时自动运行代码
watch(previewReady, (ready) => {
  if (ready) {
    runCode();
  }
});

// ========================================
// 示例加载功能
// ========================================

/**
 * 加载选中的示例代码
 * 从 exampleModules 中获取文件内容并设置到编辑器
 */
function loadExample() {
  if (!selectedExample.value) return;

  const example = exampleList.find((e) => e.name === selectedExample.value);
  if (!example) return;

  // 获取示例文件内容
  const module = exampleModules[example.path];
  if (module && module.default) {
    code.value = module.default;
    // 自动运行加载的示例
    setTimeout(() => runCode(), 100);
  }
}

// ========================================
// 拖拽分割线功能
// ========================================

/** 主体区域 DOM 引用 */
const bodyRef = ref<HTMLDivElement>();

/** 左侧编辑器宽度 */
const leftWidth = ref(500);

/** 是否正在拖拽 */
const isDragging = ref(false);

/** 最小宽度限制 */
const MIN_WIDTH = 280;

/**
 * 开始拖拽分割线
 * 记录起始位置，添加鼠标移动和释放事件监听
 */
function onDragStart(e: MouseEvent) {
  isDragging.value = true;
  const startX = e.clientX;
  const startWidth = leftWidth.value;

  /**
   * 鼠标移动处理函数
   * 计算新的编辑器宽度，并限制在最小/最大范围内
   */
  const onMouseMove = (ev: MouseEvent) => {
    const delta = ev.clientX - startX;
    const bodyWidth = bodyRef.value?.clientWidth || 1000;
    const newWidth = Math.max(MIN_WIDTH, Math.min(startWidth + delta, bodyWidth - MIN_WIDTH));
    leftWidth.value = newWidth;
    editorRef.value?.refresh();
  };

  /**
   * 鼠标释放处理函数
   * 移除事件监听，恢复鼠标样式
   */
  const onMouseUp = () => {
    isDragging.value = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

// ========================================
// 错误处理
// ========================================

/** 清除所有错误 */
function clearErrors() {
  errors.value = [];
}

/** 编译错误回调 */
function onCompileError(message: string) {
  errors.value.push({ source: "compile", message });
}

/** 运行时错误回调 */
function onRuntimeError(message: string) {
  errors.value.push({ source: "runtime", message });
}

// ========================================
// 代码执行
// ========================================

/**
 * 运行当前编辑器中的代码
 * 1. 清除之前的错误
 * 2. 编译 Vue SFC 代码
 * 3. 发送编译结果到预览面板
 */
function runCode() {
  if (!previewPane.value) return;
  errors.value = [];

  const result = compileSFC(code.value);
  if (result.error) {
    errors.value.push({ source: "compile", message: result.error });
    return;
  }

  previewPane.value.sendCode(result.code, result.styles);
}
</script>

<style scoped>
/* === Mapbox Style Dark Theme === */

.playground {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: #0d0d0d;
  color: #e0e0e0;
  font-size: 13px;
  line-height: 1.4;
}

/* --- 顶部工具栏 --- */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: #1a1a1a;
  border-bottom: 1px solid #2a2a2a;
  flex-shrink: 0;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  flex-shrink: 0;
}

.logo {
  font-weight: 600;
  font-size: 15px;
  color: #ffffff;
  letter-spacing: 0.3px;
}

.actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* --- 示例选择器 --- */
.example-select {
  padding: 6px 12px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #e0e0e0;
  font-size: 13px;
  cursor: pointer;
  min-width: 140px;
}

.example-select:hover {
  border-color: #28a745;
}

.example-select:focus {
  outline: none;
  border-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

/* --- 按钮通用 --- */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-run {
  background: #28a745;
  color: #ffffff;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
}

.btn-run:hover:not(:disabled) {
  background: #2eb54e;
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
}

.btn-run:active:not(:disabled) {
  background: #23913d;
}

.btn-clear {
  background: #495057;
  color: #e0e0e0;
}

.btn-clear:hover:not(:disabled) {
  background: #5a6268;
  color: #ffffff;
}

.btn-clear:active:not(:disabled) {
  background: #3d4349;
}

/* --- 主体区域 --- */
.body {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* 拖拽时覆盖 iframe 的透明遮罩 */
.drag-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  cursor: col-resize;
}

/* --- 拖拽分割线 --- */
.resizer {
  width: 8px;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  background: #0d0d0d;
}

.resizer:hover,
.resizer--active {
  background: rgba(40, 167, 69, 0.08);
}

.resizer-line {
  width: 1px;
  height: 100%;
  background: #2a2a2a;
  transition: all 0.15s ease;
}

.resizer:hover .resizer-line,
.resizer--active .resizer-line {
  background: #28a745;
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.5);
  width: 2px;
}

/* --- 错误面板 --- */
.error-panel {
  background: #1a1a1a;
  border-top: 2px solid #dc3545;
  max-height: 240px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.error-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #2d1f1f;
  border-bottom: 1px solid #3a2828;
  flex-shrink: 0;
}

.error-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-header-actions {
  display: flex;
  gap: 8px;
}

.error-icon {
  color: #dc3545;
}

.error-title {
  font-size: 13px;
  font-weight: 600;
  color: #ff6b6b;
  letter-spacing: 0.3px;
}

/* 错误面板中的小按钮 */
.btn-run-small {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #dc3545;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-run-small:hover:not(:disabled) {
  background: #c82333;
}

.btn-run-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear-small {
  padding: 4px 10px;
  background: transparent;
  color: #8a5a5a;
  border: 1px solid #5a3a3a;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-clear-small:hover {
  color: #ff9999;
  background: rgba(220, 53, 69, 0.15);
  border-color: #8a5a5a;
}

.error-body {
  overflow-y: auto;
  flex: 1;
}

.error-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #252525;
  font-size: 12px;
}

.error-item:last-child {
  border-bottom: none;
}

.error-badge {
  background: #dc3545;
  color: #ffffff;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
  margin-top: 1px;
  letter-spacing: 0.5px;
}

.error-item pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  color: #ffaaaa;
  font-family: "Cascadia Code", "Fira Code", "SF Mono", Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
</style>
