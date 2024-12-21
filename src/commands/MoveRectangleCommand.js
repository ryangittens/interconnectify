export class MoveRectangleCommand {
  constructor(rect, newX, newY, store) {
    this.rect = rect
    this.newX = newX
    this.newY = newY
    this.store = store
    this.originalRectPosition = { x: rect.x, y: rect.y } // Adjusted to ensure capturing initial position correctly
  }

  execute() {
    // Capture the final state of the lines after the block has moved
    //this.newLines = this.getConnectedLines(this.store.lines)
    this.store.moveRect(this.rect, this.newX, this.newY)
    this.rect.x = this.newX
    this.rect.y = this.newY
  }

  undo() {
    // Restore the block position
    this.rect.x = this.originalRectPosition.x
    this.rect.y = this.originalRectPosition.y

    //this.store.updateRect(this.rect)
  }

  redo() {
    // Restore the block position
    this.rect.x = this.newX
    this.rect.y = this.newY

    //this.store.updateRect(this.rect)
  }
}
