import React, { useEffect } from 'react'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore'; 

import SplashView from './views/SplashView';
import HomeView from './views/HomeView';
import HasilPencarianView from './views/HasilPencarianView';
import DetailPemesananView from './views/DetailPemesananView';
import PembayaranView from './views/PembayaranView';
import SuccessView from './views/SuccessView';
import CekTiketView from './views/CekTiketView';
import PromoView from './views/PromoView';

// 🌟 PASTIKAN BARIS INI MENGARAH KE PROFILVIEW YANG SUDAH KITA BERSIHKAN 🌟
import ProfilView from './views/ProfilView';

// 🌟 TAMBAHKAN DUA BARIS IMPORT VIEW BARU INI 🌟
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
        <Route path="/" element={<SplashView />} />
        <Route path="/home" element={<HomeView />} />
        <Route path="/hasil-pencarian" element={<HasilPencarianView />} />
        <Route path="/pemesanan" element={<DetailPemesananView />} />
        <Route path="/pembayaran" element={<PembayaranView />} />
        <Route path="/cek-tiket" element={<CekTiketView />} />
        <Route path="/success" element={<SuccessView />} />
        <Route path="/promo" element={<PromoView />} />

        {/* 🌟 PASTIKAN DUA RUTE BARU INI SUDAH TERPASANG DI SINI 🌟 */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/profil" element={<ProfilView />} />
        <Route path="/riwayat-perjalanan" element={<RiwayatView />} />
      </Routes>
    </Router>
  );
}

export default App;