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
      @wheel="handleWheel"
      @dblclick="handleDoubleClick"
    >
      <!-- Paper Space Group -->
      <g v-if="props.mode == 'project'" ref="paperSpaceGroup" :class="{ 'disabled-interactions': activeSpace !== 'paper' }">
        <!-- Paper Space Elements -->

        <PaperTitleBlock />
        <ConductorScheduleSvg :x="55" :y="65" />
      </g>
      <!-- Model Space Group -->
      <g ref="modelSpaceGroup" :transform="modelSpaceTransform" :class="{ 'disabled-interactions': activeSpace !== 'model' }">
        <g ref="axesContainer"></g>
        <GridLines :viewBox="modelViewBox" />
        <RectangleTool />
        <Blocks @startWire="handleStartWire" />
        <Lines ref="linesRef" />
        <ConnectionPointsTool />
        <TextTool />
      </g>
    </svg>
    <BottomSection :project="props.project" @update:project="emitUpdateProject" @update:view="updateModelViewBox" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { useHistoryStore } from '@/stores/history';
import { useCustomizerStore } from '@/stores/customizer';
import { throttle } from 'lodash';

import BottomSection from './BottomSection.vue';
import InfoPanel from './InfoPanel.vue';
import ConductorScheduleSvg from './ConductorScheduleSvg.vue';

import GridLines from './GridLines.vue';
import Blocks from './Blocks.vue';
import Lines from './Lines.vue';
import RectangleTool from './RectangleTool.vue';
import TextTool from './TextTool.vue';
import ConnectionPointsTool from './ConnectionPointsTool.vue';
import PaperTitleBlock from './PaperTitleBlock.vue'; // New component

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

const pageOptions = computed(() => store.pages);
const currentPageIndex = computed(() => store.currentPageIndex);

const emit = defineEmits(['update:isOpen', 'update:project']);

const svg = ref(null);
const modelSpaceGroup = ref(null);

const activeSpace = computed(() => store.activeSpace);

// Transformations for model space
const modelSpaceScale = ref(1);
const modelSpaceTranslate = reactive({ x: 0, y: 0 });

const viewBox = reactive({
  x: 0,
  y: 0,
  width: 1000, // Initial width
  height: 1000 // Initial height
});

// Function to handle wheel events
const handleWheel = (event) => {
  if (activeSpace.value === 'paper') {
    zoom(event);
  } else if (activeSpace.value === 'model') {
    modelZoom(event);
  }
};

const modelViewBox = ref({ x: 0, y: 0, width: 0, height: 0 });

const updateModelViewBox = () => {
  const scale = modelSpaceScale.value;
  const translateX = modelSpaceTranslate.x;
  const translateY = modelSpaceTranslate.y;

  const x = (store.viewBox.x - translateX) / scale;
  const y = (store.viewBox.y - translateY) / scale;
  const width = store.viewBox.width / scale;
  const height = store.viewBox.height / scale;
  modelViewBox.value = { x, y, width, height };

  modelSpaceGroup.value.setAttribute(
    'transform',
    `translate(${modelSpaceTranslate.x}, ${modelSpaceTranslate.y}) scale(${modelSpaceScale.value})`
  );
};

const modelSpaceTransform = computed(() => {
  return `translate(${modelSpaceTranslate.x}, ${modelSpaceTranslate.y}) scale(${modelSpaceScale.value})`;
});

const axesContainer = ref(null);

// Reference to the Lines component
const linesRef = ref(null);

// Local variables for line drawing
const isPanning = ref(false);
const isModelPanning = ref(false);
let panStart = { x: 0, y: 0 };
let viewBoxStart = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
let animationFrameId = null;
const zoomFactor = 0.04;

