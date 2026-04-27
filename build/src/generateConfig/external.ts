import { PackageJson } from "type-fest";
import { getOptions, GenerateConfigOptions } from "./options";
import { camelCase, modulePrefixName } from "../utils";

/**
 * 获取 build.rollupOptions.external 依赖外部化相关的配置
 * @param packageJson package.json 文件内容
 * @param options 构建选项
 */
export function getExternal(
  packageJson: PackageJson = {},
  options: GenerateConfigOptions = {},
) {
  const { dependencies = {}, peerDependencies = {} } = packageJson;

  const { mode } = getOptions(options);
  const defaultExternal = [] as string[];
  if (mode !== "package") {
    return defaultExternal.concat(Object.keys(peerDependencies));
  }
  return defaultExternal.concat(
    Object.keys(peerDependencies),
    // 全量构建时，依赖不进行外部化，一并打包进来
    Object.keys(dependencies).filter((key) => key.includes(modulePrefixName)),
  );
}

/**
 * 根据externals生成globals，模式rollup会帮我们生成globals的变量名。
 * 但是有的包挂在window变量名，跟包名不一样需要特殊处理一下
 */
export function getGlobals(externals: (string | RegExp)[]) {
  const globals: Record<string, string> = {};
  externals.forEach((text) => {
    const externalStr = text.toString();
    if (externalStr === "vue") {
      globals.vue = "Vue";
    } else if (externalStr === "cesium") {
      globals.cesium = "Cesium";
    } else if (externalStr.startsWith(modulePrefixName)) {
      globals[externalStr] = camelCase(externalStr);
    }
  });
  return globals;
}
