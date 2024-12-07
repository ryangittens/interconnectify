<template>
  <g v-if="store.showGrid && store.activeSpace == 'model'" class="grid-container">
    <line
      v-for="(line, index) in horizontalLines"
      :key="'h-' + index"
      :x1="props.viewBox.x - padding"
      :y1="line"
      :x2="props.viewBox.x + props.viewBox.width + padding"
      :y2="line"
      stroke="lightgray"
      stroke-width="0.5"
    />
    <line
      v-for="(line, index) in verticalLines"
      :key="'v-' + index"
      :x1="line"
      :y1="props.viewBox.y - padding"
      :x2="line"
      :y2="props.viewBox.y + props.viewBox.height + padding"
      stroke="lightgray"
      stroke-width="0.5"
    />
  </g>
</template>

<script setup>
import { computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const props = defineProps({
  viewBox: {
    type: Object,
    required: true
  }
});

const store = useSvgStore();
const gridSize = store.gridSize;
const padding = 100;

const horizontalLines = computed(() => {
  const lines = [];
  const yCount = Math.ceil((props.viewBox.height + padding) / gridSize) + 1;
  for (let y = 0; y < yCount; y++) {
    const yPos = props.viewBox.y + y * gridSize - (props.viewBox.y % gridSize);
    lines.push(yPos);
  }
  return lines;
});

const verticalLines = computed(() => {
  const lines = [];
  const xCount = Math.ceil(props.viewBox.width + padding / gridSize) + 1;
  for (let x = -padding; x < xCount; x++) {
    const xPos = props.viewBox.x + x * gridSize - (props.viewBox.x % gridSize);
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
