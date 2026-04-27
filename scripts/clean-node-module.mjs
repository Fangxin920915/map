/* eslint-disable @typescript-eslint/naming-convention */
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import process from "node:process";

// 适配 ESM 的项目根目录（脚本所在目录 = 项目根目录）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 简单旋转加载动画（无额外依赖，轻量化）
 */
const createSimpleLoader = () => {
  const frames = ["|", "/", "-", "\\"]; // 旋转帧
  let frameIndex = 0;
  let loaderInterval;

  // 启动动画
  const start = () => {
    process.stdout.write("🔄 正在删除目录... "); // 初始提示
    loaderInterval = setInterval(() => {
      frameIndex = (frameIndex + 1) % frames.length;
      process.stdout.write(`\r🔄 正在删除目录... ${frames[frameIndex]}`); // 覆盖当前行更新动画
    }, 150); // 动画速度（150ms/帧，适中不刺眼）
  };

  // 停止动画
  const stop = () => {
    clearInterval(loaderInterval);
    process.stdout.write("\r"); // 清除动画行
  };

  return { start, stop };
};

/**
 * 解析命令行参数，动态生成删除范围（保留之前的核心功能，不复杂）
 */
const getDeletePaths = () => {
  const userArgs = process.argv.slice(2);
  const isDeleteAll = userArgs.includes("all");

  const basePaths = ["**/dist", "**/.turbo", "**/stats.umd.html"];
  if (isDeleteAll) {
    console.log("📢 检测到 'all' 参数，删除：node_modules + dist + .turbo");
    return [...basePaths, "**/node_modules"];
  }
  console.log("📢 未传参数，仅删除：dist + .turbo");
  return basePaths;
};

/**
 * 执行 rimraf 命令行（完全复用原始逻辑，仅加简单动画）
 */
const runRimrafCommand = () => {
  const deletePaths = getDeletePaths();
  const loader = createSimpleLoader(); // 创建动画实例

  // 打印执行命令（保留原始格式）
  console.log(`🚀 执行清理命令：rimraf "${deletePaths.join('" "')}" --glob\n`);

  // 拆分命令参数（原始逻辑不变）
  const args = [...deletePaths, "--glob"];

  // 执行 rimraf（完全保留原始调用）
  const rimrafProcess = spawn("pnpm", ["exec", "rimraf", ...args], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
  });

  // 启动动画（删除开始）
  loader.start();

  // 监听命令执行完成（停止动画+原始逻辑）
  rimrafProcess.on("close", (code) => {
    loader.stop(); // 停止动画
    if (code === 0 || (deletePaths.includes("**/node_modules") && code === 1)) {
      console.log("🎉 清理完成！所有目标目录已删除");
      process.exit(0);
    } else {
      console.error(`❌ 清理失败，退出码：${code}`);
      process.exit(code);
    }
  });

  // 监听命令执行错误（停止动画+原始逻辑）
  rimrafProcess.on("error", (err) => {
    loader.stop(); // 停止动画
    console.error("\n❌ 执行出错：", err.message);
    process.exit(1);
  });
};

// 执行命令
runRimrafCommand();
