<template>
  <div ref="canvasContainer" class="canvas-container">
    <svg
      ref="svg"
      class="drawing-svg"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`"
      @mousedown="startPan"
      @mousemove="handleMouseMove"
      @mouseup="endPan"
      @mouseleave="endPan"
      @wheel="zoom"
      @click="handleSvgClick"
    >
      <!-- Draw blocks -->
      <g
        v-for="block in store.blocks"
        :key="block.id"
        :transform="`translate(${block.x}, ${block.y})`"
        @click.stop="handleBlockClick(block)"
      >
        <rect
          :x="0"
          :y="0"
          :width="block.width"
          :height="block.height"
          :fill="block.color"
          :stroke="isSelected(block) ? 'red' : 'black'"
          :stroke-width="isSelected(block) ? 2 : 1"
        />
      </g>

      <!-- Draw lines -->
      <g ref="linesContainer"></g>
    </svg>
  </div>
  <h2 v-for="block in store.blocks">hello {{ isSelected(block) }}</h2>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, computed } from 'vue';
import { useSvgStore } from '@/stores/drawing';

const svg = ref(null);
const linesContainer = ref(null);
const canvasContainer = ref(null);
const isDrawing = ref(false);
const hoverPoint = ref(null); // Store the hover point
const store = useSvgStore();

const { addBlock, selectBlock, moveBlock, deleteBlock, startDrawing, stopDrawing, addLinePoint, setLineType, setLineColor } = store;

const viewBox = reactive({ x: 0, y: 0, width: 0, height: 0 }); // Initial viewBox
let panStart = { x: 0, y: 0 };
let panning = false;
const zoomLevel = ref(1);
const zoomFactor = 0.1;

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

    hoverPoint.value = { x, y }; // Store the hover point

    drawAllLines(); // Redraw all existing lines
    drawCurrentLine(); // Redraw the current line

    const pathData = `M ${lastPoint.x} ${lastPoint.y} L ${x} ${y}`;

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
    store.currentLine.push({ x, y });
  } else {
    store.currentLine.push(point);
  }
  drawAllLines();
  drawCurrentLine();
};

const handleMouseMove = (event) => {
  if (store.isDrawing) {
    const coords = getSVGCoordinates(event);
    hoverPoint.value = coords; // Update the hover point to the current coordinates
    drawHoverLine(coords.x, coords.y, event.ctrlKey);
  }
};

const handleClick = (event) => {
  if (!store.isDrawing || !hoverPoint.value) return;
  // Add the last hover point to the current line
  const { x, y } = hoverPoint.value;
  addPoint({ x, y }, event.ctrlKey);
};

const handleBlockClick = (block) => {
  selectBlock(block);
};

const handleSvgClick = (event) => {
  // Deselect block if clicking outside any block
  if (!event.target.closest('rect')) {
    selectBlock(null);
  }
  if (!store.isDrawing || !hoverPoint.value) return;
  // Add the last hover point to the current line
  const { x, y } = hoverPoint.value;
  addPoint({ x, y }, event.ctrlKey);
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape' && store.isDrawing) {
    store.lines.push({
      type: store.lineType,
      color: store.lineColor,
      points: [...store.currentLine]
    });
    store.currentLine = [];
    store.stopDrawing(); // Stop drawing on Escape key press
    drawAllLines();
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
  zoomLevel.value += zoomDirection * zoomFactor;
  if (zoomLevel.value < 0.1) zoomLevel.value = 0.1;

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
  window.addEventListener('resize', resizeSVG);
  window.addEventListener('keydown', handleKeyDown);
  svg.value.addEventListener('mousemove', handleMouseMove);
  svg.value.addEventListener('mousedown', startPan);
  svg.value.addEventListener('mousemove', pan);
  svg.value.addEventListener('mouseup', endPan);
  svg.value.addEventListener('mouseleave', endPan);
  svg.value.addEventListener('wheel', zoom);
  svg.value.addEventListener('click', handleClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeSVG);
  window.removeEventListener('keydown', handleKeyDown);
  svg.value.removeEventListener('mousemove', handleMouseMove);
  svg.value.removeEventListener('mousedown', startPan);
  svg.value.removeEventListener('mousemove', pan);
  svg.value.removeEventListener('mouseup', endPan);
  svg.value.removeEventListener('mouseleave', endPan);
  svg.value.removeEventListener('wheel', zoom);
  svg.value.removeEventListener('click', handleClick);
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
  border: 1px solid #000;
  position: absolute;
  top: -42px;
  height: calc(100vh -160px);
}
.drawing-svg:active {
  cursor: grabbing;
}
</style>
