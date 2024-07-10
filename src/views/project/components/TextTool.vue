<template>
  <g>
    <text
      v-for="text in store.texts"
      :key="text.id"
      :x="text.x"
      :y="text.y"
      :font-size="text.fontSize"
      @click.stop="selectText(text)"
      style="cursor: pointer"
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

const selectText = (text) => {
  store.selectText(text);
};

const updateTextContent = (event) => {
  store.updateTextContent(event.target.value);
};

const deselectText = () => {
  store.selectText(null);
};

onMounted(() => {});
</script>
