<!-- <template>
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
</template> -->

<template>
  <g :data-selectable="true">
    <text
      v-for="text in allTexts"
      :key="text.id"
      :x="text.x"
      :y="text.y"
      :font-size="text.fontSize"
      :font-family="text.fontFamily"
      :font-weight="text.fontWeight"
      :fill="text.color"
      :text-anchor="getTextAnchor(text.align)"
      :style="{ cursor: 'grab' }"
      @mousedown.stop="handleTextMouseDown(text, $event)"
      @click.stop="handleTextClick(text, $event)"
      :ref="(el) => textRefs.set(text.id, el)"
    >
      <tspan
        v-for="(line, index) in wrapTextLines(text)"
        :key="index"
        :x="text.x"
        :dy="index === 0 ? '0' : `${text.lineHeight || text.fontSize}`"
      >
        {{ line }}
      </tspan>
    </text>
  </g>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useSvgStore } from '@/stores/svgStore';

// Access the SVG store
const store = useSvgStore();

// Destructure necessary methods from the store
const { selectText, snapToGrid } = store;

// Reference to store text elements
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

// Utility for measuring text width using a hidden canvas
const textWidthCache = new Map();

/**
 * Measures the width of a given text with specified font properties, utilizing caching.
 *
 * @param {string} text - The text to measure.
 * @param {Object} fontProps - The font properties { fontSize, fontFamily, fontWeight }.
 * @returns {number} - The width of the text in pixels.
 */
function measureTextWidthCached(text, fontProps) {
  const cacheKey = `${fontProps.fontWeight}|${fontProps.fontSize}|${fontProps.fontFamily}|${text}`;
  if (textWidthCache.has(cacheKey)) {
    return textWidthCache.get(cacheKey);
  }
  const width = measureTextWidth(text, fontProps);
  textWidthCache.set(cacheKey, width);
  return width;
}

/**
 * Measures the width of a given text with specified font properties.
 *
 * @param {string} text - The text to measure.
 * @param {Object} fontProps - The font properties { fontSize, fontFamily, fontWeight }.
 * @returns {number} - The width of the text in pixels.
 */
function measureTextWidth(text, fontProps) {
  const canvas = measureTextWidth.canvas || (measureTextWidth.canvas = document.createElement('canvas'));
  const context = canvas.getContext('2d');
  context.font = `${fontProps.fontWeight} ${fontProps.fontSize}px ${fontProps.fontFamily}`;
  return context.measureText(text).width;
}

/**
 * Splits a string of text into multiple lines based on the maximum width.
 *
 * @param {string} text - The text to split.
 * @param {number} maxWidth - The maximum width in pixels.
 * @param {Object} fontProps - The font properties { fontSize, fontFamily, fontWeight }.
 * @returns {Array<string>} - An array of text lines.
 */
function wrapText(text, maxWidth, fontProps) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = measureTextWidthCached(testLine, fontProps);

    if (testWidth > maxWidth) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word itself is longer than maxWidth, need to split the word
        const splitWord = splitLongWord(word, maxWidth, fontProps);
        lines.push(...splitWord.slice(0, -1));
        currentLine = splitWord[splitWord.length - 1];
      }
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Splits a long word into smaller parts that fit within maxWidth.
 *
 * @param {string} word - The word to split.
 * @param {number} maxWidth - The maximum width in pixels.
 * @param {Object} fontProps - The font properties { fontSize, fontFamily, fontWeight }.
 * @returns {Array<string>} - An array of word segments.
 */
function splitLongWord(word, maxWidth, fontProps) {
  const letters = word.split('');
  let segments = [];
  let currentSegment = '';

  letters.forEach((letter) => {
    const testSegment = currentSegment + letter;
    const testWidth = measureTextWidthCached(testSegment, fontProps);

    if (testWidth > maxWidth && currentSegment) {
      segments.push(currentSegment);
      currentSegment = letter;
    } else {
      currentSegment = testSegment;
    }
  });

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Wraps the text content into lines based on the width constraint.
 *
 * @param {Object} text - The text object containing content and styling.
 * @returns {Array<string>} - An array of text lines.
 */
function wrapTextLines(text) {
  const maxWidth = text.width; // Width constraint in pixels

  const fontProps = {
    fontSize: text.fontSize,
    fontFamily: text.fontFamily,
    fontWeight: text.fontWeight
  };

  const fullText = `${text.prepend || ''}${text.content || ''}${text.append || ''}`;
  const lines = wrapText(fullText, maxWidth, fontProps);
  return lines;
}

/**
 * Translates text alignment to SVG text-anchor values.
 * @param {string} align - The text alignment ('left', 'center', 'right').
 * @returns {string} - The corresponding SVG text-anchor value.
 */
function getTextAnchor(align) {
  switch (align) {
    case 'center':
      return 'middle';
    case 'right':
      return 'end';
    case 'left':
    default:
      return 'start';
  }
}

// Non-reactive variables for dragging
let isDraggingText = false;
let dragStartCoords = { x: 0, y: 0 };
let initialTextPosition = { x: 0, y: 0 };
let currentTextElement = null;
let currentText = null;

/**
 * Handles click events on text elements.
 *
 * @param {Object} text - The text object.
 * @param {Event} event - The click event.
 */
const handleTextClick = (text, event) => {
  if (store.activeTool) {
    store.handleSvgClick(event);
  } else {
    selectText(text, event);
  }
};

/**
 * Handles mouse down events on text elements for dragging.
 *
 * @param {Object} text - The text object.
 * @param {Event} event - The mouse down event.
 */
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

  if (currentTextElement) {
    // Add a visual indicator for dragging (optional)
    currentTextElement.classList.add('dragging');

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleTextMouseUp);
  } else {
    console.error(`No reference found for text id: ${text.id}`);
  }
};

/**
 * Handles mouse move events during text dragging.
 *
 * @param {Event} event - The mouse move event.
 */
const handleMouseMove = (event) => {
  if (!isDraggingText || !currentTextElement) return;

  event.preventDefault();

  let coords = store.getTransformedSVGCoordinates(event);

  const deltaX = (coords.x - dragStartCoords.x) / store.paperZoomLevel;
  const deltaY = (coords.y - dragStartCoords.y) / store.paperZoomLevel;

  const newX = initialTextPosition.x + deltaX;
  const newY = initialTextPosition.y + deltaY;

  const snappedCoords = snapToGrid(newX, newY, event);

  // Update the text's position in the reactive store
  currentText.x = snappedCoords.x;
  currentText.y = snappedCoords.y;

  // Update the text's position directly in the DOM
  currentTextElement.setAttribute('x', snappedCoords.x);
  currentTextElement.setAttribute('y', snappedCoords.y);
};

/**
 * Handles mouse up events after text dragging.
 *
 * @param {Event} event - The mouse up event.
 */
const handleTextMouseUp = (event) => {
  if (!isDraggingText || !currentText) return;

  // Get the current position from the DOM element
  const x = parseFloat(currentTextElement.getAttribute('x'));
  const y = parseFloat(currentTextElement.getAttribute('y'));

  // Update the text's position in the reactive store
  currentText.x = x;
  currentText.y = y;

  // Remove visual indicator
  currentTextElement.classList.remove('dragging');
  currentTextElement = null;
  isDraggingText = false;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleTextMouseUp);
};

// Clean up event listeners if the component is unmounted while dragging
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleTextMouseUp);
});
</script>

<style scoped>
.dragging {
  opacity: 0.7;
}

text {
  cursor: grab;
  user-select: none;
}

text.dragging {
  cursor: grabbing;
}
</style>
