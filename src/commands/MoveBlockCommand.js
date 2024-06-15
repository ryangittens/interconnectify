export class MoveBlockCommand {
  constructor(block, dx, dy, store) {
    this.block = block;
    this.dx = dx;
    this.dy = dy;
    this.store = store;
    this.originalBlockPosition = { x: block.x - dx, y: block.y - dy }; // Adjusted to ensure capturing initial position correctly
    this.originalLines = this.getConnectedLines(store.lines);
  }

  getConnectedLines(lines) {
    return lines
      .filter((line) => line.points.some((point) => point.blockId === this.block.id))
      .map((line) => ({
        id: line.id,
        points: line.points.map((point) => ({ ...point }))
      }));
  }

  execute() {
    // Capture the final state of the lines after the block has moved
    this.newLines = this.getConnectedLines(this.store.lines);
    //this.store.moveBlock(this.block, this.dx, this.dy);
  }

  undo() {
    // Restore the block position
    this.block.x = this.originalBlockPosition.x;
    this.block.y = this.originalBlockPosition.y;

    // Restore the lines to their original positions
    this.store.lines.forEach((line) => {
      const originalLine = this.originalLines.find((l) => l.id === line.id);
      if (originalLine) {
        line.points = originalLine.points.map((point) => ({ ...point }));
      }
    });

    this.store.updateBlockAndLines(this.block, this.originalLines);
  }

  redo() {
    // Restore the block position
    this.block.x = this.originalBlockPosition.x + this.dx;
    this.block.y = this.originalBlockPosition.y + this.dy;

    // Restore the lines to their new positions
    this.store.lines.forEach((line) => {
      const newLine = this.newLines.find((l) => l.id === line.id);
      if (newLine) {
        line.points = newLine.points.map((point) => ({ ...point }));
      }
    });

    this.store.updateBlockAndLines(this.block, this.newLines);
  }
}
