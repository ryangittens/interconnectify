<template>
  <g v-if="rectangle">
    <rect
      :x="rectangle.x"
      :y="rectangle.y"
      :width="rectangle.width"
      :height="rectangle.height"
      :fill="rectangle.color"
      :stroke="rectangle.stroke"
      :stroke-width="rectangle.strokeWidth"
    />
  </g>
  <g>
    <rect
      v-for="rect in store.rectangles"
      :key="rect.id"
      :x="rect.x"
      :y="rect.y"
      :width="rect.width"
      :height="rect.height"
      :fill="rect.color"
      :stroke="rect.stroke"
      :stroke-width="rect.strokeWidth"
      @mousedown.stop="handleRectangleMouseDown(rect, $event)"
      @mouseup="handleRectangleMouseUp(rect, $event)"
      @click="handleRectangleClick(rect, $event)"
    />
  </g>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const { selectRectangle, endInteraction } = store;

const rectangle = ref(null);

const handleRectangleClick = (rect, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    store.selectRectangle(rect);
  }
};

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const handleRectangleMouseDown = (rect, event) => {
  store.mouseDown = true; // Set mouseDown flag to true
  store.mouseDownRect = rect; // Store the line being dragged
  store.isRectDragging = false; // Reset dragging flag
};
const handleRectangleMouseUp = (rect, event) => {
  endInteraction(event);
  store.mouseDown = false; // Reset mouseDown flag
};
const isRectSelected = (rect) => store.selectedRect && store.selectedRect.id === rect.id;

watchEffect(() => {
  if (store.isCreatingRectangle) {
    rectangle.value = store.currentRectangle;
  } else {
    rectangle.value = null;
  }
});
</script>
