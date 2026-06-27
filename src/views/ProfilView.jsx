import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LoginView from './LoginView'; 
import '../styles/profil.css';

const ProfilView = () => {
  const navigate = useNavigate();
  const { user, logout, bahasaGlobal, setBahasaGlobal } = useAuthStore();

  // State Controller Pop-up
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false); 
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  const textContent = {
    ID: {
      title: 'PROFIL',
      masuk: 'Masuk',
      daftar: 'Daftar',
      menu1: 'Profil Saya',
      menu2: 'Coin saya',
      menu3: 'Riwayat Perjalanan',
      menu4: 'Bahasa',
      logoutBtn: 'Keluar Akun',
      logoutPrompt: 'Kamu yakin mau keluar nih?',
      iya: 'Iya',
      tidak: 'Tidak',
      alertMsg: 'Silakan login dulu untuk melihat Profil kamu.'
    },
    EN: {
      title: 'PROFILE',
      masuk: 'Sign In',
      daftar: 'Sign Up',
      menu1: 'My Profile',
      menu2: 'My Coins',
      menu3: 'Travel History',
      menu4: 'Language',
      logoutBtn: 'Log Out Account',
      logoutPrompt: 'Are you sure you want to log out?',
      iya: 'Yes',
      tidak: 'No',
      alertMsg: 'Please log in first to view your Profile.'
    }
  };

  const t = textContent[bahasaGlobal];
  const namaAsliUser = user?.user_metadata?.full_name || user?.email?.split('@')[0].toUpperCase();

  const handleMenuClick = (targetPath) => {
    if (!user) {
      setIsAlertOpen(true);
    } else {
      navigate(targetPath);
    }
  };

  const toggleLanguage = () => {
    setBahasaGlobal(bahasaGlobal === 'ID' ? 'EN' : 'ID');
  };

  const handleEksekusiLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await logout();
    window.location.reload();
  };

  // 🌟 TRIGGER MODAL DENGAN MENGATUR MODE SECARA SPESIFIK
  const pemicuPopupAuth = (modeDipilih) => {
    setAuthMode(modeDipilih);
    setIsLoginPopupOpen(true);
  };

  return (
    <div className="app-container app-profil-container">
      <div className="profil-curved-header-bg"></div>

      <header className="profil-header-nav">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>{t.title}</h2>
      </header>

      <div className="profile-card-center-wrapper">
        <div className="avatar-circle-frame">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="Avatar" />
          ) : (
            <i className="fa-solid fa-user avatar-placeholder-icon"></i>
          )}
        </div>

        {user ? (
          <>
            <h4 className="user-text-name">{namaAsliUser}</h4>
            <p className="user-text-email">{user.email}</p>
          </>
        ) : (
          /* 🌟 1. PERBAIKAN: Klik tombol langsung mengeset mode popup secara presisi */
          <div className="auth-btn-row-trigger">
            <button className="btn-outline-auth" onClick={() => pemicuPopupAuth('login')}>{t.masuk}</button>
            <button className="btn-outline-auth" onClick={() => pemicuPopupAuth('register')}>{t.daftar}</button>
          </div>
        )}
      </div>

      <div className="menu-list-container-premium">
        <button className="card-menu-item-premium" onClick={() => handleMenuClick('/edit-profil')}>
          <div className="menu-item-premium-left">
            <i className="fa-regular fa-user"></i>
            <span>{t.menu1}</span>
          </div>
          <i className="fa-solid fa-chevron-right menu-item-premium-right"></i>
        </button>

        <button className="card-menu-item-premium" onClick={() => handleMenuClick('/coin-saya')}>
          <div className="menu-item-premium-left">
            <i className="fa-solid fa-coins" style={{ color: '#d69e2e' }}></i>
            <span>{t.menu2}</span>
          </div>
          <i className="fa-solid fa-chevron-right menu-item-premium-right"></i>
        </button>

        <button className="card-menu-item-premium" onClick={() => handleMenuClick('/riwayat-perjalanan')}>
          <div className="menu-item-premium-left">
            <i className="fa-solid fa-route" style={{ color: '#2b6cb0' }}></i>
            <span>{t.menu3}</span>
          </div>
          <i className="fa-solid fa-chevron-right menu-item-premium-right"></i>
        </button>

        <button className="card-menu-item-premium" onClick={toggleLanguage}>
          <div className="menu-item-premium-left">
            <i className="fa-solid fa-language" style={{ color: '#319795' }}></i>
            <span>{t.menu4} ({bahasaGlobal})</span>
          </div>
          <i className="fa-solid fa-chevron-right menu-item-premium-right"></i>
        </button>

        {user && (
          <button 
            type="button" 
            className="card-menu-item-premium" 
            onClick={() => setIsLogoutConfirmOpen(true)}
            style={{ marginTop: '20px', background: '#ffeef0', border: '1px solid #fed7d7' }}
          >
            <div className="menu-item-premium-left" style={{ color: 'var(--danger-red)' }}>
              <i className="fa-solid fa-arrow-right-from-bracket" style={{ color: 'var(--danger-red)' }}></i>
              <span>{t.logoutBtn}</span>
            </div>
            <i className="fa-solid fa-chevron-right" style={{ color: '#feb2b2' }}></i>
          </button>
        )}
      </div>

      {/* 🚨 ALERT POPUP BELUM LOGIN */}
      <div className={`premium-popup-overlay ${isAlertOpen ? 'active' : ''}`} onClick={() => setIsAlertOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <div className="popup-sheet-notch"></div>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '46px', color: 'var(--accent-orange)', marginBottom: '16px' }}></i>
          <h5 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 20px 0', color: '#2d3748' }}>{t.alertMsg}</h5>
          <button className="btn-login-primary" onClick={() => setIsAlertOpen(false) || pemicuPopupAuth('login')}>
            Masuk Sekarang
          </button>
        </div>
      </div>

      {/* 🌟 LOGOUT POPUP CONFIRM */}
      <div className={`premium-popup-overlay ${isLogoutConfirmOpen ? 'active' : ''}`} onClick={() => setIsLogoutConfirmOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
          <div className="popup-sheet-notch"></div>
          <i className="fa-solid fa-circle-question" style={{ fontSize: '48px', color: 'var(--danger-red)', marginBottom: '16px' }}></i>
          <h5 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 24px 0', color: '#2d3748' }}>{t.logoutPrompt}</h5>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button className="btn-login-primary" onClick={handleEksekusiLogout} style={{ margin: 0, background: 'var(--danger-red)' }}>
              {t.iya}
            </button>
            <button className="btn-login-primary" onClick={() => setIsLogoutConfirmOpen(false)} style={{ margin: 0, background: '#e2e8f0', color: '#4a5568' }}>
              {t.tidak}
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 SLIDE-UP DOCK POPUP LOGIN (DENGAN RE-REJECT MODE) */}
      <div className={`premium-popup-overlay ${isLoginPopupOpen ? 'active' : ''}`} onClick={() => setIsLoginPopupOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          {/* Key mode ditambahkan di sini agar komponen re-render sesuai klik Masuk/Daftar */}
          <LoginView key={authMode} initialMode={authMode} closePopup={() => setIsLoginPopupOpen(false)} />
        </div>
      </div>

      {/* FIXED NAV BAR */}
      <nav className="fixed-bottom-nav-profil">
        <button className="nav-link-item" onClick={() => navigate('/home')}>
          <i className="fa-solid fa-house"></i>
          <span>{bahasaGlobal === 'ID' ? 'Beranda' : 'Home'}</span>
        </button>
        <button className="nav-link-item" onClick={() => navigate('/cek-tiket')}>
          <i className="fa-solid fa-ticket"></i>
          <span>{bahasaGlobal === 'ID' ? 'Tiket Saya' : 'My Tickets'}</span>
        </button>
        <button className="nav-link-item active" onClick={() => navigate('/profil')}>
          <i className="fa-solid fa-user"></i>
          <span>{bahasaGlobal === 'ID' ? 'Profil' : 'Profile'}</span>
        </button>
      </nav>

    </div>
  );
};

export default ProfilView;