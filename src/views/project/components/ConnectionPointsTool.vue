<template>
  <g v-if="activeBlock">
    <circle
      v-for="cp in activeBlock.connectionPoints"
      :key="cp.id"
      :cx="cp.x"
      :cy="cp.y"
      r="5"
      fill="red"
      @click="removeConnectionPoint(cp.id)"
    />
    <circle v-if="isAdding" :cx="currentPoint.x" :cy="currentPoint.y" r="5" fill="blue" />
  </g>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const isAdding = ref(false);
const currentPoint = ref({ x: 0, y: 0 });
const activeBlock = ref(null);

const startAddingConnectionPoint = (block) => {
  activeBlock.value = block;
  isAdding.value = true;
};

const addConnectionPoint = (event) => {
  if (!isAdding.value) return;

  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);
  activeBlock.value.connectionPoints.push({
    id: Date.now().toString(),
    x: snappedCoords.x - activeBlock.value.x,
    y: snappedCoords.y - activeBlock.value.y
  });
  isAdding.value = false;
};

const removeConnectionPoint = (id) => {
  activeBlock.value.connectionPoints = activeBlock.value.connectionPoints.filter((cp) => cp.id !== id);
};

watch(isAdding, (newVal) => {
  if (newVal) {
    window.addEventListener('mousemove', updateCurrentPoint);
    window.addEventListener('click', addConnectionPoint);
  } else {
    window.removeEventListener('mousemove', updateCurrentPoint);
    window.removeEventListener('click', addConnectionPoint);
  }
});

const updateCurrentPoint = (event) => {
  const coords = store.getSVGCoordinates(event);
  const snappedCoords = store.snapToGrid(coords.x, coords.y);
  currentPoint.value = snappedCoords;
};
</script>
