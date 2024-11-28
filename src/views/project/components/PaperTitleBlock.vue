<!-- PaperTitleBlock.vue -->
<template>
  <g>
    <rect :x="x" :y="y" :width="width" :height="height" fill="white" stroke="black" />
    <rect :x="x" :y="y" :width="blockWidth" :height="blockHeight" fill="none" stroke="black" />
    <text :x="x + 10" :y="y + 20" fill="black">Title: {{ title }}</text>
    <!-- Other text elements -->
  </g>
</template>

<script>
export default {
  props: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 50 },
    blockWidth: { type: Number, default: 1224 },
    blockHeight: { type: Number, default: 792 },
    title: { type: String, default: 'My Drawing' }
  }
};
</script>
