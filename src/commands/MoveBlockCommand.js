// src/commands/MoveBlockCommand.js
export class MoveBlockCommand {
  constructor(block, dx, dy, store) {
    this.block = block;
    this.dx = dx;
    this.dy = dy;
    this.store = store;
  }

  execute() {
    this.store.moveBlock(this.block, this.dx, this.dy);
  }

  undo() {
    this.store.moveBlock(this.block, -this.dx, -this.dy);
  }
}
