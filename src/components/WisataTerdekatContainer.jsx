import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient'; 
import useAuthStore from '../store/authStore'; // 👈 Mengambil state bahasa global
import '../styles/wisataTerdekat.css'; 

export default function WisataTerdekatContainer() {
    const navigate = useNavigate();
    const { bahasaGlobal } = useAuthStore(); // 👈 Destructure bahasaGlobal

    const [lokasiUser, setLokasiUser] = useState(null);
    const [daftarWisata, setDaftarWisata] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // 🌟 KAMUS MULTI-BAHASA DINAMIS KHUSUS REKOMENDASI WISATA
    const t = {
        ID: {
            subTitle: 'REKOMENDASI LOKAL',
            mainTitle: 'Wisata Terdekat Untukmu',
            loadingTxt: 'Mencari destinasi terbaik di sekitarmu...',
            errorTxt: 'Gagal memuat rekomendasi wisata.',
            defaultDesc: 'Jelajahi keindahan destinasi lokal menakjubkan ini.',
            priceLabel: 'Mulai dari',
            freeTxt: 'Gratis',
            btnLihatSemua: 'Lihat Semua',
            subLihatSemua: 'Jelajahi wisata radius 100km',
            emptyTxt: 'Tidak ada objek wisata dalam radius 100km di sekitar Anda.'
        },
        EN: {
            subTitle: 'LOCAL RECOMMENDATIONS',
            mainTitle: 'Nearby Attractions for You',
            loadingTxt: 'Finding the best destinations near you...',
            errorTxt: 'Failed to load travel recommendations.',
            defaultDesc: 'Explore the beauty of this stunning local destination.',
            priceLabel: 'Starting from',
            freeTxt: 'Free',
            btnLihatSemua: 'See All',
            subLihatSemua: 'Explore attractions within 100km',
            emptyTxt: 'No attractions found within 100km radius from your location.'
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
                setLokasiUser(coords);
                fetchWisataTerdekat(coords);
            },
            (error) => {
                console.error("Error mengambil GPS:", error);
                const defaultCoords = { latitude: -0.9471, longitude: 100.4172 }; // Default Padang
                setLokasiUser(defaultCoords);
                fetchWisataTerdekat(defaultCoords);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    const fetchWisataTerdekat = async (coords) => {
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

                // Filter radius maksimal 100 KM dan urutkan
                const hasilValid = wisataDenganJarak.filter(item => item.jarak !== 999999 && item.jarak <= 100);
                hasilValid.sort((a, b) => a.jarak - b.jarak);

                // Ambil maksimal 5 untuk halaman depan
                setDaftarWisata(hasilValid.slice(0, 5));
            }
        } catch (err) {
            console.error("Gagal memuat data:", err.message);
            setErrorMsg(t.errorTxt);
        } finally {
            setLoading(false);
        }
    };

    const hitungJarakHaversine = (lat1, lon1, lat2, lon2) => {
        const R = 6371; 
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; 
    };

    const formatRupiah = (angka) => {
        if (!angka || angka === 0) return t.freeTxt;
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
    };

    const handleLihatSemua = () => {
        navigate('/wisata-terdekat'); // 👈 Pindah halaman instan dengan React Router DOM
    };

    return (
        <div className="travelind-premium-section">
            {/* Header Section */}
            <div className="premium-section-header">
                <div className="header-title-wrapper">
                    <span className="premium-subtitle">{t.subTitle}</span>
                    <h3 className="premium-main-title">{t.mainTitle}</h3>
                </div>
            </div>

            {loading && (
                <div className="premium-loading-box">
                    <div className="premium-spinner"></div>
                    <p>{t.loadingTxt}</p>
                </div>
            )}

            {!loading && (
                <div className="premium-carousel-container">
                    {daftarWisata.map((wisata) => (
                        <div className="premium-wisata-card" key={wisata.id}>
                            <div className="card-image-wrapper">
                                {wisata.foto_url ? (
                                    <img src={wisata.foto_url} alt={wisata.nama} className="card-featured-img" />
                                ) : (
                                    <div className="card-img-placeholder">
                                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    </div>
                                )}
                                <div className="card-glass-badge">
                                    📍 {wisata.jarak.toFixed(1)} km
                                </div>
                            </div>

                            <div className="card-info-content">
                                <h4 className="card-destination-title">{wisata.nama}</h4>
                                
                                <p className="card-destination-desc">
                                    {wisata.deskripsi || t.defaultDesc}
                                </p>

                                <div className="card-footer-row">
                                    <div className="price-tag-box">
                                        <span className="price-label">{t.priceLabel}</span>
                                        <span className="price-value">{formatRupiah(wisata.harga_tiket)}</span>
                                    </div>
                                    <button 
    type="button" 
    className="card-arrow-btn"
    onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wisata.nama)}`, '_blank')}
    title="Petunjuk Arah"
>
    {/* 🌟 IKON PANAH ARAH PREMIUM SVG MURNI */}
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 00-6 6v3" />
    </svg>
</button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* TOMBOL "LIHAT SEMUA" DI UJUNG CAROUSEL */}
                    {daftarWisata.length > 0 && (
                        <div className="premium-see-more-card" onClick={handleLihatSemua}>
                            <div className="see-more-circle-btn">
                                ➔
                            </div>
                            <span className="see-more-text">{t.btnLihatSemua}</span>
                            <span className="see-more-subtext">{t.subLihatSemua}</span>
                        </div>
                    )}

                    {/* Jika Jarak Kosong */}
                    {daftarWisata.length === 0 && (
                        <div className="premium-empty-state">
                            <p>{t.emptyTxt}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}