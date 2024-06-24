<template>
  <g ref="linesContainer">
    <path
      v-for="line in store.lines"
      :key="line.id"
      :d="line.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')"
      :stroke="isLineSelected(line) ? primary : line.color"
      stroke-width="2"
      :stroke-dasharray="line.type === 'dashed' ? '5, 5' : 'none'"
      fill="none"
      style="cursor: pointer"
      @mousedown.stop="handleLineMouseDown(line, $event)"
      @mouseup="handleLineMouseUp(line, $event)"
      @click="handleLineClick(line)"
    ></path>
    <!-- Hover Line for Preview -->
    <path
      v-if="store.hoverPoint && store.hoverPoint.x !== null && store.isDrawing && store.currentLine.length"
      :d="`M ${store.currentLine.map((point) => `${point.x},${point.y}`).join(' L ')} L ${store.hoverPoint.x},${store.hoverPoint.y}`"
      :stroke="store.lineColor"
      stroke-width="2"
      :stroke-dasharray="store.lineType === 'dashed' ? '5, 5' : 'none'"
      fill="none"
    ></path>
  </g>
</template>

<script setup>
import { ref } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
const store = useSvgStore();

const primary = ref('rgb(var(--v-theme-primary))');

const { selectLine, endLineDrag, endInteraction } = store;

const handleLineMouseDown = (line, event) => {
  store.mouseDown = true; // Set mouseDown flag to true
  store.mouseDownLine = line; // Store the line being dragged
  store.isLineDragging = false; // Reset dragging flag
};
const handleLineMouseUp = (line, event) => {
  if (!store.isLineDragging) {
    // It's a click event, not a drag
    //handleLineClick(line);
  } else {
    // If it was a drag, end the drag interaction
    endLineDrag(line, event);
  }
  endInteraction(event);
  store.mouseDown = false; // Reset mouseDown flag
  store.mouseDownLine = null; // Reset the line being dragged
};
const handleLineClick = (line) => {
  selectLine(line);
};

const isLineSelected = (line) => store.selectedLine && store.selectedLine.id === line.id;
</script>
