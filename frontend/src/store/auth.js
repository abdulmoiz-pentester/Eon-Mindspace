// src/store/auth.js
import { defineStore } from 'pinia' // or 'zustand' depending on your setup

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
  }),
  actions: {
    login(credentials) {
      // Your login logic
    },
    logout() {
      // Your logout logic
    }
  }
})
