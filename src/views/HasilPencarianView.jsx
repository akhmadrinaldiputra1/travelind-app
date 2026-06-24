import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import '../styles/hasilPencarian.css';

const HasilPencarianView = () => {
  const navigate = useNavigate();

  // ----------------==========================================================
  // ⚡️ STATE CONTROLLER: UI LAYERS (SIDEBAR & BOTTOM SHEET CONTROL)
  // ----------------------------------------------------------------==========
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeBottomSheet, setActiveBottomSheet] = useState(null); // null | 'filter' | 'urutkan'

  // ----------------==========================================================
  // ⚡️ STATE CONTROLLER: REALTIME SYSTEM DATA & ENGINE STREAM
  // ----------------------------------------------------------------==========
  const [bookingData, setBookingData] = useState(null);
  const [masterTravelData, setMasterTravelData] = useState([]);
  const [filteredTravelData, setFilteredTravelData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Filter & Sorting Memory Controller State
  const [filterTipeMobil, setFilterTipeMobil] = useState('ALL');
  const [jenisUrutan, setJenisUrutan] = useState('murah');

  // User Session Profil State
  const [userProfile, setUserProfile] = useState({ nama: 'Masuk / Daftar', email: 'Akses riwayat perjalanan kamu', inisial: '?' });

  // ----------------==========================================================
  // 🔄 LIFE-CYCLE CORE ENGINE: SYNC ROUTE MANIFEST & CLOUD DATA
  // ----------------------------------------------------------------==========
  useEffect(() => {
    const fetchCoreManifestEngine = async () => {
      const booking_id = localStorage.getItem("booking_id");
      if (!booking_id) {
        alert("Data booking tidak ditemukan! Mengalihkan ke halaman utama.");
        navigate('/');
        return;
      }

      try {
        setLoadingData(true);
        // Tarik parameter manifest pencarian aktual dari database cloud
        const { data: booking, error: bookingErr } = await supabase
          .from("booking_temp")
          .select("*")
          .eq("id", booking_id)
          .single();

        if (bookingErr) throw bookingErr;
        setBookingData(booking);

        // Sinkronisasi status login pengguna asli dari server Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const emailUser = session.user.email;
          const namaUser = emailUser.split("@")[0].toUpperCase();
          setUserProfile({ nama: namaUser, email: emailUser, inisial: namaUser.charAt(0) });
        }

        // Tarik daftar armada travel resmi yang tersedia berdasarkan kecocokan rute
        const { data: travelList, error: travelErr } = await supabase
          .from("travel_jadwal")
          .select("*")
          .eq("pickup", booking.pickup_kota)
          .eq("tujuan", booking.tujuan_kota);

        if (travelErr) throw travelErr;
        
        setMasterTravelData(travelList || []);
        processAndRenderEngine(travelList || [], filterTipeMobil, jenisUrutan);

      } catch (err) {
        console.error("❌ Detail Kegagalan Sinkronisasi Manifest Cloud:", err);
        alert("Gagal memuat parameter pencarian travel!");
      } finally {
        setLoadingData(false);
      }
    };

    fetchCoreManifestEngine();
  }, [navigate]);

  // 🛫 COMPUTED ENGINE: IN-MEMORY RE-ACTIVE FILTERING & SORTING PROCESSOR
  const processAndRenderEngine = (rawArray, targetFilter, targetSort) => {
    let result = [...rawArray];

    // 1. Eksekusi Penyaringan Tipe Mobil Tanpa Sensitivitas Karakter (Case-Insensitive)
    if (targetFilter !== 'ALL') {
      result = result.filter(item => {
        const dbType = item.tipe_mobil ? item.tipe_mobil.toUpperCase().trim() : "";
        return dbType === targetFilter;
      });
    }

    // 2. Eksekusi Pengurutan Nilai Harga Kursi Komparatif
    if (targetSort === 'murah') {
      result.sort((a, b) => Number(a.harga) - Number(b.harga));
    } else if (targetSort === 'mahal') {
      result.sort((a, b) => Number(b.harga) - Number(a.harga));
    }

    setFilteredTravelData(result);
  };

  // 🛠️ EVENT INTERACTION MUTATION HANDLERS
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

    // Alihkan navigasi otomatis menuju halaman 3 formulir detail jemput
    navigate('/pemesanan'); 
  };

  return (
    <div className="travelind-search-wrapper">
      
      {/* HEADER SECTION LAYOUT */}
      <header className="main-header">
        <div className="header-left">
          <button type="button" className="back-btn" onClick={() => navigate(-1)} title="Kembali Ke Beranda">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h2 className="page-title">Hasil Pencarian</h2>
        </div>
        <button type="button" className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Buka Menu">
          <i className="fa-solid fa-bars-staggered"></i>
        </button>
      </header>

      {/* PROGRESS BAR TRACKING STEPS */}
      <div className="progress-container">
        <div className="steps">
          <div className="step active"><i class="fa-solid fa-check"></i><span>Pencarian</span></div>
          <div className="step current"><span className="step-num">2</span><span>Pilih Travel</span></div>
          <div className="step"><span class="step-num">3</span><span>Pemesanan</span></div>
          <div className="step"><span class="step-num">4</span><span>Pembayaran</span></div>
        </div>
      </div>

      {/* WEBVIEW MOMENTUM CONTAINER CONTENT SCROLLER */}
      <div className="search-content-scroller">
        
        {/* UPPER ROUTE INFO BOX */}
        <section className="info-card">
          {loadingData ? (
            <div className="skeleton-loader"></div>
          ) : bookingData ? (
            <>
              <div className="info-route-title">
                <span>{bookingData.pickup_kota}</span>
                <i className="fa-solid fa-arrow-right-long" style={{ color: '#02596b', fontSize: '13px' }}></i>
                <span>{bookingData.tujuan_kota}</span>
              </div>
              <div className="info-sub-details">
                <i className="fa-regular fa-calendar"></i> {bookingData.tanggal} &nbsp;•&nbsp; <i className="fa-solid fa-user"></i> {bookingData.penumpang} Penumpang
              </div>
            </>
          ) : null}
        </section>

        {/* INTERACTIVE CONTROLLER FILTER & SORTING BAR */}
        <section className="filter-bar">
          <button type="button" className="filter-btn flex-1" onClick={() => setActiveBottomSheet('filter')}>
            <i className="fa-solid fa-sliders icon-teal"></i> Filter Tipe
          </button>
          <button type="button" className="filter-btn justify-between" onClick={() => setActiveBottomSheet('urutkan')}>
            <span>
              <i className="fa-solid fa-arrow-up-down-wide-short icon-teal"></i> Urutkan: {jenisUrutan === 'murah' ? 'Termurah' : 'Termahal'}
            </span>
            <i className="fa-solid fa-chevron-down arrow-muted"></i>
          </button>
        </section>

        {/* DYNAMIC LIST ARMADA VEHICLES RENDER FIELD */}
        <section className="travel-list">
          {loadingData ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c96a3', fontSize: '13px' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '24px', marginBottom: '8px', color: '#02596b' }}></i>
              <p>Mencari armada terbaik untukmu...</p>
            </div>
          ) : filteredTravelData.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-car-tunnel" style={{ fontSize: '42px', marginBottom: '14px', color: '#cbd5e0' }}></i>
              <p>Tidak ada armada {filterTipeMobil.toLowerCase()} yang tersedia untuk rute ini.</p>
            </div>
          ) : (
            filteredTravelData.map((item) => {
              const typeClean = item.tipe_mobil ? item.tipe_mobil.toUpperCase().trim() : "";

// ✨ LOGIKA BARU: Gunakan foto dari database jika ada. Jika kosong, baru pakai ikon default flaticon.
const vehicleIcon = item.foto_armada && item.foto_armada !== "-" 
  ? item.foto_armada 
  : (typeClean === "HIACE" 
      ? "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" 
      : "https://cdn-icons-png.flaticon.com/512/743/743922.png"
    );

              return (
                <div className="travel-card" key={item.id}>
                  <div className="card-top">
                    <img className="brand-img" src={vehicleIcon} alt="Armada TRAVELIND" />
                    <div className="meta-info">
                      <h4 className="travel-name">{item.nama}</h4>
                      <div className="rating-wrapper">
                        <i className="fa-solid fa-star"></i> 4.9 
                        <span className="review-count">
                          (142) {typeClean && typeClean !== "-" && ` &nbsp;•&nbsp; Kategori: ${typeClean}`}
                        </span>
                      </div>
                    </div>
                    <span className="status-badge">Tersedia</span>
                  </div>

                  <div className="card-mid">
                    <div className="info-item">
                      <i className="fa-regular fa-clock"></i>
                      <span><b>{item.jam}</b> WIB</span>
                    </div>
                    <div className="info-item">
                      <i className="fa-solid fa-couch"></i>
                      <span><b>{item.kursi}</b> Kursi Sisa</span>
                    </div>
                  </div>

                  <div className="visual-route">
                    <span>Asal: {item.pickup}</span>
                    <i className="fa-solid fa-arrow-right-long route-arrow"></i>
                    <span>Tujuan: {item.tujuan}</span>
                  </div>

                  <div className="card-bottom">
                    <div className="price-box">
                      <span className="amount">Rp {Number(item.harga).toLocaleString('id-ID')}</span>
                      <span className="per-seat">harga per kursi</span>
                    </div>
                    <button type="button" className="select-btn" onClick={() => handleSelectArmada(item)}>
                      Pilih <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', marginLeft: '4px' }}></i>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* TRUST ACCREDITATION BANNER */}
        <section className="trust-banner">
          <div className="trust-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <div className="trust-text">
            <h5>Aman & Terpercaya</h5>
            <p>Pembayaran aman, perjalanan nyaman bersama partner travel pilihan kami.</p>
          </div>
        </section>

        {/* REVOLUTIONARY ACTIVE WHATSAPP INTELLIGENCE HELP CENTER */}
        <section className="help-section" onClick={handleOpenHelpCS}>
          <div className="help-content">
            <div className="help-left">
              <i className="fa-solid fa-headset help-icon"></i>
              <div className="help-text">
                <h5>Butuh bantuan?</h5>
                <p>Hubungi kami jika ada pertanyaan atau kendala 24/7.</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right arrow-muted"></i>
          </div>
        </section>

      </div>

      {/* ====================================================================
         ⚡️ DRAWER COMPONENT: NAVIGATION SIDEBAR MODULAR LACI SIDE
         ==================================================================== */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <nav className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title"><i className="fa-solid fa-layer-group"></i> Menu Navigasi</span>
          <button type="button" className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="sidebar-profile-card" onClick={() => { setIsSidebarOpen(false); navigate('/'); localStorage.setItem('buka_tab_langsung', 'akun'); }}>
          <div className="avatar-circle">{userProfile.inisial}</div>
          <div className="profile-card-text">
            <h6>{userProfile.nama}</h6>
            <p>{userProfile.email}</p>
          </div>
        </div>
        
        <div className="sidebar-content">
          <button type="button" className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/'); }}>
            <i className="fa-solid fa-house"></i> Beranda Utama
          </button>
          <button type="button" className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/'); localStorage.setItem('buka_tab_langsung', 'akun'); }}>
            <i className="fa-solid fa-circle-user"></i> Akun Saya
          </button>
          <button type="button" className="menu-item" onClick={() => navigate('/cek-tiket')}>
            <i className="fa-solid fa-ticket-simple"></i> Pesanan Saya
          </button>
          <div className="menu-divider"></div>
          <button type="button" className="menu-item" onClick={handleOpenHelpCS}>
            <i className="fa-solid fa-headset"></i> Pusat Bantuan
          </button>
        </div>
        <div className="sidebar-footer">
          <p>©️ 2026 TRAVELIND Startup. v1.6.0</p>
        </div>
      </nav>

      {/* ====================================================================
         🌟 PORTAL COMPONENT: PREMIUM BOTTOM SHEET CONTROLLER MANAGEMENT
         ==================================================================== */}
      <div className={`sheet-overlay ${activeBottomSheet ? 'active' : ''}`} onClick={() => setActiveBottomSheet(null)}></div>
      
      {/* Slid-Up Sheet Panel: Urutkan Komparasi Harga */}
      <div className={`bottom-sheet ${activeBottomSheet === 'urutkan' ? 'active' : ''}`}>
        <div className="sheet-header">
          <div className="sheet-notch"></div>
          <h4>Urutkan Hasil Travel</h4>
        </div>
        <div className="sheet-body">
          <div className={`sheet-option-item ${jenisUrutan === 'murah' ? 'selected' : ''}`} onClick={() => handleExecuteSort('murah')}>
            <span><i className="fa-solid fa-arrow-trend-up"></i> Harga Terendah (Termurah)</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
          <div className={`sheet-option-item ${jenisUrutan === 'mahal' ? 'selected' : ''}`} onClick={() => handleExecuteSort('mahal')}>
            <span><i className="fa-solid fa-arrow-trend-down"></i> Harga Tertinggi (Termahal)</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
        </div>
      </div>

      {/* Slid-Up Sheet Panel: Saring Kategori Tipe Mobil */}
      <div className={`bottom-sheet ${activeBottomSheet === 'filter' ? 'active' : ''}`}>
        <div className="sheet-header">
          <div className="sheet-notch"></div>
          <h4>Filter Tipe Kendaraan</h4>
        </div>
        <div className="sheet-body">
          <div className={`sheet-option-item ${filterTipeMobil === 'ALL' ? 'selected' : ''}`} onClick={() => handleExecuteFilter('ALL')}>
            <span><i className="fa-solid fa-border-all"></i> Tampilkan Semua Armada</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
          <div className={`sheet-option-item ${filterTipeMobil === 'INNOVA' ? 'selected' : ''}`} onClick={() => handleExecuteFilter('INNOVA')}>
            <span><i className="fa-solid fa-car-side"></i> Kategori Toyota Innova</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
          <div className={`sheet-option-item ${filterTipeMobil === 'HIACE' ? 'selected' : ''}`} onClick={() => handleExecuteFilter('HIACE')}>
            <span><i className="fa-solid fa-van-shuttle"></i> Kategori Toyota HiAce / Minibus</span>
            <i className="fa-solid fa-circle-check check-icon"></i>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HasilPencarianView;