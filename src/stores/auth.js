// src/stores/auth.js
import { defineStore } from 'pinia';
import { supabase } from '@/utils/supabaseClient';
import { router } from '@/router';
export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    returnUrl: null
  }),
  actions: {
    async login(email, password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw new Error(error.message);
      }

      this.user = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(this.returnUrl || '/dashboard/default');
    },
    async register(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        throw new Error(error.message);
      }

      this.user = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(this.returnUrl || '/dashboard/default');
    },
    async logout() {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      this.user = null;
      localStorage.removeItem('user');
      router.push('/auth/login');
    }
  }
});
