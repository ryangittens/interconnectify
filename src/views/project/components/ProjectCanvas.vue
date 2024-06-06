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
      <!-- Draw lines first -->
      <g ref="linesContainer"></g>

      <!-- Draw blocks -->
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
          :stroke="isSelected(block) ? primary : 'black'"
          :stroke-width="isSelected(block) ? 2 : 1"
        />
        <g v-else v-html="block.content"></g>

        <!-- Render connection points after lines and blocks -->
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
  </div>
  <h2>{{ store.blocks.length }}</h2>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue';
import { useSvgStore } from '@/stores/drawing';

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const svg = ref(null);
const linesContainer = ref(null);
const canvasContainer = ref(null);
const isDrawing = ref(false);
const hoverPoint = ref(null); // Store the hover point
const store = useSvgStore();

const { addBlock, selectBlock, moveBlock, deleteBlock, startDrawing, stopDrawing, addLinePoint, setLineType, setLineColor } = store;

const viewBox = reactive({ x: 0, y: 0, width: 0, height: 0 }); // Initial viewBox
let panStart = { x: 0, y: 0 };
let dragStart = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
let panning = false;
let dragging = false;
let drawingWire = false;
const wireStart = ref(null);
const wireEnd = ref(null);
const zoomLevel = ref(1);
const zoomFactor = 0.04;
const minZoomLevel = 0.02;
const maxZoomLevel = 1.5;
const gridSize = 20; // Define grid size

const isSelected = (block) => {
  return store.selectedBlock && store.selectedBlock.id === block.id;
};

const createSVGElement = (tag, attrs) => {
  const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (let attr in attrs) {
    elem.setAttribute(attr, attrs[attr]);
  }
  return elem;
};

const snapToGrid = (x, y) => {
  return {
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize
  };
};

const drawAllLines = () => {
  linesContainer.value.innerHTML = ''; // Clear the lines container

  // Draw all completed lines
  store.lines.forEach((line) => {
    const pathData = line.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

    const path = createSVGElement('path', {
      d: pathData,
      stroke: line.color,
      'stroke-width': 2,
      'stroke-dasharray': line.type === 'dashed' ? '5, 5' : 'none',
      fill: 'none'
    });

    linesContainer.value.appendChild(path);
  });
};

const drawCurrentLine = () => {
  if (store.currentLine.length > 0) {
    const pathData = store.currentLine.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

    const path = createSVGElement('path', {
      d: pathData,
      stroke: store.lineColor,
      'stroke-width': 2,
      'stroke-dasharray': store.lineType === 'dashed' ? '5, 5' : 'none',
      fill: 'none'
    });

    linesContainer.value.appendChild(path);
  }
};

const drawHoverLine = (x, y, ctrlKey) => {
  if (store.currentLine.length > 0) {
    const lastPoint = store.currentLine[store.currentLine.length - 1];

    if (!ctrlKey) {
      const dx = Math.abs(x - lastPoint.x);
      const dy = Math.abs(y - lastPoint.y);
      if (dx > dy) {
        y = lastPoint.y;
      } else {
        x = lastPoint.x;
      }
    }

    const snappedPoint = snapToGrid(x, y);
    hoverPoint.value = snappedPoint; // Store the hover point

    drawAllLines(); // Redraw all existing lines
    drawCurrentLine(); // Redraw the current line

    const pathData = `M ${lastPoint.x} ${lastPoint.y} L ${snappedPoint.x} ${snappedPoint.y}`;

    const path = createSVGElement('path', {
      d: pathData,
      stroke: store.lineColor,
      'stroke-width': 2,
      'stroke-dasharray': store.lineType === 'dashed' ? '5, 5' : 'none',
      fill: 'none'
    });

    linesContainer.value.appendChild(path);
  }
};

const addPoint = (point, ctrlKey) => {
  const lastPoint = store.currentLine[store.currentLine.length - 1];
  if (lastPoint) {
    let { x, y } = point;
    if (!ctrlKey) {
      const dx = Math.abs(x - lastPoint.x);
      const dy = Math.abs(y - lastPoint.y);
      if (dx > dy) {
        y = lastPoint.y;
      } else {
        x = lastPoint.x;
      }
    }
    const snappedPoint = snapToGrid(x, y);
    store.currentLine.push(snappedPoint);
  } else {
    const snappedPoint = snapToGrid(point.x, point.y);
    store.currentLine.push(snappedPoint);
  }
  drawAllLines();
  drawCurrentLine();
};

