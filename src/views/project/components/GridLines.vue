<template>
  <g v-if="store.showGrid" class="grid-container">
    <line
      v-for="x in Math.ceil(store.viewBox.width / gridSize) + 1"
      :key="'x' + x"
      :x1="store.viewBox.x + x * gridSize - (store.viewBox.x % gridSize)"
      :y1="store.viewBox.y"
      :x2="store.viewBox.x + x * gridSize - (store.viewBox.x % gridSize)"
      :y2="store.viewBox.y + store.viewBox.height"
      stroke="lightgray"
      stroke-width="0.5"
    />
    <line
      v-for="y in Math.ceil(store.viewBox.height / gridSize) + 1"
      :key="'y' + y"
      :x1="store.viewBox.x"
      :y1="store.viewBox.y + y * gridSize - (store.viewBox.y % gridSize)"
      :x2="store.viewBox.x + store.viewBox.width"
      :y2="store.viewBox.y + y * gridSize - (store.viewBox.y % gridSize)"
      stroke="lightgray"
      stroke-width="0.5"
    />
  </g>
</template>

<script setup>
import { useSvgStore } from '@/stores/svgStore';
const store = useSvgStore();
const gridSize = store.gridSize;
</script>
