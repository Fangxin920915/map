import { PluginOption } from "vite";
import { PackageJson } from "type-fest";
import { basename } from "node:path";
import { writeFile } from "node:fs/promises";
import {
  isFunction,
  isObjectLike,
  absCwd,
  relCwd,
  kebabCase,
  fullModeOutDir,
  umdModeOutDir,
  umdMode,
  esModeOutDir,
  esModeExt,
  esMode,
} from "../utils";
import { getOutFileName, resolveEntry } from "./lib";
import { getOptions, GenerateConfigOptions } from "./options";

/**
 * 自定义插件，实现对 package.json 内容的修改与回写。
 * @param packageJson package.json 文件内容
 * @param options 构建选项
 */
export function pluginSetPackageJson(
  packageJson: PackageJson = {},
  options: GenerateConfigOptions = {},
): PluginOption {
  const { onSetPkg, mode, fileName, outDir } = getOptions(options);

  if (mode !== "package") {
    return null;
  }

  const finalName = fileName || kebabCase(packageJson.name || "");

  return {
    name: "set-package-json",
    // 只在构建模式下执行
    apply: "build",
    async closeBundle() {
      const packageJsonObj = packageJson || {};

      // 将 Types main module exports 产物路径写入 package.json
      const exportsData: Record<string, any> = {};
      const full = relCwd(
        absCwd(
          outDir,
          `${fullModeOutDir}/`,
          getOutFileName(finalName, umdMode, mode),
        ),
        false,
      );

      const umd = relCwd(
        absCwd(
          outDir,
          `${umdModeOutDir}/`,
          getOutFileName(finalName, umdMode, mode),
        ),
        false,
      );
      const es = relCwd(
        absCwd(outDir, `./${esModeOutDir}/index${esModeExt}`),
        false,
      );

      const dtsEntry = getDtsPath(options);

      packageJsonObj.unpkg = full;
      packageJsonObj.jsdelivr = full;
      packageJsonObj.types = dtsEntry;
      packageJsonObj.main = umd;
      packageJsonObj.module = es;
      packageJsonObj.sideEffects = ["**/*.css"];

      exportsData.types = dtsEntry;
      exportsData.require = umd;
      exportsData.import = es;

      if (!isObjectLike(packageJsonObj.exports)) {
        packageJsonObj.exports = {};
      }
      Object.assign(packageJsonObj.exports, {
        ".": exportsData,
        "./*": "./dist/es/*",
      });

      // 支持在构建选项中的 onSetPkg 钩子中对 package.json 对象进行进一步修改
      if (isFunction(onSetPkg)) {
        await onSetPkg(packageJsonObj);
      }

      // 回写入 package.json 文件

      await writeFile(
        absCwd("package.json"),
        `${JSON.stringify(packageJsonObj, null, 2)}\n`,
      );

      // await writeJsonFile(absCwd("package.json"), packageJsonObj, null, 2);
    },
  };
}

/** 根据源码入口和产物目录，计算出 d.ts 类型声明的入口的相对地址 */
function getDtsPath(options: GenerateConfigOptions = {}) {
  const { entry, outDir } = getOptions(options);

  const { isFile } = resolveEntry(entry);

  /** 入口文件 d.ts 产物名称 */
  let entryFileName: string;
  if (isFile) entryFileName = basename(entry).replace(/\..*$/, ".d.ts");
  else entryFileName = "index.d.ts";

  return relCwd(absCwd(outDir, esMode, entryFileName), false);
}
