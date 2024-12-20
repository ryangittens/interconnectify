<template>
  <g ref="linesContainer" :data-selectable="true">
    <!-- Render all runs -->
    <g v-for="line in allRuns" :key="line.id">
      <!-- Render the line path -->
      <path
        :ref="(el) => lineRefs.set(line.id, el)"
        :d="line.points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')"
        :stroke="isLineSelected(line) ? primary : line.color"
        stroke-width="2"
        :stroke-dasharray="line.type === 'dashed' ? '5, 5' : 'none'"
        fill="none"
        :opacity="line?.active ? 1 : 0.3"
        style="cursor: pointer"
        @mousedown.stop="handleLineMouseDown(line, $event)"
        @mouseup.stop="handleLineMouseUp($event)"
        @click="handleLineClick(line, $event)"
      ></path>

      <!-- Render the label for the line -->
      <g
        v-if="line.category == 'run'"
        :class="['interactive-element', { 'disabled-interactions': activeSpace !== 'model' }]"
        @mousedown.stop="handleLabelMouseDown(line, $event)"
        @mouseup.stop="handleLabelMouseUp($event)"
        @click="handleLabelClick(line)"
        :opacity="line?.active ? 1 : 0.3"
      >
        <circle
          :cx="getLabelPosition(line).x"
          :cy="getLabelPosition(line).y"
          :r="12"
          fill="white"
          stroke="black"
          stroke-width="2"
          :class="{ dragging: isLabelDragging && draggedLineId === line.id }"
        ></circle>
        <text
          :x="getLabelPosition(line).x"
          :y="getLabelPosition(line).y + 4"
          class="line-label"
          text-anchor="middle"
          style="pointer-events: none"
        >
          {{ line.alias }}
        </text>
      </g>
    </g>

    <!-- Hover Line for Preview -->
    <path ref="hoverLineRef" v-if="store.isDrawing" class="hover-line"></path>
  </g>
</template>

<script setup>
import { ref, onBeforeUnmount, watch, computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { lineRefs } from '../refs/lineRefs.js'; // Import the shared lineRefs Map
import { defineExpose } from 'vue';
import { uuid } from 'vue-uuid';
import { useHistoryStore } from '@/stores/history';
import { AddLinePointCommand } from '@/commands/AddLinePointCommand';

const historyStore = useHistoryStore();
const store = useSvgStore();

// Compute runs from blocks
const blockRuns = computed(() => {
  return store.blocks.flatMap((block) => {
    const blockX = block.x;
    const blockY = block.y;
    const configuration = block.configurations[block.selectedConfiguration];
    if (!configuration.runs) return [];
    return configuration.runs.map((run) => {
      // Adjust the run's points based on the block's position
      const adjustedPoints = run.points.map((point) => ({
        ...point,
        x: blockX + point.x,
        y: blockY + point.y,
        blockId: block.id // Include block ID for reference
      }));

      return {
        ...run,
        points: adjustedPoints,
        blockId: block.id
      };
    });
  });
});

// Merge block runs with store runs
const allRuns = computed(() => {
  return [...store.lines, ...blockRuns.value];
});

const activeSpace = computed(() => store.activeSpace);

// Utility function to compare two positions
const isPositionEqual = (pos1, pos2) => {
  return pos1 && pos2 && pos1.x === pos2.x && pos1.y === pos2.y;
};

function areArraysEqual(arr1, arr2) {
  if (arr1?.length !== arr2?.length) return false;
  return arr1.every((value, index) => value === arr2[index]);
}

// Watcher to update label positions when lines change
watch(
  () => store.lines.map((line) => line.points),
  (newPointsArray, oldPointsArray) => {
    newPointsArray.forEach((newPoints, index) => {
      const line = store.lines[index];
      const oldPoints = oldPointsArray[index];

      // Skip lines that are currently being dragged (label or segment)
      const isLabelBeingDragged = isLabelDragging.value && draggedLineId.value === line.id;
      const isSegmentBeingDragged = store.isDraggingLineSegment && currentLine.value?.id === line.id;

      if (isLabelBeingDragged || isSegmentBeingDragged) {
        console.log(`Skipping line ID: ${line.id} (Being dragged)`);
        return;
      }

      if (oldPoints && !areArraysEqual(newPoints, oldPoints)) {
        const newPos = calculateMidpoint(newPoints);

        // Check if the newPos differs from the current labelPosition
        if (!isPositionEqual(line.labelPosition, newPos)) {
          //console.log(`Updating labelPosition for line ID: ${line.id}`);

          store.updateLine({ id: line.id, labelPosition: newPos });
        }
      }
    });
  },
  { deep: true }
);

const primary = ref('rgb(var(--v-theme-primary))');

const { selectLine } = store;

// Non-reactive variables for dragging line segments
let dragStartCoords = { x: 0, y: 0 };
let initialLinePoints = [];
let currentLine = null;
let currentSegmentIndex = null;
let tempLinePoints = []; // Initialize here

const wireStart = ref(null);
const wireEnd = ref(null);

// Reactive state for label dragging
const isLabelDragging = ref(false);
const draggedLineId = ref(null);
const labelDragStart = ref({ x: 0, y: 0 });
const labelInitialPosition = ref({ x: 0, y: 0 });

// Ref for the hover line path
const hoverLineRef = ref(null);

// Methods to handle wire drawing (existing code remains unchanged)
// lines.vue
const startWire = (cp, block, event) => {
  // Get the circle element corresponding to the connection point
  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);

  const point = {
    x: snappedCoords.x,
    y: snappedCoords.y,
    blockId: block.id,
    connectionPointId: cp.id
  };

  if (store.currentLine.length) {
    if (wireStart.value && !wireEnd.value) {
      // Finish the wire
      wireEnd.value = { block, cp };
      addPointToLine(point, event.ctrlKey);
      finishWire();
    }
  } else {
    // Start a new wire
    store.isDrawing = true;
    wireStart.value = { block, cp };
    addPointToLine(point, event.ctrlKey);
  }
};

