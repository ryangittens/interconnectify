<template>
  <g>
    <text
      v-for="text in store.texts"
      :key="text.id"
      :x="text.x"
      :y="text.y"
      :font-size="text.fontSize"
      @mousedown.stop="handleTextMouseDown(text, $event)"
      @mouseup="handleTextMouseUp(text, $event)"
      @click="handleTextClick(text, $event)"
      style="cursor: pointer; user-select: none"
    >
      {{ text.content }}
    </text>
  </g>
  <!-- <foreignObject
    v-if="store.selectedText"
    :x="store.selectedText.x"
    :y="store.selectedText.y - store.selectedText.fontSize"
    :width="300"
    :height="100"
  >
    <input
      ref="textInput"
      type="text"
      :value="store.selectedText.content"
      @input="updateTextContent"
      @blur="deselectText"
      style="font-size: 16px; width: 300px"
    />
  </foreignObject> -->
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();
const textInput = ref(null);

const { endInteraction } = store;

const selectText = (text) => {
  store.selectText(text);
};

const updateTextContent = (event) => {
  store.updateTextContent(event.target.value);
};

const deselectText = () => {
  store.selectText(null);
};

const handleTextClick = (text, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    selectText(text);
  }
};

const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');

const handleTextMouseDown = (text, event) => {
  store.mouseDown = true; // Set mouseDown flag to true
  store.mouseDownText = text; // Store the line being dragged
  store.isTextDragging = false; // Reset dragging flag
};
const handleTextMouseUp = (text, event) => {
  endInteraction(event);
  store.mouseDown = false; // Reset mouseDown flag
};
const isTextSelected = (text) => store.selectedText && store.selectedText.id === text.id;

onMounted(() => {});
</script>
