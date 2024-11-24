export class AddLinePointCommand {
  constructor(store, point) {
    this.store = store
    this.point = point
  }

  execute() {
    this.store.addLinePoint(this.point)
  }

  undo() {
    this.store.removeLastLinePoint()
  }
}
