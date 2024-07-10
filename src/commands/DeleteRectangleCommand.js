// src/commands/DeleteBlockCommand.js
export class DeleteRectangleCommand {
  constructor(rect, store) {
    this.rect = rect;
    this.store = store;
  }

  execute() {
    this.store.deleteRectangle(this.rect);
  }

  undo() {
    this.store.addRectangle(this.rect);
  }
}
