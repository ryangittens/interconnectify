<template>
  <!-- Controls -->
  <div class="controls">
    <v-btn @click="setActiveSpace('paper')" :color="activeSpace == 'paper' ? 'background' : null">Paper Space</v-btn>
    <v-btn @click="setActiveSpace('model')" :color="activeSpace == 'model' ? 'background' : null">Model Space</v-btn>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const emit = defineEmits(['update:view']);

const activeSpace = computed(() => store.activeSpace);

const setActiveSpace = (space) => {
  emit('update:view', space);
  if (space === 'model') {
    store.setActiveSpace(space);
  } else {
    store.setActiveSpace(space);
  }
};
</script>
