export class StartDrawingCommand {
  constructor(store) {
    this.store = store;
  }

  execute() {
    this.store.startDrawing();
  }

  undo() {
    this.store.stopDrawing();
  }
}
