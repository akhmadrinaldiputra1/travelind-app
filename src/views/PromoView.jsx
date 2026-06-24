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
  const [showNotif, setShowNotif] = useState(false); // State untuk Popup Notifikasi Premium

  // ----------------==========================================================
  // 🔄 LIFECYCLE DETECTION: FETCH FROM SUPABASE
  // ----------------------------------------------------------------==========
  useEffect(() => {
    const muatSeluruhDataEtalase = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const zonaWaktuLokal = new Date();
        const offsetSistem = zonaWaktuLokal.getTimezoneOffset() * 60000;
        const tanggalSesuaiLokal = new Date(zonaWaktuLokal.getTime() - offsetSistem);
        const hariIni = tanggalSesuaiLokal.toISOString().split('T')[0];

        // A. FETCH DATA PROMO
        const { data: dataPromo, error: errorPromo } = await supabase
          .from("promo")
          .select("*")
          .gte("tanggal_kedaluwarsa", hariIni)
          .order("id", { ascending: false });

        if (errorPromo) throw errorPromo;

        const promoAktifLolosSaring = (dataPromo || []).filter(promo => {
          return !(promo.sekali_pakai && promo.sudah_dipakai);
        });
        setDaftarPromo(promoAktifLolosSaring);

        // B. FETCH DATA IKLAN BANNER
        const { data: dataIklan, error: errorIklan } = await supabase
          .from("iklan")
          .select("*")
          .eq("is_aktif", true)
          .order("id", { ascending: false });

        if (errorIklan) throw errorIklan;
        setDaftarIklan(dataIklan || []);

      } catch (err) {
        console.error("Gagal sinkronisasi data etalase cloud:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    muatSeluruhDataEtalase();
  }, []);

  const tanganiScrollIklan = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const indexTerhitung = Math.round(scrollLeft / clientWidth);
      setCurrentIndexIklan(indexTerhitung);
    }
  };

  const tanganiSalinKupon = (kodePromo) => {
    navigator.clipboard.writeText(kodePromo)
      .then(() => {
        alert(`🎉 Kupon "${kodePromo}" berhasil disalin!\nGunakan kode ini di halaman pembayaran untuk menikmati potongan diskon.`);
        localStorage.setItem("kupon_aktif_travelind", kodePromo);
      })
      .catch((err) => {
        console.error("Gagal menyalin kupon:", err);
        alert(`Kode Kupon Anda: ${kodePromo}`);
      });
  };

  const konversiFormatTanggalIndo = (stringTanggal) => {
    if (!stringTanggal) return "-";
    const opsi = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(stringTanggal).toLocaleDateString('id-ID', opsi);
  };

  return (
    <div className="app-container app-promo-container">
      
      {/* HEADER NAVIGASI BAR PREMIUM */}
      <header className="main-header premium-header">
        <div className="header-left">
          <div className="back-btn" onClick={() => navigate('/home')} title="Kembali ke Beranda">
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <h2 className="page-title">Promo Spesial</h2>
        </div>
        {/* Tombol Lonceng Aktif */}
        <div className="header-right-icon" onClick={() => setShowNotif(true)} title="Lihat Notifikasi" style={{ color: '#ffffff'}}>
          <i className="fa-solid fa-bell"></i>
          <span className="notif-badge-dot"></span>
        </div>
      </header>

      {/* BODY WRAPPER CONTENT */}
      <main className="content-wrapper">
        <div className="promo-intro">
          <h3>Makin Hemat, Makin Untung!</h3>
          <p>Salin kode kupon di bawah ini dan gunakan saat pengisian formulir pemesanan tiket Anda.</p>
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
              <i className="fa-solid fa-circle-exclamation"></i>
              <p>Gagal terhubung dengan server cloud. Silakan muat ulang halaman.</p>
            </div>
          )}

          {!isLoading && !isError && daftarPromo.length === 0 && (
            <div className="state-info-empty">
              <i className="fa-solid fa-ticket"></i>
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
                <span className="promo-badge">{teksBadge}</span>
                <h4 className="promo-title">{promo.judul}</h4>
                <p className="promo-desc">{promo.deskripsi} <strong className="highlight-tag">(Potongan {formatDiskon})</strong></p>
                
                <div className="ticket-divider"></div>
                
                <div className="coupon-action-row">
                  <div className="code-box">{promo.kode_promo}</div>
                  <button type="button" className="copy-coupon-btn" onClick={() => tanganiSalinKupon(promo.kode_promo)}>
                    <i className="fa-regular fa-copy"></i> Salin
                  </button>
                </div>

                <div className="expiry-date">
                  <i className="fa-regular fa-calendar-check"></i> Berlaku s.d {konversiFormatTanggalIndo(promo.tanggal_kedaluwarsa)}
                </div>
              </div>
            );
          })}
        </div>

        {/* ==========================================================================
             📺 SEKTOR RENDER ADS CAROUSEL INDIKATOR
             ========================================================================== */}
        {!isLoading && !isError && daftarIklan.length > 0 && (
          <div className="ads-section-wrapper">
            <div className="ads-section-header">
              <span className="live-dot-pulse"></span>
              <span>Rekomendasi Info Untuk Anda</span>
            </div>
            
            <div className="ads-container-scroll" ref={scrollRef} onScroll={tanganiScrollIklan}>
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

     {/* GANTI BLOK POPUP MODAL NOTIFIKASI PREMIUM MENJADI SEPERTI INI: */}
{showNotif && (
  <div className="premium-modal-overlay" onClick={() => setShowNotif(false)}>
    <div className="premium-modal-card" onClick={(e) => e.stopPropagation()}>
      <div className="premium-modal-header">
        <div className="bell-animated-icon">
          <i className="fa-solid fa-bell"></i>
        </div>
        <h3>Pusat Notifikasi</h3>
        <p>Update info perjalanan & penawaran spesial khusus untukmu</p>
      </div>
      <div className="premium-modal-body">
        <div className="notif-item-row">
          <div className="notif-dot-active"></div>
          <div className="notif-text-content">
            <h5>Voucher Promo Siap Digunakan! 🎉</h5>
            <p>Selamat! Kupon potongan harga spesial TRAVELIND sudah aktif. Salin kodenya dan nikmati perjalanan hemat antar kota hari ini.</p>
            <span>Baru Saja</span>
          </div>
        </div>
      </div>
      <button className="premium-modal-close-btn" onClick={() => setShowNotif(false)}>
        Selesai & Tutup
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default PromoView;