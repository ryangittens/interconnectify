export class RemoveLastLinePointCommand {
  constructor(store) {
    this.store = store;
    this.removedPoint = null;
  }

  execute() {
    this.removedPoint = this.store.removeLastLinePoint();
  }

  undo() {
    if (this.removedPoint) {
      this.store.addLinePoint(this.removedPoint);
    }
  }
}
