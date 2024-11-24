<template>
  <g
    v-for="block in store.blocks"
    :key="block.id"
    :transform="`translate(${block.x}, ${block.y})`"
    @mousedown.stop="handleBlockMouseDown(block, $event)"
    @mouseup="handleBlockMouseUp(block, $event)"
    @click="handleBlockClick(block)"
  >
    <!-- Add this transparent rectangle to capture clicks -->
    <rect :x="0" :y="0" :width="block.width" :height="block.height" fill="transparent" style="cursor: pointer" />
    <!-- Existing content -->
    <rect
      v-if="!block.content"
      :x="0"
      :y="0"
      :width="block.width"
      :height="block.height"
      :fill="block.color"
      :stroke="isBlockSelected(block) ? primary : 'black'"
      :stroke-width="isBlockSelected(block) ? 2 : 1"
    />
    <g v-else v-html="block.content"></g>
    <circle
      v-for="cp in block.connectionPoints"
      :key="cp.id"
      :cx="cp.x"
      :cy="cp.y"
      r="5"
      :fill="cp.color"
      @click.stop="startWire(cp, block, $event)"
      style="cursor: crosshair"
    />
  </g>
</template>

<script setup>
import { ref } from 'vue';
import { useSvgStore } from '@/stores/svgStore';
const store = useSvgStore();

const { selectBlock, endInteraction, startWire } = store;

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const handleBlockMouseDown = (block, event) => {
  store.mouseDown = true; // Set mouseDown flag to true
  store.mouseDownBlock = block; // Store the line being dragged
  store.isBlockDragging = false; // Reset dragging flag
};
const handleBlockMouseUp = (block, event) => {
  endInteraction(event);
  store.mouseDown = false; // Reset mouseDown flag
  store.mouseDownLine = null; // Reset the line being dragged
};
const handleBlockClick = (block) => {
  selectBlock(block);
};
const isBlockSelected = (block) => store.selectedBlock && store.selectedBlock.id === block.id;
</script>
