<template>
  <div class="preview-wrapper">
    <div class="preview-header">
      <svg class="icon-eye" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#28a745" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
      <span class="label">预览</span>
      <span v-if="loading" class="status status-loading">加载中...</span>
      <span v-else-if="success" class="status status-ok">&#10003; 运行成功</span>
    </div>
    <div class="preview-container">
      <iframe
        ref="iframeRef"
        src="/playground/preview.html"
        sandbox="allow-scripts allow-same-origin"
        @load="onIframeLoad"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

const emit = defineEmits<{
  ready: [];
  "runtime-error": [message: string];
}>();

const iframeRef = ref<HTMLIFrameElement>();
const loading = ref(false);
const success = ref(false);

function onIframeLoad() {
  loading.value = true;
}

function handleMessage(e: MessageEvent) {
  if (e.source !== iframeRef.value?.contentWindow) return;

  switch (e.data?.type) {
    case "ready":
      loading.value = false;
      emit("ready");
      break;
    case "success":
      loading.value = false;
      success.value = true;
      break;
    case "error":
      loading.value = false;
      success.value = false;
      emit("runtime-error", e.data.message);
      break;
  }
}

function sendCode(code: string, styles: string) {
  loading.value = true;
  success.value = false;
  iframeRef.value?.contentWindow?.postMessage(
    { type: "code", code, styles },
    "*"
  );
}

onMounted(() => {
  window.addEventListener("message", handleMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener("message", handleMessage);
});

defineExpose({ sendCode });
</script>

<style scoped>
.preview-wrapper {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #0d1117;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 14px;
  background: #161b22;
  border-bottom: 1px solid #21262d;
  flex-shrink: 0;
}

.icon-eye {
  flex-shrink: 0;
}

.label {
  font-size: 13px;
  color: #8b949e;
  font-family: "Cascadia Code", "Fira Code", "SF Mono", Menlo, Consolas, monospace;
}

.status {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 4px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.status-loading {
  color: #f0b429;
  background: rgba(240, 180, 41, 0.12);
  border: 1px solid rgba(240, 180, 41, 0.25);
}

.status-ok {
  color: #28a745;
  background: rgba(40, 167, 69, 0.12);
  border: 1px solid rgba(40, 167, 69, 0.25);
}

.preview-container {
  flex: 1;
  overflow: hidden;
}

.preview-container iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #0d0d0d;
}
</style>
