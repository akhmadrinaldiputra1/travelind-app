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
  // ----------------==========================================================
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
      statusPending: 'Pembayaran Diterima',
      badgeLunas: 'Pembayaran Berhasil Dikonfirmasi',
      badgePending: 'Menunggu Konfirmasi',
      descLunas: 'Selamat! Pembayaran Anda telah dikonfirmasi secara resmi oleh pihak admin TRAVELIND. Tiket Anda siap digunakan.',
      descPending: 'Terima kasih! Pembayaran Anda telah kami terima. Pesanan sedang kami verifikasi.',
      estimasiText: 'Estimasi konfirmasi: maksimal 1 x 24 jam',
      labelKode: 'Kode Pesanan',
      labelTglPesan: 'Tanggal Pemesanan',
      detailTitle: 'Detail Perjalanan',
      expText: 'Berpengalaman',
      lblLunas: 'Terkonfirmasi',
      lblBerangkat: 'Berangkat',
      lblTersedia: 'Tersedia',
      lblAntarKota: 'Antar Kota',
      lblTglBerangkat: 'Tanggal Berangkat',
      lblJmlPenumpang: 'Jumlah Penumpang',
      lblOrang: 'Orang',
      lblPickup: 'Lokasi Penjemputan',
      lblTujuan: 'Lokasi Tujuan',
      btnDetail: 'Lihat Detail Pesanan',
      lblStsBayar: 'Status Pembayaran',
      lblTotal: 'Total Pembayaran',
      lblMetode: 'Metode Pembayaran',
      lblSts: 'Status',
      lblStsSelesai: 'Selesai',
      lblStsPending: 'Pending',
      lblLihatBukti: 'Lihat Bukti Pembayaran',
      lblBantuan: 'Butuh bantuan?',
      lblBantuanDesc: 'Hubungi kami jika ada pertanyaan atau kendala.',
      btnCs: 'Hubungi Kami',
      lblPolicy: 'Pembatalan gratis hingga 5 jam sebelum keberangkatan',
      mdlBuktiTitle: 'Bukti Transfer Anda',
      mdlBuktiEmpty: 'Bukti foto transfer belum diunggah.',
      mdlBuktiLoad: 'Memuat berkas gambar dari server...',
      mdlRincianTitle: 'Rincian Lengkap Tiket',
      mdlIdx: 'ID Transaksi',
      mdlNama: 'Nama Penumpang',
      mdlWa: 'No. WhatsApp',
      mdlEmail: 'Email Terdaftar',
      mdlArmada: 'Armada Travel',
      mdlRute: 'Rute Layanan',
      mdlFasilitas: 'Biaya Tol & Parkir',
      mdlFasilitasFree: 'Fasilitas Travel (Gratis)',
      mdlFooterBadge: 'E-Tiket ini sah dan resmi diterbitkan oleh TRAVELIND.',
      tfBcaLong: 'Transfer Bank (BCA)',
      qrisLong: 'QRIS Interaktif'
    },
    EN: {
      pageTitle: 'Booking Status',
      step1: 'Search',
      step2: 'Book',
      step3: 'Details',
      step4: 'Pay',
      statusLunas: 'Payment Successful',
      statusPending: 'Payment Received',
      badgeLunas: 'Payment Successfully Confirmed',
      badgePending: 'Waiting for Confirmation',
      descLunas: 'Congratulations! Your payment has been officially confirmed by TRAVELIND admin. Your ticket is ready to use.',
      descPending: 'Thank you! We have received your payment. We are currently verifying your booking.',
      estimasiText: 'Estimated confirmation: maximum 1 x 24 hours',
      labelKode: 'Booking Code',
      labelTglPesan: 'Booking Date',
      detailTitle: 'Travel Details',
      expText: 'Experienced',
      lblLunas: 'Confirmed',
      lblBerangkat: 'Departure',
      lblTersedia: 'Available',
      lblAntarKota: 'Intercity',
      lblTglBerangkat: 'Departure Date',
      lblJmlPenumpang: 'Passengers Count',
      lblOrang: 'People',
      lblPickup: 'Pickup Location',
      lblTujuan: 'Destination Location',
      btnDetail: 'View Ticket Details',
      lblStsBayar: 'Payment Status',
      lblTotal: 'Total Payment',
      lblMetode: 'Payment Method',
      lblSts: 'Status',
      lblStsSelesai: 'Completed',
      lblStsPending: 'Pending',
      lblLihatBukti: 'View Payment Receipt',
      lblBantuan: 'Need help?',
      lblBantuanDesc: 'Contact us if you have any questions or issues.',
      btnCs: 'Contact Us',
      lblPolicy: 'Free cancellation up to 5 hours before departure',
      mdlBuktiTitle: 'Your Transfer Receipt',
      mdlBuktiEmpty: 'Transfer receipt photo has not been uploaded.',
      mdlBuktiLoad: 'Loading image file from server...',
      mdlRincianTitle: 'Complete Ticket Details',
      mdlIdx: 'Transaction ID',
      mdlNama: 'Passenger Name',
      mdlWa: 'WhatsApp No.',
      mdlEmail: 'Registered Email',
      mdlArmada: 'Travel Fleet',
      mdlRute: 'Service Route',
      mdlFasilitas: 'Toll & Parking Fees',
      mdlFasilitasFree: 'Travel Facility (Free)',
      mdlFooterBadge: 'This E-Ticket is valid and officially issued by TRAVELIND.',
      tfBcaLong: 'Bank Transfer (BCA)',
      qrisLong: 'Interactive QRIS'
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
  // ----------------==========================================================
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
    <div className="travelind-booking-wrapper">
      
      {/* HEADER UTAMA SINKRON (TANPA BURGER MENU) */}
      <div className="sticky-top-layout-block">
        <header className="main-header">
          <div className="header-left">
            <button type="button" className="back-btn" onClick={() => navigate('/cek-tiket')}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2 className="page-title">{t.pageTitle}</h2>
          </div>
        </header>

        {/* PROGRESS TRACKER BAR SINKRON */}
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
            <div className="step-node completed">
              <span className="circle-node"><i className="fa-solid fa-check" style={{ fontSize: '10px' }}></i></span>
              <span className="node-label">{t.step3}</span>
            </div>
            <div className="line-connector full"></div>
            <div className="step-node completed">
              <span className="circle-node"><i className="fa-solid fa-check" style={{ fontSize: '10px' }}></i></span>
              <span className="node-label">{t.step4}</span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY CONTENT SCROLLER */}
      <div className="booking-content-scroller success-scroller-locked">
        
        {/* STATUS BANNER CARD */}
        <section className={`premium-card status-banner-card ${isLunas ? 'lunas-style-card' : ''}`}>
          <div className="status-flex-box">
            <div className={`animated-sandglass-icon ${isLunas ? 'lunas-icon-box' : ''}`}>
              {isLunas ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-solid fa-hourglass-half"></i>}
            </div>
            <div className="status-message-text">
              <h4>{isLunas ? t.statusLunas : t.statusPending}</h4>
              <span className={isLunas ? 'badge-success-outline-pay' : 'badge-warning-inline'}>
                {isLunas ? t.badgeLunas : t.badgePending}
              </span>
              <p>{isLunas ? t.descLunas : t.descPending}</p>
            </div>
          </div>
          <div className="estimation-alert-bar">
            <i className="fa-solid fa-circle-info"></i>
            <span>{t.estimasiText}</span>
          </div>
        </section>

        {/* METADATA DOUBLE GRID CARD */}
        <section className="premium-card metadata-grid-card">
          <div className="meta-item">
            <div className="meta-icon-frame"><i className="fa-regular fa-file-lines"></i></div>
            <div className="meta-texts">
              <span>{t.labelKode}</span>
              <h5>{kodeTiketAdmin}</h5>
            </div>
          </div>
          <div className="meta-item border-left">
            <div className="meta-texts">
              <span>{t.labelTglPesan}</span>
              <h5>{waktuKunciPesanan}</h5>
            </div>
          </div>
        </section>

        {/* DETAIL PERJALANAN UTAMA CARD */}
        <section className="premium-card ticket-details-card">
          <h4 className="card-section-title">{t.detailTitle}</h4>
          
          <div className="armada-mini-profile">
            <img 
              src={fotoArmadaReal} 
              alt="Travel Fleet" 
              className="armada-avatar-img" 
              style={{ objectFit: 'cover', borderRadius: '6px' }} 
              onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/512/743/743922.png'; }} 
            />
            <div className="armada-meta-info">
              <h5>{namaTravel}</h5>
              <div className="rating-row">
                <i className="fa-solid fa-star"></i> <span>4.8 (125) &nbsp;•&nbsp; {t.expText}</span>
              </div>
            </div>
            <span className="badge-success-outline-pay">{t.lblLunas}</span>
          </div>

          <div className="ticket-horiz-info-grid">
            <div className="horiz-grid-item">
              <i className="fa-regular fa-clock"></i>
              <div>
                <b>{jamTravel} WIB</b><br /><span>{t.lblBerangkat}</span>
              </div>
            </div>
            <div className="horiz-grid-item">
              <i className="fa-solid fa-couch"></i>
              <div>
                {/* 🌟 FIX TYPO: Sekarang menggunakan variabel state jumlahKursiReal dengan benar */}
                <b>{jumlahKursiReal}</b><br /><span>{t.lblTersedia}</span>
              </div>
            </div>
            <div className="horiz-grid-item">
              <i className="fa-solid fa-route"></i>
              <div>
                <b>{ruteSingkatText}</b>
                <br /><span>{t.lblAntarKota}</span>
              </div>
            </div>
          </div>

          <div className="manifest-address-timeline">
            <div className="timeline-row">
              <i className="fa-regular fa-calendar icon-marker-teal"></i>
              <div className="timeline-text">
                <span>{t.lblTglBerangkat}</span>
                <p>{tanggalBerangkat}</p>
              </div>
            </div>
            <div className="timeline-row">
              <i className="fa-solid fa-couch icon-marker-teal"></i>
              <div className="timeline-text">
                <span>{t.lblJmlPenumpang}</span>
                <p>{penumpangCount} {t.lblOrang}</p>
              </div>
            </div>
            <div className="timeline-row">
              <i className="fa-solid fa-location-dot icon-marker-teal"></i>
              <div className="timeline-text">
                <span>{t.lblPickup}</span>
                <p>{pickupAlamat}</p>
              </div>
            </div>
            <div className="timeline-row">
              <i className="fa-solid fa-flag-checkered icon-marker-teal"></i>
              <div className="timeline-text">
                <span>{t.lblTujuan}</span>
                <p>{tujuanAlamat}</p>
              </div>
            </div>
          </div>

          <button type="button" className="btn-secondary-outline-action" onClick={() => setIsModalDetailOpen(true)}>
            {t.btnDetail}
          </button>
        </section>

        {/* SUMMARY KEUANGAN CARD */}
        <section className="premium-card finance-summary-card">
          <h4 className="card-section-title">{t.lblStsBayar}</h4>
          <div className="finance-grid-three-col">
            <div className="fin-col">
              <span>{t.lblTotal}</span>
              <h5 className="teal-amount-text">Rp {totalBayarFinal.toLocaleString('id-ID')}</h5>
            </div>
            <div className="fin-col">
              <span>{t.lblMetode}</span>
              <h5>{paymentMethod === "BCA" ? t.tfBcaLong : t.qrisLong}</h5>
            </div>
            <div className="fin-col">
              <span>{t.lblSts}</span>
              <span className={isLunas ? 'badge-success-outline-pay' : 'badge-warning-inline'}>
                {isLunas ? t.lblStsSelesai : t.lblStsPending}
              </span>
            </div>
          </div>
          <div className="view-receipt-row-trigger" onClick={() => { setIsModalBuktiOpen(true); setIsImageLoading(true); }}>
            <span><i className="fa-solid fa-arrow-up-from-bracket"></i> {t.lblLihatBukti}</span>
            <i className="fa-solid fa-chevron-right arrow-muted"></i>
          </div>
        </section>

        {/* HELP CS CENTER BANNER */}
        <section className="help-cs-banner-card">
          <div className="cs-left-side">
            <div className="cs-headset-circle"><i className="fa-solid fa-headset"></i></div>
            <div className="cs-strings">
              <h6>{t.lblBantuan}</h6>
              <p>{t.lblBantuanDesc}</p>
            </div>
          </div>
          <button type="button" className="btn-call-cs-action" onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>
            {t.btnCs}
          </button>
        </section>

        <p className="bottom-policy-notice-text"><i className="fa-solid fa-shield"></i> {t.lblPolicy}</p>

        <div className="page-bottom-copyright-footer">
          <p>©️ 2026 TRAVELIND Startup. v2.0.0</p>
        </div>

      </div>

      {/* MODAL 1: PRATINJAU BUKTI */}
      {isModalBuktiOpen && (
        <div className="popup-container-overlay bottom-sheet-backdrop" onClick={() => setIsModalBuktiOpen(false)}>
          <div className="modal-success-content bottom-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-notch-line"></div>
            <div className="modal-success-header">
              <h5><i className="fa-regular fa-image" style={{ color: '#02596b' }}></i> {t.mdlBuktiTitle}</h5>
              <button type="button" className="modal-success-close-btn" onClick={() => setIsModalBuktiOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-success-body image-housing">
              {!tautanBuktiGlobal && (
                <div className="loader-box-text">
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f2994a' }}></i><br /><span style={{ marginTop: '8px', display: 'inline-block' }}>{t.mdlBuktiEmpty}</span>
                </div>
              )}
              {tautanBuktiGlobal && isImageLoading && (
                <div className="loader-box-text">
                  <i className="fa-solid fa-circle-notch fa-spin"></i> {t.mdlBuktiLoad}
                </div>
              )}
              {tautanBuktiGlobal && (
                <img 
                  src={tautanBuktiGlobal} 
                  alt="Bukti Transfer" 
                  className={`img-fluid-preview ${isImageLoading ? 'hidden' : ''}`} 
                  onLoad={() => setIsImageLoading(false)} 
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAIL MANIFES */}
      {isModalDetailOpen && (
        <div className="popup-container-overlay bottom-sheet-backdrop" onClick={() => setIsModalDetailOpen(false)}>
          <div className="modal-success-content bottom-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-notch-line"></div>
            <div className="modal-success-header">
              <h5><i className="fa-solid fa-receipt" style={{ color: '#02596b' }}></i> {t.mdlRincianTitle}</h5>
              <button type="button" className="modal-success-close-btn" onClick={() => setIsModalDetailOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-success-body">
              <div className="manifes-popup-row"><span>{t.mdlIdx}</span><b>{kodeTiketAdmin}</b></div>
              <div className="manifes-popup-row"><span>{t.mdlNama}</span><b>{namaPassenger}</b></div>
              <div className="manifes-popup-row"><span>{t.mdlWa}</span><b>{waPassenger}</b></div>
              <div className="manifes-popup-row"><span>{t.mdlEmail}</span><b>{emailPassenger}</b></div>
              <div className="manifes-popup-row"><span>{t.mdlArmada}</span><b>{namaTravel}</b></div>
              <div className="manifes-popup-row"><span>{t.mdlRute}</span><b>{pickupKota} → {tujuanKota}</b></div>
              <div className="manifes-popup-row"><span>{t.mdlFasilitas}</span><b>{t.mdlFasilitasFree}</b></div>
              <div className="manifest-alert-footer-badge">
                <i className="fa-solid fa-shield-halved"></i> {t.mdlFooterBadge}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuccessView;