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
      @mouseup="endCanvasInteraction($event)"
      @wheel="zoom"
      @dblclick="handleDoubleClick"
    >
      <g ref="axesContainer"></g>
      <GridLines />

      <!-- Pass a ref to the Lines component -->
      <Lines ref="linesRef" />
      <Blocks @startWire="handleStartWire" />
      <RectangleTool />
      <ConnectionPointsTool />
      <TextTool />
    </svg>
    <BottomSection :project="props.project" @update:project="emitUpdateProject" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { useHistoryStore } from '@/stores/history';
import { useCustomizerStore } from '@/stores/customizer';

import BottomSection from './BottomSection.vue';
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
  AddRectangleCommand,
  MoveRectangleCommand,
  MoveConnectionPointCommand,
  MoveTextCommand
} from '@/commands';

const store = useSvgStore();
const customizer = useCustomizerStore();
const historyStore = useHistoryStore();

const props = defineProps({
  project: Object || null,
  mode: String || null
});

const emit = defineEmits(['update:isOpen', 'update:project']);

const drawing = props.project?.drawing;

const svg = ref(null);

const axesContainer = ref(null);

// Reference to the Lines component
const linesRef = ref(null);

// Local variables for line drawing
let isPanning = false;
let panStart = { x: 0, y: 0 };
let viewBoxStart = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
let animationFrameId = null;
const zoomFactor = 0.04;

function endCanvasInteraction(event) {
  if (isPanning) {
    isPanning = false;
    const viewBoxValues = svg.value.getAttribute('viewBox').split(' ').map(parseFloat);
    store.viewBox.x = viewBoxValues[0];
    store.viewBox.y = viewBoxValues[1];
  } else if (store.isDraggingLineSegment) {
    linesRef.value.handleLineMouseUp(event);
  }
  endInteraction();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

/* SETUP */

const {
  getSVGCoordinates,

  snapToGrid,
  deleteObject,
  endInteraction,
  maxZoomLevel,
  minZoomLevel
} = store;

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
  store.setSvgElement(svg.value);
  store.setAxesContainer(axesContainer.value);
  store.deserializeState(drawing);
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
  }
};

onMounted(() => {
  customizer.CLOSE_SIDEBAR();

  const sidebarElement = document.querySelector('.leftSidebar'); // Replace with actual selector

  const onTransitionEnd = () => {
    initSVG();

    // Remove the event listener after it's called
    sidebarElement.removeEventListener('transitionend', onTransitionEnd);
  };

  if (sidebarElement) {
    sidebarElement.addEventListener('transitionend', onTransitionEnd);
  }
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', resizeSVG);
  svg.value.addEventListener('mousemove', handleMouseMove);
  svg.value.addEventListener('mousedown', startInteraction);
  svg.value.addEventListener('mouseup', endCanvasInteraction);
  svg.value.addEventListener('mouseleave', endCanvasInteraction);
  svg.value.addEventListener('wheel', zoom);
  svg.value.addEventListener('click', handleSvgClick);
  window.addEventListener('beforeunload', beforeUnloadHandler);
  svg.value.addEventListener('dblclick', handleDoubleClick);
});

onBeforeUnmount(() => {
  customizer.OPEN_SIDEBAR();
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', resizeSVG);
  svg.value.removeEventListener('mousemove', handleMouseMove);
  svg.value.removeEventListener('mousedown', startInteraction);
  svg.value.removeEventListener('mouseup', endCanvasInteraction);
  svg.value.removeEventListener('mouseleave', endCanvasInteraction);
  svg.value.removeEventListener('wheel', zoom);
  svg.value.removeEventListener('click', handleSvgClick);
  window.removeEventListener('beforeunload', beforeUnloadHandler);
  svg.value.removeEventListener('dblclick', handleDoubleClick);
});

/* COMMON */
const beforeUnloadHandler = (event) => {
  if (!historyStore.saved) {
    event.preventDefault();
    event.returnValue = '';
  }
};

const handleDoubleClick = (event) => {
  if (store.isDrawing) {
    endDrawing();
  }
};

const handleStartWire = ({ cp, block, event }) => {
  if (!store.isDrawing) return;
  linesRef.value.startWire(cp, block, event);
};

