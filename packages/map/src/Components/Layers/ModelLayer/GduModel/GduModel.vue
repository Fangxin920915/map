<template>
  <model-child
    v-if="!isEmpty(props.coordinates)"
    v-bind="props"
    @mouse-leave="emits('mouseLeave', $event)"
    @mouse-over="emits('mouseOver', $event)"
    @mouse-enter="emits('mouseEnter', $event)"
    @click="emits('click', $event)"
    @dblclick="emits('dblclick', $event)"
    @contextmenu="emits('contextmenu', $event)"
  />
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import ModelChild from "./component/ModelChild.vue";
import {
  defaultModelFeatureProps,
  ModelFeatureEmits,
  ModelFeatureProps,
} from "./props";

const props = withDefaults(defineProps<ModelFeatureProps>(), {
  ...defaultModelFeatureProps,
});

const emits = defineEmits<ModelFeatureEmits>();
</script>
