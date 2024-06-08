export class DeleteLineCommand {
  constructor(line, store) {
    this.line = line;
    this.store = store;
  }

  execute() {
    this.store.deleteLine(this.line);
  }

  undo() {
    this.store.addLine(this.line);
  }
}
