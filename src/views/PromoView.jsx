import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import '../styles/promo.css'; 

const PromoView = () => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [daftarPromo, setDaftarPromo] = useState([]);
  const [daftarIklan, setDaftarIklan] = useState([]);
  const [currentIndexIklan, setCurrentIndexIklan] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [showNotif, setShowNotif] = useState(false); 
  const [copiedKupon, setCopiedKupon] = useState(''); 
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false); // Deteksi Status Login

  // ----------------==========================================================
  // 🔄 LIFECYCLE DETECTION: FETCH FROM SUPABASE WITH LIVE AUTH FILTER
  // ----------------------------------------------------------------==========
  useEffect(() => {
    const muatSeluruhDataEtalase = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        // 1. CEK STATUS AUTENTIKASI USER AKTIF
        const { data: sessionData } = await supabase.auth.getSession();
        const loggedIn = !!sessionData.session;
        setIsUserLoggedIn(loggedIn);

        const zonaWaktuLokal = new Date();
        const offsetSistem = zonaWaktuLokal.getTimezoneOffset() * 60000;
        const tanggalSesuaiLokal = new Date(zonaWaktuLokal.getTime() - offsetSistem);
        const hariIni = tanggalSesuaiLokal.toISOString().split('T')[0];

        // A. FETCH DATA PROMO (VOUCHER TIKET)
        const { data: dataPromo, error: errorPromo } = await supabase
          .from("promo")
          .select("*")
          .gte("tanggal_kedaluwarsa", hariIni)
          .order("id", { ascending: false });

        if (errorPromo) throw errorPromo;

        // FILTER VOUCHER BERDASARKAN STATUS LOGIN
        const promoSaringStatus = (dataPromo || []).filter(promo => {
          // Singkirkan yang sekali pakai & sudah hangus
          if (promo.sekali_pakai && promo.sudah_dipakai) return false;
          
          // Filter Kolom target_user yang disesuaikan di Dashboard Admin
          if (loggedIn) {
            return promo.target_user === 'SEMUA' || promo.target_user === 'SUDAH_LOGIN';
          } else {
            return promo.target_user === 'SEMUA' || promo.target_user === 'BELUM_LOGIN';
          }
        });
        setDaftarPromo(promoSaringStatus);

        // B. FETCH DATA IKLAN BANNER INFO
        const { data: dataIklan, error: errorIklan } = await supabase
          .from("iklan")
          .select("*")
          .eq("is_aktif", true)
          .order("id", { ascending: false });

        if (errorIklan) throw errorIklan;

        // FILTER BANNER IKLAN BERDASARKAN STATUS LOGIN
        const iklanSaringStatus = (dataIklan || []).filter(iklan => {
          // Filter Kolom tampilkan_pada yang disesuaikan di Dashboard Admin
          if (loggedIn) {
            return iklan.tampilkan_pada === 'SEMUA' || iklan.tampilkan_pada === 'SUDAH_LOGIN';
          } else {
            return iklan.tampilkan_pada === 'SEMUA' || iklan.tampilkan_pada === 'BELUM_LOGIN';
          }
        });
        setDaftarIklan(iklanSaringStatus);

      } catch (err) {
        console.error("Gagal sinkronisasi data etalase cloud:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    muatSeluruhDataEtalase();
  }, []);

  // 🌟 AUTOMATIC INFINITE SLIDER FOR ADS (Sama seperti Engine HomeView)
  useEffect(() => {
    if (daftarIklan.length <= 1) return;

    const intervalIklan = setInterval(() => {
      setCurrentIndexIklan((prevIndex) => {
        const nextIndex = prevIndex === daftarIklan.length - 1 ? 0 : prevIndex + 1;
        
        if (scrollRef.current) {
          const clientWidth = scrollRef.current.clientWidth;
          scrollRef.current.scrollTo({
            left: nextIndex * clientWidth,
            behavior: 'smooth'
          });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(intervalIklan);
  }, [daftarIklan]);

  const tanganiScrollIklanManual = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      if (clientWidth > 0) {
        const indexTerhitung = Math.round(scrollLeft / clientWidth);
        setCurrentIndexIklan(indexTerhitung);
      }
    }
  };

  const tanganiSalinKupon = (kodePromo) => {
    navigator.clipboard.writeText(kodePromo)
      .then(() => {
        localStorage.setItem("kupon_aktif_travelind", kodePromo);
        setCopiedKupon(kodePromo);
        setTimeout(() => setCopiedKupon(''), 2500); 
      })
      .catch((err) => {
        console.error("Gagal menyalin kupon:", err);
      });
  };

  const konversiFormatTanggalIndo = (stringTanggal) => {
    if (!stringTanggal) return "-";
    const opsi = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(stringTanggal).toLocaleDateString('id-ID', opsi);
  };

  return (
    <div className="app-container app-promo-container">
      
      {/* HEADER NAVIGASI BAR PREMIUM WITH PERFECT CENTERING TITLE */}
      <header className="main-header premium-header">
        <div className="back-btn" onClick={() => navigate('/home')} title="Kembali ke Beranda">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"/>
          </svg>
        </div>
        
        <h2 className="page-title-center">Promo Spesial</h2>
        
        <div className="header-right-icon" onClick={() => setShowNotif(true)} title="Lihat Notifikasi">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
          <span className="notif-badge-dot"></span>
        </div>
      </header>

      {/* BODY WRAPPER CONTENT */}
      <main className="content-wrapper">
        <div className="promo-intro">
          <h3>Makin Hemat, Makin Untung! ✦</h3>
          <p>Salin kode kupon eksklusif di bawah ini untuk menikmati potongan harga tiket langsung saat pembayaran.</p>
        </div>

        {/* AREA RENDER VOUCHER PROMO */}
        <div id="containerVoucherDinamis">
          {isLoading && (
            <div className="state-info-loading">
              <div className="premium-spinner"></div>
              <p>Menyinkronkan voucher eksklusif...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="state-info-error">
              <span className="error-icon">✕</span>
              <p>Gagal terhubung dengan server cloud. Silakan muat ulang halaman.</p>
            </div>
          )}

          {!isLoading && !isError && daftarPromo.length === 0 && (
            <div className="state-info-empty">
              <p>Belum ada kupon promo aktif saat ini.</p>
            </div>
          )}

          {!isLoading && !isError && daftarPromo.map((promo, indeks) => {
            const formatDiskon = `Rp ${parseInt(promo.nominal_potongan || 0).toLocaleString('id-ID')}`;
            const teksBadge = promo.tipe_promo === 'BARU' ? 'Pengguna Baru' : 'Diskon Spesial';
            
            const isGayaOrange = indeks % 2 === 1;
            const kelasVariasiWarna = isGayaOrange ? "gaya-orange" : "";

            return (
              <div key={promo.id} className={`promo-card premium-card-shadow ${kelasVariasiWarna}`}>
                <div className="promo-card-top">
                  <span className="promo-badge">{teksBadge}</span>
                  <h4 className="promo-title">{promo.judul}</h4>
                  <p className="promo-desc">{promo.deskripsi}</p>
                  <div className="highlight-tag">Potongan {formatDiskon}</div>
                </div>
                
                <div className="ticket-divider">
                  <span className="notch left"></span>
                  <span className="line"></span>
                  <span className="notch right"></span>
                </div>
                
                <div className="promo-card-bottom">
                  <div className="coupon-action-row">
                    <div className="code-box">{promo.kode_promo}</div>
                    <button 
                      type="button" 
                      className={`copy-coupon-btn ${copiedKupon === promo.kode_promo ? 'copied' : ''}`} 
                      onClick={() => tanganiSalinKupon(promo.kode_promo)}
                    >
                      {copiedKupon === promo.kode_promo ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>

                  <div className="expiry-date">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{marginRight: '4px'}}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                    Berlaku s.d {konversiFormatTanggalIndo(promo.tanggal_kedaluwarsa)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ==========================================================================
             📺 SEKTOR RENDER ADS CAROUSEL INDIKATOR (INFO BANNER)
             ========================================================================== */}
        {!isLoading && !isError && daftarIklan.length > 0 && (
          <div className="ads-section-wrapper">
            <div className="ads-section-header">
              <span className="live-dot-pulse"></span>
              <span>Rekomendasi Info Untuk Anda</span>
            </div>
            
            <div className="ads-container-scroll" ref={scrollRef} onScroll={tanganiScrollIklanManual}>
              {daftarIklan.map((iklan) => {
                const TargetWrapper = iklan.link_tujuan ? 'a' : 'div';
                const wrapperProps = iklan.link_tujuan ? { href: iklan.link_tujuan, target: '_blank', rel: 'noreferrer' } : {};

                return (
                  <TargetWrapper key={iklan.id} className="ad-banner-card" {...wrapperProps}>
                    <img src={iklan.gambar_url} alt={iklan.judul} className="ad-banner-image" />
                    <div className="ad-banner-overlay-gradient">
                      <h4>{iklan.judul}</h4>
                    </div>
                  </TargetWrapper>
                );
              })}
            </div>

            {daftarIklan.length > 1 && (
              <div className="ads-carousel-dots-group">
                {daftarIklan.map((_, idx) => (
                  <span key={idx} className={`carousel-dot ${idx === currentIndexIklan ? 'active' : ''}`}></span>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL NOTIFIKASI MODEREN BOTTOM SHEET COMPATIBLE WITH HOME */}
      <div className={`premium-modal-overlay ${showNotif ? 'active' : ''}`} onClick={() => setShowNotif(false)}>
        <div className="premium-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="popup-sheet-notch"></div>
          <div className="premium-modal-header">
            <div className="bell-animated-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            </div>
            <h3>Pusat Notifikasi</h3>
            <p>Update info perjalanan & penawaran spesial khusus untukmu</p>
          </div>
          <div className="premium-modal-body">
            <div className="notif-item-row">
              <div className="notif-dot-active"></div>
              <div className="notif-text-content">
                <h5>Voucher Promo Siap Digunakan! 🎉</h5>
                <p>Kupon potongan harga spesial TRAVELIND sudah aktif. Salin kodenya dan dapatkan diskon perjalanan hemat hari ini.</p>
                <span>Baru Saja</span>
              </div>
            </div>
          </div>
          <button className="premium-modal-close-btn" onClick={() => setShowNotif(false)}>
            Selesai & Tutup
          </button>
        </div>
      </div>

      {/* MINI TOAST COMPACT FEEDBACK NOTIFICATION */}
      <div className={`toast-feedback-alert ${copiedKupon ? 'show' : ''}`}>
         🎉 Kupon "{copiedKupon}" berhasil disalin!
      </div>

    </div>
  );
};

export default PromoView;