const finishWire = () => {
  if (wireStart.value && wireEnd.value) {
    wireStart.value = null;
    wireEnd.value = null;

    // Finalize the wire and add it to the store
    if (store.currentLine.length > 1) {
      const newWire = {
        object: 'line',
        active: true,
        id: uuid.v1(),
        alias: store.generateAlias(store.wireRuns.length),
        type: store.lineType,
        color: store.lineColor,
        category: store.lineCategory,
        points: [...store.currentLine],
        voltage: 240, // Or any default value
        labelPosition: null,
        conductor: 'CU',
        sets: 1,
        size: null,
        supplySide: 'N',
        factor: 1,
        len: 20,
        ccc: 3,
        temp: 75
      };
      store.addLine(newWire);
    }
    // Clear the current line points
    store.currentLine = [];
    store.endDrawing();
  }
};

const addPointToLine = (point, ctrlKey) => {
  if (!store.currentLine.length) {
    store.currentLine.push(point);
  } else {
    const lastPoint = store.currentLine[store.currentLine.length - 1];
    let { x, y } = point;

    if (!ctrlKey) {
      const dx = Math.abs(x - lastPoint.x);
      const dy = Math.abs(y - lastPoint.y);
      if (dx > dy) y = lastPoint.y;
      else x = lastPoint.x;
    }

    const snappedPoint = store.snapToGrid(x, y);
    const updatedPoint = { ...point, ...snappedPoint };
    historyStore.executeCommand(new AddLinePointCommand(store, updatedPoint));
    // Update hover line in Lines.vue
    setHoverLine(snappedPoint.x, snappedPoint.y, ctrlKey);
  }
};

