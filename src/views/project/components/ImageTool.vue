<template>
  <g :data-selectable="true">
    <image
      v-for="image in store.images"
      :key="image.id"
      :x="image.x"
      :y="image.y"
      :width="image.width"
      :height="image.height"
      :href="image.src"
      :preserveAspectRatio="image.preserveAspectRatio"
      :ref="(el) => imageRefs.set(image.id, el)"
      @mousedown.stop="handleImageMouseDown(image, $event)"
      @click.stop="handleImageClick(image, $event)"
    />
  </g>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();
const { selectImage, snapToGrid } = store;

const imageRefs = new Map();

// Non-reactive variables
let isDraggingImage = false;
let dragStartCoords = { x: 0, y: 0 };
let initialImagePosition = { x: 0, y: 0 };
let currentImageElement = null;
let currentImage = null;

const handleImageClick = (image, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    selectImage(image, event);
  }
};

const handleImageMouseDown = (image, event) => {
  if (store.activeTool) return;
  event.preventDefault();

  isDraggingImage = true;
  const coords = store.getTransformedSVGCoordinates(event);
  dragStartCoords = { x: coords.x, y: coords.y };
  initialImagePosition = { x: image.x, y: image.y };
  currentImage = image;
  currentImageElement = imageRefs.get(image.id);
  if (currentImageElement) {
    currentImageElement.classList.add('dragging');
  }

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleImageMouseUp);
};

const handleMouseMove = (event) => {
  if (!isDraggingImage || !currentImageElement) return;
  event.preventDefault();

  const coords = store.getTransformedSVGCoordinates(event);
  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

  const newX = initialImagePosition.x + deltaX;
  const newY = initialImagePosition.y + deltaY;
  const snappedCoords = snapToGrid(newX, newY, event);

  currentImageElement.setAttribute('x', snappedCoords.x);
  currentImageElement.setAttribute('y', snappedCoords.y);
};

const handleImageMouseUp = (event) => {
  if (!isDraggingImage || !currentImage) return;

  const x = parseFloat(currentImageElement.getAttribute('x'));
  const y = parseFloat(currentImageElement.getAttribute('y'));

  currentImage.x = x;
  currentImage.y = y;

  currentImageElement.classList.remove('dragging');
  currentImageElement = null;
  isDraggingImage = false;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleImageMouseUp);
};
</script>

<style scoped>
.dragging {
  cursor: grabbing;
}

image {
  cursor: grab;
  user-select: none;
}
</style>
