<template>
  <div class="canvas-container position-relative">
    <canvas ref="canvas" @mousedown="startDrawing" @mouseup="stopDrawing" @mousemove="draw"></canvas>
  </div>
</template>

<script>
export default {
  name: 'CanvasDrawing',
  data() {
    return {
      isDrawing: false,
      context: null,
      lastX: 0,
      lastY: 0
    };
  },
  mounted() {
    this.initCanvas();
    window.addEventListener('resize', this.resizeCanvas);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeCanvas);
  },
  methods: {
    initCanvas() {
      const canvas = this.$refs.canvas;
      this.context = canvas.getContext('2d');
      this.resizeCanvas();
    },
    resizeCanvas() {
      const container = this.getClosestVContainer();
      const canvas = this.$refs.canvas;
      const containerStyle = window.getComputedStyle(container);
      const containerPaddingTop = parseFloat(containerStyle.paddingTop);
      const containerPaddingRight = parseFloat(containerStyle.paddingRight);
      const containerPaddingBottom = parseFloat(containerStyle.paddingBottom);
      const containerPaddingLeft = parseFloat(containerStyle.paddingLeft);
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        canvas.style.left = -containerPaddingLeft;
      }
    },
    getClosestVContainer() {
      let element = this.$refs.canvas;
      while (element) {
        if (element.classList.contains('v-container')) {
          return element;
        }
        element = element.parentElement;
      }
      return null;
    },
    startDrawing(event) {
      this.isDrawing = true;
      [this.lastX, this.lastY] = [event.offsetX, event.offsetY];
    },
    stopDrawing() {
      this.isDrawing = false;
      this.context.beginPath();
    },
    draw(event) {
      if (!this.isDrawing) return;
      this.context.strokeStyle = '#000';
      this.context.lineJoin = 'round';
      this.context.lineCap = 'round';
      this.context.lineWidth = 2;

      this.context.beginPath();
      this.context.moveTo(this.lastX, this.lastY);
      this.context.lineTo(event.offsetX, event.offsetY);
      this.context.stroke();
      [this.lastX, this.lastY] = [event.offsetX, event.offsetY];
    }
  }
};
</script>

<style>
.canvas-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 160px);
}
canvas {
  /* border: 1px solid #000; */
  display: block;
  top: -42px;
  position: relative;
  z-index: 0;
}
</style>
