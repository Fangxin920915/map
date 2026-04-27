import { execSync } from "child_process";
import process from "node:process";
import chalk from "chalk";

// 兼容 chalk 未安装的情况（自动降级为原生颜色码）
// const chalk = {
//   gray: (str) => `\x1b[90m${str}\x1b[0m`,
//   green: (str) => `\x1b[32m${str}\x1b[0m`,
//   red: (str) => `\x1b[31m${str}\x1b[0m`,
//   cyan: (str) => `\x1b[36m${str}\x1b[0m`,
//   yellow: (str) => `\x1b[33m${str}\x1b[0m`,
//   magenta: (str) => `\x1b[35m${str}\x1b[0m`,
//   blue: (str) => `\x1b[34m${str}\x1b[0m`,
//   bold: (str) => `\x1b[1m${str}\x1b[0m`,
// };

// ===================== 格式化打印工具函数 =====================
/**
 * 打印主标题（带长分割线）
 * @param {string} title 标题文本
 * @param {string} color 颜色（cyan/yellow/green/magenta）
 */
function printMainHeader(title, color = "cyan") {
  const line = "=".repeat(80); // 主分割线（醒目）
  console.log(`\n${chalk[color](bold(line))}`);
  console.log(chalk[color](bold(`  ${title}`)));
  console.log(`${chalk[color](bold(line))}\n`);
}

/**
 * 打印步骤副标题（带短分割线+详细说明）
 * @param {number} step 步骤序号
 * @param {string} title 步骤标题
 * @param {string} desc 步骤详细说明
 */
function printStepHeader(step, title, desc) {
  const separator = "-".repeat(60); // 步骤分割线
  console.log(chalk.yellow(`\n【步骤 ${step}】`));
  console.log(chalk.bold(title));
  console.log(chalk.gray(separator));
  console.log(`${chalk.gray(`说明：${desc}`)}\n`);
}

/**
 * 加粗文本（兼容兜底）
 * @param {string} str 文本
 */
function bold(str) {
  return chalk.bold ? chalk.bold(str) : str;
}

// ===================== 命令执行工具函数 =====================
/**
 * 执行命令并处理结果（兼容 monorepo）
 * @param {string} command 要执行的命令
 * @param {string} successDesc 成功提示
 * @param {string} failDesc 失败提示
 * @returns {boolean} 是否执行成功
 */
function runCommand(command, successDesc, failDesc) {
  console.log(chalk.gray(`📝 执行命令：${command}`));
  try {
    // 继承终端输入输出，monorepo 下保留子命令日志
    execSync(command, {
      stdio: "inherit",
      encoding: "utf8",
      cwd: process.cwd(), // 确保在项目根目录执行（monorepo 关键）
    });
    console.log(`${chalk.green(`✅ ${successDesc}`)}\n`);
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ ${failDesc}`));
    console.log(`${chalk.red(`💥 错误详情：${error.message || error}`)}\n`);
    return false;
  }
}

// ===================== 核心发布逻辑 =====================
async function main() {
  // 1. 解析命令行参数（获取用户传入的版本号）
  const targetVersion = process.argv[2]; // node publish.mjs 0.6.1 → 0.6.1
  printMainHeader("🚀 GDU-GL Monorepo 自动化发布流程启动", "cyan");

  // 打印版本号检测结果
  if (targetVersion) {
    console.log(chalk.blue(`📌 检测到用户指定版本号：${bold(targetVersion)}`));
  } else {
    console.log(
      chalk.blue(
        `📌 未检测到指定版本号，将使用 standard-version 自动生成语义化版本`,
      ),
    );
  }

  // 3. 步骤2：更新版本号（动态处理版本号，适配 monorepo）
  let versionCommand = "standard-version"; // 默认：自动语义化版本
  if (targetVersion) {
    // 传入版本号时，强制指定版本（monorepo 下全局版本更新）
    versionCommand = `standard-version --release-as ${targetVersion}`;
  }

  printStepHeader(
    1,
    "更新版本号 & 生成 CHANGELOG",
    targetVersion
      ? `强制更新根版本为 ${targetVersion}，自动生成 CHANGELOG 并提交版本变更（monorepo 全局生效）`
      : "根据提交记录自动生成语义化版本，更新 CHANGELOG 并提交（适配 monorepo）",
  );
  const step1Success = runCommand(
    versionCommand,
    "版本更新完成（已生成 CHANGELOG 并提交）",
    "版本更新失败，终止发布流程",
  );
  if (!step1Success) process.exit(1);

  // 2. 步骤2：清理 + 构建模块（monorepo 全量构建）
  printStepHeader(
    2,
    "清理历史产物 & 构建所有模块",
    "先清理 turbo 构建缓存，再执行 monorepo 全量模块构建，确保发布包为最新编译结果",
  );
  const step2Success = runCommand(
    "pnpm run clean && turbo build:modules",
    "清理+全量构建完成",
    "清理或构建失败，终止发布流程",
  );
  if (!step2Success) process.exit(1);

  // 4. 步骤3：发布到私有 NPM 仓库（monorepo 批量发布）
  printStepHeader(
    3,
    "发布所有包到私有 NPM 仓库",
    "monorepo 下批量发布所有子包到 http://118.31.69.113:4873/ 私有仓库，跳过 Git 检查",
  );
  const step3Success = runCommand(
    "pnpm publish -r --registry http://118.31.69.113:4873/ --no-git-checks",
    "所有包发布到私有仓库成功",
    "包发布失败，终止发布流程",
  );
  if (!step3Success) process.exit(1);

  // 5. 步骤4：推送到 Git 仓库（代码 + 版本标签）
  printStepHeader(
    4,
    "推送代码和版本标签到 Git 远程仓库",
    "先推送 monorepo 根目录代码，再推送版本标签，确保远程版本与发布版本一致",
  );

  // 5.1 推送代码
  const pushCodeSuccess = runCommand(
    "git push",
    "Git 代码推送成功",
    "Git 代码推送失败",
  );
  if (!pushCodeSuccess) process.exit(1);

  // 5.2 推送版本标签（standard-version 自动生成的标签）
  const pushTagSuccess = runCommand(
    "git push --tags",
    "Git 版本标签推送成功",
    "Git 标签推送失败",
  );
  if (!pushTagSuccess) process.exit(1);

  // 6. 发布完成
  printMainHeader("🎉 Monorepo 发布流程全部完成！", "magenta");
  console.log(chalk.green(bold("✅ 所有步骤执行成功！")));
  console.log(
    chalk.blue(
      "📌 所有子包已发布到私有 NPM 仓库，代码/标签已推送到 Git 远程仓库",
    ),
  );
  console.log(
    `${chalk.gray("💡 可前往 http://118.31.69.113:4873/ 验证发布结果")}\n`,
  );
}

// 启动主流程（捕获全局错误）
main().catch((error) => {
  console.log(chalk.red("\n💥 发布流程异常终止！"));
  console.log(chalk.red(`错误原因：${error.message || error}`));
  process.exit(1);
});
