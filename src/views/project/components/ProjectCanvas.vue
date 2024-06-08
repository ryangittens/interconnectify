<template>
  <div ref="canvasContainer" class="canvas-container">
    <svg
      ref="svg"
      class="drawing-svg"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="`${store.viewBox.x} ${store.viewBox.y} ${store.viewBox.width} ${store.viewBox.height}`"
      @mousedown="startInteraction"
      @mousemove="handleMouseMove"
      @mouseup="endInteraction"
      @mouseleave="endInteraction"
      @wheel="zoom"
    >
      <g ref="linesContainer">
        <path
          v-for="line in store.lines"
          :key="line.id"
          :d="line.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')"
          :stroke="isLineSelected(line) ? primary : line.color"
          stroke-width="2"
          :stroke-dasharray="line.type === 'dashed' ? '5, 5' : 'none'"
          fill="none"
          @click="handleLineClick(line)"
          style="cursor: pointer"
        ></path>
        <!-- Hover Line for Preview -->
        <path
          v-if="hoverPoint && hoverPoint.x !== null && store.isDrawing && store.currentLine.length"
          :d="`M ${store.currentLine.map((point) => `${point.x},${point.y}`).join(' L ')} L ${hoverPoint.x},${hoverPoint.y}`"
          :stroke="store.lineColor"
          stroke-width="2"
          :stroke-dasharray="store.lineType === 'dashed' ? '5, 5' : 'none'"
          fill="none"
        ></path>
      </g>
      <g ref="axesContainer"></g>
      <g
        v-for="block in store.blocks"
        :key="block.id"
        :transform="`translate(${block.x}, ${block.y})`"
        @mousedown.stop="handleBlockMouseDown(block, $event)"
      >
        <rect
          v-if="!block.content"
          :x="0"
          :y="0"
          :width="block.width"
          :height="block.height"
          :fill="block.color"
          :stroke="isBlockSelected(block) ? primary : 'black'"
          :stroke-width="isBlockSelected(block) ? 2 : 1"
          style="cursor: pointer"
        />
        <g v-else v-html="block.content"></g>
        <circle
          v-for="cp in block.connectionPoints"
          :key="cp.id"
          :cx="cp.x"
          :cy="cp.y"
          r="5"
          :fill="secondary"
          @click.stop="startWire(cp, block, $event)"
        />
      </g>
    </svg>
    <ConductorSchedule />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, defineProps } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { useHistoryStore } from '@/stores/history';

import ConductorSchedule from './ConductorSchedule.vue';

import { StopDrawingCommand, AddLinePointCommand } from '@/commands';

const store = useSvgStore();
const historyStore = useHistoryStore();

const props = defineProps(['project']);
const drawing = props.project?.drawing;

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const svg = ref(null);
const linesContainer = ref(null);
const axesContainer = ref(null);

const drawingWire = ref(false);

const wireStart = ref(null);
const wireEnd = ref(null);

const hoverPoint = ref({ x: null, y: null });

const { deserializeState, moveBlock, selectBlock, stopDrawing, selectLine, setSvgElement } = store;

let panStart = { x: 0, y: 0 };
let dragStart = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
let panning = false;
let dragging = false;
const zoomFactor = 0.04;
const minZoomLevel = 0.02;
const maxZoomLevel = 0.5;
const gridSize = 20;

/* SETUP */

