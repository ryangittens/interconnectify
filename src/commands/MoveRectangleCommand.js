export class MoveRectangleCommand {
  constructor(rect, dx, dy, store) {
    this.rect = rect
    this.dx = dx
    this.dy = dy
    this.store = store
    this.originalRectPosition = { x: rect.x - dx, y: rect.y - dy } // Adjusted to ensure capturing initial position correctly
  }

  execute() {
    // Capture the final state of the lines after the block has moved
    //this.newLines = this.getConnectedLines(this.store.lines)
    //this.store.moveBlock(this.block, this.dx, this.dy);
  }

  undo() {
    // Restore the block position
    this.rect.x = this.originalRectPosition.x
    this.rect.y = this.originalRectPosition.y

    this.store.updateRect(this.rect)
  }

  redo() {
    // Restore the block position
    this.rect.x = this.originalRectPosition.x + this.dx
    this.rect.y = this.originalRectPosition.y + this.dy

    this.store.updateRect(this.rect)
  }
}
