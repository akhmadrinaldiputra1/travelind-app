import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bahasaGlobal } = useAuthStore();

  const t = {
    ID: { navHome: 'Beranda', navTiket: 'Tiket Saya', navBantuan: 'Bantuan', navProfil: 'Profil' },
    EN: { navHome: 'Home', navTiket: 'My Tickets', navBantuan: 'Help', navProfil: 'Profile' }
  }[bahasaGlobal || 'ID'];

  const pathname = location.pathname;

  return (
    <div style={{
      width: '100%',
      maxWidth: '450px',
      height: '100vh',
      height: '100dvh',
      margin: '0 auto',
      backgroundColor: '#F7F8FA',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden', /* Kunci mutlak agar bodi shell tidak melar kebawah */
      position: 'relative',
      boxShadow: '0 0 40px rgba(0,0,0,0.1)'
    }}>
      
      {/* AREA UTAMA: Tempat HomeView dirender. Diset overflow agar scroll internal aktif penuh */}
      <div style={{ flex: 1, width: '100%', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', scrollbarWidth: 'none' }}>
        <Outlet />
      </div>

      {/* 📌 NAVIGASI BAWAH KONSISTEN (DIKUNCI DI STRUKTUR PALING BAWAH LAYAR) */}
      <nav style={{
        width: '100%',
        height: '64px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #EAECF0',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 9999,
        flexShrink: 0 /* Mencegah bar navigasi tergencet menjadi 0px */
      }}>
        
        {/* Tombol Beranda */}
        <button 
          type="button" 
          onClick={() => navigate('/home')} 
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: (pathname === '/home' || pathname === '/') ? '#00D4B8' : '#9AA3B2', fontWeight: '600', fontSize: '10px', cursor: 'pointer', flex: 1 }}
        >
          <i className="fa-solid fa-house" style={{ fontSize: '18px' }}></i>
          <span>{t.navHome}</span>
        </button>
        
        {/* Tombol Tiket Saya */}
        <button 
          type="button" 
          onClick={() => navigate('/cek-tiket')} 
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: pathname === '/cek-tiket' ? '#00D4B8' : '#9AA3B2', fontWeight: '600', fontSize: '10px', cursor: 'pointer', flex: 1 }}
        >
          <i className="fa-solid fa-ticket" style={{ fontSize: '18px' }}></i>
          <span>{t.navTiket}</span>
        </button>
        
        {/* Tombol Bantuan */}
        <button 
          type="button" 
          onClick={() => navigate('/bantuan')} 
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: pathname === '/bantuan' ? '#00D4B8' : '#9AA3B2', fontWeight: '600', fontSize: '10px', cursor: 'pointer', flex: 1 }}
        >
          <i className="fa-solid fa-headset" style={{ fontSize: '18px' }}></i>
          <span>{t.navBantuan}</span>
        </button>
        
        {/* Tombol Profil */}
        <button 
          type="button" 
          onClick={() => navigate('/profil')} 
          style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: pathname === '/profil' ? '#00D4B8' : '#9AA3B2', fontWeight: '600', fontSize: '10px', cursor: 'pointer', flex: 1 }}
        >
          <i className="fa-solid fa-circle-user" style={{ fontSize: '18px' }}></i>
          <span>{t.navProfil}</span>
        </button>
      </nav>

    </div>
  );
};

export default MainLayout;