<template>
  <div class="editor-wrapper">
    <div class="editor-header">
      <svg class="icon-vue" viewBox="0 0 128 128" width="16" height="16">
        <path fill="#42b883" d="M78.8,10L64,35.4L49.2,10H0l64,110l64-110C128,10,78.8,10,78.8,10z"/>
        <path fill="#35495e" d="M78.8,10L64,35.4L49.2,10H25.6L64,76l38.4-66H78.8z"/>
      </svg>
      <span class="filename">App.vue</span>
    </div>
    <div ref="editorRef" class="editor-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from "vue";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, highlightSpecialChars, rectangularSelection, crosshairCursor } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, indentWithTab, history, historyKeymap, indentLess } from "@codemirror/commands";
import { bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { highlightSelectionMatches } from "@codemirror/search";
import { oneDark } from "@codemirror/theme-one-dark";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  "compile-error": [message: string];
}>();

const editorRef = ref<HTMLDivElement>();
let editorView: EditorView | null = null;

function refresh() {
  editorView?.requestMeasure();
}

defineExpose({ refresh });

onMounted(() => {
  if (!editorRef.value) return;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit("update:modelValue", update.state.doc.toString());
    }
  });

  // 自定义深色主题覆盖
  const customDarkTheme = EditorView.theme({
    // 字体设置 - 跟随浏览器字体
    "&": {
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important",
    },
    ".cm-content": {
      fontFamily: "inherit !important",
    },
    ".cm-line": {
      fontFamily: "inherit !important",
    },
    ".cm-gutters": {
      fontFamily: "inherit !important",
    },
    // 选区背景 - 半透明白色，文字清晰可见
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(255, 255, 255, 0.15) !important",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(255, 255, 255, 0.1) !important",
    },
    // 双击选中单词 - 高亮匹配词（其他相同单词）
    ".cm-selectionMatch": {
      backgroundColor: "rgba(255, 255, 255, 0.08) !important",
    },
    // 双击选中的那个词
    ".cm-selectionLayer .cm-selectionBackground": {
      backgroundColor: "rgba(255, 255, 255, 0.15) !important",
    },
    // 确保选中文字颜色清晰
    ".cm-content ::selection": {
      backgroundColor: "rgba(255, 255, 255, 0.15) !important",
      color: "#ffffff !important",
    },
    // 确保选区层在匹配层之上
    ".cm-selectionLayer": {
      zIndex: "2 !important",
    },
    ".cm-highlightLayer": {
      zIndex: "1 !important",
    },
  });

  editorView = new EditorView({
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        bracketMatching(),
        indentOnInput(),
        drawSelection(),
        rectangularSelection(),
        crosshairCursor(),
        highlightSelectionMatches({
          highlightWordAroundCursor: true,
          minSelectionLength: 1,
        }),
        oneDark,
        customDarkTheme,
        keymap.of([
          ...(defaultKeymap as any),
          ...(historyKeymap as any),
          indentWithTab as any,
          indentLess as any,
        ]),
        updateListener,
      ],
    }),
    parent: editorRef.value,
  });
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (editorView && newVal !== editorView.state.doc.toString()) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: newVal,
        },
      });
    }
  }
);

onBeforeUnmount(() => {
  editorView?.destroy();
});
</script>

<style scoped>
.editor-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  background: #282c34;
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  background: #21252b;
  border-bottom: 1px solid #181a1f;
  flex-shrink: 0;
}

.icon-vue {
  flex-shrink: 0;
}

.filename {
  font-size: 13px;
  color: #abb2bf;
  font-family: "Cascadia Code", "Fira Code", "SF Mono", Menlo, Consolas, monospace;
}

.editor-container {
  flex: 1;
  overflow: auto;
}

/* 滚动条样式 */
.editor-container :deep(.cm-scroller) {
  overflow: auto !important;
}

.editor-container :deep(.cm-editor) {
  height: 100%;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar) {
  width: 10px;
  height: 10px;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar-track) {
  background: #282c34;
  border-radius: 5px;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar-thumb) {
  background: #4e5666;
  border-radius: 5px;
  border: 2px solid #282c34;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar-thumb:hover) {
  background: #5c6370;
}

.editor-container :deep(.cm-scroller::-webkit-scrollbar-corner) {
  background: #282c34;
}
</style>
