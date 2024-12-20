// src/commands/DeleteBlockCommand.js
export class DeleteImageCommand {
  constructor(image, store) {
    this.image = image
    this.store = store
  }

  execute() {
    this.store.deleteImage(this.image)
  }

  undo() {
    this.store.addImage(this.image)
  }
}