const handleSvgClickLineDrawing = (event) => {
  if (store.isDrawing) {
    const coords = store.getSVGCoordinates(event);
    const snappedCoords = store.snapToGrid(coords.x, coords.y);
    addPointToLine(snappedCoords, event.ctrlKey);
  }
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

// Method to set the hover line
const setHoverLine = (x, y, ctrlKey) => {
  if (!store.currentLine.length) {
    clearHoverLine();
    return;
  }

  const lastPoint = store.currentLine[store.currentLine.length - 1];
  let hoverX = x;
  let hoverY = y;

  if (!ctrlKey) {
    const dx = Math.abs(x - lastPoint.x);
    const dy = Math.abs(y - lastPoint.y);
    if (dx > dy) {
      hoverY = lastPoint.y;
    } else {
      hoverX = lastPoint.x;
    }
  }

  const snappedPoint = store.snapToGrid(hoverX, hoverY);

  // Construct the 'd' attribute for the hover line
  const d =
    store.currentLine.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ') + ` L ${snappedPoint.x} ${snappedPoint.y}`;

  if (hoverLineRef.value) {
    hoverLineRef.value.setAttribute('d', d);
    hoverLineRef.value.setAttribute('stroke', store.lineColor);
    hoverLineRef.value.setAttribute('stroke-width', '2');
    hoverLineRef.value.setAttribute('stroke-dasharray', store.lineType === 'dashed' ? '5,5' : 'none');
    hoverLineRef.value.setAttribute('fill', 'none');
    drawAxes(snappedPoint);
  }
};

// Method to clear the hover line
const clearHoverLine = () => {
  if (hoverLineRef.value) {
    hoverLineRef.value.removeAttribute('d');
    hoverLineRef.value.removeAttribute('stroke');
    hoverLineRef.value.removeAttribute('stroke-width');
    hoverLineRef.value.removeAttribute('stroke-dasharray');
    hoverLineRef.value.removeAttribute('fill');
  }
};

// Function to remove duplicate points
function removeDuplicatePoints(points) {
  const uniquePoints = [];
  const pointSet = new Set();

  for (const point of points) {
    const key = `${point.x},${point.y}`;
    if (!pointSet.has(key)) {
      uniquePoints.push(point);
      pointSet.add(key);
    }
  }

  return uniquePoints;
}

const endLineDrawing = () => {
  // Only add to store if more than one point
  const cleanedLinePoints = removeDuplicatePoints(store.currentLine);
  if (store.currentLine.length > 1) {
    const newLine = {
      object: 'line',
      active: true,
      id: uuid.v1(),
      alias: store.generateAlias(store.wireRuns.length),
      type: store.lineType,
      color: store.lineColor,
      category: store.lineCategory,
      points: [...store.currentLine],
      voltage: 240,
      labelPosition: null,
      conductor: 'CU',
      sets: 1,
      size: null,
      supplySide: 'N',
      factor: 1,
      len: 20,
      ccc: 3,
      temp: 75
    };

    // Add the line to the store
    store.addLine(newLine);
  }
  // Clear the current line points
  store.currentLine = [];
  clearHoverLine();

  // Recalculate label positions for all lines without manual positions
  store.wireRuns.forEach((line) => {
    if (!line.labelPosition) {
      const newPos = calculateMidpoint(line.points);
      store.updateLine({ id: line.id, labelPosition: newPos });
    }
  });
};

const handleLabelMouseMove = (event) => {
  if (!isLabelDragging.value || !draggedLineId.value) return;

  event.preventDefault();

  const coords = store.getSVGCoordinates(event);

  // Correctly apply zoom level to the difference
  const dx = (coords.x - labelDragStart.value.x) / store.paperZoomLevel;
  const dy = (coords.y - labelDragStart.value.y) / store.paperZoomLevel;

  const newX = labelInitialPosition.value.x + dx;
  const newY = labelInitialPosition.value.y + dy;

  const snappedCoords = snapLabelToLine(draggedLineId.value, newX, newY);
  if (snappedCoords) {
    // Update both circle and text elements directly in DOM
    const lineElement = lineRefs.get(draggedLineId.value);
    if (lineElement) {
      const parentElement = lineElement.parentElement;
      const circle = parentElement.querySelector('circle');
      const text = parentElement.querySelector('text');

      if (circle && text) {
        // Update circle position
        circle.setAttribute('cx', snappedCoords.x);
        circle.setAttribute('cy', snappedCoords.y);

        // Update text position
        text.setAttribute('x', snappedCoords.x);
        text.setAttribute('y', snappedCoords.y + 4); // +4 for text offset
      }
    }
  }
};

// Handle selection and dragging of lines
const handleLineMouseDown = (line, event) => {
  if (store.isDrawing) return;

  const segmentIndex = getSegmentIndex(line, event);
  if (segmentIndex === null) return;

  store.isDraggingLineSegment = true;
  dragStartCoords = store.getSVGCoordinates(event);
  initialLinePoints = line.points.map((point) => ({ ...point })); // Deep copy
  tempLinePoints = []; // Initialize here
  currentLine = line;
  currentSegmentIndex = segmentIndex;

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleLineMouseUp);
};

