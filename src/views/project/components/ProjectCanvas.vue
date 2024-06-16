<template>
  <div ref="canvasContainer" class="canvas-container">
    <InfoPanel />
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
      <!-- Grid Lines -->
      <g v-if="store.showGrid" class="grid-container">
        <line
          v-for="x in Math.ceil(store.viewBox.width / gridSize) + 1"
          :key="'x' + x"
          :x1="store.viewBox.x + x * gridSize - (store.viewBox.x % gridSize)"
          :y1="store.viewBox.y"
          :x2="store.viewBox.x + x * gridSize - (store.viewBox.x % gridSize)"
          :y2="store.viewBox.y + store.viewBox.height"
          stroke="lightgray"
          stroke-width="0.5"
        />
        <line
          v-for="y in Math.ceil(store.viewBox.height / gridSize) + 1"
          :key="'y' + y"
          :x1="store.viewBox.x"
          :y1="store.viewBox.y + y * gridSize - (store.viewBox.y % gridSize)"
          :x2="store.viewBox.x + store.viewBox.width"
          :y2="store.viewBox.y + y * gridSize - (store.viewBox.y % gridSize)"
          stroke="lightgray"
          stroke-width="0.5"
        />
      </g>
      <g ref="axesContainer"></g>
      <g ref="linesContainer">
        <path
          v-for="line in store.lines"
          :key="line.id"
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

      <g
        v-for="block in store.blocks"
        :key="block.id"
        :transform="`translate(${block.x}, ${block.y})`"
        @mousedown.stop="handleBlockMouseDown(block, $event)"
        @mouseup="handleBlockMouseUp(block, $event)"
        @click="handleBlockClick(block)"
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
          style="cursor: crosshair"
        />
      </g>
    </svg>
    <ConductorSchedule />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { useHistoryStore } from '@/stores/history';

import ConductorSchedule from './ConductorSchedule.vue';
import InfoPanel from './InfoPanel.vue';

import { StopDrawingCommand, AddLinePointCommand, MoveBlockCommand, DragLineSegmentCommand } from '@/commands';

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

const {
  getSVGCoordinates,
  startLineDrag,
  deserializeState,
  selectBlock,
  stopDrawing,
  selectLine,
  setSvgElement,
  initializeViewBox,
  dragSegment,
  snapToGrid,
  moveBlock,
  endLineDrag,
  clearInteractionStore,
  deleteObject,
  startBlockMove
} = store;

let panStart = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
let panning = false;
const zoomFactor = 0.04;
const minZoomLevel = 0.5;
const maxZoomLevel = 2;
const gridSize = 20;
const mouseDown = ref(false);
const mouseDownLine = ref(null);
const mouseDownBlock = ref(null);
const isDragging = ref(false);
const isLineDragging = ref(false);
const isBlockDragging = ref(false);

/* SETUP */

const pan = (event) => {
  if (!panning) return;
  const dx = (event.clientX - panStart.x) / store.zoomLevel;
  const dy = (event.clientY - panStart.y) / store.zoomLevel;
  panStart = { x: event.clientX, y: event.clientY };

  store.viewBox.x -= dx;
  store.viewBox.y -= dy;
};

const zoom = (event) => {
  event.preventDefault();
  // console.log('xoom levels', store.zoomLevel);
  const { offsetX, offsetY, deltaY } = event;
  const { width, height } = svg.value.getBoundingClientRect();

  // Determine the new zoom level
  const zoomDirection = deltaY > 0 ? -1 : 1;
  const newZoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, store.zoomLevel * (1 + zoomDirection * zoomFactor)));
  if (newZoomLevel === store.zoomLevel) return;

  // Calculate the new viewBox dimensions based on the new zoom level
  const newWidth = store.initialViewBox.width / newZoomLevel;
  const newHeight = store.initialViewBox.height / newZoomLevel;

  // Calculate the new viewBox position to keep the mouse position fixed
  const newX = store.viewBox.x + (offsetX / width) * (store.viewBox.width - newWidth);
  const newY = store.viewBox.y + (offsetY / height) * (store.viewBox.height - newHeight);

  // Update the zoom level and viewBox in the store
  store.zoomLevel = newZoomLevel;
  store.setViewBox(newX, newY, newWidth, newHeight);
};