const handleMouseMove = (event) => {
  if (store.isDrawing) {
    const coords = getSVGCoordinates(event);
    hoverPoint.value = coords; // Update the hover point to the current coordinates
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

const endInteraction = (event) => {
  panning = false;
  dragging = false;
};

const handleBlockMouseDown = (block, event) => {
  selectBlock(block);
  startInteraction(event);
};

const handleSvgClick = (event) => {
  // Deselect block if clicking outside any block
  if (!event.target.closest('rect') && !event.target.closest('g')) {
    selectBlock(null);
  }
  if (!store.isDrawing) return;
  // Add the last hover point to the current line
  const { x, y } = hoverPoint.value;
  addPoint({ x, y }, event.ctrlKey);
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape' && store.isDrawing) {
    endDrawing();
  }
};

const endDrawing = () => {
  store.lines.push({
    type: store.lineType,
    color: store.lineColor,
    points: [...store.currentLine]
  });
  store.currentLine = [];
  store.stopDrawing(); // Stop drawing on Escape key press
  drawAllLines();
};

const startWire = (cp, block, event) => {
  const cpX = block.x + cp.x;
  const cpY = block.y + cp.y;
  const point = {
    x: cpX,
    y: cpY
  };
  const snappedPoint = snapToGrid(point.x, point.y);
  if (store.isDrawing) {
    if (drawingWire) {
      addPoint(snappedPoint, event.ctrlKey);
      wireEnd.value = { block, cp };
      finishWire();
    } else {
      addPoint(snappedPoint, event.ctrlKey);
      wireStart.value = { block, cp };
      drawingWire = true;
    }
  }
};

const finishWire = () => {
  if (wireStart.value && wireEnd.value) {
    const start = wireStart.value;
    const end = wireEnd.value;

    wireStart.value = null;
    wireEnd.value = null;
    drawingWire = false;

    // Redraw all lines
    endDrawing();
  }
};

const startMove = (event) => {
  if (store.selectedBlock) {
    isDragging.value = true;
    dragStart.value = { x: event.clientX, y: event.clientY };
  }
};

const endMove = () => {
  isDragging.value = false;
};

const deselectBlock = () => {
  store.selectedBlock = null;
};

const deleteSelectedBlock = () => {
  if (store.selectedBlock) {
    deleteBlock(store.selectedBlock);
  }
};

const startPan = (event) => {
  panStart = { x: event.clientX, y: event.clientY };
  panning = true;
};

const pan = (event) => {
  if (!panning) return;
  const dx = event.clientX - panStart.x;
  const dy = event.clientY - panStart.y;
  panStart = { x: event.clientX, y: event.clientY };

  viewBox.x -= dx / zoomLevel.value;
  viewBox.y -= dy / zoomLevel.value;
};

const endPan = () => {
  panning = false;
};

const zoom = (event) => {
  event.preventDefault();
  const { offsetX, offsetY, deltaY } = event;
  const { width, height } = svg.value.getBoundingClientRect();

  const zoomDirection = deltaY > 0 ? -1 : 1;
  const newZoomLevel = zoomLevel.value + zoomDirection * zoomFactor;
  if (newZoomLevel < minZoomLevel || newZoomLevel > maxZoomLevel) {
    return;
  }
  zoomLevel.value = newZoomLevel;

  const scale = zoomDirection * zoomFactor * zoomLevel.value;
  const newWidth = viewBox.width * (1 - scale);
  const newHeight = viewBox.height * (1 - scale);
  const newX = viewBox.x + (offsetX / width) * viewBox.width * scale;
  const newY = viewBox.y + (offsetY / height) * viewBox.height * scale;
  viewBox.x = newX;
  viewBox.y = newY;
  viewBox.width = newWidth;
  viewBox.height = newHeight;
};

const getSVGCoordinates = (event) => {
  const { left, top, width, height } = svg.value.getBoundingClientRect();
  const x = ((event.clientX - left) / width) * viewBox.width + viewBox.x;
  const y = ((event.clientY - top) / height) * viewBox.height + viewBox.y;
  return { x, y };
};

const initSVG = () => {
  resizeSVG();
  // Initialize the viewBox with the size of the SVG
  const { clientWidth, clientHeight } = svg.value;
  viewBox.width = clientWidth;
  viewBox.height = clientHeight;
};

const resizeSVG = () => {
  const container = getClosestVContainer();
  if (container) {
    const containerStyle = window.getComputedStyle(container);
    const containerPaddingLeft = parseFloat(containerStyle.paddingLeft);
    svg.value.setAttribute('width', container.clientWidth);
    svg.value.setAttribute('height', container.clientHeight);
    svg.value.style.left = `${-containerPaddingLeft}px`;
    // Update the viewBox dimensions
    viewBox.width = container.clientWidth;
    viewBox.height = container.clientHeight;
  }
};

const getClosestVContainer = () => {
  let element = svg.value;
  while (element) {
    if (element.classList.contains('v-container')) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
};

onMounted(() => {
  initSVG();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', resizeSVG);
  svg.value.addEventListener('mousemove', handleMouseMove);
  svg.value.addEventListener('mousedown', startInteraction);
  svg.value.addEventListener('mousemove', pan);
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
  svg.value.removeEventListener('mousemove', pan);
  svg.value.removeEventListener('mouseup', endInteraction);
  svg.value.removeEventListener('mouseleave', endInteraction);
  svg.value.removeEventListener('wheel', zoom);
  svg.value.removeEventListener('click', handleSvgClick);
});

watch(() => store.lineColor, drawAllLines);
watch(() => store.lineType, drawAllLines);
watch(() => store.isDrawing, drawAllLines);
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
}
.drawing-svg {
  position: absolute;
  top: -42px;
  height: calc(100vh - 160px);
}
.drawing-svg:active {
  cursor: grabbing;
}
</style>
