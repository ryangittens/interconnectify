// src/commands/DeleteBlockCommand.js
export class DeleteConnectionPointCommand {
  constructor(cp, store) {
    this.cp = cp;
    this.store = store;
  }

  execute() {
    this.store.deleteConnectionPoint(this.cp);
  }

  undo() {
    this.store.addConnectionPoint(this.cp);
  }
}
