// src/commands/DeleteBlockCommand.js
export class DeleteBlockCommand {
  constructor(block, store) {
    this.block = block;
    this.store = store;
  }

  execute() {
    this.store.deleteBlock(this.block);
  }

  undo() {
    this.store.addBlock(this.block);
  }
}
