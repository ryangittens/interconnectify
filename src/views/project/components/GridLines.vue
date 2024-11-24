<template>
  <g v-if="store.showGrid" class="grid-container">
    <line
      v-for="(line, index) in horizontalLines"
      :key="'h-' + index"
      :x1="store.viewBox.x"
      :y1="line"
      :x2="store.viewBox.x + store.viewBox.width"
      :y2="line"
      stroke="lightgray"
      stroke-width="0.5"
    />
    <line
      v-for="(line, index) in verticalLines"
      :key="'v-' + index"
      :x1="line"
      :y1="store.viewBox.y"
      :x2="line"
      :y2="store.viewBox.y + store.viewBox.height"
      stroke="lightgray"
      stroke-width="0.5"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();
const gridSize = store.gridSize;

const horizontalLines = computed(() => {
  const lines = [];
  const yCount = Math.ceil(store.viewBox.height / gridSize) + 1;
  for (let y = 0; y < yCount; y++) {
    const yPos = store.viewBox.y + y * gridSize - (store.viewBox.y % gridSize);
    lines.push(yPos);
  }
  return lines;
});

const verticalLines = computed(() => {
  const lines = [];
  const xCount = Math.ceil(store.viewBox.width / gridSize) + 1;
  for (let x = 0; x < xCount; x++) {
    const xPos = store.viewBox.x + x * gridSize - (store.viewBox.x % gridSize);
    lines.push(xPos);
  }
  return lines;
});
</script>

<style scoped>
.grid-container {
  pointer-events: none;
}
</style>
