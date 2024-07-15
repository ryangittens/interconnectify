// src/commands/AddBlockCommand.js
export class AddConnectionPointCommand {
  constructor(cp, store) {
    this.cp = cp;
    this.store = store;
  }

  execute() {
    this.store.addConnectionPoint(this.cp);
  }

  undo() {
    this.store.deleteConnectionPoint(this.cp);
  }
}
