import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import useAuthStore from '../store/authStore'; // 🌟 Integrasi Zustand Store Global
import '../styles/detailPemesanan.css';

const DetailPemesananView = () => {
  const navigate = useNavigate();
  const { user, bahasaGlobal } = useAuthStore(); // 🌟 Ambil state bahasa global otomatis

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMapTujuan, setShowMapTujuan] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false); // 🌟 State untuk popup data belum lengkap
  const [isSubmitting, setIsSubmitting] = useState(false); // 🌟 State UX Micro-loading tombol

  // --------------------------------------------------------------------------
  // ⚡️ CORE DATA STATE & FORM
  // --------------------------------------------------------------------------
  const [travelInfo, setTravelInfo] = useState({ nama: '', jam: '', harga: 0, pickup: '', tujuan: '', tanggal: '', penumpang: 1, labelMerekDinamis: '' });
  const [pricing, setPricing] = useState({ totalTiket: 0, grandTotal: 0 });
  
  const [alamatPickupText, setAlamatPickupText] = useState('Mencari area penjemputan...');
  const [alamatTujuanMain, setAlamatTujuanMain] = useState('Klik untuk isi tujuan');
  const [alamatTujuanSub, setAlamatTujuanSub] = useState('Masukkan alamat tujuan pengantaran');

  const [formPassenger, setFormPassenger] = useState({ nama: '', whatsapp: '', email: '' });
  const [isAgreed, setIsAgreed] = useState(false);

  // Kamus Terjemahan Otomatis
  const t = {
    ID: {
      pageTitle: 'Pemesanan',
      step1: 'Cari',
      step2: 'Pilih',
      step3: 'Isi Data',
      step4: 'Bayar',
      rekomendasi: 'Rekomendasi Agen',
      berangkat: 'WIB Berangkat',
      rute: 'Rute Utama',
      infoTitle: 'Informasi Perjalanan',
      tglBerangkat: 'Tanggal Keberangkatan',
      kapasitas: 'Kapasitas Dipesan',
      orang: 'Orang',
      dataDiriTitle: 'Data Diri Penumpang',
      labelNama: 'Nama Lengkap Penumpang',
      placeholderNama: 'Masukkan nama sesuai KTP',
      labelWa: 'No. WhatsApp Aktif',
      placeholderWa: 'Contoh: 08xx-xxxx-xxxx',
      labelEmail: 'Alamat Email',
      placeholderEmail: 'Contoh: nama@email.com',
      pickupTitle: 'Lokasi Penjemputan Detail',
      pickupSub: 'Driver akan menjemput sesuai titik ini',
      tujuanTitle: 'Lokasi Tujuan Detail',
      placeholderCari: 'Ketik nama jalan / gedung / kota...',
      rincianTitle: 'Rincian Harga',
      hargaTiket: 'Harga Tiket',
      biayaLayanan: 'Biaya Layanan Aplikasi',
      totalBayar: 'Total Pembayaran',
      amanTitle: 'Pembayaran Terenkripsi & Aman',
      amanDesc: 'TRAVELIND melindungi seluruh data transaksi pemesanan Anda.',
      bacaSetuju: 'Saya telah membaca dan menyetujui ',
      syaratKetentuan: 'Syarat & Ketentuan',
      kebijakanPrivasi: 'Kebijakan Privasi',
      lanjutBtn: 'Lanjut ke Pembayaran',
      kebijakanBatal: 'Pembatalan gratis hingga 10 jam sebelum keberangkatan',
      navTitle: 'Menu Navigasi',
      menuHome: 'Beranda Utama',
      menuAkun: 'Akun Saya',
      menuTiket: 'Pesanan Saya',
      menuBantuan: 'Pusat Bantuan',
      sheetTermsTitle: '📄 Syarat & Ketentuan TRAVELIND',
      sheetTermsIntro: 'Mohon baca regulasi pembelian tiket berikut sebelum melanjutkan pembayaran:',
      terms1: 'Data nama, email, dan WhatsApp wajib diisi secara valid demi keperluan asuransi perjalanan.',
      terms2: 'Penumpang diharapkan standby di titik jemput paling lambat 30 menit sebelum jam keberangkatan tertera.',
      terms3: 'Batas bagasi gratis per penumpang adalah maksimal 10 kg. Kelebihan muatan akan dikenakan biaya tambahan oleh driver.',
      terms4: 'Pembatalan gratis dan pengembalian dana penuh berlaku maksimal hingga 10 jam sebelum jam keberangkatan.',
      btnMengerti: 'Saya Mengerti & Setuju',
      anonim: 'MASUK / DAFTAR',
      subAnonim: 'Akses riwayat perjalanan kamu'
    },
    EN: {
      pageTitle: 'Booking',
      step1: 'Search',
      step2: 'Book',
      step3: 'Fill Details',
      step4: 'Pay',
      rekomendasi: 'Recommended Agent',
      berangkat: 'WIB Departure',
      rute: 'Main Route',
      infoTitle: 'Travel Information',
      tglBerangkat: 'Departure Date',
      kapasitas: 'Seats Booked',
      orang: 'People',
      dataDiriTitle: 'Passenger Details',
      labelNama: 'Passenger Full Name',
      placeholderNama: 'Enter name according to ID card',
      labelWa: 'Active WhatsApp Number',
      placeholderWa: 'Example: 08xx-xxxx-xxxx',
      labelEmail: 'Email Address',
      placeholderEmail: 'Example: name@email.com',
      pickupTitle: 'Detailed Pickup Location',
      pickupSub: 'Driver will pick you up at this exact point',
      tujuanTitle: 'Detailed Destination Location',
      placeholderCari: 'Type street name / building / city...',
      rincianTitle: 'Price Details',
      hargaTiket: 'Ticket Price',
      biayaLayanan: 'Application Service Fee',
      totalBayar: 'Total Payment',
      amanTitle: 'Encrypted & Secure Payment',
      amanDesc: 'TRAVELIND protects all your booking transaction data.',
      bacaSetuju: 'I have read and agree to the ',
      syaratKetentuan: 'Terms & Conditions',
      kebijakanPrivasi: 'Privacy Policy',
      lanjutBtn: 'Continue to Payment',
      kebijakanBatal: 'Free cancellation up to 10 hours before departure',
      navTitle: 'Navigation Menu',
      menuHome: 'Main Home',
      menuAkun: 'My Account',
      menuTiket: 'My Bookings',
      menuBantuan: 'Help Center',
      sheetTermsTitle: '📄 TRAVELIND Terms & Conditions',
      sheetTermsIntro: 'Please read the following ticket purchase regulations before proceeding with payment:',
      terms1: 'Passenger name, email, and WhatsApp data must be filled out validly for travel insurance purposes.',
      terms2: 'Passengers are expected to be ready at the pickup point at least 30 minutes before the scheduled departure time.',
      terms3: 'The free baggage limit per passenger is a maximum of 10 kg. Excess baggage will be charged extra by the driver.',
      terms4: 'Free cancellation and full refund apply up to a maximum of 10 hours before departure time.',
      btnMengerti: 'I Understand & Agree',
      anonim: 'SIGN IN / SIGN UP',
      subAnonim: 'Access your travel history'
    }
  }[bahasaGlobal || 'ID'];

  const namaProfile = user ? (user.user_metadata?.full_name || user.email.split("@")[0].toUpperCase()) : t.anonim;
  const emailProfile = user?.email ? user.email : t.subAnonim;
  const inisialProfile = user ? namaProfile.charAt(0).toUpperCase() : '?';

  // ----------------==========================================================
  // 🗺️ LEAFLET INSTANCE REFS
  // ----------------------------------------------------------------==========
  const mapPickupRef = useRef(null);
  const markerPickupRef = useRef(null);
  const mapTujuanRef = useRef(null);
  const markerTujuanRef = useRef(null);
  const scrollerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const DEFAULT_LAT_SUMATERA = -0.9471;
  const DEFAULT_LNG_SUMATERA = 100.4172;

  useEffect(() => {
    if (!localStorage.getItem("travelId")) {
      navigate('/hasil-pencarian');
      return;
    }

    const nama = localStorage.getItem("travelNama") || 'Travel Agen';
    const jam = localStorage.getItem("travelJam") || '--:--';
    const harga = parseInt(localStorage.getItem("travelHarga")) || 0;
    const pickup = localStorage.getItem("travelPickup") || localStorage.getItem("pickup_kota") || '';
    const tujuan = localStorage.getItem("travelTujuan") || localStorage.getItem("tujuan_kota") || '';
    const tanggal = localStorage.getItem("tanggal") || '';
    const penumpang = parseInt(localStorage.getItem("penumpang")) || 1;

    let labelMerek = "";
    const nameUpper = nama.toUpperCase();
    if (nameUpper.includes("INNOVA")) labelMerek = " &nbsp;•&nbsp; Kategori: INNOVA";
    if (nameUpper.includes("HIACE")) labelMerek = " &nbsp;•&nbsp; Kategori: HIACE";

    const total = harga * penumpang;
    const grand = total + 2000;

    setTravelInfo({ nama, jam, harga, pickup, tujuan, tanggal, penumpang, labelMerekDinamis: labelMerek });
    setPricing({ totalTiket: total, grandTotal: grand });

    if (localStorage.getItem("fresh_search_trigger") === "true") {
      setAlamatPickupText("Klik pada peta untuk menentukan titik penjemputan");
      setAlamatTujuanMain("Klik tombol peta atau ketik alamat tujuan");
      setAlamatTujuanSub("Masukkan alamat tujuan pengantaran");
    } else {
      if (localStorage.getItem("pickup_alamat")) setAlamatPickupText(localStorage.getItem("pickup_alamat"));
      if (localStorage.getItem("tujuan_alamat")) {
        setAlamatTujuanMain(localStorage.getItem("tujuan_alamat"));
        setAlamatTujuanSub("Lokasi tujuan dikonfirmasi");
      }
    }

    const intervalCekLeaflet = setInterval(() => {
      if (window.L) {
        clearInterval(intervalCekLeaflet);
        setTimeout(() => {
          initPickupMapEngine(pickup);
        }, 300);
      }
    }, 100);

    if (user) {
      const namaUser = user.user_metadata?.full_name || user.email.split("@")[0].toUpperCase();
      setFormPassenger(prev => ({ ...prev, nama: prev.nama || namaUser, email: prev.email || user.email }));
    } else {
      setFormPassenger(prev => ({ ...prev, nama: prev.nama || '', email: prev.email || '' }));
    }

    return () => {
      clearInterval(intervalCekLeaflet);
      if (mapPickupRef.current) { mapPickupRef.current.remove(); mapPickupRef.current = null; }
      if (mapTujuanRef.current) { mapTujuanRef.current.remove(); mapTujuanRef.current = null; }
    };
  }, [navigate, user]);

  const dapatkanKoordinatKotaSumatera = async (namaKota) => {
    try {
      if (!namaKota) return null;
      if (namaKota.toLowerCase().includes("muko")) return { lat: -2.5833, lng: 101.1167 };
      let kotaBersih = namaKota.replace(/Kab\./gi, '').replace(/Kabupaten/gi, '').replace(/Kota/gi, '').replace(/-/g, ' ').trim();
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(kotaBersih + ", Indonesia")}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (e) { console.error(e); }
    return null;
  };

  const initPickupMapEngine = async (kotaAsal) => {
    if (!window.L || !document.getElementById('mapPickupCanvas') || mapPickupRef.current) return;

    const targetKota = kotaAsal || localStorage.getItem("pickup_kota") || "Padang";
    const coords = await dapatkanKoordinatKotaSumatera(targetKota);
    const latStart = coords ? coords.lat : DEFAULT_LAT_SUMATERA;
    const lngStart = coords ? coords.lng : DEFAULT_LNG_SUMATERA;

    const mapInstance = window.L.map('mapPickupCanvas', { zoomControl: true }).setView([latStart, lngStart], 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
    mapPickupRef.current = mapInstance;

    setTimeout(() => {
      mapInstance.invalidateSize();
      const savedLat = localStorage.getItem("pickup_lat");
      const savedLng = localStorage.getItem("pickup_lng");
      if (savedLat && savedLng) {
        setPickupMarker(parseFloat(savedLat), parseFloat(savedLng), mapInstance);
      } else {
        setPickupMarker(latStart, lngStart, mapInstance);
      }
    }, 200);

    mapInstance.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      localStorage.setItem("fresh_search_trigger", "false");
      setPickupMarker(lat, lng, mapInstance);
      fetchReverseGeocodeEngine(lat, lng, 'pickup');
    });
  };

  const initTujuanMapEngine = async (kotaTujuan, targetLat, targetLng) => {
    if (!window.L || !document.getElementById('mapTujuanCanvas') || mapTujuanRef.current) return;

    const targetKota = kotaTujuan || localStorage.getItem("tujuan_kota") || "Medan";
    const coords = await dapatkanKoordinatKotaSumatera(targetKota);
    const latStart = targetLat || (coords ? coords.lat : DEFAULT_LAT_SUMATERA);
    const lngStart = targetLng || (coords ? coords.lng : DEFAULT_LNG_SUMATERA);

    const mapInstance = window.L.map('mapTujuanCanvas', { zoomControl: true }).setView([latStart, lngStart], 13);
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance);
    mapTujuanRef.current = mapInstance;

    setTimeout(() => {
      mapInstance.invalidateSize();
      if (targetLat && targetLng) {
        setTujuanMarker(targetLat, targetLng, mapInstance);
      } else {
        const savedLat = localStorage.getItem("tujuan_lat");
        const savedLng = localStorage.getItem("tujuan_lng");
        if (savedLat && savedLng) setTujuanMarker(parseFloat(savedLat), parseFloat(savedLng), mapInstance);
      }
    }, 200);

    mapInstance.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      localStorage.setItem("fresh_search_trigger", "false");
      setTujuanMarker(lat, lng, mapInstance);
      fetchReverseGeocodeEngine(lat, lng, 'tujuan');
      setShowMapTujuan(false);
    });
  };

  const setPickupMarker = (lat, lng, instance) => {
    const mapObj = instance || mapPickupRef.current;
    if (!mapObj || !window.L) return;
    if (!markerPickupRef.current) {
      markerPickupRef.current = window.L.marker([lat, lng]).addTo(mapObj);
    } else {
      markerPickupRef.current.setLatLng([lat, lng]);
    }
    localStorage.setItem("pickup_lat", lat);
    localStorage.setItem("pickup_lng", lng);
  };

  const setTujuanMarker = (lat, lng, instance) => {
    const mapObj = instance || mapTujuanRef.current;
    if (!mapObj || !window.L) return;
    if (!markerTujuanRef.current) {
      markerTujuanRef.current = window.L.marker([lat, lng]).addTo(mapObj);
    } else {
      markerTujuanRef.current.setLatLng([lat, lng]);
    }
    localStorage.setItem("tujuan_lat", lat);
    localStorage.setItem("tujuan_lng", lng);
  };

  const fetchReverseGeocodeEngine = async (lat, lng, tipe) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const alamat = data.display_name || "Alamat tidak dikenal";
      const booking_id = localStorage.getItem("booking_id");

      if (tipe === 'pickup') {
        setAlamatPickupText(alamat);
        localStorage.setItem("pickup_alamat", alamat);
        if (booking_id) await supabase.from("booking_temp").update({ pickup_alamat: alamat, pickup_lat: lat, pickup_lng: lng }).eq("id", booking_id);
      } else {
        setAlamatTujuanMain(alamat);
        setAlamatTujuanSub("Lokasi tujuan dikonfirmasi via Peta");
        localStorage.setItem("tujuan_alamat", alamat);
        if (booking_id) await supabase.from("booking_temp").update({ tujuan_alamat: alamat, tujuan_lat: lat, tujuan_lng: lng }).eq("id", booking_id);
      }
    } catch (e) { console.error(e); }
  };

  const handleLocateMyGPS = () => {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      localStorage.setItem("fresh_search_trigger", "false");
      if (mapPickupRef.current) {
        mapPickupRef.current.setView([lat, lng], 16);
        setPickupMarker(lat, lng, mapPickupRef.current);
        fetchReverseGeocodeEngine(lat, lng, 'pickup');
      }
    }, () => { alert("Gagal mendeteksi koordinat GPS Handphone Anda."); });
  };

  const handleAutocompleteTyping = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    clearTimeout(searchTimeoutRef.current);
    if (keyword.trim().length < 3) { setSuggestions([]); return; }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword)}&limit=5`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) { console.error(err); }
    }, 400);
  };

  const handleSelectSuggestion = async (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    localStorage.setItem("fresh_search_trigger", "false");

    setShowMapTujuan(true);
    setAlamatTujuanMain(place.display_name);
    setAlamatTujuanSub("Lokasi terkonfirmasi via ketikan otomatis");
    localStorage.setItem("tujuan_alamat", place.display_name);

    await initTujuanMapEngine(travelInfo.tujuan, lat, lon);

    const booking_id = localStorage.getItem("booking_id");
    if (booking_id) await supabase.from("booking_temp").update({ tujuan_alamat: place.display_name, tujuan_lat: lat, tujuan_lng: lon }).eq("id", booking_id);

    setSuggestions([]);
    setSearchKeyword('');
  };

  // 🌟 SANITASI KETIKAN WA: Tolak semua huruf & batasi panjang nomor telpon
  const handleWhatsappTypingEngine = (e) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/[^0-9]/g, ''); // Buang semua karakter selain angka otomatis
    if (cleanDigits.length <= 15) {
      setFormPassenger(prev => ({ ...prev, whatsapp: cleanDigits }));
    }
  };

  // 🌟 PROSES VALIDASI UTAMA PREMIUM ANTI-ANTI JAIL ENGINE
  const handleExecuteBookingFinal = async () => {
    const namaClean = formPassenger.nama.trim();
    const whatsappClean = formPassenger.whatsapp.trim();
    const emailClean = formPassenger.email.trim();

    // A. Deteksi Box Kosong Mandatori
    if (!namaClean || !whatsappClean || !emailClean || !isAgreed) {
      setShowValidationAlert(true);
      return;
    }

    // B. Deteksi Orang Jail Memakai Angka Berulang Berlebihan (Regex match 5x berurutan)
    const patternAngkaBerulang = /([0-9])\1{4}/; 
    if (patternAngkaBerulang.test(whatsappClean)) {
      setShowValidationAlert(true);
      return;
    }

    // C. Validasi Struktur Format Email Benar Mengandung Karakter @
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailClean.includes('@') || !emailRegex.test(emailClean)) {
      setShowValidationAlert(true);
      return;
    }

    // D. Validasi Panjang Minimum Nomor Handphone Seluler Indonesia
    if (whatsappClean.length < 10) {
      setShowValidationAlert(true);
      return;
    }

    setIsSubmitting(true);
    const booking_id = localStorage.getItem("booking_id");
    const payload = {
      nama_penumpang: namaClean,
      whatsapp_penumpang: whatsappClean,
      email_penumpang: emailClean,
      pickup_alamat: localStorage.getItem("pickup_alamat") || alamatPickupText,
      tujuan_alamat: localStorage.getItem("tujuan_alamat") || alamatTujuanMain,
      pickup_lat: parseFloat(localStorage.getItem("pickup_lat")) || DEFAULT_LAT_SUMATERA,
      pickup_lng: parseFloat(localStorage.getItem("pickup_lng")) || DEFAULT_LNG_SUMATERA,
      tujuan_lat: parseFloat(localStorage.getItem("tujuan_lat")) || DEFAULT_LAT_SUMATERA,
      tujuan_lng: parseFloat(localStorage.getItem("tujuan_lng")) || DEFAULT_LNG_SUMATERA,
      pickup_kota: localStorage.getItem("pickup_kota") || travelInfo.pickup,
      tujuan_kota: localStorage.getItem("tujuan_kota") || travelInfo.tujuan,
      tanggal: travelInfo.tanggal,
      penumpang: travelInfo.penumpang
    };

    try {
      localStorage.setItem("nama_penumpang", namaClean);
      localStorage.setItem("whatsapp_penumpang", whatsappClean);
      localStorage.setItem("email_penumpang", emailClean);

      const { data, error } = await supabase
        .from("booking_temp")
        .upsert({ id: booking_id, ...payload })
        .select();

      if (error) throw error;

      if (data && data[0] && !booking_id) {
        localStorage.setItem("booking_id", data[0].id);
      }

      const current_booking_id = booking_id || (data && data[0] ? data[0].id : "TRV-TEMP");
      await supabase
        .from("transaksi")
        .upsert({
          booking_id: current_booking_id,
          nama_penumpang: namaClean,
          whatsapp_penumpang: whatsappClean,
          email_penumpang: emailClean,
          nama_travel: localStorage.getItem("travelNama") || "Armada Travelind",
          total_bayar: pricing.grandTotal,
          status_pesanan: "Menunggu Pembayaran"
        }, { onConflict: 'booking_id' });

      setIsSubmitting(false);
      navigate('/pembayaran');
    } catch (err) {
      console.error("❌ Eror Sinkronisasi:", err);
      setIsSubmitting(false);
      navigate('/pembayaran');
    }
  };

  const handleOpenHelpCS = () => {
    const pAsal = travelInfo.pickup || "Kota Asal";
    const pTujuan = travelInfo.tujuan || "Kota Tujuan";
    const txtWA = encodeURIComponent(`Halo CS TRAVELIND, saya butuh bantuan kendala rute travel dari ${pAsal} menuju ${pTujuan}.`);
    window.open(`https://wa.me/6281234567890?text=${txtWA}`, '_blank');
  };

  const handleNavigasiAkun = () => {
    setIsSidebarOpen(false);
    navigate('/profil'); 
  };

  return (
    <div className="travelind-booking-wrapper">
      
      {/* HEADER COLOURED PANEL STATIC BLOCK */}
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

        {/* PROGRESS TRACKER BAR */}
        <div className="progress-container">
          <div className="steps-row-modern">
            <div className="step-node completed">
              <span className="circle-node"><i className="fa-solid fa-check" style={{ fontSize: '10px' }}></i></span>
              <span className="node-label">{t.step1}</span>
            </div>
            <div className="line-connector full"></div>
            <div className="step-node completed">
              <span className="circle-node"><i className="fa-solid fa-check" style={{ fontSize: '10px' }}></i></span>
              <span className="node-label">{t.step2}</span>
            </div>
            <div className="line-connector full"></div>
            <div className="step-node active">
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
      </div>

      {/* CORE INPUT SCROLLER */}
      <div className="booking-content-scroller" ref={scrollerRef}>
        
        <section className="premium-card">
          <h3 className="title">{travelInfo.nama}</h3>
          <div className="subtitle">
            <i className="fa-solid fa-star" style={{ color: 'var(--accent-orange)' }}></i> 4.9 &nbsp;•&nbsp; {t.rekomendasi}
            <span dangerouslySetInnerHTML={{ __html: travelInfo.labelMerekDinamis }}></span>
          </div>
          <div className="item"><i className="fa-regular fa-clock"></i> <b>{travelInfo.jam}</b> {t.berangkat}</div>
          <div className="item"><i className="fa-solid fa-route"></i> {t.rute}: {travelInfo.pickup} → {travelInfo.tujuan}</div>
        </section>

        <section className="premium-card">
          <h4 className="section-title">{t.infoTitle}</h4>
          <div className="row">
            <div><small style={{ color: 'var(--text-muted)' }}>{t.tglBerangkat}</small><br /><b>{travelInfo.tanggal}</b></div>
            <div><small style={{ color: 'var(--text-muted)' }}>{t.kapasitas}</small><br /><b>{travelInfo.penumpang} {t.orang}</b></div>
          </div>
        </section>

        <section className="premium-card">
          <h4 className="section-title"><i className="fa-solid fa-address-card icon-teal"></i> {t.dataDiriTitle}</h4>
          <div className="passenger-form-group">
            <div className="input-field-wrapper">
              <label className="input-label-styled">{t.labelNama}</label>
              <div className="input-with-icon">
                <i className="fa-regular fa-user"></i>
                <input type="text" value={formPassenger.nama} onChange={(e) => setFormPassenger(prev => ({ ...prev, nama: e.target.value }))} placeholder={t.placeholderNama} className="form-input-styled" />
              </div>
            </div>

            <div className="input-field-wrapper">
              <label className="input-label-styled">{t.labelWa}</label>
              <div className="input-with-icon">
                <i className="fa-brands fa-whatsapp"></i>
                <input type="text" inputMode="numeric" value={formPassenger.whatsapp} onChange={handleWhatsappTypingEngine} placeholder={t.placeholderWa} className="form-input-styled" />
              </div>
            </div>

            <div className="input-field-wrapper">
              <label className="input-label-styled">{t.labelEmail}</label>
              <div className="input-with-icon">
                <i className="fa-regular fa-envelope"></i>
                <input type="email" value={formPassenger.email} onChange={(e) => setFormPassenger(prev => ({ ...prev, email: e.target.value }))} placeholder={t.placeholderEmail} className="form-input-styled" />
              </div>
            </div>
          </div>
        </section>

        <section className="premium-card">
          <h4 className="section-title"><i className="fa-solid fa-location-dot icon-teal"></i> {t.pickupTitle}</h4>
          <div className="address-display-box">
            <div className="address-text-wrapper">
              <div className="address-main-text">{alamatPickupText}</div>
              <div className="address-sub-text">{t.pickupSub}</div>
            </div>
            <button type="button" className="gps-locate-btn" onClick={handleLocateMyGPS} title="GPS">
              <i className="fa-solid fa-location-crosshairs"></i>
            </button>
          </div>
          <div id="mapPickupCanvas"></div>
        </section>

        <section className="premium-card">
          <h4 className="section-title"><i className="fa-solid fa-flag-checkered icon-teal"></i> {t.tujuanTitle}</h4>
          <div className="address-display-box">
            <div className="address-text-wrapper">
              <div className="tujuan-main">{alamatTujuanMain}</div>
              <div className="tujuan-sub">{alamatTujuanSub}</div>
            </div>
            <button type="button" className="gps-locate-btn" onClick={async () => { const nextState = !showMapTujuan; setShowMapTujuan(nextState); if (nextState) setTimeout(() => initTujuanMapEngine(travelInfo.tujuan), 100); }} title="Peta">
              <i className="fa-solid fa-map-location-dot"></i>
            </button>
          </div>

          <div className="search-input-wrapper">
            <i className="fa-solid fa-magnifying-glass search-bar-icon"></i>
            <input type="text" value={searchKeyword} onChange={handleAutocompleteTyping} placeholder={t.placeholderCari} className="input-lokasi-styled" />
            {suggestions.length > 0 && (
              <div className="autocomplete-suggestions-box">
                {suggestions.map((place, idx) => (
                  <div key={idx} className="suggestion-item" onClick={() => handleSelectSuggestion(place)}>{place.display_name}</div>
                ))}
              </div>
            )}
          </div>

          <div id="mapTujuanWrapper" className={showMapTujuan ? "map-show" : "map-hidden"}>
            <div id="mapTujuanCanvas"></div>
          </div>
        </section>

        <section className="premium-card">
          <h4 className="section-title">{t.rincianTitle}</h4>
          <div className="row"><div>{t.hargaTiket} (x{travelInfo.penumpang})</div><b>Rp {pricing.totalTiket.toLocaleString('id-ID')}</b></div>
          <div className="row"><div>{t.biayaLayanan}</div><b>Rp 2.000</b></div>
          <hr style={{ border: 'none', borderTop: '1px dashed #edf2f7', margin: '12px 0' }} />
          <div className="row total">
            <div>{t.totalBayar}</div>
            <div>Rp {pricing.grandTotal.toLocaleString('id-ID')}</div>
          </div>
        </section>

        <section className="security-lock-card">
          <i className="fa-solid fa-user-shield security-icon"></i>
          <div className="security-text">
            <h6>{t.amanTitle}</h6>
            <p>{t.amanDesc}</p>
          </div>
        </section>

        <div className="terms-checkbox-wrapper">
          <input type="checkbox" id="agree" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
          <label htmlFor="agree">
            {t.bacaSetuju}
            <span className="clickable-terms-trigger" onClick={() => setIsTermsOpen(true)}>
              {t.syaratKetentuan}
            </span>{' '}
            serta <span className="non-clickable-privacy">{t.kebijakanPrivasi}</span>
          </label>
        </div>

        <div className="page-bottom-copyright-footer">
          <p>© 2026 TRAVELIND Startup. v2.0.0</p>
        </div>

      </div>

      {/* BOTTOM STICKY BAR PANJANG PROFESIONAL LUX */}
      <div className="bottom-sticky-checkout-bar">
        <div className="checkout-bar-content">
          <div className="price-summary-box">
            <span className="label-total">{t.totalBayar}</span>
            <b className="grand-total-amount">Rp {pricing.grandTotal.toLocaleString('id-ID')}</b>
          </div>
          <button type="button" className="btn-checkout-submit" disabled={isSubmitting} onClick={handleExecuteBookingFinal}>
            {isSubmitting ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: '6px' }}></i> Loading...
              </>
            ) : (
              <>
                {t.lanjutBtn} <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', marginLeft: '3px' }}></i>
              </>
            )}
          </button>
        </div>
        <p className="cancellation-policy-note">
          <i className="fa-solid fa-clock-rotate-left"></i> {t.kebijakanBatal}
        </p>
      </div>

      {/* POPUP S&K TERISOLASI TENGAH */}
      {isTermsOpen && (
        <div className="popup-container-overlay" onClick={() => setIsTermsOpen(false)}>
          <div className="popup-center-card-box" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header-row">
              <h4>{t.sheetTermsTitle}</h4>
              <button type="button" className="close-popup-x" onClick={() => setIsTermsOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="popup-body-scroll">
              <p className="terms-alert-banner">{t.sheetTermsIntro}</p>
              <ol className="popup-list-ol">
                <li><b>Manifes Penumpang:</b> {t.terms1}</li>
                <li><b>Ketepatan Waktu:</b> {t.terms2}</li>
                <li><b>Kebijakan Bagasi:</b> {t.terms3}</li>
                <li><b>Regulasi Pembatalan:</b> {t.terms4}</li>
              </ol>
            </div>
            <div className="popup-footer-row">
              <button type="button" className="btn-confirm-terms" onClick={() => { setIsAgreed(true); setIsTermsOpen(false); }}>
                {t.btnMengerti}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
         🌟 NEW UX POPUP: "Yaah…Data Kamu Belum Lengkap Nih" MODAL CONTEXT
         ==================================================================== */}
      {showValidationAlert && (
        <div className="popup-container-overlay fade-in-fast" onClick={() => setShowValidationAlert(false)}>
          <div className="popup-center-card-box alert-error-bounce" onClick={(e) => e.stopPropagation()}>
            <div className="alert-lottie-mock-icon-zone">
              <div className="circle-exclamation-pulse animate-pulse">
                <i className="fa-solid fa-circle-exclamation"></i>
              </div>
            </div>
            <div className="popup-body-scroll alert-text-center">
              <h3 className="alert-title-main">Yaah…Data Kamu Belum Lengkap Nih</h3>
              <p className="alert-subtitle-desc">
                Mohon periksa kembali nama, nomor WhatsApp yang valid (tidak berulang), format email dengan tanda (@), serta centang persetujuan Syarat & Ketentuan TRAVELIND sebelum melanjutkan pembayaran.
              </p>
            </div>
            <div className="popup-footer-row no-top-border">
              <button type="button" className="btn-alert-dismiss" onClick={() => setShowValidationAlert(false)}>
                Perbaiki Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENU SIDEBAR LACI */}
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

    </div>
  );
};

export default DetailPemesananView;