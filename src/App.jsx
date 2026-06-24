import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashView from './views/SplashView';
import HomeView from './views/HomeView';
import HasilPencarianView from './views/HasilPencarianView';
import DetailPemesananView from './views/DetailPemesananView';
import PembayaranView from './views/PembayaranView';
import SuccessView from './views/SuccessView';
import CekTiketView from './views/CekTiketView';
import PromoView from './views/PromoView';
import ProfilView from './views/ProfilView';

function App() {
  return (
    <Router>
      <Routes>
        {/* Jalur Pertama Kali Aplikasi Dibuka */}
        <Route path="/" element={<SplashView />} />
        
        {/* Dasbor Utama */}
        <Route path="/home" element={<HomeView />} />

        {/* Alur Pemesanan Tiket Perjalanan */}
        <Route path="/hasil-pencarian" element={<HasilPencarianView />} />
        
        {/* Jalur Halaman 3 (Menggunakan path /pemesanan agar tombol navigasi cocok) */}
        <Route path="/pemesanan" element={<DetailPemesananView />} />
        
        {/* Jalur Halaman 4 */}
        <Route path="/pembayaran" element={<PembayaranView />} />

         <Route path="/cek-tiket" element={<CekTiketView />} />

         <Route path="/profil" element={<ProfilView/>} />

        {/* Halaman Pantau Real-Time Pasca-Bayar */}
        <Route path="/success" element={<SuccessView />} />
        <Route path="/promo" element={<PromoView/>} />
      </Routes>
    </Router>
  );
}

export default App;