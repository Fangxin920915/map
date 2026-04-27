/**
 * Playground 预览环境入口文件
 *
 * 本文件在 iframe 中运行，负责：
 * 1. 注册可供用户代码使用的模块（vue、@gdu-gl/map 等）
 * 2. 监听主窗口发来的编译后代码
 * 3. 动态执行代码并渲染组件
 * 4. 捕获并回传运行时错误
 */

import * as Vue from "vue";

/**
 * 导入 @gdu-gl/map 地图组件库
 * 用户代码可以通过 __modules__["gdu-gl/map"] 访问
 *
 * 注意：在 playground 环境中，我们使用 "gdu-gl/map" 作为模块标识符
 * 而不是 "@gdu-gl/map"，因为 @ 符号在某些情况下可能导致解析问题
 */
// @ts-ignore - vite 会处理这个导入
import * as GduMap from "@gdu-gl/map";

/**
 * 导入 @gdu-gl/common 公共工具库
 * 提供 uuid 等常用工具函数
 */
// @ts-ignore
import * as GduCommon from "@gdu-gl/common";

/**
 * 导入 @gdu-gl/core 核心库
 * 提供地图核心功能
 */
// @ts-ignore
import * as GduCore from "@gdu-gl/core";

// ========================================
// 注册模块供用户代码通过 __modules__ 访问
// ========================================

/**
 * __modules__ 全局对象
 * 存储所有可供用户代码导入的模块
 *
 * 模块名称映射：
 * - "vue": Vue 核心库
 * - "gdu-gl/map": 地图组件库（对应 @gdu-gl/map）
 * - "gdu-gl/common": 公共工具库（对应 @gdu-gl/common）
 * - "gdu-gl/core": 核心库（对应 @gdu-gl/core）
 */
(window as any).__modules__ = {
  // Vue 核心库：提供 ref、reactive、computed 等 API
  vue: Vue,
  // 地图组件库：提供 GduMap、defaultMapProps 等
  "gdu-gl/map": GduMap,
  // 公共工具库：提供 uuid、工具函数等
  "gdu-gl/common": GduCommon,
  // 核心库：提供核心地图功能
  "gdu-gl/core": GduCore,
};

// ========================================
// DOM 元素引用
// ========================================

/**
 * 应用挂载点
 * 用户组件将挂载到这个 DOM 元素
 */
const appEl = document.getElementById("app");
if (!appEl) throw new Error("#app not found");

/**
 * 当前样式元素
 * 用于管理动态注入的 scoped 样式
 */
let currentStyleEl: HTMLStyleElement | null = null;

// ========================================
// 全局错误处理
// ========================================

/**
 * 监听全局 JavaScript 错误
 * 将错误信息回传给主窗口显示
 */
window.addEventListener("error", (e) => {
  const message = `${e.message} (at ${e.filename}:${e.lineno}:${e.colno})`;
  window.parent.postMessage(
    {
      type: "error",
      message,
      source: e.filename,
      line: e.lineno,
      col: e.colno,
    },
    "*",
  );
});

/**
 * 监听未处理的 Promise 拒绝
 * 将错误信息回传给主窗口显示
 */
window.addEventListener("unhandledrejection", (e) => {
  const message = `Unhandled Promise: ${e.reason}`;
  window.parent.postMessage({ type: "error", message }, "*");
});

// ========================================
// 代码执行处理
// ========================================

/**
 * 监听主窗口发来的编译后代码
 * 接收代码后在 iframe 中执行并渲染组件
 */
window.addEventListener("message", async (e: MessageEvent) => {
  // 只处理 code 类型的消息
  if (e.data?.type !== "code") return;

  const { code, styles } = e.data;

  console.log(
    "[Preview] Received styles:",
    styles ? `${styles.length} chars` : "empty",
  );

  try {
    // ========================================
    // 清理旧的 Vue 实例和 DOM
    // ========================================

    /**
     * 销毁旧的 Vue 应用实例
     * 这会触发组件的卸载生命周期钩子
     */
    const oldApp = (window as any).__vue_app__;
    if (oldApp) {
      oldApp.unmount();
    }

    // 清空挂载点 DOM
    appEl.innerHTML = "";

    // ========================================
    // 处理样式注入
    // ========================================

    /**
     * 移除旧的样式元素
     * 确保每次运行时样式是干净的
     */
    if (currentStyleEl && currentStyleEl.parentNode) {
      currentStyleEl.parentNode.removeChild(currentStyleEl);
      currentStyleEl = null;
    }

    /**
     * 注入新的样式到 head
     * scoped 样式会包含唯一的属性选择器
     */
    if (styles) {
      currentStyleEl = document.createElement("style");
      currentStyleEl.setAttribute("data-playground", "true");
      currentStyleEl.textContent = styles;
      document.head.appendChild(currentStyleEl);
      console.log("[Preview] Styles injected to head");
    }

    // ========================================
    // 执行用户代码
    // ========================================

    /**
     * 使用 new Function 创建执行环境
     * 这比 eval 更安全，且可以控制执行上下文
     *
     * 参数：
     * - __modules__: 模块字典，用户代码通过它访问 vue、@gdu-gl/map 等
     *
     * 返回值：
     * - Vue 组件对象，包含 setup、template 等
     */
    const factory = new Function("__modules__", code);
    const component = factory((window as any).__modules__);

    console.log("[Preview] Component:", component);

    // ========================================
    // 创建并挂载 Vue 应用
    // ========================================

    /**
     * 创建新的 Vue 应用实例
     * 使用编译后的组件作为根组件
     */
    const app = Vue.createApp(component);
    (window as any).__vue_app__ = app;

    /**
     * 挂载应用到 DOM
     * 组件将被渲染到 #app 元素中
     */
    app.mount(appEl);

    console.log("[Preview] App mounted successfully");

    // 通知主窗口执行成功
    window.parent.postMessage({ type: "success" }, "*");
  } catch (err: any) {
    // ========================================
    // 错误处理
    // ========================================

    /**
     * 捕获运行时错误并回传给主窗口
     * 包含错误消息和调用栈信息
     */
    const message = err.message || String(err);
    const stack = err.stack || "";

    window.parent.postMessage(
      { type: "error", message: `${message}\n\nStack:\n${stack}` },
      "*",
    );
  }
});

// ========================================
// 初始化就绪通知
// ========================================

/**
 * 通知主窗口 preview iframe 已就绪
 * 主窗口收到此消息后可以开始发送代码
 */
window.parent.postMessage({ type: "ready" }, "*");
console.log("[Preview] Ready");
