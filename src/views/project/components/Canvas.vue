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
      @mouseleave="endInteraction"
      @wheel="zoom"
    >
      <!-- Grid Lines -->
      <GridLines :viewBox="store.viewBox" :gridSize="gridSize" v-if="store.showGrid" />
      <AxesContainer ref="axesContainer" />
      <LinesContainer ref="linesContainer" :lines="store.lines" />
      <BlocksContainer ref="blocksContainer" :blocks="store.blocks" />
    </svg>
    <ConductorSchedule />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, defineProps } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
import { useHistoryStore } from '@/stores/historyStore';
import ConductorSchedule from './ConductorSchedule.vue';
import InfoPanel from './InfoPanel.vue';
import GridLines from './GridLines.vue';
import AxesContainer from './AxesContainer.vue';
import LinesContainer from './LinesContainer.vue';
import BlocksContainer from './BlocksContainer.vue';

const store = useSvgStore();
const historyStore = useHistoryStore();

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');
const svg = ref(null);

const gridSize = 20;

// Your existing code for event handlers, setup, etc.
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
</style>
