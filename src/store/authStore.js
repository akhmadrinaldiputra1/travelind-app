import { create } from 'zustand';
import { supabase } from '../config/supabaseClient';

const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  // 🌐 State Bahasa Global (Mengambil dari localStorage jika ada, default: 'ID')
  bahasaGlobal: localStorage.getItem('travelind_bahasa') || 'ID', 

  // Fungsi untuk mengubah bahasa dari halaman mana pun + mengunci di localStorage
  setBahasaGlobal: (lang) => {
    localStorage.setItem('travelind_bahasa', lang);
    set({ bahasaGlobal: lang });
  },

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

  // 🚪 Logout bersih tanpa jejak cache hantu (Menyisakan preference bahasa agar tidak reset)
  logout: async () => {
    const bahasaSaatIni = useAuthStore.getState().bahasaGlobal;
    await supabase.auth.signOut();
    localStorage.clear();
    // Kembalikan preference bahasa setelah clear
    localStorage.setItem('travelind_bahasa', bahasaSaatIni);
    set({ user: null, profile: null });
  }
}));

export default useAuthStore;