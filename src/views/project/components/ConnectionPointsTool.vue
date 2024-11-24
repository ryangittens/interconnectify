<template>
  <g>
    <circle
      v-for="cp in store.connectionPoints"
      :key="cp.id"
      :cx="cp.x"
      :cy="cp.y"
      r="5"
      :fill="cp.color"
      @mousedown.stop="handleCPMouseDown(cp, $event)"
      @mouseup="handleCPMouseUp(cp, $event)"
      @click="handleCPClick(cp, $event)"
    />
    <circle v-if="store.isAddingConnectionPoint" :cx="store.currentPoint.x" :cy="store.currentPoint.y" r="5" :fill="cpColor" />
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
import { ref, watch, computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const isAdding = ref(false);
const currentPoint = ref({ x: 0, y: 0 });
const activeCP = ref(null);

const { selectConnectionPoint, endInteraction } = store;

const handleCPClick = (cp, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    selectConnectionPoint(cp);
  }
};

const cpColor = computed(() => {
  return store.connectionPointColors[store.currentConnectionPointType];
});

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const handleCPMouseDown = (cp, event) => {
  store.mouseDown = true; // Set mouseDown flag to true
  store.mouseDownCP = cp; // Store the line being dragged
  store.isCPDragging = false; // Reset dragging flag
};
const handleCPMouseUp = (cp, event) => {
  endInteraction(event);
  store.mouseDown = false; // Reset mouseDown flag
};
const isCPSelected = (cp) => store.selectedCP && store.selectedCP.id === cp.id;

const addConnectionPoint = (event) => {
  if (!isAdding.value) return;

  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);
  activeCP.value.connectionPoints.push({
    id: Date.now().toString(),
    x: snappedCoords.x - activeCP.value.x,
    y: snappedCoords.y - activeCP.value.y
  });
  isAdding.value = false;
};

watch(isAdding, (newVal) => {
  if (newVal) {
    window.addEventListener('mousemove', updateCurrentPoint);
    window.addEventListener('click', addConnectionPoint);
  } else {
    window.removeEventListener('mousemove', updateCurrentPoint);
    window.removeEventListener('click', addConnectionPoint);
  }
});

const updateCurrentPoint = (event) => {
  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);
  currentPoint.value = snappedCoords;
};
</script>
