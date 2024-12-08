<template>
  <g>
    <text
      v-for="text in store.texts"
      :key="text.id"
      :ref="(el) => textRefs.set(text.id, el)"
      :x="text.x"
      :y="text.y"
      :font-size="text.fontSize"
      @mousedown.stop="handleTextMouseDown(text, $event)"
      @click="handleTextClick(text, $event)"
      style="cursor: grab; user-select: none"
    >
      {{ text.content }}
    </text>
  </g>
</template>

<script setup>
import { ref } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const { selectText, snapToGrid } = store;

const textRefs = new Map();

// Non-reactive variables
let isDraggingText = false;
let dragStartCoords = { x: 0, y: 0 };
let initialTextPosition = { x: 0, y: 0 };
let currentTextElement = null;
let currentText = null;

const handleTextClick = (text, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    selectText(text, event);
  }
};

const handleTextMouseDown = (text, event) => {
  if (store.activeTool) {
    return;
  }
  event.preventDefault();

  isDraggingText = true;
  let coords = store.getTransformedSVGCoordinates(event);
  dragStartCoords = { x: coords.x, y: coords.y };
  initialTextPosition = { x: text.x, y: text.y };
  currentText = text;
  currentTextElement = textRefs.get(text.id);

  currentTextElement.classList.add('dragging');

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleTextMouseUp);
};

const handleMouseMove = (event) => {
  if (!isDraggingText || !currentTextElement) return;

  event.preventDefault();

  let coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

  const newX = initialTextPosition.x + deltaX;
  const newY = initialTextPosition.y + deltaY;

  const snappedCoords = snapToGrid(newX, newY, event);

  // Update the text's position directly in the DOM
  currentTextElement.setAttribute('x', snappedCoords.x);
  currentTextElement.setAttribute('y', snappedCoords.y);
};

const handleTextMouseUp = (event) => {
  if (!isDraggingText || !currentText) return;

  event.preventDefault();

  // Calculate final position
  let coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

  const newX = initialTextPosition.x + deltaX;
  const newY = initialTextPosition.y + deltaY;

  const snappedCoords = snapToGrid(newX, newY, event);

  // Update the text's position in the reactive store
  currentText.x = snappedCoords.x;
  currentText.y = snappedCoords.y;

  currentTextElement.classList.remove('dragging');
  currentTextElement = null;
  isDraggingText = false;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleTextMouseUp);
};
</script>

<style scoped>
.dragging {
  cursor: grabbing;
}

text {
  cursor: grab;
  user-select: none;
}
</style>
