<template>
  <g
    v-for="block in store.blocks"
    :id="`block-${block.id}`"
    :key="block.id"
    :ref="(el) => blockRefs.set(block.id, el)"
    :transform="`translate(${block.x}, ${block.y})`"
    :opacity="block?.active ? 1 : 0.3"
    @mousedown.stop="handleBlockMouseDown(block, $event)"
    @click="handleBlockClick(block, $event)"
    :data-selectable="true"
  >
    <!-- Add this transparent rectangle to capture clicks -->
    <rect :x="0" :y="0" :width="block.width" :height="block.height" fill="transparent" style="cursor: pointer" />
    <!-- Existing content -->
    <rect
      v-if="!block.configurations[block.selectedConfiguration].svg"
      :x="0"
      :y="0"
      :width="block.width"
      :height="block.height"
      :fill="block.color"
      :stroke="isBlockSelected(block) ? primary : 'black'"
      :stroke-width="isBlockSelected(block) ? 2 : 1"
    />
    <g v-else v-html="block.configurations[block.selectedConfiguration].svg"></g>
    <!-- Selectable block elements, components -->
    <g
      v-for="component in block.configurations[block.selectedConfiguration].components"
      :key="component.id"
      :id="`component-${component.id}`"
      :transform="`translate(${component.x}, ${component.y})`"
    >
      <g @click.stop="handleBlockClick(component)" @dblclick.stop="handleComponentDblClick(component)" style="cursor: pointer">
        <template v-if="component.active">
          <g v-html="component.configurations[component.selectedConfiguration].svg"></g>
          <!-- Component connection points -->
          <circle
            v-for="cp in component.configurations[component.selectedConfiguration].connectionPoints"
            :key="cp.id"
            :cx="cp.x"
            :cy="cp.y"
            r="3"
            :fill="cp.color"
            @click.stop="handleConnectionPointClick(cp, block, $event)"
            :style="store.isDrawing ? 'cursor: crosshair' : 'cursor: default'"
          />
        </template>
        <template v-else>
          <!-- Calculate center position and translate placeholder -->
          <g
            :transform="`translate(${getComponentCenterX(component)}, ${getComponentCenterY(component)})`"
            @dblclick.stop="handleComponentDblClick(component)"
            @click.stop="handleBlockClick(component)"
            style="cursor: pointer"
          >
            <circle cx="0" cy="0" r="10" fill="transparent" stroke="lightgray" />
            <!-- Plus symbol -->
            <line x1="-5" y1="0" x2="5" y2="0" stroke="lightgray" stroke-width="2" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="lightgray" stroke-width="2" />
          </g>
        </template>
      </g>
    </g>
    <!-- Block connection points -->
    <!-- <circle
      v-for="cp in block.configurations[block.selectedConfiguration].connectionPoints"
      :id="`cp-${cp.id}`"
      :key="cp.id"
      :cx="cp.x"
      :cy="cp.y"
      r="3"
      :fill="cp.color"
      @click.stop="handleConnectionPointClick(cp, block, $event)"
      :style="store.isDrawing ? 'cursor: crosshair' : 'cursor: default'"
    /> -->
  </g>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { useHistoryStore } from '@/stores/history';
import { lineRefs } from '../refs/lineRefs.js';
import { updateLinePoints } from '@/utils/lineUtils';
import { MoveBlockCommand } from '@/commands/MoveBlockCommand';

const store = useSvgStore();
const historyStore = useHistoryStore();

const { selectBlock, snapToGrid } = store;

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const blockRefs = new Map();

// Non-reactive variables
let isDraggingBlock = false;
let dragStartCoords = { x: 0, y: 0 };
let initialBlockPosition = { x: 0, y: 0 };
let currentBlockElement = null;
let currentBlock = null;
let connectedLines = []; // Store connected lines
let connectedLineElements = []; // Store references to line elements

let updatedLinePoints = new Map(); // Map to store updated points

const handleComponentDblClick = (component) => {
  store.updateComponentState(component, !component.active);
};

const toggleComponentActive = (component) => {
  store.updateComponentState(component, !component.active);
};

const getComponentCenterX = (component) => {
  // Assuming component SVG is centered at (0,0)
  // If not, adjust calculations based on your component's dimensions
  return component.width / 2 || 0;
};

const getComponentCenterY = (component) => {
  // Assuming component SVG is centered at (0,0)
  // If not, adjust calculations based on your component's dimensions
  return component.height / 2 || 0;
};

const handleBlockMouseDown = (block, event) => {
  event.preventDefault();

  isDraggingBlock = true;
  let coords = store.getTransformedSVGCoordinates(event);
  dragStartCoords = { x: coords.x, y: coords.y };
  initialBlockPosition = { x: block.x, y: block.y };
  currentBlock = block;
  currentBlockElement = blockRefs.get(block.id);

  currentBlockElement.classList.add('dragging');

  // Identify connected lines
  connectedLines = store.lines.filter((line) => line.points.some((point) => point.blockId === block.id));

  // Get references to connected line elements
  connectedLineElements = connectedLines.map((line) => lineRefs.get(line.id));

  updatedLinePoints = new Map(); // Initialize here

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleBlockMouseUp);
};

