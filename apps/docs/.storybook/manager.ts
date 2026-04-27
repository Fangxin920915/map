import { addons } from "storybook/manager-api";

addons.setConfig({
  panelPosition: "right",
  enableShortcuts: true,
  showToolbar: true,
  theme: undefined,
  selectedPanel: undefined,
  initialActive: "sidebar",
  sidebar: {
    showRoots: false,
    collapsedRoots: ["other"],
  },
});