const pan = (event) => {
  if (!panning) return;
  const dx = event.clientX - panStart.x;
  const dy = event.clientY - panStart.y;
  panStart = { x: event.clientX, y: event.clientY };

  store.viewBox.x -= dx;
  store.viewBox.y -= dy;
};
const zoom = (event) => {
  console.log(store.zoomLevel);
  event.preventDefault();

  const { offsetX, offsetY, deltaY } = event;
  const { width, height } = svg.value.getBoundingClientRect();

  // Determine the new zoom level
  const zoomDirection = deltaY > 0 ? -1 : 1;
  const newZoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, store.zoomLevel * (1 + zoomDirection * zoomFactor)));
  if (newZoomLevel === store.zoomLevel) return;

  // Calculate the scale factor based on the new zoom level
  const scale = newZoomLevel / store.zoomLevel;
  store.zoomLevel = newZoomLevel;

  // Calculate the new viewBox dimensions
  const newWidth = store.viewBox.width / scale;
  const newHeight = store.viewBox.height / scale;

  // Calculate the new viewBox position to keep the mouse position fixed
  const newX = store.viewBox.x + (offsetX / width) * (store.viewBox.width - newWidth);
  const newY = store.viewBox.y + (offsetY / height) * (store.viewBox.height - newHeight);

  // Update the viewBox in the store
  store.viewBox = { x: newX, y: newY, width: newWidth, height: newHeight };
};
const getSVGCoordinates = (event) => {
  const { left, top, width, height } = svg.value.getBoundingClientRect();
  return {
    x: ((event.clientX - left) / width) * store.viewBox.width + store.viewBox.x,
    y: ((event.clientY - top) / height) * store.viewBox.height + store.viewBox.y
  };
};

const initSVG = () => {
  resizeSVG();
  const { clientWidth, clientHeight } = svg.value;
  store.viewBox.width = clientWidth;
  store.viewBox.height = clientHeight;
};
const resizeSVG = () => {
  const container = getClosestVContainer();
  if (container) {
    const containerPaddingLeft = parseFloat(window.getComputedStyle(container).paddingLeft);
    svg.value.setAttribute('width', container.clientWidth);
    svg.value.setAttribute('height', container.clientHeight);
    svg.value.style.left = `${-containerPaddingLeft}px`;
    store.viewBox.width = container.clientWidth;
    store.viewBox.height = container.clientHeight;
  }
};
const getClosestVContainer = () => {
  let element = svg.value;
  while (element) {
    if (element.classList.contains('v-container')) return element;
    element = element.parentElement;
  }
  return null;
};
onMounted(() => {
  initSVG();
  setSvgElement(svg.value);
  deserializeState(drawing);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', resizeSVG);
  svg.value.addEventListener('mousemove', handleMouseMove);
  svg.value.addEventListener('mousedown', startInteraction);
  svg.value.addEventListener('mouseup', endInteraction);
  svg.value.addEventListener('mouseleave', endInteraction);
  svg.value.addEventListener('wheel', zoom);
  svg.value.addEventListener('click', handleSvgClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', resizeSVG);
  svg.value.removeEventListener('mousemove', handleMouseMove);
  svg.value.removeEventListener('mousedown', startInteraction);
  svg.value.removeEventListener('mouseup', endInteraction);
  svg.value.removeEventListener('mouseleave', endInteraction);
  svg.value.removeEventListener('wheel', zoom);
  svg.value.removeEventListener('click', handleSvgClick);
});

/* COMMON */
const handleMouseMove = (event) => {
  if (store.isDrawing) {
    const coords = getSVGCoordinates(event);
    hoverPoint.value = coords;
    drawHoverLine(coords.x, coords.y, event.ctrlKey);
  } else if (panning && !store.selectedBlock) {
    pan(event);
  } else if (dragging && store.selectedBlock) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;
    const snappedCoords = snapToGrid(initialBlockPosition.x + dx, initialBlockPosition.y + dy);
    moveBlock(store.selectedBlock, snappedCoords.x - store.selectedBlock.x, snappedCoords.y - store.selectedBlock.y);
  }
};

const startInteraction = (event) => {
  const coords = getSVGCoordinates(event);
  if (store.selectedBlock) {
    dragStart = coords;
    initialBlockPosition = { ...store.selectedBlock };
    dragging = true;
  } else {
    panStart = { x: event.clientX, y: event.clientY };
    panning = true;
  }
};

const endInteraction = () => {
  panning = false;
  dragging = false;
};

const handleSvgClick = (event) => {
  if (!event.target.closest('rect') && !event.target.closest('g')) {
    selectBlock(null);
  }
  if (!store.isDrawing) return;
  const { x, y } = hoverPoint.value;
  addPoint({ x, y }, event.ctrlKey);
};

/* BLOCKS */

