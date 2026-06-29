import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import dataWilayahSumatera from '../utils/datawilayah';
import useAuthStore from '../store/authStore'; 
import LoginView from './LoginView';
import '../styles/home.css'; 

const HomeView = () => {
  const navigate = useNavigate();
  const { user, logout, bahasaGlobal } = useAuthStore();

  const [isFeedLocked, setIsFeedLocked] = useState(false);
  const containerRef = useRef(null);
  const feedRef = useRef(null);

  // ⚡️ LAYER STATE CONTROLLER: REAL-TIME USER COINS DATABASE
  const [userCoins, setUserCoins] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [isCoinAuthPopupOpen, setIsCoinAuthPopupOpen] = useState(false);
  
  // 🌟 LAYER STATE CONTROLLER: AUTH OVERLAY DI BERANDA
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // ⚡️ STATE CONTROLLER: CORE REACTIVE SEARCH ENGINE
  const [pickup, setPickup] = useState('');
  const [tujuan, setTujuan] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [penumpang, setPenumpang] = useState(1);
  const [isDateActive, setIsDateActive] = useState(null);
  const [tanggalMinimalHariIni, setTanggalMinimalHariIni] = useState('');

  // Autocomplete Stream Cache States
  const [filteredAsal, setFilteredAsal] = useState([]);
  const [filteredTujuan, setFilteredTujuan] = useState([]);
  const [showAsalDropdown, setShowAsalDropdown] = useState(false);
  const [showTujuanDropdown, setShowTujuanDropdown] = useState(false);

  // Supabase Live Data Promo States
  const [listPromo, setListPromo] = useState([]);
  const [loadingPromo, setLoadingPromo] = useState(true);

  const asalRef = useRef(null);
  const tujuanRef = useRef(null);

  // 🌟 FIX SAFARI: Efek menghitung batasan tanggal minimal biar presisi di iOS & Android
  useEffect(() => {
    const hariIni = new Date();
    const opsiFormat = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('fr-CA', opsiFormat); // Menghasilkan format YYYY-MM-DD murni
    setTanggalMinimalHariIni(formatter.format(hariIni));
  }, []);

  // Fungsi mengambil saldo koin terbaru secara real-time dari tabel profiles Supabase
  const fetchBerandaUserCoins = async () => {
    if (!user) {
      setLoadingCoins(false);
      return;
    }
    try {
      setLoadingCoins(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setUserCoins(data.coins || 0);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data koin di beranda:", err.message);
      setUserCoins(user.user_metadata?.coins || 0);
    } finally {
      setLoadingCoins(false);
    }
  };

  useEffect(() => {
    fetchBerandaUserCoins();
  }, [user]);

  useEffect(() => {
    const elemenUtama = containerRef.current;
    if (!elemenUtama) return;

    const tanganiScrollParallax = () => {
      const posisiScroll = elemenUtama.scrollTop;
      if (posisiScroll >= 460) {
        setIsFeedLocked(true);
      } else {
        setIsFeedLocked(false);
      }
    };

    elemenUtama.addEventListener('scroll', tanganiScrollParallax);
    return () => elemenUtama.removeEventListener('scroll', tanganiScrollParallax);
  }, []);

  // ⚡️ LAYER STATE CONTROLLER: UI & TABS SYSTEM
  const [activeTabProduct, setActiveTabProduct] = useState('travel'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Dictionary Kamus Terjemahan Bahasa Dinamis Lengkap
  const t = {
    ID: {
      pagi: 'Selamat pagi', siang: 'Selamat siang', sore: 'Selamat sore', malam: 'Selamat malam',
      brandSub: 'Mitra Perjalanan Antar Kota',
      headline: 'Pergi ke mana\nhari ini? ✦',
      subHeadline: '320+ rute aktif · Sumatera & Jawa',
      tabTravel: 'Travel', tabBus: 'Bus', tabPaket: 'Paket',
      labelDari: 'Asal', labelKe: 'Tujuan', labelTanggal: 'Tanggal Pergi', labelPenumpang: 'Penumpang',
      placeholderAsal: 'Ketik Kota / Kabupaten Asal',
      placeholderTujuan: 'Mau Ke Kota / Kabupaten Mana?',
      hariIni: 'Hari Ini', besok: 'Besok',
      btnCari: 'Cari Tiket Sekarang',
      noteCari: 'Pesan travel antar kota dengan mudah dan cepat',
      ikutiKami: 'Ikuti kami',
      navTitle: 'Menu Navigasi',
      menuHome: 'Beranda Utama', menuAkun: 'Akun Saya', menuTiket: 'Pesanan Saya',
      menuPromo: 'Promo Spesial', menuBantuan: 'Pusat Bantuan', menuKeluar: 'Keluar Akun',
      logoutPrompt: 'Kamu yakin mau keluar nih?', iya: 'Iya', tidak: 'Tidak',
      alertLengkapi: 'Silakan lengkapi semua data pencarian terlebih dahulu!',
      anonim: 'MASUK / DAFTAR', subAnonim: 'Akses riwayat perjalanan kamu',
      secPromo: 'Promo Spesial', secLihat: 'Lihat semua', secRute: 'Rute Populer',
      secOperator: 'Operator Terpercaya', kursiText: '/ kursi', ulasanText: 'ulasan',
      loadPromo: 'Memuat promo terbaik...', noPromoTitle: 'Belum Ada Promo', noPromoDesc: 'Nantikan promo kejutan menarik dari TRAVELIND selanjutnya!',
      coinPopupTitle: 'Yuk, Gabung Member Travelind! 🌟',
      coinPopupDesc: 'Silakan masuk atau daftar akun terlebih dahulu untuk mulai mengumpulkan dan melihat jumlah Travelind Coins spesial milikmu.',
      coinPopupBtnAction: 'Masuk / Daftar Sekarang',
      coinPopupBtnCancel: 'Nanti Saja'
    },
    EN: {
      pagi: 'Good morning', siang: 'Good afternoon', sore: 'Good evening', malam: 'Good night',
      brandSub: 'Intercity Travel Partner',
      headline: 'Where are you\ngoing today? ✦',
      subHeadline: '320+ active routes · Sumatra & Java',
      tabTravel: 'Travel', tabBus: 'Bus', tabPaket: 'Parcel',
      labelDari: 'Origin', labelKe: 'Destination', labelTanggal: 'Departure Date', labelPenumpang: 'Passengers',
      placeholderAsal: 'Type Origin City / Regency',
      placeholderTujuan: 'Where City / Regency Are You Going?',
      hariIni: 'Today', besok: 'Tomorrow',
      btnCari: 'Search Tickets Now',
      noteCari: 'Book intercity travel easily and quickly',
      ikutiKami: 'Follow us',
      navTitle: 'Navigation Menu',
      menuHome: 'Main Home', menuAkun: 'My Account', menuTiket: 'My Bookings',
      menuPromo: 'Special Promo', menuBantuan: 'Help Center', menuKeluar: 'Log Out Account',
      logoutPrompt: 'Are you sure you want to log out?', iya: 'Yes', tidak: 'No',
      alertLengkapi: 'Please complete all search data first!',
      anonim: 'SIGN IN / SIGN UP', subAnonim: 'Access your travel history',
      secPromo: 'Special Promotions', secLihat: 'See all', secRute: 'Popular Routes',
      secOperator: 'Trusted Operators', kursiText: '/ seat', ulasanText: 'reviews',
      loadPromo: 'Loading best deals...', noPromoTitle: 'No Promotion Available', noPromoDesc: 'Stay tuned for exciting promotional surprises from TRAVELIND!',
      coinPopupTitle: 'Join Travelind Member! 🌟',
      coinPopupDesc: 'Please sign in or create an account first to start collecting and viewing your special Travelind Coins.',
      coinPopupBtnAction: 'Sign In / Sign Up Now',
      coinPopupBtnCancel: 'Later'
    }
  }[bahasaGlobal || 'ID'];

  const namaProfile = user ? (user.user_metadata?.full_name || user.email.split("@")[0].toUpperCase()) : t.anonim;
  const emailProfile = user?.email ? user.email : t.subAnonim;
  const inisialProfile = user ? namaProfile.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (asalRef.current && !asalRef.current.contains(e.target)) setShowAsalDropdown(false);
      if (tujuanRef.current && !tujuanRef.current.contains(e.target)) setShowTujuanDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    ambilDataPromoDariAdmin();
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ambilDataPromoDariAdmin = async () => {
    try {
      setLoadingPromo(true);
      const { data, error } = await supabase.from('promo').select('*');
      if (error) throw error;
      if (data) {
        const promoAktif = data.filter(p => p.is_aktif === true || p.is_aktif === 'true' || p.is_aktif === 1);
        setListPromo(promoAktif);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data tabel promo:", err);
    } finally {
      setLoadingPromo(false);
    }
  };

  const dapatkanWaktuGreeting = () => {
    const jam = new Date().getHours();
    if (jam < 11) return t.pagi;
    if (jam < 15) return t.siang;
    if (jam < 19) return t.sore;
    return t.malam;
  };

  const handleMencariAsalManual = (inputTarget) => {
    setPickup(inputTarget);
    const textKetik = inputTarget.toLowerCase();
    const hasilFilter = dataWilayahSumatera.filter(item => 
      item?.nama?.toLowerCase().includes(textKetik) || item?.prov?.toLowerCase().includes(textKetik)
    );
    setFilteredAsal(hasilFilter);
    setShowAsalDropdown(true);
  };

  const handleMencariTujuanManual = (inputTarget) => {
    setTujuan(inputTarget);
    const textKetik = inputTarget.toLowerCase();
    const hasilFilter = dataWilayahSumatera.filter(item => 
      item?.nama?.toLowerCase().includes(textKetik) || item?.prov?.toLowerCase().includes(textKetik)
    );
    setFilteredTujuan(hasilFilter);
    setShowTujuanDropdown(true);
  };

  const handleTukarRuteKota = () => {
    if (!pickup && !tujuan) return;
    const tampung = pickup;
    setPickup(tujuan);
    setTujuan(tampung);
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

  // 🌟 FIX SAFARI: Proteksi ganda penangkal tanggal mundur bandel di iOS
  const handleUbahTanggalAman = (targetValue) => {
    if (!targetValue) {
      setTanggal('');
      return;
    }
    if (targetValue < tanggalMinimalHariIni) {
      setTanggal(tanggalMinimalHariIni);
      setIsDateActive(0);
    } else {
      setTanggal(targetValue);
      setIsDateActive(null);
    }
  };

  // 🌟 LOGIKA PENGASAHAN PENGISIAN PENUMPANG SECARA MANUAL DI HP
  const handleUbahPenumpangManual = (value) => {
    if (value === '') {
      setPenumpang('');
      return;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) return;
    setPenumpang(parsed);
  };

  // Validasi saat kursor meninggalkan kotak input penumpang (On Blur)
  const handleValidasiPelepasanPenumpang = () => {
    if (penumpang === '' || penumpang <= 0) {
      setPenumpang(1);
    }
  };

  const handleCariTravel = async () => {
    if (!pickup || !tujuan || !tanggal) {
      alert(t.alertLengkapi);
      return;
    }

    const nilaiPenumpangFinal = penumpang === '' || penumpang <= 0 ? 1 : penumpang;
    const emailTerbaca = user?.email || localStorage.getItem("email_penumpang") || null;
    const namaTerbaca = user?.user_metadata?.full_name || "Pengguna Anonim";

    const dataPayload = {
      pickup_kota: pickup,
      tujuan_kota: tujuan,
      tanggal: tanggal,
      penumpang: parseInt(nilaiPenumpangFinal, 10),
      nama_penumpang: namaTerbaca,
      email_penumpang: emailTerbaca, 
      pickup_alamat: "Menunggu penentuan lokasi",
      pickup_lat: -0.9471, 
      pickup_lng: 100.4172
    };

    try {
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
      localStorage.setItem("penumpang", nilaiPenumpangFinal);
      localStorage.setItem("fresh_search_trigger", "true"); 

      navigate('/hasil-pencarian');
    } catch (err) {
      console.error(err);
      navigate('/hasil-pencarian');
    }
  };

  const handleEksekusiLogout = async () => {
    setIsLogoutConfirmOpen(false);
    await logout();
    window.location.reload();
  };

  const handleCoinBadgeClick = () => {
    if (user) {
      navigate('/coin-saya');
    } else {
      setIsCoinAuthPopupOpen(true);
    }
  };

  const pemicuPopupAuthBeranda = (modeDipilih) => {
    setAuthMode(modeDipilih);
    setIsLoginPopupOpen(true);
  };

  return (
    <div ref={containerRef} className="travelind-luxury-home-container" style={{ overflowY: 'auto' }}>
      
      {/* 📌 HEADER ATAS FIXED PANEL */}
      <div className="hero-top-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="user-profile-zone" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <div 
            className="home-avatar-click-node" 
            onClick={() => {
              if (user) navigate('/profil');
              else pemicuPopupAuthBeranda('login');
            }}
            style={{ 
              width: '42px', height: '42px', borderRadius: '12px', 
              background: 'rgba(255,255,255,0.15)', overflow: 'hidden', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--teal)' }}>{inisialProfile}</span>
            )}
          </div>

          <div className="user-profile-text">
            <span className="greeting-text" style={{ display: 'block' }}>{dapatkanWaktuGreeting()}</span>
            <h3 className="user-name-title" style={{ margin: 0 }}>{user ? (user.user_metadata?.full_name || 'User') : 'Tamu'}</h3>
          </div>
        </div>
        
        <div className="header-right-action-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="premium-home-coin-badge" onClick={handleCoinBadgeClick}>
            <div className="home-coin-badge-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#F5A623" stroke="#D4AF37" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="7" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="3 2"/>
                <path d="M12 7V17M9 10H14M9 14H14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="home-coin-badge-value">
              {!user ? '-' : loadingCoins ? '...' : userCoins.toLocaleString('id-ID')}
            </span>
          </div>

          <button type="button" className="sidebar-trigger-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* BLOCK SLOGAN & HEADLINE */}
      <div className="hero-gradient-block">
        <h1 className="hero-headline-text">
          {t.headline.split('\n')[0]}<br />{t.headline.split('\n')[1]}
        </h1>
        <div className="live-route-indicator">
          <span className="pulse-live-dot"></span>
          <span>{t.subHeadline}</span>
        </div>
      </div>

      {/* FLOATING CARD PEMESANAN */}
      <div className="floating-search-card-outer">
        <div className="floating-search-card">
          <div className="product-tab-row">
            <div className={`product-tab-item ${activeTabProduct === 'travel' ? 'active' : ''}`} onClick={() => setActiveTabProduct('travel')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
              <span>{t.tabTravel}</span>
            </div>
            <div className={`product-tab-item ${activeTabProduct === 'bus' ? 'active' : ''}`} onClick={() => setActiveTabProduct('bus')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              <span>{t.tabBus}</span>
            </div>
            <div className={`product-tab-item ${activeTabProduct === 'paket' ? 'active' : ''}`} onClick={() => setActiveTabProduct('paket')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              <span>{t.tabPaket}</span>
            </div>
          </div>

          {activeTabProduct !== 'travel' ? (
            <div className="locked-module-placeholder">
              <p>Fitur {activeTabProduct.toUpperCase()} akan segera hadir pada pembaruan tahap berikutnya.</p>
            </div>
          ) : (
            <div className="search-form-core-group">
              <div className="route-selection-row">
                <div className="route-field-box" ref={asalRef}>
                  <div className="route-label-sm">{t.labelDari}</div>
                  <input 
                    type="text" 
                    placeholder={t.placeholderAsal}
                    value={pickup}
                    onFocus={() => { setShowAsalDropdown(true); setFilteredAsal(dataWilayahSumatera); }}
                    onChange={(e) => handleMencariAsalManual(e.target.value)}
                    autoComplete="off"
                    className="route-city-input"
                  />
                  {showAsalDropdown && filteredAsal.length > 0 && (
                    <div className="luxury-autocomplete-dropdown-container">
                      <div className="luxury-autocomplete-scroll-area">
                        {filteredAsal.map((item, idx) => (
                          <div key={idx} className="dropdown-row-item" onMouseDown={() => { setPickup(item.nama); setShowAsalDropdown(false); }}>
                            <span>{item.nama}</span>
                            <small>{item.prov}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="circle-swap-action-btn" onClick={handleTukarRuteKota}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>
                  </svg>
                </div>

                <div className="route-field-box" ref={tujuanRef}>
                  <div className="route-label-sm">{t.labelKe}</div>
                  <input 
                    type="text" 
                    placeholder={t.placeholderTujuan}
                    value={tujuan}
                    onFocus={() => { setShowTujuanDropdown(true); setFilteredTujuan(dataWilayahSumatera); }}
                    onChange={(e) => handleMencariTujuanManual(e.target.value)}
                    autoComplete="off"
                    className="route-city-input"
                  />
                  {showTujuanDropdown && filteredTujuan.length > 0 && (
                    <div className="luxury-autocomplete-dropdown-container">
                      <div className="luxury-autocomplete-scroll-area">
                        {filteredTujuan.map((item, idx) => (
                          <div key={idx} className="dropdown-row-item" onMouseDown={() => { setTujuan(item.nama); setShowTujuanDropdown(false); }}>
                            <span>{item.nama}</span>
                            <small>{item.prov}</small>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="parameter-pencarian-row">
                {/* 🌟 FORM PICKER TANGGAL DENGAN PROTEKSI MULTI-BROWSER */}
                <div className="input-split-field">
                  <div className="field-label">{t.labelTanggal}</div>
                  <div className="field-input-wrapper">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    <input 
                      type="date" 
                      value={tanggal} 
                      min={tanggalMinimalHariIni} 
                      onChange={(e) => handleUbahTanggalAman(e.target.value)} 
                      className="date-raw-picker" 
                    />
                  </div>
                  <div className="mini-quick-date-container">
                    <button type="button" className={`mini-date-btn ${isDateActive === 0 ? 'active' : ''}`} onClick={() => handleSetQuickDate('hariIni')}>{t.hariIni}</button>
                    <button type="button" className={`mini-date-btn ${isDateActive === 1 ? 'active' : ''}`} onClick={() => handleSetQuickDate('besok')}>{t.besok}</button>
                  </div>
                </div>
                
                {/* 🌟 FIXED STEPPER: Tombol Plus/Minus Penuh & Responsif */}
                <div className="input-split-field">
                  <div className="field-label">{t.labelPenumpang}</div>
                  <div className="premium-stepper-container">
                    
                    <button 
                      type="button" 
                      className="stepper-action-node minus"
                      onClick={() => setPenumpang(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                    >
                      －
                    </button>
                    
                    <input 
                      type="number" 
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={penumpang} 
                      onChange={(e) => handleUbahPenumpangManual(e.target.value)}
                      onBlur={handleValidasiPelepasanPenumpang}
                      className="passenger-premium-input" 
                    />
                    
                    <button 
                      type="button" 
                      className="stepper-action-node plus"
                      onClick={() => setPenumpang(prev => (parseInt(prev, 10) || 0) + 1)}
                    >
                      ＋
                    </button>

                  </div>
                </div>
              </div>

              <button type="button" className="btn-search-travel-submit" onClick={handleCariTravel}>
                <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                {t.btnCari}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AREA SCROLL CONTENT SHEET */}
      <div className="home-feed-scroll-content">
        <div className="stats-metric-section">
          <div className="metric-badge-card">
            <div className="stat-number">32<span>+</span></div>
            <div className="stat-desc">{t.secOperator}</div>
          </div>
          <div className="metric-badge-card">
            <div className="stat-number">320<span>+</span></div>
            <div className="stat-desc">Rute Tersedia</div>
          </div>
          <div className="metric-badge-card">
            <div className="stat-number">4.<span>8</span></div>
            <div className="stat-desc">Rating Rata-rata</div>
          </div>
        </div>

        <div className="feed-header-row-layout">
          <h3 className="feed-section-title">{t.secPromo}</h3>
          <span className="see-all-trigger-btn" onClick={() => navigate('/promo')}>{t.secLihat} <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>
        
        <div className="horizontal-carousel-promo">
          {loadingPromo ? (
            <p style={{ fontSize: '12px', color: '#9AA3B2', padding: '10px' }}>{t.loadPromo}</p>
          ) : listPromo.length === 0 ? (
            <div className="promo-banner-card style-navy" style={{ width: '100%' }}>
              <h5 className="promo-title">{t.noPromoTitle}</h5>
              <p className="promo-sub">{t.noPromoDesc}</p>
            </div>
          ) : (
            listPromo.map((promo) => (
              <div key={promo.id} className={`promo-banner-card ${promo.tema_warna === 'coral' ? 'style-coral' : 'style-navy'}`}>
                <div className="promo-tag">
                  <svg width="10" height="10" fill="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  {promo.kode_kupon || 'PROMO'}
                </div>
                <h5 className="promo-title">{promo.judul_promo}</h5>
                <p className="promo-sub">{promo.deskripsi_singkat}</p>
                <span className="promo-btn" onClick={() => navigate(`/promo`)}>Pakai Promo</span>
              </div>
            ))
          )}
        </div>

        <div className="feed-header-row-layout" style={{ marginTop: '20px' }}>
          <h3 className="feed-section-title">{t.secRute}</h3>
          <span className="see-all-trigger-btn">{t.secLihat} <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
        </div>

        <div className="routes-shortcut-grid-layout">
          <div className="route-grid-item-card" onClick={() => { setPickup('Medan'); setTujuan('Padang'); }}>
            <div className="route-card-top-header">
              <div className="vehicle-mini-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
              <span className="hot-tag-badge">Populer</span>
            </div>
            <div className="route-from">Medan</div>
            <div className="route-arrow-down-svg">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7-7 7"/></svg>
            </div>
            <div className="route-to">Padang</div>
            <div className="route-starting-price">Rp120K</div>
          </div>

          <div className="route-grid-item-card" onClick={() => { setPickup('Palembang'); setTujuan('Lampung'); }}>
            <div className="route-card-top-header">
              <div className="vehicle-mini-icon">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/></svg>
              </div>
              <span className="hot-tag-badge blue-badge">Travel</span>
            </div>
            <div className="route-from">Palembang</div>
            <div className="route-arrow-down-svg">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7-7 7"/></svg>
            </div>
            <div className="route-to">Lampung</div>
            <div className="route-starting-price">Rp85K</div>
          </div>
        </div>

        <div className="feed-header-row-layout" style={{ marginTop: '20px' }}>
          <h3 className="feed-section-title">{t.secOperator}</h3>
        </div>

        <div className="horizontal-carousel-operators">
          <div className="operator-chip-item">
            <div className="operator-avatar-logo">ALS</div>
            <div className="operator-meta-info">
              <h6>Antar Lintas Sumatera</h6>
              <span className="rating"><svg width="10" height="10" fill="#F5A623" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 4.8 · 1.2rb {t.ulasanText}</span>
            </div>
          </div>
          <div className="operator-chip-item">
            <div className="operator-avatar-logo">NPM</div>
            <div className="operator-meta-info">
              <h6>PO NPM</h6>
              <span className="rating"><svg width="10" height="10" fill="#F5A623" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> 4.6 · 2.1rb {t.ulasanText}</span>
            </div>
          </div>
        </div>

        <footer className="main-footer" style={{ padding: '24px 0 10px 0', textAlign: 'center' }}>
            <p className="footer-title" style={{ fontSize: '12px', fontWeight: '700', color: '#9AA3B2', marginBottom: '8px' }}>{t.ikutiKami}</p>
            <div className="social-icons" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <a href="#tiktok" style={{ color: '#9AA3B2' }}><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14.94 1.08 2.27 1.81 3.71 2.05v3.83c-1.39-.06-2.76-.53-3.92-1.32-.38-.26-.73-.56-1.04-.89v7.12c.04 1.51-.31 3.02-1.03 4.33-.89 1.61-2.31 2.89-4.01 3.52-1.74.65-3.66.75-5.46.26-1.81-.48-3.46-1.57-4.63-3.11-1.14-1.51-1.71-3.41-1.61-5.3.09-1.92.93-3.75 2.37-5.03 1.44-1.29 3.35-1.99 5.27-1.96.42 0 .84.04 1.25.11v3.97c-.64-.22-1.33-.28-1.99-.18-.69.09-1.35.41-1.85.91-.53.53-.84 1.24-.87 1.99-.05.86.32 1.72.96 2.28.62.54 1.44.81 2.26.73.83-.07 1.6-.53 2.02-1.25.26-.45.38-.96.36-1.48V0h.23z"/></svg></a>
                <a href="#instagram" style={{ color: '#9AA3B2' }}><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01"/></svg></a>
                <a href="#facebook" style={{ color: '#9AA3B2' }}><svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/></svg></a>
            </div>
        </footer>
      </div>

      {/* LACI NAVIGATION MENU SIDEBAR */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <div className={`sidebar-container-block ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header-top">
          <span className="sidebar-title-label">
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
            {t.navTitle}
          </span>
          <button type="button" className="close-sidebar-trigger" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        <div className="sidebar-user-profile-badge" onClick={() => { setIsSidebarOpen(false); if (user) navigate('/profil'); else pemicuPopupAuthBeranda('login'); }}>
          <div 
            className="sidebar-avatar-circle-box"
            style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'var(--teal-light)', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--gray-200)', flexShrink: 0
            }}
          >
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--navy)' }}>{inisialProfile}</span>
            )}
          </div>
          <div className="profile-meta-text">
            <h6>{namaProfile}</h6>
            <p>{emailProfile}</p>
          </div>
        </div>
        <div className="sidebar-links-list">
          <button type="button" className="sidebar-menu-btn active-node" onClick={() => setIsSidebarOpen(false)}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
            {t.menuHome}
          </button>
          
          <button type="button" className="sidebar-menu-btn" onClick={() => { setIsSidebarOpen(false); if (user) navigate('/profil'); else pemicuPopupAuthBeranda('login'); }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            {t.menuAkun}
          </button>
          
          <button type="button" className="sidebar-menu-btn" onClick={() => { setIsSidebarOpen(false); navigate('/cek-tiket'); }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-3-12h.008v.008H13.5V6Zm0 6h.008v.008H13.5V12Zm0 6h.008v.008H13.5V18s-6 2.472-6-3.414c0-5.886 6-3.414 6-3.414ZM2.25 12a9.75 9.75 0 1 1 19.5 0 9.75 9.75 0 0 1-19.5 0Z" /></svg>
            {t.menuTiket}
          </button>
          
          <div className="sidebar-line-separator"></div>
          
          <button type="button" className="sidebar-menu-btn" onClick={() => { setIsSidebarOpen(false); navigate('/promo'); }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>
            {t.menuPromo}
          </button>
          
          <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="sidebar-menu-btn" style={{ textDecoration: 'none' }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-2.833A7.96 7.96 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" /></svg>
            {t.menuBantuan}
          </a>
          
          {user && (
            <button type="button" className="sidebar-menu-btn" onClick={() => { setIsSidebarOpen(false); setIsLogoutConfirmOpen(true); }} style={{ color: '#eb5757' }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" /></svg>
              {t.menuKeluar}
            </button>
          )}
        </div>
      </div>

      {/* MODAL BOTTOM SHEET: AJAKAN DAFTAR COIN */}
      <div className={`premium-popup-overlay ${isCoinAuthPopupOpen ? 'active' : ''}`} onClick={() => setIsCoinAuthPopupOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '10px', color: '#0B1F3A' }}>
            {t.coinPopupTitle}
          </h4>
          <p style={{ fontSize: '13px', color: '#657786', lineHeight: '1.5', marginBottom: '24px', padding: '0 8px' }}>
            {t.coinPopupDesc}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="btn-popup-action danger" 
              style={{ background: 'linear-gradient(135deg, var(--teal) 0%, #00B89C 100%)', color: 'var(--navy)' }}
              onClick={() => { 
                setIsCoinAuthPopupOpen(false); 
                pemicuPopupAuthBeranda('login');
              }}
            >
              {t.coinPopupBtnAction}
            </button>
            <button className="btn-popup-action cancel" onClick={() => setIsCoinAuthPopupOpen(false)}>
              {t.coinPopupBtnCancel}
            </button>
          </div>
        </div>
      </div>

      {/* SLIDE-UP POPUP LOGIN SHEET ASLI */}
      <div className={`premium-popup-overlay ${isLoginPopupOpen ? 'active' : ''}`} onClick={() => setIsLoginPopupOpen(false)}>
        <div className="premium-popup-sheet intense-padding" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          <LoginView key={authMode} initialMode={authMode} closePopup={() => setIsLoginPopupOpen(false)} />
        </div>
      </div>

      {/* MODAL BOTTOM SHEET: LOGOUT CONFIRM */}
      <div className={`premium-popup-overlay ${isLogoutConfirmOpen ? 'active' : ''}`} onClick={() => setIsLogoutConfirmOpen(false)}>
        <div className="premium-popup-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          <h5 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '20px', color: '#0B1F3A' }}>{t.logoutPrompt}</h5>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-popup-action danger" onClick={handleEksekusiLogout}>{t.iya}</button>
            <button className="btn-popup-action cancel" onClick={() => setIsLogoutConfirmOpen(false)}>{t.tidak}</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomeView;