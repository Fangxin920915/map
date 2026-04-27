import { defineConfig } from "vite";
import { generateConfig } from "../../build/build.config";

export default defineConfig(
  ({ mode }) => generateConfig({ mode: mode as any }) as any,
);
