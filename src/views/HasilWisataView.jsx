import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import useAuthStore from '../store/authStore'; // 👈 Tambah integrasi bahasa global
import '../styles/wisataTerdekat.css'; 

const HasilWisataView = () => {
  const navigate = useNavigate();
  const { bahasaGlobal } = useAuthStore();

  const [daftarWisataLengkap, setDaftarWisataLengkap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // 🌟 KAMUS MULTI-BAHASA HALAMAN LIST WISATA
  const t = {
    ID: {
      navTitle: 'Destinasi Terdekat',
      subTitle: 'Eksplorasi Di Sekitarmu',
      mainTitle: 'Semua Destinasi Untukmu',
      loadingTxt: 'Menyusun daftar wisata terbaik di sekitarmu...',
      priceLabel: 'Tiket Masuk',
      freeTxt: 'Gratis',
      emptyTxt: 'Tidak ada objek wisata yang ditemukan di sekitar lokasi Anda saat ini.'
    },
    EN: {
      navTitle: 'Nearby Destinations',
      subTitle: 'Exploration 100KM Radius',
      mainTitle: 'All Destinations for You',
      loadingTxt: 'Compiling the best travel deals near you...',
      priceLabel: 'Admission Fee',
      freeTxt: 'Free',
      emptyTxt: 'No destinations found around your current location.'
    }
  }[bahasaGlobal || 'ID'];

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolokasi tidak didukung oleh browser Anda.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        fetchSemuaWisata(coords);
      },
      (error) => {
        console.error("Error mengambil GPS:", error);
        const defaultCoords = { latitude: -0.9471, longitude: 100.4172 }; // Default Padang
        fetchSemuaWisata(defaultCoords);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const fetchSemuaWisata = async (coords) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wisata')
        .select('*');

      if (error) throw error;

      if (data) {
        const wisataDenganJarak = data.map((item) => {
          const latWisata = parseFloat(item.latitude);
          const lonWisata = parseFloat(item.longitude);

          if (isNaN(latWisata) || isNaN(lonWisata)) {
            return { ...item, jarak: 999999 };
          }

          const jarak = hitungJarakHaversine(coords.latitude, coords.longitude, latWisata, lonWisata);
          return { ...item, jarak: jarak };
        });

        const hasilValid = wisataDenganJarak.filter(item => item.jarak !== 999999 && item.jarak <= 100);
        hasilValid.sort((a, b) => a.jarak - b.jarak);

        setDaftarWisataLengkap(hasilValid);
      }
    } catch (err) {
      console.error(err.message);
      setErrorMsg("Gagal memuat data destinasi.");
    } finally {
      setLoading(false);
    }
  };

  const hitungJarakHaversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatRupiah = (angka) => {
    if (!angka || angka === 0) return t.freeTxt;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="travelind-luxury-home-container wisata-page-bg-override">
      
      {/* 📌 PREMIUM TOP NAVIGATION BAR */}
      <div className="premium-view-page-header">
        <button type="button" className="header-back-circle-btn" onClick={() => navigate(-1)}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h3 className="header-nav-title-text">{t.navTitle}</h3>
        <div style={{ width: '36px' }}></div>
      </div>

      {/* 📌 SCROLLABLE CONTENT WRAPPER */}
      <div className="wisata-results-scroll-area">
        <div className="wisata-title-block-header">
          <span className="premium-subtitle">{t.subTitle}</span>
          <h2 className="wisata-main-display-title">{t.mainTitle}</h2>
        </div>

        {loading && (
          <div className="premium-loading-box">
            <div className="premium-spinner"></div>
            <p>{t.loadingTxt}</p>
          </div>
        )}

        {errorMsg && <p className="wisata-error-toast">{errorMsg}</p>}

        {!loading && (
          <div className="premium-grid-layout-container">
            {daftarWisataLengkap.map((wisata) => (
              <div className="premium-wisata-card GridViewNode" key={wisata.id}>
                <div className="card-image-wrapper">
                  {wisata.foto_url ? (
                    <img src={wisata.foto_url} alt={wisata.nama} className="card-featured-img" />
                  ) : (
                    <div className="card-img-placeholder">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 00-2.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="card-glass-badge">
                    📍 {wisata.jarak.toFixed(1)} km
                  </div>
                </div>

                <div className="card-info-content">
                  <div>
                    <h4 className="card-destination-title">{wisata.nama}</h4>
                    <p className="card-destination-desc">{wisata.deskripsi || "Jelajahi keindahan destinasi lokal menakjubkan ini."}</p>
                  </div>
                  
                  <div className="card-footer-row">
                    <div className="price-tag-box">
                      <span className="price-label">{t.priceLabel}</span>
                      <span className="price-value">{formatRupiah(wisata.harga_tiket)}</span>
                    </div>
                   <button 
    type="button" 
    className="card-arrow-btn"
    style={{ width: '30px', height: '30px' }}
    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wisata.nama)}`, '_blank')}
>
    {/* 🌟 IKON PANAH ARAH PREMIUM SVG MURNI */}
    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 00-6 6v3" />
    </svg>
</button>
                  </div>
                </div>
              </div>
            ))}

            {daftarWisataLengkap.length === 0 && (
              <div className="premium-empty-state" style={{ gridColumn: 'span 2' }}>
                <p>{t.emptyTxt}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HasilWisataView;