/**
 * Vue SFC (Single File Component) 编译转换器
 *
 * 本模块负责将 Vue 单文件组件（.vue 文件）编译为可在浏览器中直接执行的可执行代码。
 * 主要用于在线代码编辑器 playground 环境，实现实时的 Vue 组件预览功能。
 *
 * 核心功能：
 * 1. 解析 Vue SFC 源码（template、script、style）
 * 2. 编译 script setup 为可执行 JavaScript
 * 3. 处理 scoped 样式
 * 4. 转换 import 语句为运行时模块引用
 */

import { parse, compileScript, compileStyle } from "@vue/compiler-sfc";

/**
 * 编译结果接口
 *
 * @property code - 编译后的可执行 JavaScript 代码字符串
 * @property styles - 编译后的 CSS 样式字符串
 * @property error - 编译过程中的错误信息（如果有）
 */
export interface CompileResult {
  code: string;
  styles: string;
  error?: string;
}

/**
 * 编译 Vue 单文件组件
 *
 * 这是模块的主入口函数，负责将 Vue SFC 源码编译为可执行代码和样式。
 *
 * 编译流程：
 * 1. 解析 SFC 源码，提取 descriptor（包含 template、script、style 等块的描述信息）
 * 2. 编译 script/scriptSetup 块为 JavaScript 代码
 * 3. 编译 style 块，处理 scoped 样式
 * 4. 转换为可在 playground 环境执行的可执行代码
 *
 * @param source - Vue SFC 源码字符串（完整的 .vue 文件内容）
 * @returns CompileResult 对象，包含编译后的代码、样式和可能的错误信息
 *
 * @example
 * ```typescript
 * const result = compileSFC(`
 *   <template>
 *     <div>{{ message }}</div>
 *   </template>
 *   <script setup>
 *     const message = ref('Hello')
 *   </script>
 * `);
 * // result.code 包含可执行的 JavaScript 代码
 * // result.styles 包含编译后的 CSS
 * ```
 */
export function compileSFC(source: string): CompileResult {
  try {
    // ========================================
    // 初始化编译上下文
    // ========================================

    /**
     * scopeId: 用于 scoped 样式的唯一标识符
     * 当组件使用 scoped 样式时，Vue 会为每个元素添加此属性选择器
     * 例如：data-v-abc123，确保样式只作用于当前组件
     */
    const scopeId = generateId();

    /**
     * filename: 虚拟文件名
     * 用于编译器生成更有意义的错误信息和 source map
     * 在 playground 环境中，统一使用 "App.vue"
     */
    const filename = "App.vue";

    // ========================================
    // 步骤 1: 解析 SFC
    // ========================================

    /**
     * 使用 @vue/compiler-sfc 的 parse 函数解析 SFC 源码
     * 返回的 descriptor 包含：
     * - template: 模板块信息
     * - script/scriptSetup: 脚本块信息
     * - styles: 样式块数组
     * - customBlocks: 自定义块数组
     */
    const { descriptor, errors } = parse(source, {
      filename,
    });

    // 如果解析过程中有错误，立即返回错误信息
    if (errors.length > 0) {
      return {
        code: "",
        styles: "",
        error: errors.map((e) => e.message).join("\n"),
      };
    }

    // ========================================
    // 步骤 2: 检查 scoped 样式
    // ========================================

    /**
     * 检查组件是否使用了 scoped 样式
     * scoped 样式会为元素添加独特的属性选择器，实现样式隔离
     * 示例：<style scoped> 中的 .foo { color: red; }
     * 编译后变为 .foo[data-v-xxx] { color: red; }
     */
    const hasScopeStyle = descriptor.styles.some((s) => s.scoped);

    // ========================================
    // 步骤 3: 编译 script/scriptSetup
    // ========================================

    /**
     * scriptCode: 编译后的脚本代码
     * 使用 inlineTemplate 模式，模板会被编译到 setup 函数内部
     * 这样生成的代码可以直接执行，无需额外的模板编译器
     */
    let scriptCode = "";

    if (descriptor.scriptSetup || descriptor.script) {
      /**
       * compileScript 编译选项说明：
       * - id: scoped 样式的标识符
       * - inlineTemplate: 内联模板模式
       *   - true: 模板编译为渲染函数，直接嵌入 setup 返回值
       *   - false: 模板单独编译，需要额外的 render 函数
       * - templateOptions.scoped: 是否为模板元素添加 scoped 属性
       */
      const scriptResult = compileScript(descriptor, {
        id: scopeId,
        // 关键：使用 inlineTemplate，模板会编译到 setup 函数内部
        inlineTemplate: true,
        // 模板选项：为 scoped 样式添加属性选择器支持
        templateOptions: {
          scoped: hasScopeStyle,
        },
      });
      scriptCode = scriptResult.content;
    }

    // ========================================
    // 步骤 4: 编译样式
    // ========================================

    /**
     * styles: 编译后的 CSS 样式字符串
     * 处理所有 <style> 块，包括普通样式和 scoped 样式
     */
    let styles = "";

    if (descriptor.styles.length > 0) {
      /**
       * 遍历所有样式块并编译
       * scoped 样式需要通过 compileStyle 添加属性选择器
       * 非 scoped 样式直接使用原始内容
       */
      const compiledStyles = descriptor.styles.map((styleBlock) => {
        if (styleBlock.scoped) {
          /**
           * 编译 scoped 样式
           * compileStyle 会：
           * 1. 为选择器添加 [data-v-xxx] 属性选择器
           * 2. 处理深度选择器（::v-deep、>>>、/deep/）
           * 3. 处理插槽选择器（:slotted）
           */
          const result = compileStyle({
            source: styleBlock.content,
            filename,
            id: scopeId,
            scoped: true,
          });
          return result.code;
        } else {
          // 非 scoped 样式直接返回原始内容
          return styleBlock.content;
        }
      });
      // 将所有编译后的样式合并为一个字符串
      styles = compiledStyles.join("\n");
    }

    // ========================================
    // 步骤 5: 转换为可执行代码
    // ========================================

    /**
     * 将编译后的脚本代码转换为可在 playground 环境执行的形式
     * 主要处理：
     * 1. 将 import 语句转换为 __modules__ 运行时引用
     * 2. 添加 scoped 样式标识
     * 3. 返回组件对象
     */
    const finalCode = transformToExecutableCode(
      scriptCode,
      hasScopeStyle,
      `data-v-${scopeId}`,
    );

    return { code: finalCode, styles };
  } catch (err: any) {
    // 捕获并返回编译过程中的任何异常
    console.error("Compile error:", err);
    return { code: "", styles: "", error: err.message || String(err) };
  }
}

