<template>
  <FrustumChild v-if="!isEmpty(props.coordinates)" v-bind="props">
    <slot />
  </FrustumChild>
</template>

<script setup lang="ts">
import { isEmpty } from "lodash-es";
import { defaultVectorFrustumProps, VectorFrustumProps } from "./props";
import FrustumChild from "./FrustumChild.vue";

const props = withDefaults(defineProps<VectorFrustumProps>(), {
  ...defaultVectorFrustumProps,
});
</script>
