<template>
  <g ref="cloudsContainer" :data-selectable="true">
    <!-- Clouds -->
    <g v-for="cloud in store.clouds" :key="cloud.id">
      <path :d="generateCloudPath(cloud.points)" stroke="blue" fill="none" stroke-width="2" stroke-linejoin="round"></path>
    </g>

    <!-- Hover Cloud Path -->
    <path
      v-if="isDrawingCloud"
      :d="generateCloudPath(currentCloudPoints)"
      stroke="blue"
      fill="none"
      stroke-width="2"
      stroke-linejoin="round"
    ></path>
  </g>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { uuid } from 'vue-uuid';

const store = useSvgStore();

// Cloud drawing state
const isDrawingCloud = ref(false);
const currentCloudPoints = ref([]);

const startCloudDrawing = (event) => {
  const coords = store.getSVGCoordinates(event);
  currentCloudPoints.value = [{ x: coords.x, y: coords.y }];
  isDrawingCloud.value = true;
  window.addEventListener('mousemove', handleCloudMouseMove);
  window.addEventListener('mouseup', finishCloudDrawing);
};

const handleCloudMouseMove = (event) => {
  if (!isDrawingCloud.value) return;
  const coords = store.getSVGCoordinates(event);
  currentCloudPoints.value.push({ x: coords.x, y: coords.y });
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
  if (points.length < 2) return '';

  const scallopRadius = 10; // Fixed scallop radius
  const maxSkip = 15; // Maximum number of points to skip between scallops
  const minSkip = 5; // Minimum number of points to skip between scallops

  // Estimate the total length of the cloud path
  const estimateCloudLength = (points) => {
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.hypot(dx, dy);
    }
    return length;
  };

  const totalLength = estimateCloudLength(points);

  // Adjust scallop parameters based on total length
  const scallopLength = 100; // Desired length of each scallop
  const desiredScallops = Math.max(5, Math.floor(totalLength / scallopLength));

  // Calculate skip value with a maximum limit
  const calculatedSkip = Math.max(minSkip, Math.floor(points.length / desiredScallops));
  const skip = Math.min(calculatedSkip, maxSkip);

  // Reduce the number of points by skipping some
  const reducedPoints = [];
  for (let i = 0; i < points.length; i += skip) {
    reducedPoints.push(points[i]);
  }
  // Ensure the last point is included
  if ((points.length - 1) % skip !== 0 || reducedPoints[reducedPoints.length - 1] !== points[points.length - 1]) {
    reducedPoints.push(points[points.length - 1]);
  }

  let path = `M ${reducedPoints[0].x} ${reducedPoints[0].y} `;

  // Loop through all segments, including the closing segment
  for (let i = 0; i < reducedPoints.length - 1; i++) {
    const start = reducedPoints[i];
    const end = reducedPoints[i + 1];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.hypot(dx, dy);

    if (dist === 0) {
      continue; // Skip identical points
    }

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    // Calculate normal vectors
    const nx = -dy / dist;
    const ny = dx / dist;

    const cpX = midX + scallopRadius * nx;
    const cpY = midY + scallopRadius * ny;

    path += `Q ${cpX} ${cpY} ${end.x} ${end.y} `;
  }

  // Handle the closing segment
  const closingStart = reducedPoints[reducedPoints.length - 1];
  const closingEnd = reducedPoints[0];
  const closingDx = closingEnd.x - closingStart.x;
  const closingDy = closingEnd.y - closingStart.y;
  const closingDist = Math.hypot(closingDx, closingDy);

  if (closingDist > 0) {
    const numClosingScallops = Math.max(1, Math.floor(closingDist / (scallopRadius * 2)));
    for (let i = 0; i < numClosingScallops; i++) {
      const t = i / numClosingScallops;
      const nextT = (i + 1) / numClosingScallops;

      const startX = closingStart.x + t * closingDx;
      const startY = closingStart.y + t * closingDy;
      const endX = closingStart.x + nextT * closingDx;
      const endY = closingStart.y + nextT * closingDy;

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const nx = -closingDy / closingDist;
      const ny = closingDx / closingDist;

      const cpX = midX + scallopRadius * nx;
      const cpY = midY + scallopRadius * ny;

      path += `Q ${cpX} ${cpY} ${endX} ${endY} `;
    }
  }

  path += 'Z';
  return path;
};

defineExpose({
  handleCloudMouseMove,
  startCloudDrawing,
  finishCloudDrawing
});

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
