<template>
  <div ref="canvasContainer" class="canvas-container">
    <svg
      ref="svg"
      class="drawing-svg"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`"
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
    <v-expansion-panels class="conductorSchedulePanel">
      <v-expansion-panel title="Conductor Schedule">
        <v-expansion-panel-text>
          <perfect-scrollbar class="conductorScheduleTable">
            <v-data-table-virtual :headers="conductorTableHeadings" :items="store.lines" item-value="name"></v-data-table-virtual>
          </perfect-scrollbar>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, defineProps } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const props = defineProps(['project']);
const drawing = props.project?.drawing;

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const svg = ref(null);
const linesContainer = ref(null);
const axesContainer = ref(null);
const store = useSvgStore();

const drawingWire = ref(false);

const wireStart = ref(null);
const wireEnd = ref(null);

const hoverPoint = ref({ x: null, y: null });

const { deserializeState, moveBlock, selectBlock, stopDrawing, selectLine } = store;

const viewBox = reactive({ x: 0, y: 0, width: 0, height: 0 });
let panStart = { x: 0, y: 0 };
let dragStart = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
let panning = false;
let dragging = false;
const zoomLevel = ref(1);
const zoomFactor = 0.04;
const minZoomLevel = 0.02;
const maxZoomLevel = 1.5;
const gridSize = 20;

const conductorTableHeadings = [
  { title: 'RUN', align: 'start', key: 'name' },
  { title: 'VOLTAGE', align: 'end', key: 'length' },
  { title: 'CURRENT', align: 'end', key: 'speed' },
  { title: 'VD', align: 'end', key: 'speed' },
  { title: 'CCC', align: 'end', key: 'speed' },
  { title: 'EGC', align: 'end', key: 'speed' },
  { title: 'OCPD', align: 'end', key: 'speed' },
  { title: 'SIZE', align: 'end', key: 'speed' },
  { title: 'CONDUCTOR', align: 'end', key: 'speed' },
  { title: 'OHMS', align: 'end', key: 'price' }
];

const isBlockSelected = (block) => store.selectedBlock && store.selectedBlock.id === block.id;

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
  store.currentLine.push(snappedPoint);
};

const drawAxes = (snappedPoint) => {
  axesContainer.value.innerHTML = '';
  const { x, y } = snappedPoint;
  const { width, height } = viewBox;

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

const handleBlockMouseDown = (block, event) => {
  selectBlock(block);
  startInteraction(event);
};

const handleSvgClick = (event) => {
  if (!event.target.closest('rect') && !event.target.closest('g')) {
    selectBlock(null);
  }
  if (!store.isDrawing) return;
  const { x, y } = hoverPoint.value;
  addPoint({ x, y }, event.ctrlKey);
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape' && store.isDrawing) {
    endDrawing();
  }
  selectBlock(null);
};

const endDrawing = () => {
  store.lines.push({
    id: Date.now(),
    type: store.lineType,
    color: store.lineColor,
    pathData: store.currentLine.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '),
    points: [...store.currentLine]
  });
  store.currentLine = [];
  stopDrawing();
  clearAxes();
};

const pan = (event) => {
  if (!panning) return;
  const dx = event.clientX - panStart.x;
  const dy = event.clientY - panStart.y;
  panStart = { x: event.clientX, y: event.clientY };

  viewBox.x -= dx / zoomLevel.value;
  viewBox.y -= dy / zoomLevel.value;
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

const zoom = (event) => {
  event.preventDefault();
  const { offsetX, offsetY, deltaY } = event;
  const { width, height } = svg.value.getBoundingClientRect();
  const zoomDirection = deltaY > 0 ? -1 : 1;
  const newZoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, zoomLevel.value + zoomDirection * zoomFactor));
  if (newZoomLevel === zoomLevel.value) return;
  zoomLevel.value = newZoomLevel;
  const scale = zoomDirection * zoomFactor * zoomLevel.value;
  const newWidth = viewBox.width * (1 - scale);
  const newHeight = viewBox.height * (1 - scale);
  viewBox.x += (offsetX / width) * viewBox.width * scale;
  viewBox.y += (offsetY / height) * viewBox.height * scale;
  viewBox.width = newWidth;
  viewBox.height = newHeight;
};

const getSVGCoordinates = (event) => {
  const { left, top, width, height } = svg.value.getBoundingClientRect();
  return {
    x: ((event.clientX - left) / width) * viewBox.width + viewBox.x,
    y: ((event.clientY - top) / height) * viewBox.height + viewBox.y
  };
};

const initSVG = () => {
  resizeSVG();
  const { clientWidth, clientHeight } = svg.value;
  viewBox.width = clientWidth;
  viewBox.height = clientHeight;
};

const resizeSVG = () => {
  const container = getClosestVContainer();
  if (container) {
    const containerPaddingLeft = parseFloat(window.getComputedStyle(container).paddingLeft);
    svg.value.setAttribute('width', container.clientWidth);
    svg.value.setAttribute('height', container.clientHeight);
    svg.value.style.left = `${-containerPaddingLeft}px`;
    viewBox.width = container.clientWidth;
    viewBox.height = container.clientHeight;
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
  deserializeState(drawing);
  initSVG();
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
