import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import dataWilayahSumatera from '../utils/dataWilayah';
import '../styles/home.css';

const HomeView = () => {
  const navigate = useNavigate();

  // ----------------==========================================================
  // ⚡️ STATE CONTROLLER: UI LAYERS (TAB, SIDEBAR, & PORTAL AUTH)
  // ------------------------------------------------==========================
  const [currentTab, setCurrentTab] = useState('beranda'); // 'beranda' | 'akun'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // ----------------==========================================================
  // ⚡️ STATE CONTROLLER: REACTIVE SEARCH FORM ENGINE
  // ----------------==========================================================
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

  // ----------------==========================================================
  // ⚡️ STATE CONTROLLER: SUPABASE CLOUD AUTH & TRANSACTION HISTORIES
  // ----------------==========================================================
  const [userSession, setUserSession] = useState(null);
  const [userProfile, setUserProfile] = useState({ nama: 'MASUK / DAFTAR', email: 'Akses riwayat perjalanan kamu', inisial: '?' });
  const [authEmail, setAuthEmail] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [riwayatTransaksi, setRiwayatTransaksi] = useState([]);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);

  // ----------------=========================================================
  // 🔄 CORE APPLICATION LIFE-CYCLE: SUPABASE SECURITY CONTROL
  // ------------------------------------------------=========================
  useEffect(() => {
    // Jalur inter-halaman: Cek instruksi buka tab langsung dari local gawai
    const tabPancingan = localStorage.getItem("buka_tab_langsung");
    if (tabPancingan === "akun") {
      localStorage.removeItem("buka_tab_langsung");
      setCurrentTab('akun');
    }

    // Ambil token sesi aktif pertama kali gawai memuat aplikasi
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncUserSessionEngine(session);
    });

    // Jalur OTP Link: Monitor perubahan status login otentikasi global cloud server
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔒 Perubahan Status Autentikasi Supabase:", event);
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        syncUserSessionEngine(session);
      }
    });

    // Deteksi ketukan di luar box autocomplete untuk menutup daftar laci wilayah
    const handleClickOutside = (e) => {
      if (asalRef.current && !asalRef.current.contains(e.target)) setShowAsalDropdown(false);
      if (tujuanRef.current && !tujuanRef.current.contains(e.target)) setShowTujuanDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 🤝 MUTATION ENGINE: SINKRONISASI AKUN DUA JALUR (GUEST VS AUTHED USER)
  const syncUserSessionEngine = (session) => {
    if (session && session.user) {
      setUserSession(session);
      const emailUser = session.user.email;
      const namaUser = emailUser.split("@")[0].toUpperCase();

      // Kunci data kredensial terotentikasi ke penyimpanan lokal
      localStorage.setItem("nama_penumpang", namaUser);
      localStorage.setItem("email_penumpang", emailUser);

      setUserProfile({
        nama: namaUser,
        email: emailUser,
        inisial: namaUser.charAt(0)
      });

      // Tarik riwayat manifes dari tabel database cloud resmi
      fetchRiwayatTransaksiCloud(emailUser);
    } else {
      setUserSession(null);
      setUserProfile({
        nama: 'Masuk / Daftar',
        email: 'Akses riwayat perjalanan kamu',
        inisial: '?'
      });
      setRiwayatTransaksi([]);
    }
  };

  // ☁️ READ TRANSACTION DATABASE ENGINE
  const fetchRiwayatTransaksiCloud = async (emailUser) => {
    setLoadingRiwayat(true);
    try {
      const { data, error } = await supabase
        .from("booking_temp")
        .select("*")
        .eq("email_penumpang", emailUser)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRiwayatTransaksi(data || []);
    } catch (err) {
      console.error("❌ Gagal memuat riwayat database:", err.message);
    } finally {
      setLoadingRiwayat(false);
    }
  };

  // ----------------==========================================================
  // 🛫 STREAM MEMORY CACHE FILTER: AUTOCOMPLETE IN-MEMORY DETECTOR (ANTI-CRASH)
  // ------------------------------------------------==========================
  const handleMencariAsalManual = (inputTarget) => {
    setPickup(inputTarget);
    const textKetik = inputTarget ? inputTarget.toLowerCase() : '';
    
    // Fail-safe protection: Tambahkan interseptor data bernilai undefined / null
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
    
    // Fail-safe protection: Tambahkan interseptor data bernilai undefined / null
    const hasilFilter = dataWilayahSumatera.filter(item => 
      (item?.nama && item.nama.toLowerCase().includes(textKetik)) || 
      (item?.prov && item.prov.toLowerCase().includes(textKetik))
    );
    setFilteredTujuan(hasilFilter);
    setShowTujuanDropdown(true);
  };

  // ----------------==========================================================
  // 💾 TRANSACTION DATA MECHANISM: INITIAL PUSH BACKEND SYSTEM
  // ------------------------------------------------==========================
  const handleCariTravel = async () => {
    if (!pickup || !tujuan || !tanggal) {
      alert("Silakan lengkapi semua data pencarian terlebih dahulu!");
      return;
    }

    const emailTerbaca = localStorage.getItem("email_penumpang") || null;
    const namaTerbaca = localStorage.getItem("nama_penumpang") || "Pengguna Anonim";

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

      // Amankan ID referensi yang digenerate oleh server cloud ke local gawai pelanggan
      localStorage.setItem("booking_id", data.id);
      localStorage.setItem("pickup", pickup);
      localStorage.setItem("tujuan", tujuan);
      localStorage.setItem("tanggal", tanggal);
      localStorage.setItem("penumpang", penumpang);
      localStorage.setItem("fresh_search_trigger", "true"); 

      navigate('/hasil-pencarian');
    } catch (err) {
      console.error("❌ Detail Error Kirim Supabase:", err);
      // Robust Recovery System: Tetap biarkan gawai masuk halaman 2 jika cloud mati demi alur hybrid
      navigate('/hasil-pencarian');
    }
  };

  // ----------------==========================================================
  // 🔐 CLIENT SECURITY LOGICS INTERACTION CONTROLLER
  // ------------------------------------------------==========================
  const handleKirimMagicLink = async (e) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      alert("Silakan masukkan alamat email aktif Anda!");
      return;
    }

    setLoadingAuth(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: {
          redirectTo: window.location.origin + "/index.html" // Penyelaras kompilator Capacitor Webview Wrapper
        }
      });

      if (error) throw error;

      alert(`Tautan masuk dikirim ke: ${authEmail}\n\nSilakan buka kotak masuk email Anda, lalu klik tautan masuk yang dikirim.`);
      setIsAuthModalOpen(false);
      setAuthEmail('');
    } catch (err) {
      alert("Gagal mengirim tautan: " + err.message);
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogoutSistem = async () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari akun TRAVELIND?")) {
      await supabase.auth.signOut();
      localStorage.clear();
      setUserSession(null);
      setIsSidebarOpen(false);
      setCurrentTab('beranda');
      alert("Berhasil keluar akun.");
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

  const handleTabSwitch = (target) => {
    setIsSidebarOpen(false);
    if (target === 'akun') {
      setCurrentTab('akun');
      if (!userSession) setIsAuthModalOpen(true);
    } else {
      setCurrentTab('beranda');
    }
  };

  return (
    <div className="travelind-home-wrapper">
      
      {/* SCOPED APP HEADER */}
      <header className="main-header">
        <div className="brand-wrapper">
          <h1 className="brand-title">TRAVELIND</h1>
          <p className="brand-subtitle">Mitra Perjalanan Antar Kota</p>
        </div>
        <button type="button" className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Buka Menu Drawer">
          <i className="fa-solid fa-bars-staggered"></i>
        </button>
      </header>

      {/* WEBVIEW MOMENTUM SCROLLER CONTAINER */}
      <div className="content-scroller">
        {currentTab === 'beranda' ? (
          /* ====================================================================
             📌 LAYOUT TAB: CARI TRAVEL FORM COMPONENTS
             ==================================================================== */
         <main className="content-wrapper" style={{ padding: '0 16px', marginTop: '-50px', width: '100%' }}>
            <div className="search-card" style={{ width: '100%', boxSizing: 'border-box', padding: '20px 16px', gap: '14px' }}>
              
              {/* COMPONENT AUTOCOMPLETE: KOTA PENJEMPUTAN ASAL */}
              <div className="input-group location-box" ref={asalRef} style={{ width: '100%', position: 'relative' }}>
                <div className="input-with-icon" style={{ position: 'relative', width: '100%', display: 'block' }}>
                  <i className="fa-solid fa-location-dot input-icon" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, color: '#02596b' }}></i>
                  <input 
                    type="text" 
                    placeholder="Ketik Kota / Kabupaten Asal"
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
                    placeholder="Mau Ke Kota / Kabupaten Mana?"
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
                      placeholder="Pilih tanggal" 
                      value={tanggal}
                      onChange={(e) => {
                        setTanggal(e.target.value);
                        setIsDateActive(null);
                      }}
                      style={{ width: '100%', height: '52px', boxSizing: 'border-box', padding: '12px 145px 12px 48px', fontSize: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'block' }}
                    />
                  </div>
                  <div className="quick-date">
                    <button type="button" className={isDateActive === 0 ? 'active' : ''} onClick={() => handleSetQuickDate('hariIni')}>Hari Ini</button>
                    <button type="button" className={isDateActive === 1 ? 'active' : ''} onClick={() => handleSetQuickDate('besok')}>Besok</button>
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

              <button type="button" className="btn-primary" onClick={handleCariTravel}>Cari travel</button>
              <p className="search-note">Pesan travel antar kota dengan mudah dan cepat</p>
            </div>

            <footer className="main-footer">
                <p className="footer-title">Ikuti kami</p>
                <div className="social-icons">
                    <a href="#" aria-label="TikTok"><i className="fa-brands fa-tiktok"></i></a>
                    <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                    <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
                </div>
            </footer>
          </main>
        ) : (
          /* ====================================================================
             📌 LAYOUT TAB: DATA PROFIL & HISTORY TRANSACTION PORTAL
             ==================================================================== */
          <main className="content-wrapper" style={{ marginTop: '16px' }}>
            {userSession ? (
              <>
                <div className="search-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="avatar-circle" style={{ width: '54px', height: '54px', fontSize: '18px' }}>{userProfile.inisial}</div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#2b2b2b', margin: 0 }}>{userProfile.nama}</h4>
                    <p style={{ fontSize: '12px', color: '#8c96a3', marginTop: '2px', margin: 0 }}>{userProfile.email}</p>
                    <span style={{ display: 'inline-block', backgroundColor: '#e6f7ef', color: '#27ae60', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: 20, marginTop: '6px' }}><i className="fa-solid fa-shield-cat"></i> Member Setia</span>
                  </div>
                </div>
                
                <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#02596b', margin: '16px 0 8px 4px' }}><i className="fa-solid fa-clock-rotate-left"></i> Riwayat Transaksi</h5>
                
                <div className="history-list-housing">
                  {loadingRiwayat ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#8c96a3', fontSize: '12px' }}><i className="fa-solid fa-circle-notch fa-spin"></i> Memuat riwayat cloud...</div>
                  ) : riwayatTransaksi.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#8c96a3', fontSize: '12px' }}><i className="fa-solid fa-folder-open" style={{ fontSize: '24px', color: '#cbd5e0', marginBottom: '4px' }}></i><p>Belum ada riwayat perjalanan.</p></div>
                  ) : (
                    riwayatTransaksi.map((trx) => {
                      const status = trx.pickup_alamat && trx.pickup_alamat.includes("Jalan") ? "Terkonfirmasi" : "Menunggu Koordinat";
                      return (
                        <div className="history-item-card" key={trx.id}>
                          <div className="history-header-row">
                            <span className="history-code">TRV-ID-{trx.id}</span>
                            <span className="history-date">{trx.tanggal}</span>
                          </div>
                          <div className="history-body-row">
                            <div className="history-icon-box"><i className="fa-solid fa-van-shuttle"></i></div>
                            <div className="history-route-info">
                              <div className="history-route-title">{trx.pickup_kota || "Asal"} → {trx.tujuan_kota || "Tujuan"}</div>
                              <div className="history-travel-name">Kapasitas: {trx.penumpang} Orang</div>
                            </div>
                          </div>
                          <div className="history-footer-row">
                            <div className="history-price">Lunas</div>
                            <span className={`badge-history-status ${status === 'Terkonfirmasi' ? 'status-success' : 'status-pending'}`}>{status}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button type="button" style={{ width: '100%', backgroundColor: '#fff5f5', border: '1px solid #fecaca', color: '#eb5757', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handleLogoutSistem}>
                  <i className="fa-solid fa-arrow-right-from-bracket"></i> Keluar dari Akun
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px', color: '#8c96a3', fontSize: '12px' }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '24px', marginBottom: '8px', color: '#cbd5e0' }}></i>
                <p style={{ marginBottom: '16px' }}>Silakan login terlebih dahulu untuk melihat riwayat transaksi Anda.</p>
                <button type="button" className="btn-primary" style={{ maxWidth: '200px', margin: '0 auto', padding: '10px 20px', fontSize: '14px' }} onClick={() => setIsAuthModalOpen(true)}>Masuk Sekarang</button>
              </div>
            )}
          </main>
        )}
      </div>

      {/* ====================================================================
         ⚡️ COMPONENT INTERAKTIF: NAVIGATION DRAWER SIDEBAR LACI SIDE
         ==================================================================== */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <nav className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title"><i className="fa-solid fa-layer-group"></i> Menu Navigasi</span>
          <button type="button" className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)} aria-label="Tutup Menu">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="sidebar-profile-card" onClick={() => handleTabSwitch('akun')}>
          <div className="avatar-circle">{userProfile.inisial}</div>
          <div className="profile-card-text">
            <h6>{userProfile.nama}</h6>
            <p>{userProfile.email}</p>
          </div>
        </div>
        
        <div className="sidebar-content">
          <button type="button" className={`menu-item ${currentTab === 'beranda' ? 'menu-item-active' : ''}`} onClick={() => handleTabSwitch('beranda')}>
            <i className="fa-solid fa-house"></i> Beranda Utama
          </button>
          
          <button type="button" className={`menu-item ${currentTab === 'akun' ? 'menu-item-active' : ''}`} onClick={() => handleTabSwitch('akun')}>
            <i className="fa-solid fa-circle-user"></i> Akun Saya
          </button>

          <button type="button" className="menu-item" onClick={() => navigate('/cek-tiket')}>
            <i className="fa-solid fa-ticket-simple"></i> Pesanan Saya
          </button>

          <div className="menu-divider"></div>

          <button type="button" className="menu-item" onClick={() => navigate('/promo')}>
            <i className="fa-solid fa-tags"></i> Promo Spesial
          </button>

          <a href="https://wa.me/6281234567890?text=Halo%20CS%20TRAVELIND,%20saya%20butuh%20bantuan%20terkait%20pemesanan%20travel." 
             target="_blank" rel="noreferrer" className="menu-item">
            <i className="fa-solid fa-headset"></i> Pusat Bantuan
          </a>
          
          {userSession && (
            <button type="button" className="menu-item" onClick={handleLogoutSistem} style={{ color: '#eb5757' }}>
              <i className="fa-solid fa-arrow-right-from-bracket" style={{ color: '#eb5757' }}></i> Keluar Akun
            </button>
          )}
        </div>

        <div className="sidebar-footer">
          <p>©️ 2026 TRAVELIND Startup. v1.6.0</p>
        </div>
      </nav>

      {/* ====================================================================
         📌 COMPONENT STICKY: MOBILE FIXED BOTTOM NAVIGATION
         ==================================================================== */}
      <nav className="bottom-nav">
        <button type="button" className={`nav-link ${currentTab === 'beranda' ? 'active' : ''}`} onClick={() => handleTabSwitch('beranda')}>
          <i className="fa-solid fa-house"></i>
          <span>Beranda</span>
        </button>
        <button type="button" className="nav-link" onClick={() => navigate('/cek-tiket')}>
          <i className="fa-solid fa-ticket-simple"></i>
          <span>Tiket Saya</span>
        </button>
        <button type="button" className={`nav-link ${currentTab === 'akun' ? 'active' : ''}`} onClick={() => handleTabSwitch('akun')}>
          <i className="fa-solid fa-user"></i>
          <span>Profil</span>
        </button>
      </nav>

      {/* ====================================================================
         🌟 PORTAL COMPONENT: MAGIC LINK EMAIL AUTHENTICATION MODAL
         ==================================================================== */}
      <div className={`auth-modal-overlay ${isAuthModalOpen ? 'active' : ''}`}>
        <div className="auth-modal-box">
          <button type="button" className="auth-modal-close" onClick={() => setIsAuthModalOpen(false)}><i className="fa-solid fa-xmark"></i></button>
          <h4 className="auth-modal-title"><i className="fa-solid fa-shield-halved"></i> Masuk / Daftar</h4>
          <p className="auth-modal-p">Masukkan email Anda untuk login otomatis tanpa kata sandi via Magic Link.</p>
          
          <form onSubmit={handleKirimMagicLink}>
            <input 
              type="email" 
              className="auth-input-style" 
              placeholder="nama@email.com" 
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
            <button type="submit" className="auth-btn-submit" disabled={loadingAuth}>
              {loadingAuth ? "Mengirim Tautan..." : "Kirim Tautan Masuk"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
};

export default HomeView;