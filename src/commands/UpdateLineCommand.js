// src/commands/UpdateLineCommand.js
export class UpdateLineCommand {
  constructor(line, newValues, oldValues, store) {
    this.line = line
    this.newValues = newValues
    this.oldValues = oldValues
    this.store = store
  }

  execute() {
    Object.assign(this.line, this.newValues)
    this.store.recalculateLine(this.line)
  }

  undo() {
    Object.assign(this.line, this.oldValues)
    this.store.recalculateLine(this.line)
  }
}