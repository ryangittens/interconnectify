<template>
  <g v-if="rectangle">
    <rect
      :x="rectangle.x"
      :y="rectangle.y"
      :width="rectangle.width"
      :height="rectangle.height"
      :fill="rectangle.color"
      stroke="black"
      stroke-width="1"
    />
  </g>
  <g v-for="rect in store.rectangles" :key="rect.id">
    <rect :x="rect.x" :y="rect.y" :width="rect.width" :height="rect.height" :fill="rect.color" stroke="black" stroke-width="1" />
  </g>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const rectangle = ref(null);

watchEffect(() => {
  if (store.isCreatingRectangle) {
    rectangle.value = store.currentRectangle;
  } else {
    rectangle.value = null;
  }
});
</script>
