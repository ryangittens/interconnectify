<template>
  <g
    v-for="block in store.blocks"
    :key="block.id"
    :ref="(el) => blockRefs.set(block.id, el)"
    :transform="`translate(${block.x}, ${block.y})`"
    @mousedown.stop="handleBlockMouseDown(block, $event)"
    @click="handleBlockClick(block)"
  >
    <!-- Add this transparent rectangle to capture clicks -->
    <rect :x="0" :y="0" :width="block.width" :height="block.height" fill="transparent" style="cursor: pointer" />
    <!-- Existing content -->
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
      :fill="cp.color"
      @click.stop="handleConnectionPointClick(cp, block, $event)"
      style="cursor: crosshair"
    />
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

const handleBlockMouseDown = (block, event) => {
  event.preventDefault();

  isDraggingBlock = true;
  dragStartCoords = { x: event.clientX, y: event.clientY };
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
  if (isDraggingBlock && currentBlockElement) {
    event.preventDefault();

    const deltaX = (event.clientX - dragStartCoords.x) / store.zoomLevel;
    const deltaY = (event.clientY - dragStartCoords.y) / store.zoomLevel;

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
    const deltaX = (event.clientX - dragStartCoords.x) / store.zoomLevel;
    const deltaY = (event.clientY - dragStartCoords.y) / store.zoomLevel;

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
        store.updateLinePoints(line, lineStartedAtBlock, isHorizontalMove);
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

const handleBlockClick = (block) => {
  selectBlock(block);
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

g {
  cursor: grab;
}
</style>