const initSVG = () => {
  const container = svg.value.parentElement;
  const { clientWidth, clientHeight } = container;
  store.setViewBox(0, 0, clientWidth, clientHeight);
  svg.value.setAttribute('width', clientWidth);
  svg.value.setAttribute('height', clientHeight);
  setSvgElement(svg.value);
  deserializeState(drawing);
  store.renderGrid();
};

const resizeSVG = () => {
  const container = svg.value.parentElement;
  if (container) {
    const containerPaddingLeft = parseFloat(window.getComputedStyle(container).paddingLeft);
    svg.value.setAttribute('width', container.clientWidth);
    svg.value.setAttribute('height', container.clientHeight);
    svg.value.style.left = `${-containerPaddingLeft}px`;
    store.setViewBox(0, 0, container.clientWidth, container.clientHeight);
    store.renderGrid();
  }
};

onMounted(() => {
  initSVG();
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', resizeSVG);
  svg.value.addEventListener('mousemove', handleMouseMove);
  svg.value.addEventListener('mousedown', startInteraction);
  svg.value.addEventListener('mouseup', endInteraction);
  svg.value.addEventListener('mouseleave', endInteraction);
  svg.value.addEventListener('wheel', zoom);
  svg.value.addEventListener('click', handleSvgClick);
  window.addEventListener('beforeunload', beforeUnloadHandler);
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
  window.removeEventListener('beforeunload', beforeUnloadHandler);
});

/* COMMON */
const beforeUnloadHandler = (event) => {
  if (!historyStore.saved) {
    event.preventDefault();
    event.returnValue = '';
  }
};

const handleMouseMove = (event) => {
  handleBlockMouseMove(event);
  handleLineMouseMove(event);
  if (store.isDrawing) {
    const coords = getSVGCoordinates(event);
    hoverPoint.value = coords;
    drawHoverLine(coords.x, coords.y, event.ctrlKey);
  } else if (panning && !store.movingBlock) {
    pan(event);
  } else if (store.dragging && store.movingBlock) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - store.dragStart.x;
    const dy = coords.y - store.dragStart.y;
    const snappedCoords = snapToGrid(initialBlockPosition.x + dx, initialBlockPosition.y + dy);

    moveBlock(store.movingBlock, snappedCoords.x - store.movingBlock.x, snappedCoords.y - store.movingBlock.y, store);
  } else if (store.dragging && store.selectedLineSegment) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - store.dragStart.x;
    const dy = coords.y - store.dragStart.y;
    dragSegment(store.selectedLineSegment, dx, dy);
    //store.dragStart = coords; // Update drag start for smooth dragging
  }
};

const startInteraction = (event) => {
  const coords = getSVGCoordinates(event);
  if (store.movingBlock) {
    store.dragStart = coords;
    initialBlockPosition = { ...store.movingBlock };
    store.dragging = true;

    // Initialize MoveBlockCommand
    store.currentMoveBlockCommand = new MoveBlockCommand(store.movingBlock, 0, 0, store);
  } else if (store.selectedLineSegment) {
    store.dragStart = coords;
    store.dragging = true;

    // Initialize DragLineSegmentCommand
    const originalPoints = store.selectedLineSegment.line.points.map((point) => ({ ...point }));
    store.currentDragLineSegmentCommand = new DragLineSegmentCommand(store.selectedLineSegment.line, originalPoints, originalPoints, store);
  } else {
    panStart = { x: event.clientX, y: event.clientY };
    panning = true;
  }
};

const endInteraction = () => {
  panning = false;
  endLineDrag();

  // Finalize MoveBlockCommand and execute
  if (store.currentMoveBlockCommand) {
    const dx = store.movingBlock.x - store.currentMoveBlockCommand.originalBlockPosition.x;
    const dy = store.movingBlock.y - store.currentMoveBlockCommand.originalBlockPosition.y;
    store.currentMoveBlockCommand.dx = dx;
    store.currentMoveBlockCommand.dy = dy;
    store.currentMoveBlockCommand.execute();
    historyStore.executeCommand(store.currentMoveBlockCommand);
    store.currentMoveBlockCommand = null;
  }

  clearInteractionStore();
};

const handleSvgClick = (event) => {
  if (!event.target.closest('rect') && !event.target.closest('g')) {
    selectBlock(null);
  }
  if (!store.isDrawing) return;
  const coords = getSVGCoordinates(event);
  addPoint(coords, event.ctrlKey);
};

/* BLOCKS */

