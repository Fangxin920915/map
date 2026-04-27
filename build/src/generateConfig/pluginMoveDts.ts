import { PluginOption } from "vite";
import { getParsedCommandLineOfConfigFile, sys } from "typescript";
import { cp, stat, unlink, rmdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import * as console from "node:console";
import { getOptions, GenerateConfigOptions } from "./options";
import { absCwd, esMode, usePathAbs, usePathRel } from "../utils";
import { resolveEntry } from "./lib";

/** 自定义插件，将 d.ts 产物从集中目录移动到子包的产物目录 */
export function pluginMoveDts(
  options: GenerateConfigOptions = {},
): PluginOption {
  const { entry, outDir, mode, dts } = getOptions(options);

  if (mode !== "package" || !dts) {
    return null;
  }

  // 解析用于生成 d.ts 总体产物的 tsconfig 文件，并获取解析后的配置
  const tsConfigs = getParsedCommandLineOfConfigFile(dts, {}, sys as any);

  if (!tsConfigs) {
    throw new Error(`Could not find tsconfig file: ${dts}`);
  }

  // 解析出来的路径都是绝对路径
  const { rootDir, outDir: tsOutDir } = tsConfigs.options;

  if (!rootDir || !tsOutDir) {
    throw new Error(
      `Could not find rootDir or outDir in tsconfig file: ${dts}`,
    );
  }

  const relRoot = usePathRel(rootDir);
  const absRoot = usePathAbs(rootDir);

  /** 当前包相对于根目录的路径 */
  const relPackagePath = relRoot(process.cwd());

  // 源码入口的相对路径
  const { rel: relEntryPath } = resolveEntry(entry);

  return {
    name: "move-dts",
    apply: "build",
    async closeBundle() {
      const source = absRoot(tsOutDir, relEntryPath);
      const target = absCwd(outDir, `./${esMode}`);
      try {
        // 移动产物
        await cp(source, target, {
          force: true,
          recursive: true,
        });
        await removeDir(source);
      } catch (err) {
        console.log(`[${relPackagePath}]: failed to move dts!`);
        console.error(err);
      }
    },
  };
}

async function removeDir(dir: string) {
  const files = await readdir(dir);
  await Promise.all(
    files.map(async (file) => {
      const filePath = join(dir, file);
      const state = await stat(filePath);
      if (state.isDirectory()) {
        // 如果是文件夹，递归调用
        await removeDir(filePath);
      } else {
        // 如果是文件，删除文件
        await unlink(filePath);
      }
    }),
  );
  // 删除空文件夹
  await rmdir(dir);
}
