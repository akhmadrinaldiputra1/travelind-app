import { create } from 'zustand';
import { supabase } from '../config/supabaseClient';

const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  // 🌐 State Bahasa Global (Default: ID)
  bahasaGlobal: 'ID', 

  // Fungsi untuk mengubah bahasa dari halaman mana pun
  setBahasaGlobal: (lang) => set({ bahasaGlobal: lang }),

  // 📡 Radar otomatis memantau perubahan sesi (Login/Logout)
  initializeAuth: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        set({ user: session.user, isLoading: false });
        useAuthStore.getState().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null, isLoading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        set({ user: session.user, isLoading: false });
        useAuthStore.getState().fetchProfile(session.user.id);
      } else {
        set({ user: null, profile: null, isLoading: false });
      }
    });

    return subscription;
  },

  // 🔄 Sinkronisasi data user dari tabel profiles
  fetchProfile: async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (data) set({ profile: data });
    } catch (err) {
      console.error("Gagal memuat profil database:", err);
    }
  },

  // 🚪 Logout bersih tanpa jejak cache hantu
  logout: async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    set({ user: null, profile: null });
  }
}));

export default useAuthStore;