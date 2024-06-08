// src/commands/AddBlockCommand.js
export class AddBlockCommand {
  constructor(block, store) {
    this.block = block;
    this.store = store;
  }

  execute() {
    this.store.addBlock(this.block);
  }

  undo() {
    this.store.deleteBlock(this.block);
  }
}
