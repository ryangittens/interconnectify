// src/commands/DeleteBlockCommand.js
export class ScaleBlockCommand {
  constructor(block, scale, store) {
    this.block = block
    this.store = store
    this.oldScale = block.scale
    this.newScale = scale
  }

  execute() {
    this.store.scaleBlock(this.block, this.newScale)
  }

  undo() {
    this.store.scaleBlock(this.block, this.oldScale)
  }
}