const handleMouseMove = (event) => {
  if (store.activeTool) {
    return;
  }
  if (isDraggingBlock && currentBlockElement) {
    event.preventDefault();

    let coords = store.getTransformedSVGCoordinates(event);

    const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
    const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

    const newX = initialBlockPosition.x + deltaX;
    const newY = initialBlockPosition.y + deltaY;

    const snappedCoords = snapToGrid(newX, newY);

    // Update the block's position in the DOM
    currentBlockElement.setAttribute('transform', `translate(${snappedCoords.x}, ${snappedCoords.y})`);

    // Calculate movement delta
    const dx = snappedCoords.x - initialBlockPosition.x;
    const dy = snappedCoords.y - initialBlockPosition.y;

    // Update connected lines
    connectedLines.forEach((line, index) => {
      const lineElement = connectedLineElements[index];
      if (!lineElement) return;

      // Create a non-reactive copy of the line points
      const tempLine = {
        ...line,
        points: line.points.map((point) => ({ ...point }))
      };

      // Update the points of the line
      tempLine.points = tempLine.points.map((point) => {
        if (point.blockId === currentBlock.id) {
          return {
            ...point,
            x: point.x + dx,
            y: point.y + dy
          };
        } else {
          return point;
        }
      });

      // Determine if the block movement is primarily horizontal or vertical
      const isHorizontalMove = Math.abs(dx) > Math.abs(dy);
      const lineStartedAtBlock = tempLine.points[0].blockId === currentBlock.id;

      // Use the utility function to update line points
      tempLine.points = updateLinePoints(tempLine, lineStartedAtBlock, isHorizontalMove);

      // Update the path 'd' attribute directly in the DOM
      const newD = tempLine.points.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

      lineElement.setAttribute('d', newD);

      // Store the updated points for this line
      updatedLinePoints.set(line.id, tempLine.points);
    });
  }
};

const handleBlockMouseUp = (event) => {
  if (isDraggingBlock && currentBlock) {
    // Update the reactive state
    let coords = store.getTransformedSVGCoordinates(event);

    const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
    const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

    const newX = initialBlockPosition.x + deltaX;
    const newY = initialBlockPosition.y + deltaY;

    const snappedCoords = snapToGrid(newX, newY);

    const dx = snappedCoords.x - initialBlockPosition.x;
    const dy = snappedCoords.y - initialBlockPosition.y;

    if (dx === 0 && dy === 0) {
      // If there was no movement, clear the connected lines and return
      currentBlockElement.classList.remove('dragging');
      currentBlockElement = null;
      isDraggingBlock = false;
      connectedLines = [];
      connectedLineElements = [];
      updatedLinePoints = new Map(); // Clear the updatedLinePoints
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleBlockMouseUp);
      return;
    }

    // Update the block's position in the reactive store
    currentBlock.x = snappedCoords.x;
    currentBlock.y = snappedCoords.y;

    // Update connected lines in the reactive store
    connectedLines.forEach((line) => {
      // Retrieve the updated points for this line
      const updatedPoints = updatedLinePoints.get(line.id);

      if (updatedPoints) {
        // Update the reactive line.points with the updated points
        line.points = updatedPoints.map((point) => ({ ...point }));
      } else {
        // Fall back to previous logic if no updated points are available
        line.points = line.points.map((point) => {
          if (point.blockId === currentBlock.id) {
            return {
              ...point,
              x: point.x + dx,
              y: point.y + dy
            };
          } else {
            return point;
          }
        });

        // Adjust line points for right-angle connections if needed
        const lineStartedAtBlock = line.points[0].blockId === currentBlock.id;
        const isHorizontalMove = Math.abs(dx) > Math.abs(dy);
        updateLinePoints(line, lineStartedAtBlock, isHorizontalMove);
      }
    });

    currentBlockElement.classList.remove('dragging');
    currentBlockElement = null;
    isDraggingBlock = false;

    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleBlockMouseUp);

    // Execute move command
    const command = new MoveBlockCommand(currentBlock, dx, dy, store);
    historyStore.executeCommand(command);

    // Clear connected lines
    connectedLines = [];
    connectedLineElements = [];
    updatedLinePoints = new Map(); // Clear the updatedLinePoints
  }
};

const handleBlockClick = (block, event) => {
  selectBlock(block, event);
};

const isBlockSelected = (block) => store.selectedBlock && store.selectedBlock.id === block.id;

// Emit function
import { defineEmits } from 'vue';
const emit = defineEmits(['startWire']);

const handleConnectionPointClick = (cp, block, event) => {
  emit('startWire', { cp, block, event });
};
</script>

<style scoped>
.dragging {
  cursor: grabbing;
}
</style>