const handleMouseMove = (event) => {
  if (!store.isDraggingLineSegment || !currentLine) return;

  event.preventDefault();

  const coords = store.getSVGCoordinates(event);
  const dx = coords.x - dragStartCoords.x;
  const dy = coords.y - dragStartCoords.y;

  // Use the non-reactive copy of the line points
  tempLinePoints = initialLinePoints.map((point) => ({ ...point }));
  const lineCopy = { ...currentLine, points: tempLinePoints };

  let index = currentSegmentIndex;
  let startPoint = tempLinePoints[index];
  let endPoint = tempLinePoints[index + 1];

  // For lines with only two points, ensure index is 0
  if (tempLinePoints.length === 2) {
    currentSegmentIndex = 0;
    index = 0;
    startPoint = tempLinePoints[0];
    endPoint = tempLinePoints[1];
  }

  // Capture original first and last points of the line
  const originalFirstPoint = { ...initialLinePoints[0] };
  const originalLastPoint = { ...initialLinePoints[initialLinePoints.length - 1] };

  // Check if the segment's endpoints are connected to blocks
  const startPointConnectedToBlock = startPoint.blockId ? true : false;
  const endPointConnectedToBlock = endPoint.blockId ? true : false;

  // Determine if the segment is horizontal or vertical
  const isHorizontal = startPoint.y === endPoint.y;
  const isVertical = startPoint.x === endPoint.x;

  // Restrict movement based on segment orientation
  let adjustedDx = dx;
  let adjustedDy = dy;

  if (isHorizontal) {
    adjustedDx = 0; // No horizontal movement for horizontal segments
  } else if (isVertical) {
    adjustedDy = 0; // No vertical movement for vertical segments
  }

  // Calculate new positions for the segment's points
  const newStartPoint = { x: startPoint.x + adjustedDx, y: startPoint.y + adjustedDy };
  const newEndPoint = { x: endPoint.x + adjustedDx, y: endPoint.y + adjustedDy };

  // Snap the new positions to the grid
  const snappedStartPoint = store.snapToGrid(newStartPoint.x, newStartPoint.y);
  const snappedEndPoint = store.snapToGrid(newEndPoint.x, newEndPoint.y);

  // Apply the logic to adjust line points based on connections
  if (isHorizontal) {
    if (endPointConnectedToBlock && startPointConnectedToBlock) {
      // Both endpoints are connected to blocks
      if (snappedStartPoint.y !== startPoint.y) {
        if (tempLinePoints.length === 2) {
          tempLinePoints.splice(index + 1, 0, { x: snappedStartPoint.x, y: snappedStartPoint.y, blockId: '' });
          tempLinePoints.splice(index + 2, 0, { x: snappedEndPoint.x, y: snappedEndPoint.y, blockId: '' });
          currentSegmentIndex = 1;
          index = 1;
        } else if (tempLinePoints.length === 4) {
          tempLinePoints[1] = snappedStartPoint;
          tempLinePoints[2] = snappedEndPoint;
        }
      }
      if (snappedStartPoint.y === startPoint.y && tempLinePoints.length === 4) {
        tempLinePoints.splice(1, 2);
      }
    } else if (endPointConnectedToBlock) {
      tempLinePoints.splice(index + 1, 0, { x: endPoint.x, y: snappedEndPoint.y });
      tempLinePoints[index] = snappedStartPoint;
      tempLinePoints[index + 1] = snappedEndPoint;
    } else if (startPointConnectedToBlock) {
      tempLinePoints.splice(1, 0, { x: endPoint.x, y: snappedEndPoint.y });
      tempLinePoints[1] = snappedStartPoint;
      tempLinePoints[2] = snappedEndPoint;
    } else {
      tempLinePoints[index] = { ...tempLinePoints[index], ...snappedStartPoint };
      tempLinePoints[index + 1] = { ...tempLinePoints[index + 1], ...snappedEndPoint };
    }
  }

  if (isVertical) {
    if (endPointConnectedToBlock && startPointConnectedToBlock) {
      // Both endpoints are connected to blocks
      if (snappedStartPoint.x !== startPoint.x) {
        if (tempLinePoints.length === 2) {
          tempLinePoints.splice(index + 1, 0, { x: snappedStartPoint.x, y: snappedStartPoint.y, blockId: '' });
          tempLinePoints.splice(index + 2, 0, { x: snappedEndPoint.x, y: snappedEndPoint.y, blockId: '' });
          currentSegmentIndex = 1;
          index = 1;
        } else if (tempLinePoints.length === 4) {
          tempLinePoints[1] = snappedStartPoint;
          tempLinePoints[2] = snappedEndPoint;
        }
      }
      if (snappedStartPoint.x === startPoint.x && tempLinePoints.length === 4) {
        tempLinePoints.splice(1, 2);
      }
    } else if (endPointConnectedToBlock) {
      tempLinePoints.splice(index + 1, 0, { x: snappedEndPoint.x, y: endPoint.y });
      tempLinePoints[index] = snappedStartPoint;
      tempLinePoints[index + 1] = snappedEndPoint;
    } else if (startPointConnectedToBlock) {
      tempLinePoints.splice(1, 0, { x: snappedEndPoint.x, y: endPoint.y });
      tempLinePoints[1] = snappedStartPoint;
      tempLinePoints[2] = snappedEndPoint;
    } else {
      tempLinePoints[index] = { ...tempLinePoints[index], ...snappedStartPoint };
      tempLinePoints[index + 1] = { ...tempLinePoints[index + 1], ...snappedEndPoint };
    }
  }

  // Reset the first and last points to the original block connection points
  resetEndPointsToOriginal(tempLinePoints, originalFirstPoint, originalLastPoint);

  // Update the SVG path directly using lineRefs
  const newD = tempLinePoints.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  const lineElement = lineRefs.get(currentLine.id);
  if (lineElement) {
    lineElement.setAttribute('d', newD);
  }
};

