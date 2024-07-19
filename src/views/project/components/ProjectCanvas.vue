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
      @wheel="zoom"
    >
      <g ref="axesContainer"></g>
      <GridLines />

      <Lines />
      <Blocks />
      <RectangleTool />
      <ConnectionPointsTool />
      <TextTool />
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

import GridLines from './GridLines.vue';
import Blocks from './Blocks.vue';
import Lines from './Lines.vue';
import RectangleTool from './RectangleTool.vue';
import TextTool from './TextTool.vue';
import ConnectionPointsTool from './ConnectionPointsTool.vue';

import {
  StopDrawingCommand,
  AddLinePointCommand,
  MoveBlockCommand,
  DragLineSegmentCommand,
  AddTextCommand,
  AddRectangleCommand
} from '@/commands';

const store = useSvgStore();
const historyStore = useHistoryStore();

const props = defineProps({
  project: Object || null,
  mode: String || null
});

const drawing = props.project?.drawing;

const svg = ref(null);

const axesContainer = ref(null);

const {
  getSVGCoordinates,
  startLineDrag,
  deserializeState,
  selectBlock,
  stopDrawing,
  setSvgElement,
  setAxesContainer,
  dragSegment,
  snapToGrid,
  moveBlock,
  deleteObject,
  startBlockMove,
  endInteraction,
  addPoint,
  deselectAll,
  endDrawing,
  handleSvgClick
} = store;

let panStart = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
const zoomFactor = 0.04;
const minZoomLevel = 0.5;
const maxZoomLevel = 2;

/* SETUP */

const pan = (event) => {
  if (!store.panning) return;
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
  setAxesContainer(axesContainer.value);
  deserializeState(drawing);
  store.renderGrid();
  store.setMode(props.mode);
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
  handleConnectionPointsMouseMove(event);
  if (store.isDrawing) {
    const coords = getSVGCoordinates(event);
    store.hoverPoint = coords;
    drawHoverLine(coords.x, coords.y, event.ctrlKey);
  } else if (store.panning && !store.movingBlock) {
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
  } else if (store.activeTool == 'rectangle' && store.isCreatingRectangle) {
    updateRectangle(event);
  }
};

const startInteraction = (event) => {
  const coords = getSVGCoordinates(event);
  if (store.movingBlock) {
    store.dragStart = coords;
    initialBlockPosition = { ...store.movingBlock };
    store.dragging = true;
    // Initialize MoveBlockCommand
    if (!store.droppedBlock) {
      store.currentMoveBlockCommand = new MoveBlockCommand(store.movingBlock, 0, 0, store);
    }
  } else if (store.selectedLineSegment) {
    store.dragStart = coords;
    store.dragging = true;

    // Initialize DragLineSegmentCommand
    const originalPoints = store.selectedLineSegment.line.points.map((point) => ({ ...point }));
    store.currentDragLineSegmentCommand = new DragLineSegmentCommand(store.selectedLineSegment.line, originalPoints, originalPoints, store);
  } else if (store.activeTool == 'rectangle') {
    //startRectangle(event);
  } else {
    panStart = { x: event.clientX, y: event.clientY };
    store.panning = true;
  }
};

/* Mouse Moves */

const handleBlockMouseMove = (event) => {
  if (store.mouseDown) {
    if (!store.isBlockDragging) {
      if (store.mouseDownBlock) {
        // If dragging hasn't started yet, start it now
        store.isBlockDragging = true;
        store.isDragging = true;
        startBlockMove(store.mouseDownBlock, event);
        startInteraction(event);
      }
    }
  }
};

const handleLineMouseMove = (event) => {
  if (store.mouseDown) {
    if (!store.isLineDragging) {
      if (store.mouseDownLine) {
        // If dragging hasn't started yet, start it now
        store.isLineDragging = true;
        store.isDragging = true;
        startLineDrag(store.mouseDownLine, event);
        startInteraction(event);
      }
    }
  }
};

const handleConnectionPointsMouseMove = (event) => {
  if (store.isAddingConnectionPoint) {
    const coords = store.getSVGCoordinates(event);
    const snappedCoords = store.snapToGrid(coords.x, coords.y);
    store.currentPoint = snappedCoords;
  }
};

const updateRectangle = (event) => {
  if (store.isCreatingRectangle) {
    const coords = getSVGCoordinates(event);
    const snappedCoords = snapToGrid(coords.x, coords.y);
    store.updateCurrentRectangle(snappedCoords);
  }
};

const cancelRectangle = () => {
  store.cancelCreatingRectangle();
};

const drawAxes = (snappedPoint) => {
  store.axesContainer.innerHTML = '';
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

  store.axesContainer.appendChild(xAxis);
  store.axesContainer.appendChild(yAxis);
};

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
    store.hoverPoint = snappedPoint;
    drawAxes(snappedPoint);
  }
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
