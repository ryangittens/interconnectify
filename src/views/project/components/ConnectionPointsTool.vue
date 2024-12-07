<template>
  <g>
    <circle
      v-for="cp in store.connectionPoints"
      :key="cp.id"
      :ref="(el) => cpRefs.set(cp.id, el)"
      :cx="cp.x"
      :cy="cp.y"
      r="3"
      :fill="cp.color"
      @mousedown.stop="handleCPMouseDown(cp, $event)"
      @mouseup="handleCPMouseUp($event)"
      @click="handleCPClick(cp, $event)"
    />
    <circle v-if="store.isAddingConnectionPoint" :cx="store.currentPoint.x" :cy="store.currentPoint.y" r="3" :fill="cpColor" />
  </g>
</template>

<!-- <template>
  <g v-if="store.selectedBlock">
    <circle
      v-for="cp in store.selectedBlock.connectionPoints"
      :key="cp.id"
      :cx="store.selectedBlock.x + cp.x"
      :cy="store.selectedBlock.y + cp.y"
      r="5"
      fill="red"
      @click="removeConnectionPoint(cp.id)"
    />
    <circle v-if="store.isAddingConnectionPoint" :cx="store.currentPoint.x" :cy="store.currentPoint.y" r="5" fill="blue" />
  </g>
</template> -->

<script setup>
import { computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();
const { selectConnectionPoint, endInteraction } = store;
// Non-reactive variables
const cpRefs = new Map();

let isDraggingCP = false;
let dragStartCoords = { x: 0, y: 0 };
let initialCPPosition = { x: 0, y: 0 };
let currentCPElement = null;
let currentCP = null;

let isAdding = false;
let currentPoint = { x: 0, y: 0 };
let tempCPCircle = null;

const cpColor = computed(() => {
  return store.connectionPointColors[store.currentConnectionPointType];
});

const handleCPClick = (cp, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    store.selectConnectionPoint(cp);
  }
};

const handleCPMouseDown = (cp, event) => {
  if (store.activeTool) {
    return;
  }

  event.preventDefault();

  isDraggingCP = true;
  const coords = store.getTransformedSVGCoordinates(event);
  dragStartCoords = { x: coords.x, y: coords.y };
  initialCPPosition = { x: cp.x, y: cp.y };
  currentCP = cp;
  currentCPElement = cpRefs.get(cp.id);

  currentCPElement.classList.add('dragging');

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleCPMouseUp);
};

const handleMouseMove = (event) => {
  if (!isDraggingCP || !currentCPElement) return;

  event.preventDefault();

  const coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

  const newX = initialCPPosition.x + deltaX;
  const newY = initialCPPosition.y + deltaY;

  const snappedCoords = store.snapToGrid(newX, newY, event);

  // Update the CP's position directly in the DOM
  currentCPElement.setAttribute('cx', snappedCoords.x);
  currentCPElement.setAttribute('cy', snappedCoords.y);
};

const handleCPMouseUp = (event) => {
  if (!isDraggingCP || !currentCP) return;

  event.preventDefault();

  // Calculate final position
  const coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

  const newX = initialCPPosition.x + deltaX;
  const newY = initialCPPosition.y + deltaY;

  const snappedCoords = store.snapToGrid(newX, newY, event);

  // Update the CP's position in the reactive store
  currentCP.x = snappedCoords.x;
  currentCP.y = snappedCoords.y;

  currentCPElement.classList.remove('dragging');
  currentCPElement = null;
  isDraggingCP = false;
  currentCP = null;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleCPMouseUp);

  endInteraction(event);
  store.mouseDown = false; // Reset mouseDown flag
};

const startAddingConnectionPoint = () => {
  if (store.activeTool !== 'connectionPoint') return;

  isAdding = true;
  currentPoint = { x: 0, y: 0 };

  // Create the temporary circle
  tempCPCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  tempCPCircle.setAttribute('r', 5);
  tempCPCircle.setAttribute('fill', cpColor.value);

  // Append it to the SVG
  const svg = document.querySelector('svg');
  svg.appendChild(tempCPCircle);

  window.addEventListener('mousemove', updateCurrentPoint);
  window.addEventListener('click', addConnectionPoint);
};

const stopAddingConnectionPoint = () => {
  isAdding = false;

  // Remove the temporary circle
  if (tempCPCircle && tempCPCircle.parentNode) {
    tempCPCircle.parentNode.removeChild(tempCPCircle);
    tempCPCircle = null;
  }

  window.removeEventListener('mousemove', updateCurrentPoint);
  window.removeEventListener('click', addConnectionPoint);
};

const updateCurrentPoint = (event) => {
  if (!isAdding || !tempCPCircle) return;

  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);

  currentPoint = snappedCoords;

  // Update the position of the temporary circle
  tempCPCircle.setAttribute('cx', currentPoint.x);
  tempCPCircle.setAttribute('cy', currentPoint.y);
};

const addConnectionPoint = (event) => {
  if (!isAdding) return;

  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);

  // Add the connection point to the store
  store.connectionPoints.push({
    id: Date.now().toString(),
    x: snappedCoords.x,
    y: snappedCoords.y,
    color: cpColor.value
  });

  // Create and append the new connection point circle
  const newCPCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  newCPCircle.setAttribute('cx', snappedCoords.x);
  newCPCircle.setAttribute('cy', snappedCoords.y);
  newCPCircle.setAttribute('r', 5);
  newCPCircle.setAttribute('fill', cpColor.value);
  // You may need to set up event listeners for the new circle
  newCPCircle.addEventListener('mousedown', (e) => handleCPMouseDown(store.connectionPoints[store.connectionPoints.length - 1], e));
  newCPCircle.addEventListener('click', (e) => handleCPClick(store.connectionPoints[store.connectionPoints.length - 1], e));

  // Append the new circle to the SVG
  const svg = document.querySelector('svg');
  svg.appendChild(newCPCircle);

  // Update cpRefs
  cpRefs.set(store.connectionPoints[store.connectionPoints.length - 1].id, newCPCircle);

  stopAddingConnectionPoint();
};

// Start adding connection point when the tool is activated
if (store.activeTool === 'connectionPoint') {
  startAddingConnectionPoint();
}
</script>

<style scoped>
.dragging {
  cursor: grabbing;
}

circle {
  cursor: pointer;
  user-select: none;
}
</style>