const handleMouseMove = (event) => {
  handleBlockMouseMove(event);
  handleRectangleMouseMove(event);
  handleLineMouseMove(event);
  handleConnectionPointsMouseMove(event);
  handleTextMouseMove(event);

  if (store.isDrawing) {
    const coords = getSVGCoordinates(event);
    linesRef.value.setHoverLine(coords.x, coords.y, event.ctrlKey);
  } else if (store.dragging && store.movingBlock) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - initialBlockPosition.x;
    const dy = coords.y - initialBlockPosition.y;
    const snappedCoords = store.snapToGrid(initialBlockPosition.x + dx, initialBlockPosition.y + dy);

    store.moveBlock(store.movingBlock, snappedCoords.x - store.movingBlock.x, snappedCoords.y - store.movingBlock.y, store);
  } else if (store.dragging && store.selectedLineSegment) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - store.dragStart.x;
    const dy = coords.y - store.dragStart.y;
    store.dragSegment(store.selectedLineSegment, dx, dy);
  } else if (store.activeTool == 'rectangle' && store.isCreatingRectangle) {
    updateRectangle(event);
  } else if (store.dragging && store.movingRect) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - initialBlockPosition.x;
    const dy = coords.y - initialBlockPosition.y;
    const snappedCoords = store.snapToGrid(store.initialRectPosition.x + dx, store.initialRectPosition.y + dy);
    store.moveRect(store.movingRect, snappedCoords.x - store.movingRect.x, snappedCoords.y - store.movingRect.y, store);
  } else if (store.dragging && store.movingCP) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - initialBlockPosition.x;
    const dy = coords.y - initialBlockPosition.y;
    const snappedCoords = store.snapToGrid(store.initialCPPosition.x + dx, store.initialCPPosition.y + dy);
    store.moveCP(store.movingCP, snappedCoords.x - store.movingCP.x, snappedCoords.y - store.movingCP.y, store);
  } else if (store.dragging && store.movingText) {
    const coords = getSVGCoordinates(event);
    const dx = coords.x - initialBlockPosition.x;
    const dy = coords.y - initialBlockPosition.y;
    const snappedCoords = store.snapToGrid(store.initialTextPosition.x + dx, store.initialTextPosition.y + dy);
    store.moveText(store.movingText, snappedCoords.x - store.movingText.x, snappedCoords.y - store.movingText.y, store);
  } else if (isPanning) {
    const dx = (event.clientX - panStart.x) / store.zoomLevel;
    const dy = (event.clientY - panStart.y) / store.zoomLevel;

    const newViewBoxX = viewBoxStart.x - dx;
    const newViewBoxY = viewBoxStart.y - dy;

    // Cancel any pending animation frame
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    // Schedule the viewBox update
    animationFrameId = requestAnimationFrame(() => {
      svg.value.setAttribute('viewBox', `${newViewBoxX} ${newViewBoxY} ${store.viewBox.width} ${store.viewBox.height}`);
    });
  }
};

const startInteraction = (event) => {
  const coords = getSVGCoordinates(event);
  if (store.movingBlock) {
    store.dragStart = coords;
    if (store.droppedFragment) {
      initialBlockPosition = coords;
    } else {
      initialBlockPosition = { ...store.movingBlock };
    }

    store.dragging = true;
    //Initialize MoveBlockCommand
    if (!store.droppedBlock) {
      store.currentMoveBlockCommand = new MoveBlockCommand(store.movingBlock, 0, 0, store);
    }
  } else if (store.movingRect) {
    store.dragStart = coords;
    store.initialRectPosition = { ...store.movingRect };

    store.dragging = true;
    // Initialize MoveBlockCommand
    // if (!store.droppedRect) {
    //   store.currentMoveRectCommand = new MoveRectangleCommand(store.movingRect, 0, 0, store);
    // }
  } else if (store.movingCP) {
    store.dragStart = coords;
    store.initialCPPosition = { ...store.movingCP };

    store.dragging = true;
    // Initialize MoveBlockCommand
    // if (!store.droppedCP) {
    //   store.currentMoveCPCommand = new MoveConnectionPointCommand(store.movingCP, 0, 0, store);
    // }
  } else if (store.movingText) {
    store.dragStart = coords;
    store.initialTextPosition = { ...store.movingText };

    store.dragging = true;
    // Initialize MoveBlockCommand
    if (!store.droppedText) {
      store.currentMoveTextCommand = new MoveTextCommand(store.movingText, 0, 0, store);
    }
  } else if (store.selectedLineSegment) {
    store.dragStart = coords;
    store.dragging = true;

    // Initialize DragLineSegmentCommand
    const originalPoints = store.selectedLineSegment.line.points.map((point) => ({ ...point }));
    store.currentDragLineSegmentCommand = new DragLineSegmentCommand(store.selectedLineSegment.line, originalPoints, originalPoints, store);
  } else if (store.activeTool == 'rectangle') {
    //startRectangle(event);
  } else if (!store.dragging && !store.isDrawing && !store.activeTool) {
    isPanning = true;
    panStart = { x: event.clientX, y: event.clientY };
    viewBoxStart = { x: store.viewBox.x, y: store.viewBox.y };
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
        store.startBlockMove(store.mouseDownBlock, event);
        startInteraction(event);
      }
    }
  }
};

const handleRectangleMouseMove = (event) => {
  if (store.mouseDown) {
    if (!store.isRectDragging) {
      if (store.mouseDownRect) {
        // If dragging hasn't started yet, start it now
        store.isRectDragging = true;
        store.isDragging = true;
        store.startRectMove(store.mouseDownRect, event);
        startInteraction(event);
      }
    }
  }
};

const handleTextMouseMove = (event) => {
  if (store.mouseDown) {
    if (!store.isTextDragging) {
      if (store.mouseDownText) {
        // If dragging hasn't started yet, start it now
        store.isTextDragging = true;
        store.isDragging = true;
        store.startTextMove(store.mouseDownText, event);
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
        store.startLineDrag(store.mouseDownLine, event);
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
  } else if (store.mouseDown) {
    if (!store.isCPDragging) {
      if (store.mouseDownCP) {
        // If dragging hasn't started yet, start it now
        store.isCPDragging = true;
        store.isDragging = true;
        store.startCPMove(store.mouseDownCP, event);
        startInteraction(event);
      }
    }
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

// Function to handle hover line is moved to Lines.vue

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

// Function to handle drawing logic locally
const handleSvgClick = (event) => {
  if (store.activeTool === 'line') {
    linesRef.value.handleSvgClickLineDrawing(event);
  } else {
    store.handleSvgClick(event);
  }
};

const endDrawing = () => {
  if (store.isDrawing) {
    linesRef.value.endLineDrawing();
  }
  store.endDrawing();
};

// Emit updated project to parent
const emitUpdateProject = (updatedProject) => {
  emit('update:project', updatedProject);
};
</script>

<style scoped>
.canvas-container {
  position: relative;
  width: 100%;
  margin-top: -42px;
  height: calc(100vh - 110px);
}
.drawing-svg {
  height: 100%;
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
