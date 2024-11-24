<template>
  <g v-if="rectangle">
    <rect
      :x="rectangle.x"
      :y="rectangle.y"
      :width="rectangle.width"
      :height="rectangle.height"
      :fill="rectangle.color"
      :stroke="rectangle.stroke"
      :stroke-width="rectangle.strokeWidth"
    />
  </g>
  <g>
    <rect
      v-for="rect in store.rectangles"
      :key="rect.id"
      :ref="(el) => rectangleRefs.set(rect.id, el)"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      :fill="rect.color"
      :stroke="rect.stroke"
      :stroke-width="rect.strokeWidth"
      @mousedown.stop="handleRectangleMouseDown(rect, $event)"
      @click="handleRectangleClick(rect, $event)"
      style="cursor: grab"
    />
  </g>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const { selectRectangle, snapToGrid } = store;

const rectangle = ref(null);

const rectangleRefs = new Map();

// Non-reactive variables
let isDraggingRectangle = false;
let dragStartCoords = { x: 0, y: 0 };
let initialRectanglePosition = { x: 0, y: 0 };
let currentRectangleElement = null;
let currentRectangle = null;

const handleRectangleClick = (rect, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    store.selectRectangle(rect);
  }
};

const handleRectangleMouseDown = (rect, event) => {
  event.preventDefault();

  isDraggingRectangle = true;
  dragStartCoords = { x: event.clientX, y: event.clientY };
  initialRectanglePosition = { x: rect.x, y: rect.y };
  currentRectangle = rect;
  currentRectangleElement = rectangleRefs.get(rect.id);

  currentRectangleElement.classList.add('dragging');

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleRectangleMouseUp);
};

const handleMouseMove = (event) => {
  if (!isDraggingRectangle || !currentRectangleElement) return;

  event.preventDefault();

  const deltaX = (event.clientX - dragStartCoords.x) / store.zoomLevel;
  const deltaY = (event.clientY - dragStartCoords.y) / store.zoomLevel;

  const newX = initialRectanglePosition.x + deltaX;
  const newY = initialRectanglePosition.y + deltaY;

  const snappedCoords = snapToGrid(newX, newY);

  // Update the rectangle's position directly in the DOM
  currentRectangleElement.setAttribute('x', snappedCoords.x);
  currentRectangleElement.setAttribute('y', snappedCoords.y);
};

const handleRectangleMouseUp = (event) => {
  if (!isDraggingRectangle || !currentRectangle) return;

  event.preventDefault();

  // Calculate final position
  const deltaX = (event.clientX - dragStartCoords.x) / store.zoomLevel;
  const deltaY = (event.clientY - dragStartCoords.y) / store.zoomLevel;

  const newX = initialRectanglePosition.x + deltaX;
  const newY = initialRectanglePosition.y + deltaY;

  const snappedCoords = snapToGrid(newX, newY);

  // Update the rectangle's position in the reactive store
  currentRectangle.x = snappedCoords.x;
  currentRectangle.y = snappedCoords.y;

  currentRectangleElement.classList.remove('dragging');
  currentRectangleElement = null;
  isDraggingRectangle = false;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleRectangleMouseUp);
};

watchEffect(() => {
  if (store.isCreatingRectangle) {
    rectangle.value = store.currentRectangle;
  } else {
    rectangle.value = null;
  }
});
</script>

<style scoped>
.dragging {
  cursor: grabbing;
}

rect {
  cursor: grab;
}
</style>
