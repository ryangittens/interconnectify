import { defineStore } from 'pinia';

export const useHistoryStore = defineStore('history', {
  state: () => ({
    undoStack: [],
    redoStack: []
  }),
  actions: {
    executeCommand(command) {
      command.execute();
      this.undoStack.push(command);
      this.redoStack = []; // Clear redo stack on new command
    },
    undo() {
      const command = this.undoStack.pop();
      if (command) {
        command.undo();
        this.redoStack.push(command);
      }
    },
    redo() {
      const command = this.redoStack.pop();
      if (command) {
        command.execute();
        this.undoStack.push(command);
      }
    }
  }
});
