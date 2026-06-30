import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import useAuthStore from '../store/authStore'; 
import '../styles/success.css'; 

const SuccessView = () => {
  const navigate = useNavigate();
  const { bahasaGlobal } = useAuthStore(); 

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [isModalBuktiOpen, setIsModalBuktiOpen] = useState(false);
  const [isModalDetailOpen, setIsModalDetailOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isLunas, setIsLunas] = useState(false);

  // ----------------==========================================================
  // ⚡️ DYNAMIC CLOUD DATA BINDING STATE
  // ----------------------------------------------------------------==========
  const [kodeTiketAdmin, setKodeTiketAdmin] = useState('TRV-LOADING...');
  const [waktuKunciPesanan, setWaktuKunciPesanan] = useState('');
  const [tautanBuktiGlobal, setTautanBuktiGlobal] = useState('');
  const [jumlahKursiReal, setJumlahKursiReal] = useState('Loading...');
  const [fotoArmadaReal, setFotoArmadaReal] = useState('https://cdn-icons-png.flaticon.com/512/743/743922.png');

  // ----------------==========================================================
  // ⚡️ RECOVERY PARAMETER DARI LOCAL STORAGE
  // ----------------------------------------------------------------==========
  const bookingIdAktif = localStorage.getItem("booking_id") || "TRV-TEMP";
  const namaTravel = localStorage.getItem("travelNama") || "Travel Pilihan Minang";
  const jamTravel = localStorage.getItem("travelJam") || "08:00";
  const hargaTravel = parseInt(localStorage.getItem("travelHarga")) || 0;
  const penumpangCount = parseInt(localStorage.getItem("penumpang")) || 1;
  const tanggalBerangkat = localStorage.getItem("tanggal") || "Hari ini";
  
  const pickupKota = localStorage.getItem("pickup") || localStorage.getItem("pickup_kota") || "Kota Asal";
  const tujuanKota = localStorage.getItem("tujuan") || localStorage.getItem("tujuan_kota") || "Kota Tujuan";
  const pickupAlamat = localStorage.getItem("pickup_alamat") || "Alamat penjemputan terkonfirmasi peta";
  const tujuanAlamat = localStorage.getItem("tujuan_alamat") || "Alamat pengantaran terkonfirmasi peta";
  
  const paymentMethod = localStorage.getItem("metode_pembayaran") || "BCA";
  const totalBayarFinal = parseInt(localStorage.getItem("total_bayar_final")) || ((hargaTravel * penumpangCount) + 2000);

  const namaPassenger = localStorage.getItem("nama_penumpang") || "Penumpang TRAVELIND";
  const waPassenger = localStorage.getItem("whatsapp_penumpang") || "-";
  const emailPassenger = localStorage.getItem("email_penumpang") || "-";

  // Kamus Terjemahan Otomatis Dinamis Sinkron Bahasa Global
  const t = {
    ID: {
      pageTitle: 'Status Pemesanan',
      step1: 'Cari',
      step2: 'Pilih',
      step3: 'Isi Data',
      step4: 'Bayar',
      statusLunas: 'Pembayaran Berhasil',
      statusPending: 'Menunggu Verifikasi',
      badgeLunas: 'E-Tiket Siap Digunakan',
      badgePending: 'Sedang Diproses Admin',
      descLunas: 'Selamat! Pembayaran Anda telah dikonfirmasi secara resmi oleh pihak admin TRAVELIND. Tiket Anda siap digunakan.',
      descPending: 'Terima kasih! Pembayaran Anda telah kami terima. Mohon tunggu sebentar selagi sistem dan admin kami memverifikasi transaksi.',
      estimasiText: 'Estimasi konfirmasi: maksimal 10-15 menit',
      labelKode: 'Kode Pesanan',
      labelTglPesan: 'Tanggal Pemesanan',
      detailTitle: 'Detail Perjalanan',
      expText: 'Berpengalaman',
      lblLunas: 'Terkonfirmasi',
      lblBerangkat: 'Keberangkatan',
      lblTersedia: 'Sisa Kursi',
      lblAntarKota: 'Antar Kota',
      lblTglBerangkat: 'Tanggal Perjalanan',
      lblJmlPenumpang: 'Jumlah Penumpang',
      lblOrang: 'Orang',
      lblPickup: 'Titik Jemput',
      lblTujuan: 'Titik Antar',
      btnDetail: 'Rincian Manifes & Fasilitas',
      lblStsBayar: 'Ringkasan Pembayaran',
      lblTotal: 'Total Tagihan',
      lblMetode: 'Metode',
      lblSts: 'Status',
      lblStsSelesai: 'Lunas',
      lblStsPending: 'Pending',
      lblLihatBukti: 'Pratinjau Bukti Transfer',
      lblBantuan: 'Butuh Bantuan Perjalanan?',
      lblBantuanDesc: 'Hubungi CS 24/7 kami jika mengalami kendala penjemputan atau operasional.',
      btnCs: 'Chat WhatsApp',
      lblPolicy: 'Pembatalan & reschedule gratis hingga 5 jam sebelum keberangkatan.',
      mdlBuktiTitle: 'Bukti Pembayaran',
      mdlBuktiEmpty: 'Bukti transfer belum diunggah.',
      mdlBuktiLoad: 'Mengambil gambar aman dari server...',
      mdlRincianTitle: 'Detail Manifes Penumpang',
      mdlIdx: 'ID Transaksi',
      mdlNama: 'Nama Utama',
      mdlWa: 'No. WhatsApp',
      mdlEmail: 'Email',
      mdlArmada: 'Operator Armada',
      mdlRute: 'Rute Perjalanan',
      mdlFasilitas: 'Fasilitas Ekstra',
      mdlFasilitasFree: 'Termasuk Tol & Bagasi Gratis',
      mdlFooterBadge: 'E-Tiket ini sah dan diterbitkan secara digital oleh TRAVELIND.',
      tfBcaLong: 'Transfer BCA',
      qrisLong: 'QRIS Dinamis'
    },
    EN: {
      pageTitle: 'Booking Status',
      step1: 'Search',
      step2: 'Book',
      step3: 'Details',
      step4: 'Pay',
      statusLunas: 'Payment Successful',
      statusPending: 'Awaiting Verification',
      badgeLunas: 'E-Ticket Ready',
      badgePending: 'Processing',
      descLunas: 'Congratulations! Your payment has been officially confirmed by TRAVELIND admin. Your ticket is ready to use.',
      descPending: 'Thank you! We have received your payment. Please wait a moment while our system verifies your transaction.',
      estimasiText: 'Estimated confirmation: 10-15 minutes max',
      labelKode: 'Booking Code',
      labelTglPesan: 'Booking Date',
      detailTitle: 'Travel Details',
      expText: 'Experienced',
      lblLunas: 'Confirmed',
      lblBerangkat: 'Departure Time',
      lblTersedia: 'Available Seats',
      lblAntarKota: 'Intercity',
      lblTglBerangkat: 'Departure Date',
      lblJmlPenumpang: 'Passengers',
      lblOrang: 'Pax',
      lblPickup: 'Pickup Point',
      lblTujuan: 'Drop-off Point',
      btnDetail: 'Manifest & Facility Details',
      lblStsBayar: 'Payment Summary',
      lblTotal: 'Total Amount',
      lblMetode: 'Method',
      lblSts: 'Status',
      lblStsSelesai: 'Paid',
      lblStsPending: 'Pending',
      lblLihatBukti: 'Preview Payment Receipt',
      lblBantuan: 'Need Travel Assistance?',
      lblBantuanDesc: 'Contact our 24/7 CS if you experience pickup or operational updates.',
      btnCs: 'WhatsApp Chat',
      lblPolicy: 'Free cancellation & reschedule up to 5 hours before departure.',
      mdlBuktiTitle: 'Payment Receipt',
      mdlBuktiEmpty: 'No transfer receipt uploaded yet.',
      mdlBuktiLoad: 'Fetching secure image from server...',
      mdlRincianTitle: 'Passenger Manifest Details',
      mdlIdx: 'Transaction ID',
      mdlNama: 'Primary Passenger',
      mdlWa: 'WhatsApp Number',
      mdlEmail: 'Email Address',
      mdlArmada: 'Fleet Operator',
      mdlRute: 'Travel Route',
      mdlFasilitas: 'Extra Benefits',
      mdlFasilitasFree: 'Includes Free Toll & Luggage',
      mdlFooterBadge: 'This E-Ticket is valid and digitally issued by TRAVELIND.',
      tfBcaLong: 'BCA Transfer',
      qrisLong: 'Dynamic QRIS'
    }
  }[bahasaGlobal || 'ID'];

  const dapatkanSingkatanKota = (namaKota) => {
    if (!namaKota || namaKota.toLowerCase().includes("kota asal") || namaKota.toLowerCase().includes("kota tujuan")) {
      return "TRV";
    }
    const namaInti = namaKota.replace(/kota|kabupaten/gi, "").trim();
    return namaInti.substring(0, 3).toUpperCase();
  };

  const ruteSingkatText = `${dapatkanSingkatanKota(pickupKota)} → ${dapatkanSingkatanKota(tujuanKota)}`;

  const dapatkanTeksWaktuFormat = () => {
    const today = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()} • ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')} WIB`;
  };

  // ----------------==========================================================
  // 🔄 LIFECYCLE HYDRATION & REAL-TIME POLLING ENGINE
  // ----------------------------------------------------------------==========
  useEffect(() => {
    const idTerkunciLama = localStorage.getItem("success_id_tracker");
    if (idTerkunciLama !== bookingIdAktif) {
      localStorage.setItem("success_id_tracker", bookingIdAktif);
      const waktuBaru = dapatkanTeksWaktuFormat();
      localStorage.setItem("success_waktu_locked", waktuBaru);
      setWaktuKunciPesanan(waktuBaru);
    } else {
      setWaktuKunciPesanan(localStorage.getItem("success_waktu_locked") || dapatkanTeksWaktuFormat());
    }

    const inisialisasiDataTransaksiCloud = async () => {
      if (!bookingIdAktif || bookingIdAktif === "TRV-TEMP") return;
      try {
        const { data: trxData, error } = await supabase
          .from("transaksi")
          .select("*")
          .eq("booking_id", bookingIdAktif)
          .maybeSingle();

        if (!error && trxData) {
          if (trxData.id) {
            const idMurniString = trxData.id.toString().replace(/-/g, ""); 
            const potongDelapanKarakter = idMurniString.substring(0, 8).toUpperCase();
            const kodeTiketFix = `TRV-${potongDelapanKarakter}`;
            setKodeTiketAdmin(kodeTiketFix);
            localStorage.setItem("success_kode_tiket_admin", kodeTiketFix);
          }

          if (trxData.bukti_pembayaran) {
            setTautanBuktiGlobal(trxData.bukti_pembayaran);
          }
          if (trxData.status_pesanan === "Terkonfirmasi" || trxData.status_pesanan === "Selesai") {
            setIsLunas(true);
          }

          const namaTravelTarget = trxData.nama_travel || namaTravel;
          const jamCleanTarget = jamTravel.trim().replace(':', '.').substring(0, 5); 

          const { data: jadwalData, error: jadwalErr } = await supabase
            .from("travel_jadwal")
            .select("*") 
            .ilike("nama_travel", `%${namaTravelTarget}%`)
            .or(`jam_keberangkatan.ilike.%${jamCleanTarget}%,jam.ilike.%${jamCleanTarget}%`)
            .maybeSingle();

          if (!jadwalErr && jadwalData) {
            let nilaiKursiKetemu = null;
            Object.keys(jadwalData).forEach((key) => {
              if (key.trim().toLowerCase() === "kursi") nilaiKursiKetemu = jadwalData[key];
              if (key.trim().toLowerCase() === "foto_armada" && jadwalData[key]) setFotoArmadaReal(String(jadwalData[key]).trim());
            });

            if (nilaiKursiKetemu !== null && nilaiKursiKetemu !== undefined) {
              setJumlahKursiReal(`${String(nilaiKursiKetemu).trim()} Kursi`);
              return;
            }
          }

          const { data: semuaJadwal } = await supabase.from("travel_jadwal").select("*");
          if (semuaJadwal && semuaJadwal.length > 0) {
            const ketemuBackup = semuaJadwal.find(j => {
              const dbNama = String(j.nama_travel || "").toLowerCase();
              const dbJam = String(j.jam_keberangkatan || j.jam || "").replace(':', '.');
              return dbNama.includes(namaTravelTarget.toLowerCase()) || dbJam.includes(jamCleanTarget);
            });

            if (ketemuBackup) {
              let kursiBackup = ketemuBackup.kursi || ketemuBackup.Kursi || ketemuBackup["kursi "];
              if (kursiBackup !== undefined && kursiBackup !== null) {
                setJumlahKursiReal(`${String(kursiBackup).trim()} Kursi`);
                if (ketemuBackup.foto_armada) setFotoArmadaReal(String(ketemuBackup.foto_armada).trim());
                return;
              }
            }
          }
          setJumlahKursiReal(`${16 - penumpangCount} Kursi`);
        }
      } catch (err) { 
        console.warn(err); 
        setJumlahKursiReal(`${16 - penumpangCount} Kursi`);
      }
    };
    inisialisasiDataTransaksiCloud();

    const pollingInterval = setInterval(async () => {
      if (!bookingIdAktif || bookingIdAktif === "TRV-TEMP") return;
      try {
        const { data: trxData, error } = await supabase
          .from("transaksi")
          .select("status_pesanan")
          .eq("booking_id", bookingIdAktif)
          .maybeSingle();

        if (!error && trxData) {
          if (trxData.status_pesanan === "Terkonfirmasi" || trxData.status_pesanan === "Selesai") {
            setIsLunas(true);
            clearInterval(pollingInterval);
          }
        }
      } catch (err) { console.log("Polling Terinterupsi:", err); }
    }, 4000);

    return () => clearInterval(pollingInterval);
  }, [bookingIdAktif, namaTravel, penumpangCount, jamTravel]);

  return (
    <div className="modern-success-wrapper">
      
      {/* 🧭 NAVIGATION HEADER */}
      <div className="modern-sticky-header-container">
        <header className="modern-navbar">
          <button type="button" className="modern-back-circle-btn" onClick={() => navigate('/cek-tiket')} aria-label="Back">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h2 className="modern-nav-title">{t.pageTitle}</h2>
          <div className="modern-header-spacer"></div>
        </header>

        {/* 🎚️ MINIMAL PROGRESS STEPBAR */}
        <div className="modern-progress-stepper">
          <div className="modern-step-track">
            <div className="modern-step-node past"><span>1</span><label>{t.step1}</label></div>
            <div className="modern-step-line active"></div>
            <div className="modern-step-node past"><span>2</span><label>{t.step2}</label></div>
            <div className="modern-step-line active"></div>
            <div className="modern-step-node past"><span>3</span><label>{t.step3}</label></div>
            <div className="modern-step-line active"></div>
            <div className="modern-step-node active-success">
              {isLunas ? <i className="fa-solid fa-check"></i> : <span>4</span>}
              <label>{t.step4}</label>
            </div>
          </div>
        </div>
      </div>

      {/* 📜 SCROLLABLE CONTAINER */}
      <div className="modern-scrollable-content">
        
        {/* 🏆 HERO STATUS CARD (BENTO BOX STATUS) */}
        <div className={`modern-bento-hero ${isLunas ? 'is-confirmed' : 'is-pending'}`}>
          <div className="modern-hero-illustration">
            {isLunas ? (
              <div className="modern-pulse-icon icon-success">
                <i className="fa-solid fa-circle-check"></i>
              </div>
            ) : (
              <div className="modern-pulse-icon icon-pending">
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              </div>
            )}
          </div>
          <div className="modern-hero-text">
            <span className="modern-status-tag">{isLunas ? t.badgeLunas : t.badgePending}</span>
            <h3 className="modern-status-heading">{isLunas ? t.statusLunas : t.statusPending}</h3>
            <p className="modern-status-desc">{isLunas ? t.descLunas : t.descPending}</p>
          </div>
          <div className="modern-hero-info-bar">
            <i className="fa-solid fa-clock-rotate-left"></i>
            <span>{t.estimasiText}</span>
          </div>
        </div>

        {/* 🎫 QUICK METADATA PAIR (BENTO ROW) */}
        <div className="modern-bento-row grid-2-col">
          <div className="modern-mini-card">
            <span className="modern-meta-label">{t.labelKode}</span>
            <div className="modern-meta-value-group">
              <span className="modern-code-badge">{kodeTiketAdmin}</span>
            </div>
          </div>
          <div className="modern-mini-card">
            <span className="modern-meta-label">{t.labelTglPesan}</span>
            <span className="modern-meta-value text-muted">{waktuKunciPesanan.split(' • ')[0]}</span>
          </div>
        </div>

        {/* 🚍 MAIN TRAVEL TICKET CARD */}
        <div className="modern-bento-main-card">
          <div className="modern-card-header-group">
            <h4 className="modern-section-title">{t.detailTitle}</h4>
            <span className="modern-pill-status-success">{t.lblLunas}</span>
          </div>
          
          {/* Operator Profile */}
          <div className="modern-operator-profile">
            <img 
              src={fotoArmadaReal} 
              alt={namaTravel} 
              className="modern-fleet-avatar"
              onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/743/743922.png'; }} 
            />
            <div className="modern-operator-info">
              <h5>{namaTravel}</h5>
              <div className="modern-rating-pill">
                <i className="fa-solid fa-star"></i>
                <span>4.8</span>
                <span className="dot-separator">•</span>
                <span className="text-secondary">{t.expText}</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Multi-Grid */}
          <div className="modern-metrics-three-grid">
            <div className="metric-box">
              <i className="fa-regular fa-clock"></i>
              <div className="metric-data">
                <span className="metric-title">{t.lblBerangkat}</span>
                <span className="metric-value">{jamTravel} WIB</span>
              </div>
            </div>
            <div className="metric-box">
              <i className="fa-solid fa-couch"></i>
              <div className="metric-data">
                <span className="metric-title">{t.lblTersedia}</span>
                <span className="metric-value">{jumlahKursiReal.replace(' Kursi', '')} Left</span>
              </div>
            </div>
            <div className="metric-box">
              <i className="fa-solid fa-route"></i>
              <div className="metric-data">
                <span className="metric-title">Rute</span>
                <span className="metric-value-route">{ruteSingkatText}</span>
              </div>
            </div>
          </div>

          {/* Minimalist Address Timeline Line */}
          <div className="modern-timeline-wrapper">
            <div className="timeline-node-item">
              <div className="node-indicator start"></div>
              <div className="node-content">
                <label>{t.lblTglBerangkat} & {t.lblJmlPenumpang}</label>
                <p className="highlight">{tanggalBerangkat} &bull; {penumpangCount} {t.lblOrang}</p>
              </div>
            </div>
            
            <div className="timeline-node-item">
              <div className="node-indicator pickup"></div>
              <div className="node-content">
                <label>{t.lblPickup}</label>
                <p>{pickupAlamat}</p>
              </div>
            </div>

            <div className="timeline-node-item">
              <div className="node-indicator destination"></div>
              <div className="node-content">
                <label>{t.lblTujuan}</label>
                <p>{tujuanAlamat}</p>
              </div>
            </div>
          </div>

          <button type="button" className="modern-btn-primary-action-outline" onClick={() => setIsModalDetailOpen(true)}>
            <i className="fa-solid fa-receipt"></i> {t.btnDetail}
          </button>
        </div>

        {/* 💳 TRANSACTION & PAYMENT FINANCE SUMMARY */}
        <div className="modern-bento-main-card financial-box">
          <h4 className="modern-section-title">{t.lblStsBayar}</h4>
          
          <div className="modern-financial-row">
            <div className="fin-block-main">
              <span>{t.lblTotal}</span>
              <h3 className="modern-price-text">Rp {totalBayarFinal.toLocaleString('id-ID')}</h3>
            </div>
            <div className="fin-block-sub">
              <div className="sub-item">
                <span>{t.lblMetode}</span>
                <span className="val-text">{paymentMethod === "BCA" ? t.tfBcaLong : t.qrisLong}</span>
              </div>
              <div className="sub-item">
                <span>{t.lblSts}</span>
                <span className={`modern-badge-status ${isLunas ? 'success' : 'pending'}`}>
                  {isLunas ? t.lblStsSelesai : t.lblStsPending}
                </span>
              </div>
            </div>
          </div>

          <div className="modern-interactive-list-row" onClick={() => { setIsModalBuktiOpen(true); setIsImageLoading(true); }}>
            <div className="row-left-content">
              <i className="fa-regular fa-image icon-teal"></i>
              <span>{t.lblLihatBukti}</span>
            </div>
            <i className="fa-solid fa-chevron-right arrow-nav"></i>
          </div>
        </div>

        {/* 🛠️ CUSTOMER CARE SUPPORT BANNER */}
        <div className="modern-support-banner">
          <div className="support-left">
            <div className="support-icon-avatar">
              <i className="fa-solid fa-headset"></i>
            </div>
            <div className="support-strings">
              <h6>{t.lblBantuan}</h6>
              <p>{t.lblBantuanDesc}</p>
            </div>
          </div>
          <button type="button" className="modern-btn-whatsapp" onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>
            <i className="fa-brands fa-whatsapp"></i> {t.btnCs.split(' ')[0]}
          </button>
        </div>

        {/* POLICY FOOTER NOTICE */}
        <div className="modern-footer-policy-notice">
          <i className="fa-solid fa-shield-halved"></i>
          <span>{t.lblPolicy}</span>
        </div>

        {/* COPYRIGHT MATTE FOOTER */}
        <footer className="modern-screen-footer">
          <p>© 2026 TRAVELIND System &bull; Clean Premium Concept v2.0</p>
        </footer>

      </div>

      {/* 📥 MODAL 1: PREVIEW BUKTI TRANSFER */}
      {isModalBuktiOpen && (
        <div className="modern-modal-overlay" onClick={() => setIsModalBuktiOpen(false)}>
          <div className="modern-bottom-sheet-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modern-sheet-notch"></div>
            <div className="modern-sheet-header">
              <span className="sheet-title-icon-group">
                <i className="fa-regular fa-image"></i>
                <h5>{t.mdlBuktiTitle}</h5>
              </span>
              <button type="button" className="modern-close-circle-btn" onClick={() => setIsModalBuktiOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modern-sheet-body center-image-housing">
              {!tautanBuktiGlobal && (
                <div className="modern-empty-state-box">
                  <i className="fa-solid fa-triangle-exclamation text-amber"></i>
                  <p>{t.mdlBuktiEmpty}</p>
                </div>
              )}
              {tautanBuktiGlobal && isImageLoading && (
                <div className="modern-loading-state-box">
                  <i className="fa-solid fa-circle-notch fa-spin text-teal"></i>
                  <p>{t.mdlBuktiLoad}</p>
                </div>
              )}
              {tautanBuktiGlobal && (
                <img 
                  src={tautanBuktiGlobal} 
                  alt="Receipt Preview" 
                  className={`modern-preview-fluid-img ${isImageLoading ? 'is-hidden' : ''}`} 
                  onLoad={() => setIsImageLoading(false)} 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📥 MODAL 2: TICKET EXTRA MANIFEST DETAILS */}
      {isModalDetailOpen && (
        <div className="modern-modal-overlay" onClick={() => setIsModalDetailOpen(false)}>
          <div className="modern-bottom-sheet-card animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="modern-sheet-notch"></div>
            <div className="modern-sheet-header">
              <span className="sheet-title-icon-group">
                <i className="fa-solid fa-receipt"></i>
                <h5>{t.mdlRincianTitle}</h5>
              </span>
              <button type="button" className="modern-close-circle-btn" onClick={() => setIsModalDetailOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modern-sheet-body">
              <div className="modern-manifest-table-rows">
                <div className="m-row"><span>{t.mdlIdx}</span><b className="code-text">{kodeTiketAdmin}</b></div>
                <div className="m-row"><span>{t.mdlNama}</span><b>{namaPassenger}</b></div>
                <div className="m-row"><span>{t.mdlWa}</span><b>{waPassenger}</b></div>
                <div className="m-row"><span>{t.mdlEmail}</span><b>{emailPassenger}</b></div>
                <div className="m-row"><span>{t.mdlArmada}</span><b>{namaTravel}</b></div>
                <div className="m-row"><span>{t.mdlRute}</span><b>{pickupKota} → {tujuanKota}</b></div>
                <div className="m-row"><span>{t.mdlFasilitas}</span><span className="facility-badge-green">{t.mdlFasilitasFree}</span></div>
              </div>
              <div className="modern-sheet-footer-disclaimer">
                <i className="fa-solid fa-circle-check"></i>
                <span>{t.mdlFooterBadge}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuccessView;