export class MoveConnectionPointCommand {
  constructor(cp, dx, dy, store) {
    this.cp = cp
    this.dx = dx
    this.dy = dy
    this.store = store
    this.originalCPPosition = { x: cp.x - dx, y: cp.y - dy } // Adjusted to ensure capturing initial position correctly
  }

  execute() {

  }

  undo() {
    // Restore the block position
    this.cp.x = this.originalCPPosition.x
    this.cp.y = this.originalCPPosition.y

  }

  redo() {
    // Restore the block position
    this.cp.x = this.originalCPPosition.x + this.dx
    this.cp.y = this.originalCPPosition.y + this.dy

  }
}
