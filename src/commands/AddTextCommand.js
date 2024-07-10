// src/commands/AddBlockCommand.js
export class AddTextCommand {
  constructor(text, store) {
    this.text = text;
    this.store = store;
  }

  execute() {
    this.store.addText(this.text);
  }

  undo() {
    this.store.deleteText(this.text);
  }
}