const handleBlockMouseDown = (block, event) => {
  mouseDown.value = true; // Set mouseDown flag to true
  mouseDownBlock.value = block; // Store the line being dragged
  isBlockDragging.value = false; // Reset dragging flag
};

const handleBlockMouseMove = (event) => {
  if (mouseDown.value) {
    if (!isBlockDragging.value) {
      if (mouseDownBlock.value) {
        // If dragging hasn't started yet, start it now
        isBlockDragging.value = true;
        isDragging.value = true;
        startBlockMove(mouseDownBlock.value, event);
        startInteraction(event);
      }
    }
  }
};

const handleBlockMouseUp = (block, event) => {
  if (!isBlockDragging.value) {
    // It's a click event, not a drag
    //handleBlockClick(block);
  }
  endInteraction(event);
  mouseDown.value = false; // Reset mouseDown flag
  mouseDownLine.value = null; // Reset the line being dragged
};

const handleBlockClick = (block) => {
  selectBlock(block);
};

const isBlockSelected = (block) => store.selectedBlock && store.selectedBlock.id === block.id;

/* WIRES/LINES */

const handleLineMouseDown = (line, event) => {
  mouseDown.value = true; // Set mouseDown flag to true
  mouseDownLine.value = line; // Store the line being dragged
  isLineDragging.value = false; // Reset dragging flag
};

const handleLineMouseMove = (event) => {
  if (mouseDown.value) {
    if (!isLineDragging.value) {
      if (mouseDownLine.value) {
        // If dragging hasn't started yet, start it now
        isLineDragging.value = true;
        isDragging.value = true;
        startLineDrag(mouseDownLine.value, event);
        startInteraction(event);
      }
    }
  }
};

const handleLineMouseUp = (line, event) => {
  if (!isLineDragging.value) {
    // It's a click event, not a drag
    //handleLineClick(line);
  } else {
    // If it was a drag, end the drag interaction
    endLineDrag(line, event);
  }
  endInteraction(event);
  mouseDown.value = false; // Reset mouseDown flag
  mouseDownLine.value = null; // Reset the line being dragged
};

const handleLineClick = (line) => {
  selectLine(line);
};

const drawAxes = (snappedPoint) => {
  axesContainer.value.innerHTML = '';
  const { x, y } = snappedPoint;
  const { x: viewBoxX, y: viewBoxY, width, height } = store.viewBox;

  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', x);
  xAxis.setAttribute('y1', viewBoxY - height); // Extend beyond the top of the viewport
  xAxis.setAttribute('x2', x);
  xAxis.setAttribute('y2', viewBoxY + 2 * height); // Extend beyond the bottom of the viewport
  xAxis.setAttribute('stroke', 'rgba(255, 0, 0, 0.5)');
  xAxis.setAttribute('stroke-width', 1);
  xAxis.setAttribute('stroke-dasharray', '5,5');

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', viewBoxX - width); // Extend beyond the left of the viewport
  yAxis.setAttribute('y1', y);
  yAxis.setAttribute('x2', viewBoxX + 2 * width); // Extend beyond the right of the viewport
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
  const updatedPoint = { ...point, ...snappedPoint };
  historyStore.executeCommand(new AddLinePointCommand(store, updatedPoint));
};

const handleKeyDown = (event) => {
  if (event.key === 'Escape' && store.isDrawing) {
    endDrawing();
  }

  switch (event.key) {
    case 'z':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        historyStore.undo();
      }
      break;
    case 'y':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        historyStore.redo();
      }
      break;
    case 'Delete':
      deleteObject();
      break;
    case 'Escape':
      if (event.key === 'Escape') {
        endDrawing();
        break;
      }
  }
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
    if (drawingWire.value) {
      wireEnd.value = { block, cp };
      const endPoint = {
        x: wireEnd.value.block.x + wireEnd.value.cp.x,
        y: wireEnd.value.block.y + wireEnd.value.cp.y,
        blockId: wireEnd.value.block.id,
        connectionPointId: wireEnd.value.cp.id
      };
      addPoint(endPoint, event.ctrlKey);
      finishWire();
    } else {
      drawingWire.value = true;
      wireStart.value = { block, cp };
      const startPoint = {
        x: wireStart.value.block.x + wireStart.value.cp.x,
        y: wireStart.value.block.y + wireStart.value.cp.y,
        blockId: wireStart.value.block.id,
        connectionPointId: wireStart.value.cp.id
      };
      addPoint(startPoint, event.ctrlKey);
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
