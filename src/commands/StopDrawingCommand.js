export class StopDrawingCommand {
  constructor(store) {
    this.store = store;
    this.line = null;
  }
  execute() {
    if (this?.line) {
      this.store.stopDrawing(this.line);
    } else {
      this.store.stopDrawing();
      this.line = this.store.lines.at(-1);
    }
  }

  undo() {
    this.store.removeLastLine();
  }
}
