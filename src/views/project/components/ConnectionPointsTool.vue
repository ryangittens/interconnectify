<template>
  <g>
    <circle v-for="cp in store.connectionPoints" :key="cp.id" :cx="cp.x" :cy="cp.y" r="5" fill="red" @click="selectConnectionPoint(cp)" />
    <circle v-if="store.isAddingConnectionPoint" :cx="store.currentPoint.x" :cy="store.currentPoint.y" r="5" fill="blue" />
  </g>
</template>

<!-- <template>
  <g v-if="store.selectedBlock">
    <circle
      v-for="cp in store.selectedBlock.connectionPoints"
      :key="cp.id"
      :cx="store.selectedBlock.x + cp.x"
      :cy="store.selectedBlock.y + cp.y"
      r="5"
      fill="red"
      @click="removeConnectionPoint(cp.id)"
    />
    <circle v-if="store.isAddingConnectionPoint" :cx="store.currentPoint.x" :cy="store.currentPoint.y" r="5" fill="blue" />
  </g>
</template> -->

<script setup>
import { ref, watch } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const isAdding = ref(false);
const currentPoint = ref({ x: 0, y: 0 });
const activeBlock = ref(null);

const { selectConnectionPoint } = store;

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
