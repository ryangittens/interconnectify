// src/stores/svgStore.js
import { defineStore } from 'pinia';

export const useSvgStore = defineStore('svgStore', {
  state: () => ({
    blocks: [],
    lines: [],
    selectedBlock: null,
    selectedLine: null, // Add this
    isDrawing: false,
    lineType: 'solid',
    lineColor: '#000000',
    currentLine: [],
    activeTool: '',
    svg: null,
    viewBox: { x: 0, y: 0, width: 0, height: 0 },
    zoomLevel: 1
  }),
  actions: {
    addBlock(block) {
      this.blocks.push(block);
    },
    selectBlock(block) {
      this.selectedBlock = block;
      this.selectedLine = null; // Deselect line when block is selected
    },
    moveBlock(block, dx, dy) {
      const index = this.blocks.findIndex((b) => b.id === block.id);
      if (index !== -1) {
        this.blocks[index].x += dx;
        this.blocks[index].y += dy;
      }
    },
    deleteBlock(block) {
      this.blocks = this.blocks.filter((b) => b.id !== block.id);
      if (this.selectedBlock && this.selectedBlock.id === block.id) {
        this.selectedBlock = null;
      }
    },
    startDrawing() {
      this.isDrawing = true;
      this.activeTool = `${this.lineType}-${this.lineColor}`; // Set the active tool
    },
    addLine(line) {
      if (line) {
        this.lines.push(line);
      }
    },
    stopDrawing(line) {
      if (line) {
        this.addLine(line);
      } else if (this.currentLine.length > 0) {
        let newLine = {
          object: 'line',
          id: Date.now(),
          type: this.lineType,
          color: this.lineColor,
          points: [...this.currentLine]
        };
        this.addLine(newLine);
        this.currentLine = [];
      }
      this.isDrawing = false;
      this.activeTool = '';
    },
    addLinePoint(point) {
      this.currentLine.push(point);
    },
    setLineType(type) {
      this.lineType = type;
    },
    setLineColor(color) {
      this.lineColor = color;
    },
    selectLine(line) {
      this.selectedLine = line;
      this.selectedBlock = null; // Deselect block when line is selected
    },
    deleteLine(line) {
      this.lines = this.lines.filter((l) => l.id !== line.id);
      if (this.selectedLine && this.selectedLine.id === line.id) {
        this.selectedLine = null;
      }
    },
    removeLastLinePoint() {
      if (this.currentLine.length > 0) {
        this.currentLine.pop();
      }
    },
    removeLastLine() {
      if (this.lines.length > 0) {
        this.lines.pop();
      }
    },
    serializeState() {
      return JSON.stringify({
        blocks: this.blocks,
        lines: this.lines,
        viewBox: this.viewBox,
        zoomLevel: this.zoomLevel
      });
    },
    deserializeState(serializedState) {
      const data = JSON.parse(serializedState);
      const { clientWidth, clientHeight } = this.svg;
      this.blocks = data?.blocks || [];
      this.lines = data?.lines || [];
      this.viewBox = data?.viewBox || { x: 0, y: 0, width: clientWidth, height: clientHeight };
      this.zoomLevel = data?.zoomLevel || 1;
    },
    setSvgElement(svg) {
      this.svg = svg;
    },
    setViewBox(x, y, width, height) {
      this.viewBox = { x, y, width, height };
    },
    centerSVG() {
      if (this.svg) {
        this.viewBox.x = 0;
        this.viewBox.y = 0;
      }
    }
  }
});