const handleBlockMouseDown = (block, event) => {
  selectBlock(block);
  startInteraction(event);
};

const isBlockSelected = (block) => store.selectedBlock && store.selectedBlock.id === block.id;

/* WIRES/LINES */

const drawAxes = (snappedPoint) => {
  axesContainer.value.innerHTML = '';
  const { x, y } = snappedPoint;
  const { width, height } = store.viewBox;

  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', x);
  xAxis.setAttribute('y1', 0);
  xAxis.setAttribute('x2', x);
  xAxis.setAttribute('y2', height);
  xAxis.setAttribute('stroke', 'rgba(255, 0, 0, 0.5)');
  xAxis.setAttribute('stroke-width', 1);
  xAxis.setAttribute('stroke-dasharray', '5,5');

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', 0);
  yAxis.setAttribute('y1', y);
  yAxis.setAttribute('x2', width);
  yAxis.setAttribute('y2', y);
  yAxis.setAttribute('stroke', 'rgba(255, 0, 0, 0.5)');
  yAxis.setAttribute('stroke-width', 1);
  yAxis.setAttribute('stroke-dasharray', '5,5');

  axesContainer.value.appendChild(xAxis);
  axesContainer.value.appendChild(yAxis);
};

const clearAxes = () => {
  axesContainer.value.innerHTML = '';
};

const isLineSelected = (line) => store.selectedLine && store.selectedLine.id === line.id;

const snapToGrid = (x, y) => ({
  x: Math.round(x / gridSize) * gridSize,
  y: Math.round(y / gridSize) * gridSize
});

const drawHoverLine = (x, y, ctrlKey) => {
  if (store.currentLine.length > 0) {
    const lastPoint = store.currentLine[store.currentLine.length - 1];
    if (!ctrlKey) {
      const dx = Math.abs(x - lastPoint.x);
      const dy = Math.abs(y - lastPoint.y);
      if (dx > dy) y = lastPoint.y;
      else x = lastPoint.x;
    }
    const snappedPoint = snapToGrid(x, y);
    hoverPoint.value = snappedPoint;

    store.hoverLine = { x1: lastPoint.x, y1: lastPoint.y, x2: snappedPoint.x, y2: snappedPoint.y };
    drawAxes(snappedPoint);
  }
};

const addPoint = (point, ctrlKey) => {
  const lastPoint = store.currentLine[store.currentLine.length - 1];
  let { x, y } = point;
  if (lastPoint && !ctrlKey) {
    const dx = Math.abs(x - lastPoint.x);
    const dy = Math.abs(y - lastPoint.y);
    if (dx > dy) y = lastPoint.y;
    else x = lastPoint.x;
  }
  const snappedPoint = snapToGrid(x, y);
  historyStore.executeCommand(new AddLinePointCommand(store, snappedPoint));
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape' && store.isDrawing) {
    endDrawing();
  }
  selectBlock(null);
};

const endDrawing = () => {
  stopDrawing();
  clearAxes();

  historyStore.executeCommand(new StopDrawingCommand(store));
};

const startWire = (cp, block, event) => {
  const cpX = block.x + cp.x;
  const cpY = block.y + cp.y;
  const point = snapToGrid(cpX, cpY);
  if (store.isDrawing) {
    addPoint(point, event.ctrlKey);
    if (drawingWire.value) {
      wireEnd.value = { block, cp };
      finishWire();
    } else {
      wireStart.value = { block, cp };
      drawingWire.value = true;
    }
  }
};

const finishWire = () => {
  if (wireStart.value && wireEnd.value) {
    wireStart.value = null;
    wireEnd.value = null;
    drawingWire.value = false;
    endDrawing();
  }
};

const handleLineClick = (line) => {
  selectLine(line);
};
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 160px);
}
.drawing-svg {
  position: absolute;
  top: -42px;
  height: calc(100vh - 160px);
}
.drawing-svg:active {
  cursor: grabbing;
}
.conductorSchedulePanel {
  position: absolute;
  bottom: 0;
}
.conductorScheduleTable {
  max-height: 200px;
}
</style>
