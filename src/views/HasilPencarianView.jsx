import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import useAuthStore from '../store/authStore'; 
import '../styles/hasilPencarian.css';

const HasilPencarianView = () => {
  const navigate = useNavigate();
  const { user, bahasaGlobal } = useAuthStore();

  // ----------------==========================================================
  // ⚡️ STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState(null); 

  const [bookingData, setBookingData] = useState(null);
  const [masterTravelData, setMasterTravelData] = useState([]);
  const [filteredTravelData, setFilteredTravelData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [filterTipeMobil, setFilterTipeMobil] = useState('ALL');
  const [jenisUrutan, setJenisUrutan] = useState('murah');

  // Kamus Bahasa Dinamis (Otomatis Sinkron dari Zustand Profile)
  const t = {
    ID: {
      pageTitle: 'Hasil Pencarian',
      step1: 'Cari',
      step2: 'Pilih',
      step3: 'Isi Data',
      step4: 'Bayar',
      penumpangText: 'Penumpang',
      filterTipe: 'Filter Tipe',
      urutkanText: 'Urutkan:',
      termurah: 'Termurah',
      termahal: 'Termahal',
      mencariArmada: 'Mencari armada terbaik...',
      emptyState: 'Tidak ada armada yang tersedia.',
      kursiSisa: 'Kursi Sisa',
      hargaSewa: 'harga per kursi',
      pilihBtn: 'Pilih',
      amanTitle: 'Aman & Terpercaya',
      amanDesc: 'Pembayaran aman, perjalanan nyaman bersama partner travel pilihan.',
      bantuanTitle: 'Butuh bantuan?',
      bantuanDesc: 'Hubungi kami jika ada pertanyaan atau kendala 24/7.',
      navTitle: 'Menu Navigasi',
      menuHome: 'Beranda Utama',
      menuAkun: 'Akun Saya',
      menuTiket: 'Pesanan Saya',
      menuBantuan: 'Pusat Bantuan',
      sheetUrutTitle: 'Urutkan Hasil Travel',
      sheetFilterTitle: 'Filter Tipe Kendaraan',
      allArmada: 'Tampilkan Semua Armada',
      anonim: 'MASUK / DAFTAR',
      subAnonim: 'Akses riwayat perjalanan kamu',
      alertEmpty: 'Data booking tidak ditemukan! Mengalihkan ke halaman utama.',
      alertGagal: 'Gagal memuat parameter pencarian travel!'
    },
    EN: {
      pageTitle: 'Search Results',
      step1: 'Search',
      step2: 'Book',
      step3: 'Fill Details',
      step4: 'Pay',
      penumpangText: 'Passengers',
      filterTipe: 'Filter Type',
      urutkanText: 'Sort:',
      termurah: 'Cheapest',
      termahal: 'Most Expensive',
      mencariArmada: 'Finding the best fleet...',
      emptyState: 'No fleet available.',
      kursiSisa: 'Seats Left',
      hargaSewa: 'price per seat',
      pilihBtn: 'Choose',
      amanTitle: 'Safe & Reliable',
      amanDesc: 'Secure payments, comfortable travel with our choice partners.',
      bantuanTitle: 'Need help?',
      bantuanDesc: 'Contact us if there are questions or obstacles 24/7.',
      navTitle: 'Navigation Menu',
      menuHome: 'Main Home',
      menuAkun: 'My Account',
      menuTiket: 'My Bookings',
      menuBantuan: 'Help Center',
      sheetUrutTitle: 'Sort Travel Results',
      sheetFilterTitle: 'Filter Vehicle Type',
      allArmada: 'Show All Fleets',
      anonim: 'SIGN IN / SIGN UP',
      subAnonim: 'Access your travel history',
      alertEmpty: 'Booking data not found! Redirecting to home page.',
      alertGagal: 'Failed to load travel search parameters!'
    }
  }[bahasaGlobal || 'ID'];

  const namaProfile = user ? (user.user_metadata?.full_name || user.email.split("@")[0].toUpperCase()) : t.anonim;
  const emailProfile = user?.email ? user.email : t.subAnonim;
  const inisialProfile = user ? namaProfile.charAt(0).toUpperCase() : '?';

  // ----------------==========================================================
  // 🔄 CORE LIFE-CYCLE ENGINE
  // ----------------------------------------------------------------==========
  useEffect(() => {
    const fetchCoreManifestEngine = async () => {
      const booking_id = localStorage.getItem("booking_id");
      if (!booking_id) {
        alert(t.alertEmpty);
        navigate('/home');
        return;
      }

      try {
        setLoadingData(true);
        const { data: booking, error: bookingErr } = await supabase
          .from("booking_temp")
          .select("*")
          .eq("id", booking_id)
          .single();

        if (bookingErr) throw bookingErr;
        setBookingData(booking);

        const { data: travelList, error: travelErr } = await supabase
          .from("travel_jadwal")
          .select("*")
          .eq("pickup", booking.pickup_kota)
          .eq("tujuan", booking.tujuan_kota);

        if (travelErr) throw travelErr;
        
        setMasterTravelData(travelList || []);
        processAndRenderEngine(travelList || [], filterTipeMobil, jenisUrutan);
      } catch (err) {
        console.error("❌ Error Sync Cloud:", err);
        alert(t.alertGagal);
      } finally {
        setLoadingData(false);
      }
    };

    fetchCoreManifestEngine();
  }, [navigate]);

  // 🛫 COMPUTED ENGINE: IN-MEMORY RE-ACTIVE FILTERING & SORTING PROCESSOR
  const processAndRenderEngine = (rawArray, targetFilter, targetSort) => {
    let result = [...rawArray];

    if (targetFilter !== 'ALL') {
      result = result.filter(item => {
        const dbType = item.tipe_mobil ? item.tipe_mobil.toUpperCase().trim() : "";
        return dbType === targetFilter;
      });
    }

    if (targetSort === 'murah') {
      result.sort((a, b) => Number(a.harga) - Number(b.harga));
    } else if (targetSort === 'mahal') {
      result.sort((a, b) => Number(b.harga) - Number(a.harga));
    }

    setFilteredTravelData(result);
  };

  const handleExecuteFilter = (kategori) => {
    setFilterTipeMobil(kategori);
    setActiveBottomSheet(null);
    processAndRenderEngine(masterTravelData, kategori, jenisUrutan);
  };

  const handleExecuteSort = (tipe) => {
    setJenisUrutan(tipe);
    setActiveBottomSheet(null);
    processAndRenderEngine(masterTravelData, filterTipeMobil, tipe);
  };

  const handleOpenHelpCS = () => {
    if (!bookingData) return;
    const txtWA = encodeURIComponent(`Halo CS TRAVELIND, saya butuh bantuan kendala rute travel dari ${bookingData.pickup_kota} menuju ${bookingData.tujuan_kota} untuk tanggal ${bookingData.tanggal}.`);
    window.open(`https://wa.me/6281234567890?text=${txtWA}`, '_blank');
  };

  const handleSelectArmada = (item) => {
    localStorage.setItem("travelId", item.id);
    localStorage.setItem("travelNama", item.nama);
    localStorage.setItem("travelJam", item.jam);
    localStorage.setItem("travelHarga", item.harga);
    localStorage.setItem("travelKursi", item.kursi);
    localStorage.setItem("travelPickup", item.pickup);
    localStorage.setItem("travelTujuan", item.tujuan);
    navigate('/pemesanan'); 
  };

  const handleNavigasiAkun = () => {
    setIsSidebarOpen(false);
    navigate('/profil'); 
  };

  return (
    <div className="travelind-search-wrapper">
      
      {/* 🌟 STICKY PANEL CONTAINER BOX (DIKUNCI DI ATAS TIDAK IKUT DI-SCROLL) */}
      <div className="sticky-top-layout-block">
        <header className="main-header">
          <div className="header-left">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2 className="page-title">{t.pageTitle}</h2>
          </div>
          <button type="button" className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <i className="fa-solid fa-bars-staggered"></i>
          </button>
        </header>

        {/* PROGRESS TRACKER BAR SINKRON */}
        <div className="progress-container">
          <div className="steps-row-modern">
            <div className="step-node completed">
              <span className="circle-node">
                <i className="fa-solid fa-check" style={{ fontSize: '10px' }}></i>
              </span>
              <span className="node-label">{t.step1}</span>
            </div>
            <div className="line-connector full"></div>

            <div className="step-node active">
              <span className="circle-node">2</span>
              <span className="node-label">{t.step2}</span>
            </div>
            <div className="line-connector"></div>

            <div className="step-node">
              <span className="circle-node">3</span>
              <span className="node-label">{t.step3}</span>
            </div>
            <div className="line-connector"></div>

            <div className="step-node">
              <span className="circle-node">4</span>
              <span className="node-label">{t.step4}</span>
            </div>
          </div>
        </div>

        {/* UPPER ROUTE INFO BOX */}
        <div className="info-card-wrapper-fixed">
          <section className="info-card">
            {loadingData ? (
              <div className="skeleton-loader"></div>
            ) : bookingData ? (
              <>
                <div className="info-route-title">
                  <span>{bookingData.pickup_kota}</span>
                  <i className="fa-solid fa-arrow-right-long" style={{ color: '#02596b' }}></i>
                  <span>{bookingData.tujuan_kota}</span>
                </div>
                <div className="info-sub-details">
                  <i className="fa-regular fa-calendar"></i> {bookingData.tanggal} &nbsp;•&nbsp; <i className="fa-solid fa-user"></i> {bookingData.penumpang} {t.penumpangText}
                </div>
              </>
            ) : null}
          </section>
        </div>

        {/* INTERACTIVE CONTROLLER FILTER & SORTING BAR */}
        <div className="filter-bar-wrapper-fixed">
          <section className="filter-bar">
            <button type="button" className="filter-btn flex-1" onClick={() => setActiveBottomSheet('filter')}>
              <i className="fa-solid fa-sliders icon-teal"></i> {t.filterTipe}
            </button>
            <button type="button" className="filter-btn justify-between" onClick={() => setActiveBottomSheet('urutkan')}>
              <span>
                <i className="fa-solid fa-arrow-up-down-wide-short icon-teal"></i> {t.urutkanText} {jenisUrutan === 'murah' ? t.termurah : t.termahal}
              </span>
              <i className="fa-solid fa-chevron-down arrow-muted"></i>
            </button>
          </section>
        </div>
      </div>

      {/* 🌟 AREA SCROLLER KONTEN UTAMA */}
      <div className="search-content-scroller">
        
        {loadingData ? (
          <div className="loading-state-wrapper">
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            <p>{t.mencariArmada}</p>
          </div>
        ) : filteredTravelData.length === 0 ? (
          /* 🌟 DATA KOSONG DIKUNCI DI TENGAH LAYAR & TINGGI SEJAJAR ELASTIS */
          <div className="empty-state-container">
            <div className="empty-state-box">
              <i className="fa-solid fa-car-tunnel"></i>
              <p>{t.emptyState}</p>
            </div>
          </div>
        ) : (
          <section className="travel-list">
            {filteredTravelData.map((item) => {
              const typeClean = item.tipe_mobil ? item.tipe_mobil.toUpperCase().trim() : "";
              const vehicleIcon = item.foto_armada && item.foto_armada !== "-" 
                ? item.foto_armada 
                : (typeClean === "HIACE" 
                    ? "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" 
                    : "https://cdn-icons-png.flaticon.com/512/743/743922.png"
                  );

              return (
                <div className="travel-card" key={item.id}>
                  <div className="card-top">
                    <img className="brand-img" src={vehicleIcon} alt="Armada" />
                    <div className="meta-info">
                      <h4 className="travel-name">{item.nama}</h4>
                      <div className="rating-wrapper">
                        <i className="fa-solid fa-star"></i> 4.9 
                        <span className="review-count">{typeClean && typeClean !== "-" && ` • Kategori: ${typeClean}`}</span>
                      </div>
                    </div>
                    <span className="status-badge">Tersedia</span>
                  </div>

                  <div className="card-mid">
                    <div className="info-item"><i className="fa-regular fa-clock"></i><span><b>{item.jam}</b> WIB</span></div>
                    <div className="info-item"><i className="fa-solid fa-couch"></i><span><b>{item.kursi}</b> {t.kursiSisa}</span></div>
                  </div>

                  <div className="visual-route">
                    <span>Asal: {item.pickup}</span>
                    <i className="fa-solid fa-arrow-right-long route-arrow"></i>
                    <span>Tujuan: {item.tujuan}</span>
                  </div>

                  <div className="card-bottom">
                    <div className="price-box">
                      <span className="amount">Rp {Number(item.harga).toLocaleString('id-ID')}</span>
                      <span className="per-seat">{t.hargaSewa}</span>
                    </div>
                    <button type="button" className="select-btn" onClick={() => handleSelectArmada(item)}>
                      {t.pilihBtn} <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', marginLeft: '4px' }}></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* TRUST BANNER & HELP SECTION (Hanya muncul di paling bawah daftar scroll) */}
        <div className="scroller-footer-group">
          <section className="trust-banner">
            <div className="trust-icon"><i className="fa-solid fa-shield-halved"></i></div>
            <div className="trust-text">
              <h5>{t.amanTitle}</h5>
              <p>{t.amanDesc}</p>
            </div>
          </section>

          <section className="help-section" onClick={handleOpenHelpCS}>
            <div className="help-content">
              <div className="help-left">
                <i className="fa-solid fa-headset help-icon"></i>
                <div className="help-text">
                  <h5>{t.bantuanTitle}</h5>
                  <p>{t.bantuanDesc}</p>
                </div>
              </div>
              <i className="fa-solid fa-chevron-right arrow-muted"></i>
            </div>
          </section>
        </div>
      </div>

      {/* NAVIGATION SIDEBAR */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <nav className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title"><i className="fa-solid fa-layer-group"></i> {t.navTitle}</span>
          <button type="button" className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
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
          <button type="button" className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/home'); }}>
            <i className="fa-solid fa-house"></i> {t.menuHome}
          </button>
          <button type="button" className="menu-item" onClick={handleNavigasiAkun}>
            <i className="fa-solid fa-circle-user"></i> {t.menuAkun}
          </button>
          <button type="button" className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/cek-tiket'); }}>
            <i className="fa-solid fa-ticket"></i> {t.menuTiket}
          </button>
          <div className="menu-divider"></div>
          <button type="button" className="menu-item" onClick={() => { setIsSidebarOpen(false); handleOpenHelpCS(); }}>
            <i className="fa-solid fa-headset"></i> {t.menuBantuan}
          </button>
        </div>
        <div className="sidebar-footer">
          <p>©️ 2026 TRAVELIND Startup. v2.0.0</p>
        </div>
      </nav>

      {/* BOTTOM SHEETS PORTAL CONTAINER */}
      <div className={`sheet-overlay ${activeBottomSheet ? 'active' : ''}`} onClick={() => setActiveBottomSheet(null)}></div>
      
      {/* Sheet Urutkan */}
      <div className={`bottom-sheet ${activeBottomSheet === 'urutkan' ? 'active' : ''}`}>
        <div className="sheet-header"><div className="sheet-notch"></div><h4>{t.sheetUrutTitle}</h4></div>
        <div className="sheet-body">
          <div className={`sheet-option-item ${jenisUrutan === 'murah' ? 'selected' : ''}`} onClick={() => handleExecuteSort('murah')}>
            <span><i className="fa-solid fa-arrow-trend-up"></i> {bahasaGlobal === 'ID' ? 'Harga Terendah (Termurah)' : 'Lowest Price (Cheapest)'}</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
          <div className={`sheet-option-item ${jenisUrutan === 'mahal' ? 'selected' : ''}`} onClick={() => handleExecuteSort('mahal')}>
            <span><i className="fa-solid fa-arrow-trend-down"></i> {bahasaGlobal === 'ID' ? 'Harga Tertinggi (Termahal)' : 'Highest Price (Most Expensive)'}</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
        </div>
      </div>

      {/* Sheet Filter */}
      <div className={`bottom-sheet ${activeBottomSheet === 'filter' ? 'active' : ''}`}>
        <div className="sheet-header"><div className="sheet-notch"></div><h4>{t.sheetFilterTitle}</h4></div>
        <div className="sheet-body">
          <div className={`sheet-option-item ${filterTipeMobil === 'ALL' ? 'selected' : ''}`} onClick={() => handleExecuteFilter('ALL')}>
            <span><i className="fa-solid fa-border-all"></i> {t.allArmada}</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
          <div className={`sheet-option-item ${filterTipeMobil === 'INNOVA' ? 'selected' : ''}`} onClick={() => handleExecuteFilter('INNOVA')}>
            <span><i className="fa-solid fa-car-side"></i> Toyota Innova</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
          <div className={`sheet-option-item ${filterTipeMobil === 'HIACE' ? 'selected' : ''}`} onClick={() => handleExecuteFilter('HIACE')}>
            <span><i className="fa-solid fa-van-shuttle"></i> Toyota HiAce / Minibus</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HasilPencarianView;