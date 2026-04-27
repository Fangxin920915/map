import { PackageJson } from "type-fest";
import { LibraryFormats, BuildOptions } from "vite";
import { statSync } from "node:fs";
import path, { join } from "node:path";
import {
  kebabCase,
  camelCase,
  absCwd,
  relCwd,
  esMode,
  umdMode,
  esModeOutDir,
  umdModeOutDir,
  fullModeOutDir,
  esModeExt,
  umdModeExt,
  fullModeExt,
  fullMinModeExt,
} from "../utils";
import { getOptions, GenerateConfigOptions } from "./options";
import { getExternal, getGlobals } from "./external";

/**
 * 获取 build.lib 产物相关配置
 * @param packageJson package.json 文件内容
 * @param options 构建选项
 */
export function getLib(
  packageJson: PackageJson = {},
  options: GenerateConfigOptions = {},
): Pick<
  BuildOptions,
  | "lib"
  | "minify"
  | "sourcemap"
  | "outDir"
  | "emptyOutDir"
  | "rollupOptions"
  | "terserOptions"
> {
  // 生成依赖外部化相关配置 build.rollupOptions.external
  const external = getExternal(packageJson, options);
  // 在umd模式下生成 build.rollupOptions.output.globals
  const globals = getGlobals(external);
  const { entry, outDir, mode, fileName, singleDir } = getOptions(options);
  // 文件名称，默认取 package.json 的 name 字段转换成 kebab-case：@gdu-gl/build => gdu-gl-build
  const finalName = fileName || kebabCase(packageJson.name || "");
  // 当前脚本执行的绝对位置
  const root = absCwd();
  // 是否需要打包成npm模式
  const ESFormat = mode === "package";
  return {
    cssCodeSplit: false,
    lib: {
      entry,
    },
    // full-min 模式下全量构建，需要混淆代码，生成 sourcemap 文件，且不清空产物目录
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      external,
      output: ESFormat
        ? [
            {
              format: esMode,
              exports: "auto",
              globals,
              // 使用函数动态设置入口文件名
              entryFileNames: (chunkInfo) => {
                if (chunkInfo.isEntry) {
                  return `[name]${esModeExt}`;
                }
                return `[name]-[hash]${esModeExt}`;
              },
              preserveModules: !singleDir,
              preserveModulesRoot: path.resolve(root, "./src"),
              dir: path.resolve(root, `${outDir}/${esModeOutDir}`),
            },
            {
              format: umdMode,
              exports: "auto",
              globals,
              name: camelCase(finalName),
              entryFileNames: getOutFileName(finalName, umdMode, mode),
              dir: path.resolve(root, `${outDir}/${umdModeOutDir}`),
            },
          ]
        : [
            {
              format: umdMode,
              exports: "auto",
              globals,
              name: camelCase(finalName),
              entryFileNames: getOutFileName(finalName, umdMode, mode),
              dir: path.resolve(root, `${outDir}/${fullModeOutDir}`),
            },
          ],
    },
  };
}

/**
 * 获取产物文件名称
 * @param fileName 文件名称
 * @param format 产物格式
 * @param buildMode 构建模式
 */
export function getOutFileName(
  fileName: string,
  format: LibraryFormats,
  buildMode: GenerateConfigOptions["mode"],
) {
  const formatName = format as "es" | "umd";
  const ext = formatName === esMode ? esModeExt : umdModeExt;
  let tail: string;
  // 全量构建时，文件名后缀的区别
  if (buildMode === "full") {
    tail = fullModeExt;
  } else if (buildMode === "full-min") {
    tail = fullMinModeExt;
  } else {
    tail = ext;
  }
  return `${fileName}${tail}`;
}

interface EntryInfo {
  /** 子包源码入口文件的绝对路径 */
  abs: string;

  /** 子包源码入口文件相对于脚本执行位置的路径 */
  rel: string;

  /** 子包源码入口是不是文件 */
  isFile: boolean;
}

/**
 * 解析子包源码入口
 * @param entry 源码入口路径
 * @returns 子包源码入口信息，解析结果
 */
export function resolveEntry(entry: string): EntryInfo {
  /** 入口绝对路径 */
  const absEntry = absCwd(entry);

  /** 入口是否为文件 */
  const isEntryFile = statSync(absEntry).isFile();

  /** 入口文件夹绝对路径 */
  const absEntryFolder = isEntryFile ? join(absEntry, "..") : absEntry;

  return {
    abs: absEntry,
    rel: relCwd(absEntryFolder),
    isFile: isEntryFile,
  };
}