const resetEndPointsToOriginal = (points, originalFirstPoint, originalLastPoint) => {
  points[0] = { ...points[0], x: originalFirstPoint.x, y: originalFirstPoint.y };
  points[points.length - 1] = { ...points[points.length - 1], x: originalLastPoint.x, y: originalLastPoint.y };
};

const handleLineMouseUp = (event) => {
  if (!store.isDraggingLineSegment || !currentLine) return;

  event.preventDefault();

  // Apply the final positions to the reactive line data
  if (tempLinePoints.length) {
    currentLine.points = tempLinePoints.map((point) => ({ ...point }));
    // Ensure reactivity
    store.updateLine(currentLine);
  }

  // Recalculate label position
  const newPos = calculateMidpoint(currentLine.points);

  store.updateLine({ id: currentLine.id, labelPosition: newPos });

  // Clean up
  store.isDraggingLineSegment = false;
  currentLine = null;
  currentSegmentIndex = null;
  tempLinePoints = []; // Clear here
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleLineMouseUp);
};

// Label Drag Handlers

const handleLabelMouseDown = (line, event) => {
  event.stopPropagation(); // Prevent triggering line drag
  event.preventDefault();
  isLabelDragging.value = true;
  draggedLineId.value = line.id;

  // Use SVG coordinates
  const coords = store.getSVGCoordinates(event);
  labelDragStart.value = { x: coords.x, y: coords.y };
  const currentPos = getLabelPosition(line);
  labelInitialPosition.value = { x: currentPos.x, y: currentPos.y };

  window.addEventListener('mousemove', handleLabelMouseMove);
  window.addEventListener('mouseup', handleLabelMouseUp);
};

// Update handleLabelMouseUp to ensure position is saved
const handleLabelMouseUp = (event) => {
  if (!isLabelDragging.value || !draggedLineId.value) return;

  event.preventDefault();

  const coords = store.getSVGCoordinates(event);
  const snappedCoords = snapLabelToLine(draggedLineId.value, coords.x, coords.y);

  if (snappedCoords) {
    const line = store.wireRuns.find((l) => l.id === draggedLineId.value);
    if (line) {
      // Save the final position
      store.updateLine({
        id: line.id,
        labelPosition: snappedCoords
      });
    }
  }

  // Reset dragging state
  isLabelDragging.value = false;
  draggedLineId.value = null;
  window.removeEventListener('mousemove', handleLabelMouseMove);
  window.removeEventListener('mouseup', handleLabelMouseUp);
};

const handleLabelClick = (line, event) => {
  handleLineClick(line, event); // Retain the existing click behavior
};

// Utility to snap label to the nearest point on the line
const snapLabelToLine = (lineId, x, y) => {
  const line = store.wireRuns.find((l) => l.id === lineId);
  if (!line || !line.points.length) return null;

  const nearestPoint = findNearestPointOnLine(line.points, { x, y });
  return nearestPoint;
};