/**
 * 生成唯一的 scoped ID
 *
 * 生成一个随机的 8 位字符串，用于标识组件的 scoped 样式。
 * 格式示例："k3j5h9a2"
 *
 * @returns 随机生成的唯一标识符字符串
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * 模块名称映射表
 *
 * 将源代码中的 import 路径映射到 __modules__ 中的键名
 * 例如：`import { ref } from 'vue'` -> `__modules__["vue"]`
 *       `import { GduMap } from '@gdu-gl/map'` -> `__modules__["gdu-gl/map"]`
 */
const MODULE_ALIAS: Record<string, string> = {
  vue: "vue",
  "@gdu-gl/map": "gdu-gl/map",
  "@gdu-gl/common": "gdu-gl/common",
  "@gdu-gl/core": "gdu-gl/core",
};

/**
 * 将编译后的脚本代码转换为可执行代码
 *
 * 这个函数是 playground 编译器的核心，负责将 Vue 编译器生成的代码
 * 转换为可以在浏览器中直接执行的形式。
 *
 * 主要转换内容：
 * 1. import 语句转换：将 `import { ref } from 'vue'` 转换为 `const { ref } = __modules__["vue"]`
 * 2. 多模块支持：支持 vue、@gdu-gl/map、@gdu-gl/common 等模块
 * 3. export default 转换：将 `export default {}` 转换为 `const _sfc_main = {}`
 * 4. 添加 scoped 样式标识
 *
 * @param scriptCode - Vue 编译器编译后的脚本代码
 * @param hasScopeStyle - 组件是否使用了 scoped 样式
 * @param scopeId - scoped 样式的完整标识符（如 "data-v-abc123"）
 * @returns 转换后的可执行代码字符串
 *
 * @example
 * 输入代码：
 * ```javascript
 * import { ref, computed as c } from 'vue';
 * import { GduMap } from '@gdu-gl/map';
 * export default {
 *   setup() {
 *     const count = ref(0);
 *     return { count };
 *   }
 * }
 * ```
 *
 * 输出代码：
 * ```javascript
 * const { ref, computed } = __modules__["vue"];
 * const c = computed;
 * const { GduMap } = __modules__["gdu-gl/map"];
 *
 * const _sfc_main = {
 *   setup() {
 *     const count = ref(0);
 *     return { count };
 *   }
 * }
 * _sfc_main.__scopeId = "data-v-abc123";
 * return _sfc_main;
 * ```
 */