function endCanvasInteraction(event) {
  if (isPanning.value) {
    isPanning.value = false;
    const viewBoxValues = svg.value.getAttribute('viewBox').split(' ').map(parseFloat);
    store.viewBox.x = viewBoxValues[0];
    store.viewBox.y = viewBoxValues[1];
  } else if (isModelPanning.value) {
    isModelPanning.value = false;
    updateModelViewBox();
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

const zoom = (event) => {
  if (activeSpace.value !== 'paper') return; // Only zoom when paper space is active

  event.preventDefault();
  const { offsetX, offsetY, deltaY } = event;
  const { width, height } = svg.value.getBoundingClientRect();

  // Determine the zoom direction
  const zoomDirection = deltaY > 0 ? -1 : 1;

  // Use a fixed zoom factor
  const zoomFactor = 0.05; // Adjust this value for desired zoom speed (e.g., 0.1 for 10%)

  // Calculate the scale amount
  const scaleAmount = 1 + zoomDirection * zoomFactor;

  // Compute the new zoom level
  const newZoomLevel = Math.max(minZoomLevel, Math.min(maxZoomLevel, store.paperZoomLevel * scaleAmount));

  if (newZoomLevel === store.paperZoomLevel) return;

  // Calculate the zoom scale (ratio of new to old zoom level)
  const zoomScale = newZoomLevel / store.paperZoomLevel;

  // Calculate the new viewBox dimensions
  const newWidth = store.viewBox.width / zoomScale;
  const newHeight = store.viewBox.height / zoomScale;

  // Calculate the new viewBox position to keep the mouse position fixed
  const newX = store.viewBox.x + (offsetX / width) * (store.viewBox.width - newWidth);
  const newY = store.viewBox.y + (offsetY / height) * (store.viewBox.height - newHeight);

  // Update the zoom level and viewBox in the store
  store.setPaperZoomLevel(newZoomLevel);
  store.setViewBox(newX, newY, newWidth, newHeight);
};

const modelZoom = (event) => {
  if (activeSpace.value !== 'model') return;

  event.preventDefault();

  const { clientX, clientY, deltaY } = event;

  const point = svg.value.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const svgP = point.matrixTransform(svg.value.getScreenCTM().inverse());

  const zoomDirection = deltaY > 0 ? -1 : 1;
  const combinedScale = store.paperZoomLevel * modelSpaceScale.value;
  const adjustedZoomFactor = zoomFactor / combinedScale;
  const zoomAmount = 1 + zoomDirection * adjustedZoomFactor;
  const newScale = Math.max(minZoomLevel, Math.min(maxZoomLevel, modelSpaceScale.value * zoomAmount));
  if (newScale === modelSpaceScale.value) return;

  const modelPointX = (svgP.x - modelSpaceTranslate.x) / modelSpaceScale.value;
  const modelPointY = (svgP.y - modelSpaceTranslate.y) / modelSpaceScale.value;

  modelSpaceScale.value = newScale;

  modelSpaceTranslate.x = svgP.x - modelPointX * newScale;
  modelSpaceTranslate.y = svgP.y - modelPointY * newScale;

  // Save the new scale and translation
  store.modelSpaceScale = modelSpaceScale.value;
  store.modelSpaceTranslate.x = modelSpaceTranslate.x;
  store.modelSpaceTranslate.y = modelSpaceTranslate.y;

  updateModelViewBox();
};

const pan = throttle((event) => {
  if (activeSpace.value !== 'paper') return;

  event.preventDefault();

  const point = svg.value.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  const startPoint = svg.value.createSVGPoint();
  startPoint.x = panStart.x;
  startPoint.y = panStart.y;

  // Transform points to SVG coordinate space
  const svgP = point.matrixTransform(svg.value.getScreenCTM().inverse());
  const svgStartP = startPoint.matrixTransform(svg.value.getScreenCTM().inverse());

  const dx = svgStartP.x - svgP.x;
  const dy = svgStartP.y - svgP.y;

  const newViewBoxX = viewBoxStart.x + dx;
  const newViewBoxY = viewBoxStart.y + dy;

  svg.value.setAttribute('viewBox', `${newViewBoxX} ${newViewBoxY} ${store.viewBox.width} ${store.viewBox.height}`);
  store.setViewBox(newViewBoxX, newViewBoxY, store.viewBox.width, store.viewBox.height);
}, 16);

const modelPan = throttle((event) => {
  if (activeSpace.value !== 'model') return;

  event.preventDefault();

  const point = svg.value.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  const startPoint = svg.value.createSVGPoint();
  startPoint.x = panStart.x;
  startPoint.y = panStart.y;

  // Transform points to SVG coordinate space
  const svgP = point.matrixTransform(svg.value.getScreenCTM().inverse());
  const svgStartP = startPoint.matrixTransform(svg.value.getScreenCTM().inverse());

  const dx = svgP.x - svgStartP.x;
  const dy = svgP.y - svgStartP.y;

  panStart = { x: event.clientX, y: event.clientY };

  modelSpaceTranslate.x += dx;
  modelSpaceTranslate.y += dy;

  modelSpaceGroup.value.setAttribute(
    'transform',
    `translate(${modelSpaceTranslate.x}, ${modelSpaceTranslate.y}) scale(${modelSpaceScale.value})`
  );

  // Save the new translation
  store.modelSpaceTranslate.x = modelSpaceTranslate.x;
  store.modelSpaceTranslate.y = modelSpaceTranslate.y;

  //updateModelViewBox();
}, 16);

const initializeModelSpace = () => {
  // Set the model space scale and translate to saved values
  modelSpaceScale.value = store.modelSpaceScale;
  modelSpaceTranslate.x = store.modelSpaceTranslate.x;
  modelSpaceTranslate.y = store.modelSpaceTranslate.y;

  // Update the model space group's transform
  modelSpaceGroup.value.setAttribute(
    'transform',
    `translate(${modelSpaceTranslate.x}, ${modelSpaceTranslate.y}) scale(${modelSpaceScale.value})`
  );

  // Update the model viewBox
  updateModelViewBox();
};

const initSVG = () => {
  const container = svg.value.parentElement;
  const { clientWidth, clientHeight } = container;
  svg.value.setAttribute('width', clientWidth);
  svg.value.setAttribute('height', clientHeight);
  store.setSvgElement(svg.value);
  store.loadPages(props.project?.drawing || []);
  store.loadPage(store.currentPageIndex);
  // Set the flag to indicate the project is loaded
  store.isProjectLoaded = true;
  store.setModelSpaceGroup(modelSpaceGroup.value);
  store.setAxesContainer(axesContainer.value);
  store.setMode(props.mode);
  store.initializePaperSpace();
  initializeModelSpace();

  store.setLinesRef(linesRef.value);
};

const resizeSVG = () => {
  const container = svg.value.parentElement;
  if (container) {
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    svg.value.setAttribute('width', width);
    svg.value.setAttribute('height', height);

    store.setViewBox(0, 0, width, height);
    store.initializePaperSpace();
    updateModelViewBox();
  }
};
let resizeObserver;
onMounted(() => {
  customizer.CLOSE_SIDEBAR();

  store.setActiveSpace('model');

  // Initialize the ResizeObserver
  resizeObserver = new ResizeObserver(() => {
    resizeSVG();
  });

  // Start observing the container
  const container = svg.value.parentElement;
  if (container) {
    resizeObserver.observe(container);
  }

  initSVG();

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
  store.resetState();
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
  // Disconnect the ResizeObserver
  if (resizeObserver && resizeObserver.disconnect) {
    resizeObserver.disconnect();
  }
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
  } else if (isPanning.value) {
    pan(event);
  } else if (isModelPanning.value) {
    modelPan(event);
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
    if (activeSpace.value === 'paper') {
      // Handle paper space interactions
      isPanning.value = true;
      panStart = { x: event.clientX, y: event.clientY };
      viewBoxStart = { x: store.viewBox.x, y: store.viewBox.y };
    } else if (activeSpace.value === 'model') {
      // Handle model space interactions
      panStart = { x: event.clientX, y: event.clientY };
      isModelPanning.value = true;
      viewBoxStart = { x: store.viewBox.x, y: store.viewBox.y };
    }
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
  store.handleSvgClick(event);
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
  box-sizing: content-box;
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
.disabled-interactions {
  pointer-events: none;
  user-select: none;
}
</style>
