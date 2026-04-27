import type { Preview } from "@storybook/vue3-vite";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import { setup } from "@storybook/vue3-vite";

// 全局注册 Element Plus
setup((app) => {
  app.use(ElementPlus);
});

const preview: Preview = {
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      codePanel: true,
    },
    controls: {
      disableSaveFromUI: false,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  argTypes: {
    viewId: {
      control: false, // 禁止控制面板中的控制
    },
  },
  decorators: [
    (_, { viewMode }) => {
      switch (viewMode) {
        case "docs":
          return { template: '<div class="docs-page-layout"><story/></div>' };
        default:
          return { template: "<story/>" };
      }
    },
  ],
};

export default preview;
