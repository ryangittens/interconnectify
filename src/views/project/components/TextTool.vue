<template>
  <g :data-selectable="true">
    <foreignObject
      v-for="text in store.texts"
      :key="text.id"
      :x="text.x"
      :y="text.y"
      :width="text.width"
      :height="text.height"
      style="overflow: visible"
      :ref="(el) => textRefs.set(text.id, el)"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        :style="{
          fontSize: text.fontSize + 'px',
          fontFamily: text.fontFamily,
          fontWeight: text.fontWeight,
          color: text.color,
          textAlign: text.align,
          width: text.width + 'px',
          height: text.height + 'px',
          whiteSpace: 'pre-wrap',
          cursor: 'grab',
          lineHeight: (text.lineHeight || text.fontSize) + 'px'
        }"
        @mousedown.stop="handleTextMouseDown(text, $event)"
        @click.stop="handleTextClick(text, $event)"
      >
        {{ text.prepend }}{{ text.content }}{{ text.append }}
      </div>
    </foreignObject>
  </g>
  <g :data-selectable="true">
    <foreignObject
      v-for="text in blockEditableTexts"
      :key="text.id"
      :x="text.x"
      :y="text.y"
      :width="text.width"
      :height="text.height"
      style="overflow: visible"
      :ref="(el) => textRefs.set(text.id, el)"
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        :style="{
          fontSize: text.fontSize + 'px',
          fontFamily: text.fontFamily,
          fontWeight: text.fontWeight,
          color: text.color,
          textAlign: text.align,
          width: text.width + 'px',
          height: text.height + 'px',
          whiteSpace: 'pre-wrap',
          cursor: 'grab',
          lineHeight: (text.lineHeight || text.fontSize) + 'px'
        }"
        @mousedown.stop="handleTextMouseDown(text, $event)"
        @click.stop="handleTextClick(text, $event)"
      >
        {{ text.prepend }}{{ text.content }}{{ text.append }}
      </div>
    </foreignObject>
  </g>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

const store = useSvgStore();

const { selectText, snapToGrid } = store;

const textRefs = new Map();

// Compute editable texts from blocks
const blockEditableTexts = computed(() => {
  return store.blocks.flatMap((block) => {
    const blockX = block.x;
    const blockY = block.y;
    const configuration = block.configurations[block.selectedConfiguration];

    if (!configuration.editableTexts) return [];

    return configuration.editableTexts.map((text) => {
      return {
        ...text,
        x: blockX + text.x,
        y: blockY + text.y,
        blockId: block.id // Include block ID for reference
      };
    });
  });
});

// Merge block editable texts with store texts
const allTexts = computed(() => {
  return [...store.texts, ...blockEditableTexts.value];
});

// Non-reactive variables
let isDraggingText = false;
let dragStartCoords = { x: 0, y: 0 };
let initialTextPosition = { x: 0, y: 0 };
let currentTextElement = null;
let currentText = null;

const handleTextClick = (text, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    selectText(text, event);
  }
};

const handleTextMouseDown = (text, event) => {
  if (store.activeTool) {
    return;
  }
  event.preventDefault();

  isDraggingText = true;
  let coords = store.getTransformedSVGCoordinates(event);
  dragStartCoords = { x: coords.x, y: coords.y };
  initialTextPosition = { x: text.x, y: text.y };
  currentText = text;
  currentTextElement = textRefs.get(text.id);

  currentTextElement.classList.add('dragging');

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleTextMouseUp);
};

const handleMouseMove = (event) => {
  if (!isDraggingText || !currentTextElement) return;

  event.preventDefault();

  let coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.modelSpaceScale;
  const deltaY = (coords.y - dragStartCoords.y) / store.modelSpaceScale;

  const newX = initialTextPosition.x + deltaX;
  const newY = initialTextPosition.y + deltaY;

  const snappedCoords = snapToGrid(newX, newY, event);

  // Update the text's position directly in the DOM
  currentTextElement.setAttribute('x', snappedCoords.x);
  currentTextElement.setAttribute('y', snappedCoords.y);
};

const handleTextMouseUp = (event) => {
  if (!isDraggingText || !currentText) return;

  // Get the current position from the DOM element
  const x = parseFloat(currentTextElement.getAttribute('x'));
  const y = parseFloat(currentTextElement.getAttribute('y'));

  // Update the text's position in the reactive store
  currentText.x = x;
  currentText.y = y;

  currentTextElement.classList.remove('dragging');
  currentTextElement = null;
  isDraggingText = false;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleTextMouseUp);
};
</script>

<style scoped>
.dragging {
  cursor: grabbing;
}

text {
  cursor: grab;
  user-select: none;
}
</style>
