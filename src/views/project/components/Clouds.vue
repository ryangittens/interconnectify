<template>
  <g ref="linesContainer">
    <!-- Drawing Mode Toggle -->
    <v-btn-toggle v-model="drawingMode" mandatory class="mb-2">
      <v-btn value="line">Line Mode</v-btn>
      <v-btn value="cloud">Cloud Mode</v-btn>
    </v-btn-toggle>

    <!-- Existing lines -->
    <g v-for="line in store.lines" :key="line.id">
      <!-- Line rendering logic -->
    </g>

    <!-- Clouds -->
    <g v-for="cloud in store.clouds" :key="cloud.id">
      <path :d="generateCloudPath(cloud.points)" stroke="blue" fill="none" stroke-width="2" stroke-dasharray="5,5"></path>
    </g>

    <!-- Hover Cloud Path -->
    <path
      v-if="isDrawingCloud"
      :d="generateCloudPath(currentCloudPoints)"
      stroke="blue"
      fill="none"
      stroke-width="2"
      stroke-dasharray="5,5"
    ></path>
  </g>
</template>

<script setup>
import { ref, onBeforeUnmount, computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { uuid } from 'vue-uuid';

const store = useSvgStore();

// Drawing mode: 'line' or 'cloud'
const drawingMode = ref('line');

// Cloud drawing state
const isDrawingCloud = ref(false);
const currentCloudPoints = ref([]);

const startDrawing = (event) => {
  if (drawingMode.value === 'cloud') {
    startCloudDrawing(event);
  } else {
    startLineDrawing(event);
  }
};

const startCloudDrawing = (event) => {
  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);
  currentCloudPoints.value = [{ x: snappedCoords.x, y: snappedCoords.y }];
  isDrawingCloud.value = true;
  window.addEventListener('mousemove', handleCloudMouseMove);
  window.addEventListener('mouseup', finishCloudDrawing);
};

const handleCloudMouseMove = (event) => {
  if (!isDrawingCloud.value) return;
  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);
  currentCloudPoints.value.push({ x: snappedCoords.x, y: snappedCoords.y });
};

const finishCloudDrawing = () => {
  if (currentCloudPoints.value.length > 2) {
    const newCloud = {
      id: uuid.v1(),
      points: [...currentCloudPoints.value]
    };
    store.clouds.push(newCloud);
  }
  isDrawingCloud.value = false;
  currentCloudPoints.value = [];
  window.removeEventListener('mousemove', handleCloudMouseMove);
  window.removeEventListener('mouseup', finishCloudDrawing);
};

const generateCloudPath = (points) => {
  let path = '';
  const scallopRadius = 10; // Adjust for desired scallop size
  if (points.length > 1) {
    path += `M ${points[0].x} ${points[0].y} `;
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currPoint = points[i];
      const midPoint = {
        x: (prevPoint.x + currPoint.x) / 2,
        y: (prevPoint.y + currPoint.y) / 2
      };
      path += `Q ${prevPoint.x} ${prevPoint.y} ${midPoint.x} ${midPoint.y} `;
    }
    // Close the cloud path
    path += 'Z';
  }
  return path;
};

// Existing line drawing functions
const startLineDrawing = (event) => {
  // Line drawing logic
};

// Handle SVG canvas events
const handleSvgMouseDown = (event) => {
  if (drawingMode.value === 'cloud') {
    startCloudDrawing(event);
  } else {
    // Existing line drawing logic
  }
};

// Cleanup
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleCloudMouseMove);
  window.removeEventListener('mouseup', finishCloudDrawing);
});
</script>

<style scoped>
svg {
  cursor: crosshair;
}
</style>
