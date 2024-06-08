// src/stores/snackbar.js
import { defineStore } from 'pinia';

export const useSnackbarStore = defineStore('snackbar', {
  state: () => ({
    show: false,
    message: '',
    color: 'success'
  }),
  actions: {
    showSnackbar(newMessage, newColor = 'success') {
      this.message = newMessage;
      this.color = newColor;
      this.show = true;
      setTimeout(() => {
        this.show = false;
      }, 3000); // Snackbar will disappear after 3 seconds
    }
  }
});
