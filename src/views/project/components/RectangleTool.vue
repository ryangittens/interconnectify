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
      @click.stop="selectRectangle(rect)"
    />
  </g>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const rectangle = ref(null);

const selectRectangle = (rect) => {
  store.selectRectangle(rect);
};

watchEffect(() => {
  if (store.isCreatingRectangle) {
    rectangle.value = store.currentRectangle;
  } else {
    rectangle.value = null;
  }
});
</script>
