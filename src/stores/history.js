// src/stores/history.js
import { defineStore } from 'pinia'

export const useHistoryStore = defineStore('history', {
  state: () => ({
    undoStack: [],
    redoStack: [],
    saved: true, // Track if changes are saved
  }),
  actions: {
    executeCommand(command) {
      if (typeof command.execute === 'function') {
        command.execute()
        this.undoStack.push(command)
        this.redoStack = [] // Clear redo stack on new command
        this.saved = false // Mark changes as unsaved
      } else {
        console.error('Command does not have an execute method', command)
      }
    },
    undo() {
      if (this.undoStack.length) {
        const command = this.undoStack.pop()
        if (command && typeof command.undo === 'function') {
          command.undo()
          this.redoStack.push(command)
          this.saved = false // Mark changes as unsaved
        } else {
          console.error('Command does not have an undo method', command)
        }
      }
    },
    redo() {
      if (this.redoStack.length) {
        const command = this.redoStack.pop()
        if (command) {
          if (typeof command.redo === 'function') {
            command.redo()
          } else if (typeof command.execute === 'function') {
            command.execute()
          } else {
            console.error('Command does not have a redo or execute method', command)
            return
          }
          this.undoStack.push(command)
          this.saved = false // Mark changes as unsaved
        }
      }
    },
    markSaved() {
      this.saved = true // Mark changes as saved
    },
    clearHistory() {
      this.undoStack = []
      this.redoStack = []
      this.markSaved() // Mark changes as saved
    },
  },
})
