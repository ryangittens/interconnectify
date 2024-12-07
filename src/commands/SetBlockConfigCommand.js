// src/commands/DeleteBlockCommand.js
export class SetBlockConfigCommand {
  constructor(block, configuration, store) {
    this.block = block
    this.store = store
    this.oldConfig = block.configuration
    this.newConfig = configuration
  }

  execute() {
    this.store.setBlockConfig(this.block, this.newConfig)
  }

  undo() {
    this.store.setBlockConfig(this.block, this.oldConfig)
  }
}
