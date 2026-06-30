import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import useAuthStore from '../store/authStore'; 
import '../styles/hasilPencarian.css';

const HasilPencarianView = () => {
  const navigate = useNavigate();
  const { bahasaGlobal } = useAuthStore();

  // ----------------==========================================================
  // ⚡️ STATE CONTROLLER
  // ----------------------------------------------------------------==========
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
      pageTitle: 'Pilih Armada',
      step1: 'Cari',
      step2: 'Pilih',
      step3: 'Isi Data',
      step4: 'Bayar',
      penumpangText: 'Penumpang',
      filterTipe: 'Filter Kendaraan',
      urutkanText: 'Urutkan',
      termurah: 'Termurah',
      termahal: 'Termahal',
      mencariArmada: 'Mencari armada terbaik...',
      emptyState: 'Tidak ada armada yang tersedia.',
      kursiSisa: 'Kursi Tersedia',
      hargaSewa: 'per kursi',
      pilihBtn: 'Pilih',
      amanTitle: 'Aman & Terpercaya',
      amanDesc: 'Pembayaran aman, perjalanan nyaman bersama partner travel pilihan.',
      bantuanTitle: 'Butuh bantuan perjalanan?',
      bantuanDesc: 'Hubungi tim CS kami jika ada pertanyaan atau kendala 24/7.',
      sheetUrutTitle: 'Urutkan Hasil Travel',
      sheetFilterTitle: 'Filter Tipe Kendaraan',
      allArmada: 'Tampilkan Semua Armada',
      alertEmpty: 'Data booking tidak ditemukan! Mengalihkan ke halaman utama.',
      alertGagal: 'Gagal memuat parameter pencarian travel!'
    },
    EN: {
      pageTitle: 'Select Fleet',
      step1: 'Search',
      step2: 'Choose',
      step3: 'Fill Details',
      step4: 'Pay',
      penumpangText: 'Passengers',
      filterTipe: 'Filter Vehicle',
      urutkanText: 'Sort By',
      termurah: 'Cheapest',
      termahal: 'Most Expensive',
      mencariArmada: 'Finding the best fleet...',
      emptyState: 'No fleet available.',
      kursiSisa: 'Seats Available',
      hargaSewa: 'per seat',
      pilihBtn: 'Select',
      amanTitle: 'Safe & Reliable',
      amanDesc: 'Secure payments, comfortable travel with our choice partners.',
      bantuanTitle: 'Need travel help?',
      bantuanDesc: 'Contact our CS team if there are questions or obstacles 24/7.',
      sheetUrutTitle: 'Sort Travel Results',
      sheetFilterTitle: 'Filter Vehicle Type',
      allArmada: 'Show All Fleets',
      alertEmpty: 'Booking data not found! Redirecting to home page.',
      alertGagal: 'Failed to load travel search parameters!'
    }
  }[bahasaGlobal || 'ID'];

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

  return (
    <div className="modern-search-wrapper">
      
      {/* 🌟 STICKY TOP LAYOUT PANEL */}
      <div className="modern-sticky-header-container">
        <header className="modern-navbar">
          <button type="button" className="modern-back-circle-btn" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h2 className="modern-nav-title">{t.pageTitle}</h2>
          <div className="modern-header-spacer"></div>
        </header>

        {/* PROGRESS TRACKER BAR */}
        <div className="modern-progress-stepper">
          <div className="modern-step-track">
            <div className="modern-step-node past">
              <span><i className="fa-solid fa-check"></i></span>
              <label>{t.step1}</label>
            </div>
            <div className="modern-step-line active"></div>

            <div className="modern-step-node active-search">
              <span>2</span>
              <label>{t.step2}</label>
            </div>
            <div className="modern-step-line"></div>

            <div className="modern-step-node">
              <span>3</span>
              <label>{t.step3}</label>
            </div>
            <div className="modern-step-line"></div>

            <div className="modern-step-node">
              <span>4</span>
              <label>{t.step4}</label>
            </div>
          </div>
        </div>

        {/* ROUTE SUMMARY INFO CARD (BENTO STYLE) */}
        <div className="modern-route-summary-box">
          <div className="modern-summary-card">
            {loadingData ? (
              <div className="modern-skeleton-route"></div>
            ) : bookingData ? (
              <>
                <div className="modern-summary-route-title">
                  <span>{bookingData.pickup_kota}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                  <span>{bookingData.tujuan_kota}</span>
                </div>
                <div className="modern-summary-sub-details">
                  <div className="detail-pill">
                    <i className="fa-regular fa-calendar"></i>
                    <span>{bookingData.tanggal}</span>
                  </div>
                  <div className="detail-pill-divider"></div>
                  <div className="detail-pill">
                    <i className="fa-solid fa-user"></i>
                    <span>{bookingData.penumpang} {t.penumpangText}</span>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* INTEGRATED CONTROLLER FILTER & SORTING ROW */}
        <div className="modern-controls-bar-box">
          <div className="modern-controls-row">
            <button type="button" className={`control-action-btn ${filterTipeMobil !== 'ALL' ? 'is-active' : ''}`} onClick={() => setActiveBottomSheet('filter')}>
              <i className="fa-solid fa-sliders"></i>
              <span>{filterTipeMobil === 'ALL' ? t.filterTipe : filterTipeMobil}</span>
              <i className="fa-solid fa-chevron-down arrow-indicator"></i>
            </button>
            <div className="control-divider-line"></div>
            <button type="button" className="control-action-btn" onClick={() => setActiveBottomSheet('urutkan')}>
              <i className="fa-solid fa-arrow-up-down-wide-short"></i>
              <span>{t.urutkanText}: {jenisUrutan === 'murah' ? t.termurah : t.termahal}</span>
              <i className="fa-solid fa-chevron-down arrow-indicator"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 AREA SCROLLER KONTEN UTAMA */}
      <div className="modern-search-content-scroller">
        
        {loadingData ? (
          <div className="modern-search-loading-state">
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            <p>{t.mencariArmada}</p>
          </div>
        ) : filteredTravelData.length === 0 ? (
          <div className="modern-search-empty-container">
            <div className="modern-search-empty-box">
              <i className="fa-solid fa-car-tunnel"></i>
              <p>{t.emptyState}</p>
            </div>
          </div>
        ) : (
          <div className="modern-travel-cards-list">
            {filteredTravelData.map((item) => {
              const typeClean = item.tipe_mobil ? item.tipe_mobil.toUpperCase().trim() : "";
              const vehicleIcon = item.foto_armada && item.foto_armada !== "-" 
                ? item.foto_armada 
                : (typeClean === "HIACE" 
                    ? "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" 
                    : "https://cdn-icons-png.flaticon.com/512/743/743922.png"
                  );

              return (
                <div className="modern-travel-card" key={item.id}>
                  <div className="card-top-header">
                    <div className="avatar-brand-housing">
                      <img className="fleet-brand-img" src={vehicleIcon} alt="Armada" />
                    </div>
                    <div className="fleet-meta-info">
                      <h4 className="fleet-travel-name">{item.nama}</h4>
                      <div className="fleet-rating-pill">
                        <i className="fa-solid fa-star"></i>
                        <span>4.9</span>
                        {typeClean && typeClean !== "-" && (
                          <>
                            <span className="dot-sep">•</span>
                            <span className="type-tag">{typeClean}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="fleet-status-badge">Tersedia</span>
                  </div>

                  <div className="card-middle-metrics">
                    <div className="metric-item-pill">
                      <i className="fa-regular fa-clock icon-navy"></i>
                      <span><b>{item.jam}</b> WIB</span>
                    </div>
                    <div className="metric-item-pill">
                      <i className="fa-solid fa-couch icon-teal"></i>
                      <span><b>{item.kursi}</b> {t.kursiSisa}</span>
                    </div>
                  </div>

                  <div className="card-visual-route-timeline">
                    <div className="route-node">
                      <div className="node-dot start"></div>
                      <span>{item.pickup}</span>
                    </div>
                    <div className="route-connecting-dashed"></div>
                    <div className="route-node text-right">
                      <div className="node-dot end"></div>
                      <span>{item.tujuan}</span>
                    </div>
                  </div>

                  <div className="card-bottom-pricing">
                    <div className="price-tag-box">
                      <span className="currency-amount">Rp {Number(item.harga).toLocaleString('id-ID')}</span>
                      <span className="price-label-text">{t.hargaSewa}</span>
                    </div>
                    <button type="button" className="modern-btn-select-fleet" onClick={() => handleSelectArmada(item)}>
                      {t.pilihBtn}
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TRUST BANNER & HELP SECTION */}
        <div className="modern-scroller-footer-group">
          <div className="modern-trust-badge-banner">
            <div className="trust-icon-circle"><i className="fa-solid fa-shield-halved"></i></div>
            <div className="trust-strings-text">
              <h5>{t.amanTitle}</h5>
              <p>{t.amanDesc}</p>
            </div>
          </div>

          <div className="modern-help-card-banner" onClick={handleOpenHelpCS}>
            <div className="help-left-side">
              <div className="help-icon-circle"><i className="fa-solid fa-headset"></i></div>
              <div className="help-strings-text">
                <h5>{t.bantuanTitle}</h5>
                <p>{t.bantuanDesc}</p>
              </div>
            </div>
            <i className="fa-solid fa-chevron-right arrow-muted-nav"></i>
          </div>
          
          <div className="modern-search-screen-footer">
            <p>© 2026 TRAVELIND. All Rights Reserved.</p>
          </div>
        </div>
      </div>

      {/* ==========================================================================
         🥞 PORTAL SYSTEM: MODERN PREMIUM BOTTOM SHEETS OVERLAYS
         ========================================================================== */}
      {activeBottomSheet && (
        <div className="modern-search-sheet-overlay" onClick={() => setActiveBottomSheet(null)}>
          
          {/* Sheet Urutkan */}
          {activeBottomSheet === 'urutkan' && (
            <div className="modern-search-bottom-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="modern-search-sheet-notch"></div>
              <div className="modern-search-sheet-header">
                <h5>{t.sheetUrutTitle}</h5>
                <button type="button" className="modern-search-close-btn" onClick={() => setActiveBottomSheet(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="modern-search-sheet-body">
                <div className={`modern-search-option-row ${jenisUrutan === 'murah' ? 'is-selected' : ''}`} onClick={() => handleExecuteSort('murah')}>
                  <span className="option-label-group"><i className="fa-solid fa-arrow-trend-up"></i> {bahasaGlobal === 'ID' ? 'Harga Terendah (Termurah)' : 'Lowest Price (Cheapest)'}</span>
                  <i className="fa-solid fa-circle-check check-indicator-icon"></i>
                </div>
                <div className={`modern-search-option-row ${jenisUrutan === 'mahal' ? 'is-selected' : ''}`} onClick={() => handleExecuteSort('mahal')}>
                  <span className="option-label-group"><i className="fa-solid fa-arrow-trend-down"></i> {bahasaGlobal === 'ID' ? 'Harga Tertinggi (Termahal)' : 'Highest Price (Most Expensive)'}</span>
                  <i className="fa-solid fa-circle-check check-indicator-icon"></i>
                </div>
              </div>
            </div>
          )}

          {/* Sheet Filter */}
          {activeBottomSheet === 'filter' && (
            <div className="modern-search-bottom-sheet animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="modern-search-sheet-notch"></div>
              <div className="modern-search-sheet-header">
                <h5>{t.sheetFilterTitle}</h5>
                <button type="button" className="modern-search-close-btn" onClick={() => setActiveBottomSheet(null)}>
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="modern-search-sheet-body">
                <div className={`modern-search-option-row ${filterTipeMobil === 'ALL' ? 'is-selected' : ''}`} onClick={() => handleExecuteFilter('ALL')}>
                  <span className="option-label-group"><i className="fa-solid fa-border-all"></i> {t.allArmada}</span>
                  <i className="fa-solid fa-circle-check check-indicator-icon"></i>
                </div>
                <div className={`modern-search-option-row ${filterTipeMobil === 'INNOVA' ? 'is-selected' : ''}`} onClick={() => handleExecuteFilter('INNOVA')}>
                  <span className="option-label-group"><i className="fa-solid fa-car-side"></i> Toyota Innova</span>
                  <i className="fa-solid fa-circle-check check-indicator-icon"></i>
                </div>
                <div className={`modern-search-option-row ${filterTipeMobil === 'HIACE' ? 'is-selected' : ''}`} onClick={() => handleExecuteFilter('HIACE')}>
                  <span className="option-label-group"><i className="fa-solid fa-van-shuttle"></i> Toyota HiAce / Minibus</span>
                  <i className="fa-solid fa-circle-check check-indicator-icon"></i>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default HasilPencarianView;