// src/commands/AddBlockCommand.js
export class AddRectangleCommand {
  constructor(rect, store) {
    this.rect = rect;
    this.store = store;
  }

  execute() {
    this.store.addRectangle(this.rect);
  }

  undo() {
    this.store.deleteRectangle(this.rect);
  }
}
