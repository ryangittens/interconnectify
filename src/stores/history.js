import { defineStore } from 'pinia';

export const useHistoryStore = defineStore('history', {
  state: () => ({
    undoStack: [],
    redoStack: []
  }),
  actions: {
    executeCommand(command) {
      command.execute();
      console.log('added to undo');
      this.undoStack.push(command);
      this.redoStack = []; // Clear redo stack on new command
    },
    undo() {
      if (this.undoStack.length) {
        const command = this.undoStack.pop();
        if (command) {
          command.undo();
          this.redoStack.push(command);
        }
      }
    },
    redo() {
      if (this.redoStack.length) {
        const command = this.redoStack.pop();
        if (command && command?.redo) {
          command.redo();
          this.undoStack.push(command);
        } else {
          command.execute();
          this.undoStack.push(command);
        }
      }
    }
  }
});
