export class MoveTextCommand {
  constructor(text, dx, dy, store) {
    this.text = text
    this.dx = dx
    this.dy = dy
    this.store = store
    this.originalTextPosition = { x: text.x - dx, y: text.y - dy } // Adjusted to ensure capturing initial position correctly
  }

  execute() {
    // Capture the final state of the lines after the block has moved

  }

  undo() {
    // Restore the block position
    this.text.x = this.originalTextPosition.x
    this.text.y = this.originalTextPosition.y
  }

  redo() {
    // Restore the block position
    this.text.x = this.originalTextPosition.x + this.dx
    this.text.y = this.originalTextPosition.y + this.dy
  }
}
