import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import dataWilayahSumatera from '../utils/datawilayah';
import useAuthStore from '../store/authStore'; 
import '../styles/home.css';

const HomeView = () => {
  const navigate = useNavigate();

  // 🌟 Ambil data sesi global, fungsi logout, dan bahasa global dari Zustand Store
  const { user, logout, bahasaGlobal } = useAuthStore();

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER: UI LAYERS (SIDEBAR OPEN/CLOSE)
  // ----------------==========================================================
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false); // 🌟 State untuk mengontrol popup konfirmasi keluar

  // --------------------------------------------------------------------------
  // ⚡️ STATE CONTROLLER: REACTIVE SEARCH FORM ENGINE
  // --------------------------------------------------------------------------
  const [pickup, setPickup] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [penumpang, setPenumpang] = useState(1);
  const [isDateActive, setIsDateActive] = useState(null);

  // Autocomplete Stream Cache States
  const [filteredAsal, setFilteredAsal] = useState([]);
  const [filteredTujuan, setFilteredTujuan] = useState([]);
  const [showAsalDropdown, setShowAsalDropdown] = useState(false);
  const [showTujuanDropdown, setShowTujuanDropdown] = useState(false);

  // Click-Outside Focus DOM Reference Tracker
  const asalRef = useRef(null);
  const tujuanRef = useRef(null);

  // Dictionary Kamus Kamar Terjemahan Bahasa Dinamis
  const t = {
    ID: {
      brandSub: 'Mitra Perjalanan Antar Kota',
      placeholderAsal: 'Ketik Kota / Kabupaten Asal',
      placeholderTujuan: 'Mau Ke Kota / Kabupaten Mana?',
      hariIni: 'Hari Ini',
      besok: 'Besok',
      btnCari: 'Cari travel',
      noteCari: 'Pesan travel antar kota dengan mudah dan cepat',
      ikutiKami: 'Ikuti kami',
      navTitle: 'Menu Navigasi',
      menuHome: 'Beranda Utama',
      menuAkun: 'Akun Saya',
      menuTiket: 'Pesanan Saya',
      menuPromo: 'Promo Spesial',
      menuBantuan: 'Pusat Bantuan',
      menuKeluar: 'Keluar Akun',
      logoutPrompt: 'Kamu yakin mau keluar nih?',
      iya: 'Iya',
      tidak: 'Tidak',
      alertLengkapi: 'Silakan lengkapi semua data pencarian terlebih dahulu!',
      navBtmHome: 'Beranda',
      navBtmTiket: 'Tiket Saya',
      navBtmProfil: 'Profil',
      anonim: 'MASUK / DAFTAR',
      subAnonim: 'Akses riwayat perjalanan kamu'
    },
    EN: {
      brandSub: 'Intercity Travel Partner',
      placeholderAsal: 'Type Origin City / Regency',
      placeholderTujuan: 'Where City / Regency Are You Going?',
      hariIni: 'Today',
      besok: 'Tomorrow',
      btnCari: 'Search Travel',
      noteCari: 'Book intercity travel easily and quickly',
      ikutiKami: 'Follow us',
      navTitle: 'Navigation Menu',
      menuHome: 'Main Home',
      menuAkun: 'My Account',
      menuTiket: 'My Bookings',
      menuPromo: 'Special Promo',
      menuBantuan: 'Help Center',
      menuKeluar: 'Log Out Account',
      logoutPrompt: 'Are you sure you want to log out?',
      iya: 'Yes',
      tidak: 'No',
      alertLengkapi: 'Please complete all search data first!',
      navBtmHome: 'Home',
      navBtmTiket: 'My Tickets',
      navBtmProfil: 'Profile',
      anonim: 'SIGN IN / SIGN UP',
      subAnonim: 'Access your travel history'
    }
  }[bahasaGlobal || 'ID'];

  // 🌟 PERBAIKAN: Menarik Nama Asli Lengkap dari metadata registrasi
  const namaProfile = user ? (user.user_metadata?.full_name || user.email.split("@")[0].toUpperCase()) : t.anonim;
  const emailProfile = user?.email ? user.email : t.subAnonim;
  const inisialProfile = user ? namaProfile.charAt(0).toUpperCase() : '?';

  // ----------------=========================================================
  // 🔄 CORE APPLICATION LIFE-CYCLE
  // ----------------=========================================================
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (asalRef.current && !asalRef.current.contains(e.target)) setShowAsalDropdown(false);
      if (tujuanRef.current && !tujuanRef.current.contains(e.target)) setShowTujuanDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ----------------==========================================================
  // 🛫 STREAM MEMORY CACHE FILTER: AUTOCOMPLETE
  // ----------------------------------------------------------------==========
  const handleMencariAsalManual = (inputTarget) => {
    setPickup(inputTarget);
    const textKetik = inputTarget ? inputTarget.toLowerCase() : '';
    const hasilFilter = dataWilayahSumatera.filter(item => 
      (item?.nama && item.nama.toLowerCase().includes(textKetik)) || 
      (item?.prov && item.prov.toLowerCase().includes(textKetik))
    );
    setFilteredAsal(hasilFilter);
    setShowAsalDropdown(true);
  };

  const handleMencariTujuanManual = (inputTarget) => {
    setTujuan(inputTarget);
    const textKetik = inputTarget ? inputTarget.toLowerCase() : '';
    const hasilFilter = dataWilayahSumatera.filter(item => 
      (item?.nama && item.nama.toLowerCase().includes(textKetik)) || 
      (item?.prov && item.prov.toLowerCase().includes(textKetik))
    );
    setFilteredTujuan(hasilFilter);
    setShowTujuanDropdown(true);
  };

  // ----------------==========================================================
  // 💾 TRANSACTION DATA MECHANISM: INITIAL PUSH BACKEND SYSTEM
  // ----------------------------------------------------------------==========
  const handleCariTravel = async () => {
    if (!pickup || !tujuan || !tanggal) {
      alert(t.alertLengkapi);
      return;
    }

    const emailTerbaca = user?.email || localStorage.getItem("email_penumpang") || null;
    const namaTerbaca = user?.user_metadata?.full_name || "Pengguna Anonim";

    const dataPayload = {
      pickup_kota: pickup,
      tujuan_kota: tujuan,
      tanggal: tanggal,
      penumpang: parseInt(penumpang) || 1,
      nama_penumpang: namaTerbaca,
      email_penumpang: emailTerbaca, 
      pickup_alamat: "Menunggu penentuan lokasi",
      pickup_lat: -0.9471, 
      pickup_lng: 100.4172
    };

    try {
      console.log("🚀 Mengirim Manifest Rute Awal ke Cloud Supabase:", dataPayload);
      const { data, error } = await supabase
        .from("booking_temp")
        .insert([dataPayload])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem("booking_id", data.id);
      localStorage.setItem("pickup", pickup);
      localStorage.setItem("tujuan", tujuan);
      localStorage.setItem("tanggal", tanggal);
      localStorage.setItem("penumpang", penumpang);
      localStorage.setItem("fresh_search_trigger", "true"); 

      navigate('/hasil-pencarian');
    } catch (err) {
      console.error("❌ Detail Error Kirim Supabase:", err);
      navigate('/hasil-pencarian');
    }
  };

  const handleSetQuickDate = (type) => {
    const targetDate = new Date();
    if (type === 'besok') targetDate.setDate(targetDate.getDate() + 1);
    
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    
    setTanggal(`${yyyy}-${mm}-${dd}`);
    setIsDateActive(type === 'hariIni' ? 0 : 1);
  };

  const handleNavigasiAkun = () => {
    setIsSidebarOpen(false);
    navigate('/profil'); 
  };

  // 🌟 PERBAIKAN: Fungsi logout final pasca klik popup iya
  const handleEksekusiLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await logout();
    window.location.reload();
  };

  return (
    <div className="travelind-home-wrapper">
      
      {/* SCOPED APP HEADER */}
      <header className="main-header">
        <div className="brand-wrapper">
          <h1 className="brand-title">TRAVELIND</h1>
          <p className="brand-subtitle">{t.brandSub}</p>
        </div>
        <button type="button" className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Buka Menu Drawer">
          <i className="fa-solid fa-bars-staggered"></i>
        </button>
      </header>

      {/* WEBVIEW MOMENTUM SCROLLER CONTAINER */}
      <div className="content-scroller">
        <main className="content-wrapper" style={{ padding: '0 16px', marginTop: '-50px', width: '100%' }}>
          <div className="search-card" style={{ width: '100%', boxSizing: 'border-box', padding: '20px 16px', gap: '14px' }}>
            
            {/* COMPONENT AUTOCOMPLETE: KOTA PENJEMPUTAN ASAL */}
            <div className="input-group location-box" ref={asalRef} style={{ width: '100%', position: 'relative' }}>
              <div className="input-with-icon" style={{ position: 'relative', width: '100%', display: 'block' }}>
                <i className="fa-solid fa-location-dot input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#02596b' }}></i>
                <input 
                  type="text" 
                  placeholder={t.placeholderAsal}
                  value={pickup}
                  onFocus={() => {
                    setShowAsalDropdown(true);
                    setFilteredAsal(dataWilayahSumatera);
                  }}
                  onChange={(e) => handleMencariAsalManual(e.target.value)}
                  autoComplete="off"
                  style={{ width: '100%', height: '52px', boxSizing: 'border-box', padding: '12px 40px 12px 48px', fontSize: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'block' }}
                />
                <i className="fa-solid fa-chevron-down arrow-icon" style={{ position: 'absolute', right: '16px', left: 'auto', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#a0aec0' }}></i>
              </div>
              {showAsalDropdown && filteredAsal.length > 0 && (
                <div className="dropdown-content">
                  {filteredAsal.map((item, index) => (
                    <div 
                      key={index} 
                      className="dropdown-item" 
                      onMouseDown={() => { setPickup(item.nama); setShowAsalDropdown(false); }}
                    >
                      {item.nama} <span className="dropdown-province-tag">{item.prov}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPONENT AUTOCOMPLETE: KOTA TUJUAN DESTINASI */}
            <div className="input-group destination-box" ref={tujuanRef} style={{ width: '100%', position: 'relative' }}>
              <div className="input-with-icon" style={{ position: 'relative', width: '100%', display: 'block' }}>
                <i className="fa-solid fa-car input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#02596b' }}></i>
                <input 
                  type="text" 
                  placeholder={t.placeholderTujuan}
                  value={tujuan}
                  onFocus={() => {
                    setShowTujuanDropdown(true);
                    setFilteredTujuan(dataWilayahSumatera);
                  }}
                  onChange={(e) => handleMencariTujuanManual(e.target.value)}
                  autoComplete="off"
                  style={{ width: '100%', height: '52px', boxSizing: 'border-box', padding: '12px 40px 12px 48px', fontSize: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'block' }}
                />
                <i className="fa-solid fa-chevron-down arrow-icon" style={{ position: 'absolute', right: '16px', left: 'auto', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#a0aec0' }}></i>
              </div>
              {showTujuanDropdown && filteredTujuan.length > 0 && (
                <div className="dropdown-content">
                  {filteredTujuan.map((item, index) => (
                    <div 
                      key={index} 
                      className="dropdown-item" 
                      onMouseDown={() => { setTujuan(item.nama); setShowTujuanDropdown(false); }}
                    >
                      {item.nama} <span className="dropdown-province-tag">{item.prov}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMPONENT INTERAKTIF: NATIVE CALENDAR PICKER & BUTTON SHORTCUT */}
            <div className="input-group date-box" style={{ width: '100%' }}>
              <div className="date-input-container" style={{ position: 'relative', width: '100%', display: 'block' }}>
                <div className="input-with-icon" style={{ position: 'relative', width: '100%', display: 'block' }}>
                  <i className="fa-solid fa-calendar input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#02596b' }}></i>
                  <input 
                    type="date" 
                    value={tanggal}
                    onChange={(e) => {
                      setTanggal(e.target.value);
                      setIsDateActive(null);
                    }}
                    style={{ width: '100%', height: '52px', boxSizing: 'border-box', padding: '12px 145px 12px 48px', fontSize: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'block' }}
                  />
                </div>
                <div className="quick-date">
                  <button type="button" className={isDateActive === 0 ? 'active' : ''} onClick={() => handleSetQuickDate('hariIni')}>{t.hariIni}</button>
                  <button type="button" className={isDateActive === 1 ? 'active' : ''} onClick={() => handleSetQuickDate('besok')}>{t.besok}</button>
                </div>
              </div>
            </div>

            {/* COMPONENT FORM: JUMLAH KURSI MANIFES */}
            <div className="input-group passenger-box" style={{ width: '100%' }}>
              <div className="input-with-icon" style={{ position: 'relative', width: '100%', display: 'block' }}>
                <i className="fa-solid fa-user input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#02596b' }}></i>
                <input 
                  type="number" 
                  value={penumpang} 
                  min="1" 
                  onChange={(e) => setPenumpang(Math.max(1, parseInt(e.target.value) || 1))}
                  style={{ width: '100%', height: '52px', boxSizing: 'border-box', padding: '12px 16px 12px 48px', fontSize: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'block' }}
                />
              </div>
            </div>

            <button type="button" className="btn-primary" onClick={handleCariTravel}>{t.btnCari}</button>
            <p className="search-note">{t.noteCari}</p>
          </div>

          <footer className="main-footer">
              <p className="footer-title">{t.ikutiKami}</p>
              <div className="social-icons">
                  <a href="#" aria-label="TikTok"><i className="fa-brands fa-tiktok"></i></a>
                  <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                  <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
              </div>
          </footer>
        </main>
      </div>

      {/* ====================================================================
         ⚡️ NAVIGATION DRAWER SIDEBAR LACI SIDE
         ==================================================================== */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <nav className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title"><i className="fa-solid fa-layer-group"></i> {t.navTitle}</span>
          <button type="button" className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Tutup Menu">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="sidebar-profile-card" onClick={handleNavigasiAkun}>
          <div className="avatar-circle">{inisialProfile}</div>
          <div className="profile-card-text">
            <h6>{namaProfile}</h6>
            <p>{emailProfile}</p>
          </div>
        </div>
        
        <div className="sidebar-content">
          <button type="button" className="menu-item menu-item-active" onClick={() => setIsSidebarOpen(false)}>
            <i className="fa-solid fa-house"></i> {t.menuHome}
          </button>
          
          <button type="button" className="menu-item" onClick={handleNavigasiAkun}>
            <i className="fa-solid fa-circle-user"></i> {t.menuAkun}
          </button>

          <button type="button" className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/cek-tiket'); }}>
            <i className="fa-solid fa-ticket"></i> {t.menuTiket}
          </button>

          <div className="menu-divider"></div>

          <button type="button" className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/promo'); }}>
            <i className="fa-solid fa-tags"></i> {t.menuPromo}
          </button>

          <a href="https://wa.me/6281234567890?text=Halo%20CS%20TRAVELIND,%20saya%20butuh%20bantuan%20terkait%20pemesanan%20travel." 
             target="_blank" rel="noreferrer" className="menu-item">
            <i className="fa-solid fa-headset"></i> {t.menuBantuan}
          </a>
          
          {user && (
            /* 🌟 PERBAIKAN: Mengganti window.confirm lama dengan menembak modal sheet konfirmasi */
            <button type="button" className="menu-item" onClick={() => setIsSidebarOpen(false) || setIsLogoutConfirmOpen(true)} style={{ color: '#eb5757', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
              <i className="fa-solid fa-arrow-right-from-bracket" style={{ color: '#eb5757' }}></i> {t.menuKeluar}
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <p>©️ 2026 TRAVELIND Startup. v2.0.0</p>
        </div>
      </nav>

      {/* ====================================================================
         🌟 POPUP BOTTOM SHEET CONFIRM LOGOUT (MEMINJAM GAYA PROFIL.CSS)
         ==================================================================== */}
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

      {/* ====================================================================
         📌 COMPONENT STICKY: MOBILE FIXED BOTTOM NAVIGATION
         ==================================================================== */}
      <nav className="bottom-nav">
        <button type="button" className="nav-link active" onClick={() => navigate('/home')}>
          <i className="fa-solid fa-house"></i>
          <span>{t.navBtmHome}</span>
        </button>
        <button type="button" className="nav-link" onClick={() => navigate('/cek-tiket')}>
          <i className="fa-solid fa-ticket"></i>
          <span>{t.navBtmTiket}</span>
        </button>
        <button type="button" className="nav-link" onClick={handleNavigasiAkun}>
          <i className="fa-solid fa-user"></i>
          <span>{t.navBtmProfil}</span>
        </button>
      </nav>

    </div>
  );
};

export default HomeView;