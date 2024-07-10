// src/commands/DeleteBlockCommand.js
export class DeleteTextCommand {
  constructor(text, store) {
    this.text = text;
    this.store = store;
  }

  execute() {
    this.store.deleteText(this.text);
  }

  undo() {
    this.store.addText(this.text);
  }
}
