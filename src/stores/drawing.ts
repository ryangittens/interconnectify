import { defineStore } from 'pinia';

interface Point {
  x: number;
  y: number;
}

interface Line {
  type: 'solid' | 'dashed';
  color: string;
  points: any[];
}

interface Block {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface SvgStoreState {
  blocks: any[];
  lines: any[];
  selectedBlock: {} | null;
  isDrawing: boolean;
  lineType: 'solid' | 'dashed';
  lineColor: string;
  currentLine: any[];
  activeTool: string;
}

export const useSvgStore = defineStore('svgStore', {
  state: (): SvgStoreState => ({
    blocks: [],
    lines: [],
    selectedBlock: null,
    isDrawing: false,
    lineType: 'solid',
    lineColor: '#000000',
    currentLine: [],
    activeTool: ''
  }),
  actions: {
    addBlock(block: {} | null) {
      this.blocks.push(block);
    },
    selectBlock(block: {} | null) {
      this.selectedBlock = block;
    },
    moveBlock(block: any, dx: number, dy: number) {
      const index = this.blocks.findIndex((b) => b.id === block.id);
      if (index !== -1) {
        this.blocks[index].x += dx;
        this.blocks[index].y += dy;
      }
    },
    deleteBlock(block: any) {
      this.blocks = this.blocks.filter((b) => b.id !== block.id);
      if (this.selectedBlock && this.selectedBlock.id === block.id) {
        this.selectedBlock = null;
      }
    },
    startDrawing() {
      this.isDrawing = true;
      this.activeTool = `${this.lineType}-${this.lineColor}`; // Set the active tool
    },
    stopDrawing() {
      if (this.currentLine.length > 0) {
        this.lines.push({
          type: this.lineType,
          color: this.lineColor,
          points: [...this.currentLine]
        });
        this.currentLine = [];
      }
      this.isDrawing = false;
      this.activeTool = '';
    },
    addLinePoint(point: any) {
      this.currentLine.push(point);
    },
    setLineType(type: 'solid' | 'dashed') {
      this.lineType = type;
    },
    setLineColor(color: string) {
      this.lineColor = color;
    },
    serializeState() {
      return JSON.stringify({
        blocks: this.blocks,
        lines: this.lines
      });
    },
    deserializeState(serializedState: string) {
      const data = JSON.parse(serializedState);
      this.blocks = data.blocks;
      this.lines = data.lines;
    }
  }
});
