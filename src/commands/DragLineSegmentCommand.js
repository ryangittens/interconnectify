export class DragLineSegmentCommand {
  constructor(line, originalPoints, newPoints, store) {
    this.line = line;
    this.originalPoints = originalPoints.map((point) => ({ ...point }));
    this.newPoints = newPoints.map((point) => ({ ...point }));
    this.store = store;
  }

  execute() {
    this.applyPoints(this.newPoints);
  }

  undo() {
    this.applyPoints(this.originalPoints);
  }

  applyPoints(points) {
    this.line.points = points.map((point) => ({ ...point }));
  }
}
