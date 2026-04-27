import { defineConfig } from "vite";
import fs from "fs";
import path from "path";
import { generateVueConfig } from "../../build/build.config";

// 读取package.json并提取版本号
const packagePath = path.resolve(__dirname, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
const appVersion = packageJson.version; // 获取版本号（如 "1.0.0"）

export default defineConfig(
  ({ mode }) =>
    generateVueConfig(
      { mode: mode as any },
      {
        define: {
          // 关键：注入全局变量，注意字符串需要用JSON.stringify包裹
          __APP_VERSION__: JSON.stringify(appVersion),
          // 可选：同时注入构建时间，方便排查版本问题
          __BUILD_TIME__: JSON.stringify(new Date().toLocaleString()),
        },
      },
    ) as any,
);
