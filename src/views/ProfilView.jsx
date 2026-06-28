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
      title: 'Profil',
      masuk: 'Masuk',
      daftar: 'Daftar',
      menu1: 'Profil Saya',
      menu2: 'Coin Saya',
      menu3: 'Riwayat Perjalanan',
      menu4: 'Bahasa',
      logoutBtn: 'Keluar Akun',
      logoutPrompt: 'Kamu yakin mau keluar nih?',
      iya: 'Iya',
      tidak: 'Tidak',
      alertMsg: 'Silakan login dulu untuk melihat Profil kamu.',
      navBtmHome: 'Beranda'
    },
    EN: {
      title: 'Profile',
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
      alertMsg: 'Please log in first to view your Profile.',
      navBtmHome: 'Home'
    }
  };

  const t = textContent[bahasaGlobal || 'ID'];
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

  const pemicuPopupAuth = (modeDipilih) => {
    setAuthMode(modeDipilih);
    setIsLoginPopupOpen(true);
  };

  return (
    <div className="travelind-luxury-profile-container">
      
      {/* HEADER NAVIGATION NAVY SOLID */}
      <header className="profile-top-bar">
        <button type="button" className="back-action-btn" onClick={() => navigate('/home')} title={t.navBtmHome}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
        </button>
        <h2 className="profile-page-title">{t.title}</h2>
        <div style={{ width: '40px' }}></div>
      </header>

      {/* SCROLLER ENGINE WRAPPER INTERNAL */}
      <div className="profile-main-content">

        {/* PROFILE CARD DISPLAY BOX */}
        <div className="profile-user-avatar-card">
          <div className="avatar-circle-frame">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Avatar" />
            ) : (
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
            )}
          </div>

          {user ? (
            <div className="profile-meta-details">
              <h4 className="user-text-name">{namaAsliUser}</h4>
              <p className="user-text-email">{user.email}</p>
            </div>
          ) : (
            <div className="auth-btn-row-trigger">
              <button type="button" className="btn-outline-auth-node accent-login" onClick={() => pemicuPopupAuth('login')}>{t.masuk}</button>
              <button type="button" className="btn-outline-auth-node" onClick={() => pemicuPopupAuth('register')}>{t.daftar}</button>
            </div>
          )}
        </div>

        {/* LUXURY ACCORDION OPTIONS LIST */}
        <div className="menu-list-container-premium">
          <button type="button" className="card-menu-item-premium" onClick={() => handleMenuClick('/edit-profil')}>
            <div className="menu-item-premium-left">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>{t.menu1}</span>
            </div>
            <svg className="chevron-right" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>

          <button type="button" className="card-menu-item-premium" onClick={() => handleMenuClick('/coin-saya')}>
            <div className="menu-item-premium-left text-icon-gold">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.165c2.193 1.69 5.378 1.69 7.572 0L17 15.182m-8.571-5.118L9 9.899c2.193-1.69 5.378-1.69 7.572 0l.214.165m-8.572 2.51h7.572"/></svg>
              <span>{t.menu2}</span>
            </div>
            <svg className="chevron-right" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>

          <button type="button" className="card-menu-item-premium" onClick={() => handleMenuClick('/riwayat-perjalanan')}>
            <div className="menu-item-premium-left text-icon-blue">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25M2.25 17.25a3.375 3.375 0 116.75 0M2.25 17.25a3.375 3.375 0 106.75 0M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25"/></svg>
              <span>{t.menu3}</span>
            </div>
            <svg className="chevron-right" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>

          <button type="button" className="card-menu-item-premium" onClick={toggleLanguage}>
            <div className="menu-item-premium-left text-icon-teal">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"/></svg>
              <span>{t.menu4} ({bahasaGlobal})</span>
            </div>
            <svg className="chevron-right" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
          </button>

          {user && (
            <button 
              type="button" 
              className="card-menu-item-premium action-logout-node" 
              onClick={() => setIsLogoutConfirmOpen(true)}
            >
              <div className="menu-item-premium-left">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
                <span>{t.logoutBtn}</span>
              </div>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </button>
          )}
        </div>

      </div>

      {/* 🚨 POPUP ALERT BELUM LOGIN */}
      <div className={`premium-popup-overlay ${isAlertOpen ? 'active' : ''}`} onClick={() => setIsAlertOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          <svg style={{ color: '#FF6B4A', marginBottom: '14px' }} width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
          <h5 className="popup-sheet-title">{t.alertMsg}</h5>
          <button type="button" className="btn-popup-sheet-action-submit" onClick={() => setIsAlertOpen(false) || pemicuPopupAuth('login')}>
            {t.masuk}
          </button>
        </div>
      </div>

      {/* 🌟 POPUP CONFIRM LOGOUT */}
      <div className={`premium-popup-overlay ${isLogoutConfirmOpen ? 'active' : ''}`} onClick={() => setIsLogoutConfirmOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          <svg style={{ color: '#FF6B4A', marginBottom: '14px' }} width="44" height="44" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"/></svg>
          <h5 className="popup-sheet-title">{t.logoutPrompt}</h5>
          <div className="popup-sheet-buttons-flex">
            <button type="button" className="btn-popup-sheet-action-submit node-danger" onClick={handleEksekusiLogout}>
              {t.iya}
            </button>
            <button type="button" className="btn-popup-sheet-action-submit node-cancel" onClick={() => setIsLogoutConfirmOpen(false)}>
              {t.tidak}
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 SLIDE-UP POPUP LOGIN SHEET */}
      <div className={`premium-popup-overlay ${isLoginPopupOpen ? 'active' : ''}`} onClick={() => setIsLoginPopupOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          <LoginView key={authMode} initialMode={authMode} closePopup={() => setIsLoginPopupOpen(false)} />
        </div>
      </div>

    </div>
  );
};

export default ProfilView;