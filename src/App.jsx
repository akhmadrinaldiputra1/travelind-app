import React, { useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore'; 

// 🚨 IMPORT PEMBUNGKUS LAYOUT UTAMA DI SINI 🚨
import MainLayout from './layouts/MainLayout';

import SplashView from './views/SplashView';
import HomeView from './views/HomeView';
import HasilPencarianView from './views/HasilPencarianView';
import DetailPemesananView from './views/DetailPemesananView';
import PembayaranView from './views/PembayaranView';
import SuccessView from './views/SuccessView';
import CekTiketView from './views/CekTiketView';
import PromoView from './views/PromoView';
import ProfilView from './views/ProfilView';
import LoginView from './views/LoginView';
import RiwayatView from './views/RiwayatView';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    const subscription = initializeAuth();
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        /* 1. Halaman yang TIDAK memiliki menu navigasi bawah (Stand-alone Views) */
        <Route path="/" element={<SplashView />} />
        <Route path="/login" element={<LoginView />} />
        <Route path="/hasil-pencarian" element={<HasilPencarianView />} />
        <Route path="/pemesanan" element={<DetailPemesananView />} />
        <Route path="/pembayaran" element={<PembayaranView />} />
        <Route path="/success" element={<SuccessView />} />
        <Route path="/riwayat-perjalanan" element={<RiwayatView />} />

        /* 🚨 2. KUNCI UTAMA: Bungkus halaman-halaman ini di dalam MainLayout 🚨 */
        <Route element={<MainLayout />}>
          {/* Semua halaman di dalam blok ini otomatis menampilkan menu bawah 4 pilihan */}
          <Route path="/home" element={<HomeView />} />
          <Route path="/cek-tiket" element={<CekTiketView />} />
          <Route path="/promo" element={<PromoView />} />
          <Route path="/profil" element={<ProfilView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;