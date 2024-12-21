<template>
  <g v-if="rectangle" :data-selectable="true">
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
  <g :data-selectable="true">
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
      :class="{ dragging: isDraggingRectangle && currentRectangle && currentRectangle.id === rect.id }"
    />
  </g>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { MoveRectangleCommand } from '@/commands';
import { useHistoryStore } from '@/stores/history';
const historyStore = useHistoryStore();

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
  if (!store.activeTool) {
    store.selectRectangle(rect, event);
  }
};

const handleRectangleMouseDown = (rect, event) => {
  event.preventDefault();

  isDraggingRectangle = true;
  let coords = store.getTransformedSVGCoordinates(event);
  dragStartCoords = { x: coords.x, y: coords.y };
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

  let coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

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

  let coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

  const newX = initialRectanglePosition.x + deltaX;
  const newY = initialRectanglePosition.y + deltaY;

  const snappedCoords = snapToGrid(newX, newY);

  // Update the rectangle's position in the reactive store
  historyStore.executeCommand(new MoveRectangleCommand(currentRectangle, snappedCoords.x, snappedCoords.y, store));
  //currentRectangle.x = snappedCoords.x;
  //currentRectangle.y = snappedCoords.y;

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
  cursor: default;
}
</style>
