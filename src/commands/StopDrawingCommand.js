export class StopDrawingCommand {
  constructor(store) {
    this.store = store;
    this.line = store.currentLine.slice();
  }

  execute() {
    this.store.stopDrawing();
  }

  undo() {
    this.store.removeLastLine();
  }
}