function transformToExecutableCode(
  scriptCode: string,
  hasScopeStyle: boolean,
  scopeId: string,
): string {
  // ========================================
  // 初始化
  // ========================================

  /**
   * lines: 用于构建最终代码的行数组
   * 通过数组拼接的方式构建代码，比字符串拼接更高效
   */
  const lines: string[] = [];

  // ========================================
  // 步骤 1: 收集和处理 import 语句（支持多模块）
  // ========================================

  /**
   * moduleImports: 按模块分组的导入名称
   * key: 模块名（如 "vue"、"gdu-gl/map"）
   * value: 导入的名称数组
   */
  const moduleImports: Map<string, string[]> = new Map();

  /**
   * globalAliasAssignments: 全局别名赋值语句
   * 存储所有模块的别名赋值
   */
  const globalAliasAssignments: string[] = [];

  /**
   * processedImports: 记录已处理的 import，防止重复
   * key 格式：`module:name`，例如 `vue:ref`
   */
  const processedImports = new Set<string>();

  /**
   * namedImportRegex: 匹配具名 import 语句的正则表达式
   * 匹配格式：import { name1, name2 as alias } from 'module'
   * 捕获组：
   * - $1: 大括号内的导入名称列表
   * - $2: 模块路径
   */
  const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let match;

  // 遍历所有匹配的 import 语句
  while ((match = namedImportRegex.exec(scriptCode)) !== null) {
    /**
     * names: 大括号内的名称部分
     * 例如："ref, computed as c"
     */
    const names = match[1];

    /**
     * originalModule: 原始导入的模块路径
     * 例如："vue" 或 "@gdu-gl/map"
     */
    const originalModule = match[2];

    /**
     * mappedModule: 映射后的模块名
     * 用于在 __modules__ 中查找
     * 例如："@gdu-gl/map" -> "gdu-gl/map"
     */
    const mappedModule = MODULE_ALIAS[originalModule] || originalModule;

    // 确保模块在 Map 中存在
    if (!moduleImports.has(mappedModule)) {
      moduleImports.set(mappedModule, []);
    }
    const importNames = moduleImports.get(mappedModule)!;

    // 处理每个导入项（用逗号分隔）
    names.split(",").forEach((part) => {
      const trimmed = part.trim();

      // 跳过空字符串和已处理的导入
      if (!trimmed || processedImports.has(`${mappedModule}:${trimmed}`))
        return;
      processedImports.add(`${mappedModule}:${trimmed}`);

      /**
       * 检查是否有别名（as 关键字）
       * 格式：originalName as aliasName
       * 例如：computed as c
       */
      const aliasMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
      if (aliasMatch) {
        const originalName = aliasMatch[1]; // 原始名称，如 "computed"
        const aliasName = aliasMatch[2]; // 别名，如 "c"

        // 导入原始名称
        importNames.push(originalName);
        // 生成别名赋值语句
        globalAliasAssignments.push(`const ${aliasName} = ${originalName};`);
      } else {
        // 没有别名，直接添加导入名称
        importNames.push(trimmed);
      }
    });
  }

  // ========================================
  // 步骤 2: 生成运行时导入语句（支持多模块）
  // ========================================

  /**
   * 遍历所有模块，生成对应的运行时导入语句
   * 每个模块生成一行：const { xxx } = __modules__["module"];
   */
  moduleImports.forEach((importNames, moduleName) => {
    if (importNames.length > 0) {
      lines.push(
        `const { ${importNames.join(", ")} } = __modules__["${moduleName}"];`,
      );
    }
  });
  lines.push("");

  // ========================================
  // 步骤 3: 生成别名赋值语句
  // ========================================

  /**
   * 将别名赋值语句添加到代码中
   * 这些语句必须在导入语句之后执行
   */
  if (globalAliasAssignments.length > 0) {
    lines.push(...globalAliasAssignments);
    lines.push("");
  }

  // ========================================
  // 步骤 4: 处理 script 内容
  // ========================================

  if (scriptCode) {
    /**
     * processedScript: 处理后的脚本代码
     * 需要进行以下转换：
     * 1. 移除 import 语句（已在步骤 1-2 中处理）
     * 2. 将 export default 转换为 const 声明
     */
    const processedScript = scriptCode
      // 移除具名 import 语句（import { ... } from '...'）
      .replace(namedImportRegex, "")
      // 将 export default { 转换为 const _sfc_main = {
      // 这是组件对象的命名约定
      .replace(/export\s+default\s+\{/g, "const _sfc_main = {")
      // 移除剩余的 import 语句（如默认导入：import foo from 'bar'）
      .replace(/^\s*import\s+.*$/gm, "");

    // 添加处理后的脚本代码
    lines.push(processedScript.trim());
    lines.push("");
  }

  // ========================================
  // 步骤 5: 添加 scoped 样式标识
  // ========================================

  /**
   * 如果组件使用了 scoped 样式，需要为组件对象添加 __scopeId 属性
   * Vue 运行时会使用这个属性为组件的 DOM 元素添加对应的 data 属性
   * 从而实现样式隔离
   */
  if (hasScopeStyle) {
    lines.push(`_sfc_main.__scopeId = "${scopeId}";`);
    lines.push("");
  }

  // ========================================
  // 步骤 6: 返回组件对象
  // ========================================

  /**
   * 最终返回组件对象
   * 在 playground 环境中，这段代码会被包装在一个函数中执行
   * 返回值就是需要渲染的 Vue 组件
   */
  lines.push("return _sfc_main;");

  // 将所有行合并为最终的代码字符串
  const result = lines.join("\n");

  return result;
}