// Utility function to find the nearest point on a polyline to a given point
const findNearestPointOnLine = (points, target) => {
  let minDistance = Infinity;
  let nearestPoint = { x: 0, y: 0 };

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const closest = getClosestPointOnSegment(target, p1, p2);
    const distance = Math.hypot(target.x - closest.x, target.y - closest.y);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPoint = closest;
    }
  }

  return nearestPoint;
};

// Utility function to get the closest point on a line segment to a target point
const getClosestPointOnSegment = (pt, p1, p2) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  if (dx === 0 && dy === 0) {
    return { x: p1.x, y: p1.y };
  }

  const t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / (dx * dx + dy * dy);

  if (t < 0) {
    return { x: p1.x, y: p1.y };
  } else if (t > 1) {
    return { x: p2.x, y: p2.y };
  } else {
    return {
      x: p1.x + t * dx,
      y: p1.y + t * dy
    };
  }
};

// Calculate the midpoint of a line
const calculateMidpoint = (points) => {
  if (points.length === 0) return { x: 0, y: 0 };
  const totalLength = points.reduce((acc, point, idx, arr) => {
    if (idx === 0) return acc;
    const prev = arr[idx - 1];
    return acc + Math.hypot(point.x - prev.x, point.y - prev.y);
  }, 0);

  let distance = totalLength / 2;
  let accumulatedLength = 0;
  let index = 0;

  while (
    index < points.length - 1 &&
    accumulatedLength + Math.hypot(points[index + 1].x - points[index].x, points[index + 1].y - points[index].y) < distance
  ) {
    accumulatedLength += Math.hypot(points[index + 1].x - points[index].x, points[index + 1].y - points[index].y);
    index++;
  }

  if (index >= points.length - 1) {
    index = points.length - 2;
  }

  const segmentLength = Math.hypot(points[index + 1].x - points[index].x, points[index + 1].y - points[index].y);
  const remaining = distance - accumulatedLength;
  const t = segmentLength === 0 ? 0 : remaining / segmentLength;

  return {
    x: points[index].x + t * (points[index + 1].x - points[index].x),
    y: points[index].y + t * (points[index + 1].y - points[index].y)
  };
};

const handleLineClick = (line) => {
  selectLine(line);
};

// Removed watcher as handleLineMouseUp manages label positioning

// Expose methods to ProjectCanvas.vue
defineExpose({
  setHoverLine,
  clearHoverLine,
  handleSvgClickLineDrawing,
  endLineDrawing,
  startWire,
  addPointToLine,
  handleLineMouseUp
});

const isLineSelected = (line) => store.selectedLine && store.selectedLine.id === line.id;

// Updated getLabelPosition to use labelPosition if available
const getLabelPosition = (line) => {
  if (!line || !line.points.length) {
    return { x: 0, y: 0 };
  }
  if (line.labelPosition) {
    return { x: line.labelPosition.x, y: line.labelPosition.y };
  }
  // Calculate the midpoint of the line
  return calculateMidpoint(line.points);
};

// Existing getSegmentIndex remains unchanged
const getSegmentIndex = (line, event) => {
  const coords = store.getSVGCoordinates(event);
  const { x, y } = coords;

  // Loop through line segments to find the closest to the click position
  for (let i = 0; i < line.points.length - 1; i++) {
    const p1 = line.points[i];
    const p2 = line.points[i + 1];
    if (isPointNearSegment({ x, y }, p1, p2)) {
      return i;
    }
  }
  return null;
};

const isPointNearSegment = (point, p1, p2, threshold = 5) => {
  // Calculate distance from point to segment
  const distance = distanceToSegment(point, p1, p2);
  return distance <= threshold;
};

const distanceToSegment = (pt, p1, p2) => {
  // Calculate distance from a point to a line segment
  // Implementation based on the algorithm from StackOverflow
  const x = pt.x;
  const y = pt.y;
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;

  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  if (lenSq !== 0) param = dot / lenSq;

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = x - xx;
  const dy = y - yy;
  return Math.sqrt(dx * dx + dy * dy);
};

// Clean up lineRefs when the component is unmounted
onBeforeUnmount(() => {
  lineRefs.clear();
});
</script>

<style scoped>
.line-label {
  font-size: 14px;
  fill: black;
  user-select: none;
}
.dragging {
  cursor: grabbing !important;
}
circle {
  cursor: grab;
}
.interactive-element {
  cursor: pointer;
  pointer-events: all;
}

.disabled-interactions {
  pointer-events: none !important;
  user-select: none;
}
</style>
