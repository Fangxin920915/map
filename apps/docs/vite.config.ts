import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "node:path";
// import vueDevTools from "vite-plugin-vue-devtools";
// import { viteExternalsPlugin } from "vite-plugin-externals";

export default defineConfig(() => {
  const cesiumSource = "./node_modules/cesium/Build/Cesium";
  const cesiumStaticDir = "cesiumStatic"; // 静态文件输出目录（相对路径）
  const cesiumBaseUrl = "/cesiumStatic"; // URL 路径（绝对路径，确保 iframe 中正确解析）
  return {
    define: {
      CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
      __APP_VERSION__: JSON.stringify("开发环境无版本号"),
      __BUILD_TIME__: JSON.stringify("开发环境无构建时间"),
    },
    assetsInclude: ["**/*.pgm"],
    plugins: [
      vue(),
      // vueDevTools(),
      // viteExternalsPlugin({
      //   vue: "Vue",
      //   "@gdu-gl/map": "gduGlMap",
      // }),
      viteStaticCopy({
        silent: true,
        targets: [
          { src: `${cesiumSource}/ThirdParty`, dest: cesiumStaticDir },
          { src: `${cesiumSource}/Workers`, dest: cesiumStaticDir },
          { src: `${cesiumSource}/Assets`, dest: cesiumStaticDir },
          { src: `${cesiumSource}/Widgets`, dest: cesiumStaticDir },
        ],
      }),
    ],
    server: {
      open: "/index.html",
      proxy: {
        "/dem_server": {
          target: "http://gdu-dev.com:32305/",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/dem_server/, ""),
        },
        "/ar_map_mvt": {
          target: "http://gdu-dev.com:30500/",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ar_map_mvt/, ""),
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
          preview: path.resolve(__dirname, "playground/preview.html"),
        },
      },
    },
    resolve: {
      alias: [
        {
          find: /^@gdu-gl\/([^/]+)$/,
          replacement: path.join(__dirname, "../../packages/$1/src"),
        },
        {
          find: /^@map\/(.*)$/,
          replacement: path.resolve(__dirname, "../../packages/map/src/$1"),
        },
        {
          find: /^@core\/(.*)$/,
          replacement: path.resolve(__dirname, "../../packages/core/src/$1"),
        },
        {
          find: /^@common\/(.*)$/,
          replacement: path.resolve(__dirname, "../../packages/common/src/$1"),
        },
        {
          find: /@cesium-engine\/(.*)$/,
          replacement: path.resolve(__dirname, "../../packages/cesium/src/$1"),
        },
      ],
    },
  };
});
