<template>
  <g ref="linesContainer">
    <!-- Render the lines -->
    <path
      v-for="line in store.lines"
      :key="`path-${line.id}`"
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

    <!-- Render the labels for each line ID inside a circle -->
    <template v-for="line in store.lines" :key="`label-${line.id}`">
      <g
        style="cursor: pointer; pointer-events: all"
        @mousedown.stop="handleLineMouseDown(line, $event)"
        @mouseup="handleLineMouseUp(line, $event)"
        @click="handleLineClick(line)"
      >
        <circle :cx="getLabelPosition(line).x" :cy="getLabelPosition(line).y" :r="12" fill="white" stroke="black" stroke-width="2"></circle>
        <text :x="getLabelPosition(line).x" :y="getLabelPosition(line).y + 4" class="line-label" text-anchor="middle">
          {{ line.alias }}
        </text>
      </g>
    </template>

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
  store.mouseDown = true;
  store.mouseDownLine = line;
  store.isLineDragging = false;
};
const handleLineMouseUp = (line, event) => {
  if (!store.isLineDragging) {
    // It's a click event, not a drag
  } else {
    endLineDrag(line, event);
  }
  endInteraction(event);
  store.mouseDown = false;
  store.mouseDownLine = null;
};
const handleLineClick = (line) => {
  selectLine(line);
};

const isLineSelected = (line) => store.selectedLine && store.selectedLine.id === line.id;

const getLabelPosition = (line) => {
  // Calculate the midpoint of the line
  let totalLength = 0;
  const segmentLengths = [];

  for (let i = 0; i < line.points.length - 1; i++) {
    const dx = line.points[i + 1].x - line.points[i].x;
    const dy = line.points[i + 1].y - line.points[i].y;
    const length = Math.hypot(dx, dy);
    segmentLengths.push(length);
    totalLength += length;
  }

  let distance = totalLength / 2;
  let accumulatedLength = 0;
  let index = 0;

  while (index < segmentLengths.length && accumulatedLength + segmentLengths[index] < distance) {
    accumulatedLength += segmentLengths[index];
    index++;
  }

  if (index >= line.points.length - 1) {
    index = line.points.length - 2;
  }

  const t = (distance - accumulatedLength) / segmentLengths[index];
  const x = line.points[index].x + t * (line.points[index + 1].x - line.points[index].x);
  const y = line.points[index].y + t * (line.points[index + 1].y - line.points[index].y);

  return { x, y };
};
</script>

<style scoped>
.line-label {
  font-size: 14px;
  fill: black;
  user-select: none;
}
</style>
