import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import '../styles/success.css'; 

const SuccessView = () => {
  const navigate = useNavigate();

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [userProfile, setUserProfile] = useState({ nama: 'Masuk/Daftar', email: 'Akses riwayat perjalanan kamu', inisial: 'M' });
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
        // 1. Tarik data transaksi
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

          // 🌟 2. KITA MATA-MATAI & TARIK SEMUA DATA DARI TABEL travel_jadwal TANPA FILTER
          const { data: semuaJadwalDiDatabase } = await supabase
            .from("travel_jadwal")
            .select("*");

          // 🚨 CETAK LOG DI CONSOLE BROWSER UNTUK INVESTIGASI
          console.log("=== Mitra Perjalanan Anda ===");
          console.log("Nama travel:", namaTravelTarget);
          console.log("Jam travel:", jamTravel);
          console.log("Isi:", semuaJadwalDiDatabase);
          console.log("=======================================");

          // 3. Jalankan pencarian standard seperti biasa
          const { data: jadwalData, error: jadwalErr } = await supabase
            .from("travel_jadwal")
            .select("*") 
            .ilike("nama_travel", `%${namaTravelTarget}%`)
            .maybeSingle();

          if (!jadwalErr && jadwalData) {
            let nilaiKursiKetemu = null;
            Object.keys(jadwalData).forEach((key) => {
              if (key.trim().toLowerCase() === "kursi") nilaiKursiKetemu = jadwalData[key];
              if (key.trim().toLowerCase() === "foto_armada" && jadwalData[key]) setFotoArmadaReal(String(jadwalData[key]).trim());
            });

            if (nilaiKursiKetemu !== null && nilaiKursiKetemu !== undefined) {
              setJumlahKursiReal(`${String(nilaiKursiKetemu).trim()} Kursi`);
              return; // Selesai jika ketemu
            }
          }

          // Jalankan pencarian backup jam jika nama travel meleset
          if (semuaJadwalDiDatabase && semuaJadwalDiDatabase.length > 0) {
            // Cari manual di array lokal untuk menghindari error spasi di kolom jam_keberangkatan
            const jamCleanTarget = jamTravel.trim().substring(0, 5); // ambil format "15.00" atau "15:00"
            
            const ketemuBackup = semuaJadwalDiDatabase.find(j => {
              const jamDb = String(j.jam_keberangkatan || j.jam || "").trim();
              return jamDb.includes(jamCleanTarget);
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

          // Jika semua titik buntu, gunakan nilai fallback default
          setJumlahKursiReal(`${16 - penumpangCount} Kursi`);
        }
      } catch (err) { 
        console.warn(err); 
        setJumlahKursiReal(`${16 - penumpangCount} Kursi`);
      }
    };
    inisialisasiDataTransaksiCloud();

    const syncUserSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const emailUser = session.user.email;
          const namaUser = emailUser.split("@")[0].toUpperCase();
          setUserProfile({ nama: namaUser, email: emailUser, inisial: namaUser.charAt(0) });
        }
      } catch (e) { console.warn(e); }
    };
    syncUserSession();

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
  }, [bookingIdAktif, namaTravel, penumpangCount]);

  return (
    <div className="app-container">
      
      {/* HEADER UTAMA */}
      <header className="main-header-success">
        <button type="button" className="back-btn" onClick={() => navigate('/home')} title="Kembali ke Beranda">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2 className="page-title" style={{ flex: 1, fontSize: '20px', fontWeight: 600 }}>Status Pemesanan</h2>
        <button type="button" className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Menu" style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer' }}>
          <i className="fa-solid fa-bars-staggered"></i>
        </button>
      </header>

      {/* PROGRESS TRACKER BAR */}
      <div className="progress-container-success">
        <div className="steps">
          <div className="step active"><i className="fa-solid fa-check"></i><span>Pencarian</span></div>
          <div className="step active"><i className="fa-solid fa-check"></i><span>Pilih Travel</span></div>
          <div className="step active"><i className="fa-solid fa-check"></i><span>Pemesanan</span></div>
          <div className="step active"><i className="fa-solid fa-check"></i><span>Pembayaran</span></div>
        </div>
      </div>

      <main className="content-wrapper">
        
        {/* STATUS BANNER CARD */}
        <section className={`premium-card status-banner-card ${isLunas ? 'lunas-style-card' : ''}`}>
          <div className="status-flex-box">
            <div className={`animated-sandglass-icon ${isLunas ? 'lunas-icon-box' : ''}`}>
              {isLunas ? <i className="fa-solid fa-circle-check"></i> : <i className="fa-solid fa-hourglass-half"></i>}
            </div>
            <div className="status-message-text">
              <h4>{isLunas ? 'Pembayaran Berhasil' : 'Pembayaran Diterima'}</h4>
              <span className={isLunas ? 'badge-success-outline-pay' : 'badge-warning-inline'}>
                {isLunas ? 'Pembayaran Berhasil Dikonfirmasi' : 'Menunggu Konfirmasi'}
              </span>
              <p>
                {isLunas 
                  ? 'Selamat! Pembayaran Anda telah dikonfirmasi secara resmi oleh pihak admin TRAVELIND. Tiket Anda siap digunakan.' 
                  : 'Terima kasih! Pembayaran Anda telah kami terima. Pesanan sedang kami verifikasi.'}
              </p>
            </div>
          </div>
          <div className="estimation-alert-bar">
            <i className="fa-solid fa-circle-info"></i>
            <span>Estimasi konfirmasi: maksimal 1 x 24 jam</span>
          </div>
        </section>

        {/* METADATA DOUBLE GRID CARD */}
        <section className="premium-card metadata-grid-card">
          <div className="meta-item">
            <div className="meta-icon-frame"><i className="fa-regular fa-file-lines"></i></div>
            <div className="meta-texts">
              <span>Kode Pesanan</span>
              <h5>{kodeTiketAdmin}</h5>
            </div>
          </div>
          <div className="meta-item border-left">
            <div className="meta-texts">
              <span>Tanggal Pemesanan</span>
              <h5>{waktuKunciPesanan}</h5>
            </div>
          </div>
        </section>

        {/* DETAIL PERJALANAN UTAMA CARD */}
        <section className="premium-card ticket-details-card">
          <h4 className="card-section-title">Detail Perjalanan</h4>
          
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
                <i className="fa-solid fa-star"></i> <span>4.8 (125) &nbsp;•&nbsp; Berpengalaman</span>
              </div>
            </div>
            <span className="badge-success-outline-pay">Terkonfirmasi</span>
          </div>

          <div className="ticket-horiz-info-grid">
            <div className="horiz-grid-item">
              <i className="fa-regular fa-clock"></i>
              <div>
                <b>{jamTravel} WIB</b><br /><span>Berangkat</span>
              </div>
            </div>
            <div className="horiz-grid-item">
              <i className="fa-solid fa-couch"></i>
              <div>
                {/* Menampilkan sisa kursi database yang telah tersinkronisasi murni */}
                <b>{jumlahKursiReal}</b><br /><span>Tersedia</span>
              </div>
            </div>
            <div className="horiz-grid-item">
              <i className="fa-solid fa-route"></i>
              <div>
                <b>{ruteSingkatText}</b>
                <br /><span>Antar Kota</span>
              </div>
            </div>
          </div>

          <div className="manifest-address-timeline">
            <div className="timeline-row">
              <i className="fa-regular fa-calendar icon-marker-teal"></i>
              <div className="timeline-text">
                <span>Tanggal Berangkat</span>
                <p>{tanggalBerangkat}</p>
              </div>
            </div>
            <div className="timeline-row">
              <i className="fa-solid fa-couch icon-marker-teal"></i>
              <div className="timeline-text">
                <span>Jumlah Penumpang</span>
                <p>{penumpangCount} Orang</p>
              </div>
            </div>
            <div className="timeline-row">
              <i className="fa-solid fa-location-dot icon-marker-teal"></i>
              <div className="timeline-text">
                <span>Lokasi Penjemputan</span>
                <p>{pickupAlamat}</p>
              </div>
            </div>
            <div className="timeline-row">
              <i className="fa-solid fa-flag-checkered icon-marker-teal"></i>
              <div className="timeline-text">
                <span>Lokasi Tujuan</span>
                <p>{tujuanAlamat}</p>
              </div>
            </div>
          </div>

          <button type="button" className="btn-secondary-outline-action" onClick={() => setIsModalDetailOpen(true)}>
            Lihat Detail Pesanan
          </button>
        </section>

        {/* SUMMARY KEUANGAN CARD */}
        <section className="premium-card finance-summary-card">
          <h4 className="card-section-title">Status Pembayaran</h4>
          <div className="finance-grid-three-col">
            <div className="fin-col">
              <span>Total Pembayaran</span>
              <h5 className="teal-amount-text">Rp {totalBayarFinal.toLocaleString('id-ID')}</h5>
            </div>
            <div className="fin-col">
              <span>Metode Pembayaran</span>
              <h5>{paymentMethod === "BCA" ? "Transfer Bank (BCA)" : "QRIS Interaktif"}</h5>
            </div>
            <div className="fin-col">
              <span>Status</span>
              <span className={isLunas ? 'badge-success-outline-pay' : 'badge-warning-inline'}>
                {isLunas ? 'Selesai' : 'Pending'}
              </span>
            </div>
          </div>
          <div className="view-receipt-row-trigger" onClick={() => { setIsModalBuktiOpen(true); setIsImageLoading(true); }}>
            <span><i className="fa-solid fa-arrow-up-from-bracket"></i> Lihat Bukti Pembayaran</span>
            <i className="fa-solid fa-chevron-right arrow-muted"></i>
          </div>
        </section>

        {/* HELP CS CENTER BANNER */}
        <section className="help-cs-banner-card">
          <div className="cs-left-side">
            <div className="cs-headset-circle"><i className="fa-solid fa-headset"></i></div>
            <div className="cs-strings">
              <h6>Butuh bantuan?</h6>
              <p>Hubungi kami jika ada pertanyaan atau kendala.</p>
            </div>
          </div>
          <button type="button" className="btn-call-cs-action" onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>
            Hubungi Kami
          </button>
        </section>

        <p className="bottom-policy-notice-text"><i className="fa-solid fa-shield"></i> Pembatalan gratis hingga 5 jam sebelum keberangkatan</p>

      </main>

      {/* MODAL 1: PRATINJAU BUKTI */}
      {isModalBuktiOpen && (
        <div className="modal-success-overlay active" onClick={() => setIsModalBuktiOpen(false)}>
          <div className="modal-success-content modal-center-layout" onClick={(e) => e.stopPropagation()}>
            <div className="modal-success-header">
              <h5><i className="fa-regular fa-image" style={{ color: '#02596b' }}></i> Bukti Transfer Anda</h5>
              <button type="button" className="modal-success-close-btn" onClick={() => setIsModalBuktiOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-success-body image-housing" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', minHeight: '180px', marginTop: '10px' }}>
              {!tautanBuktiGlobal && (
                <div className="loader-box-text">
                  <i className="fa-solid fa-triangle-exclamation" style={{ color: '#f2994a' }}></i><br /><span style={{ marginTop: '8px', display: 'inline-block' }}>Bukti foto transfer belum diunggah.</span>
                </div>
              )}
              {tautanBuktiGlobal && isImageLoading && (
                <div className="loader-box-text">
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Memuat berkas gambar dari server...
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
        <div className="modal-success-overlay active" onClick={() => setIsModalDetailOpen(false)}>
          <div className="modal-success-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-success-header">
              <h5><i className="fa-solid fa-receipt" style={{ color: '#02596b' }}></i> Rincian Lengkap Tiket</h5>
              <button type="button" className="modal-success-close-btn" onClick={() => setIsModalDetailOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-success-body">
              <div className="manifes-popup-row"><span>ID Transaksi</span><b>{kodeTiketAdmin}</b></div>
              <div className="manifes-popup-row"><span>Nama Penumpang</span><b>{namaPassenger}</b></div>
              <div className="manifes-popup-row"><span>No. WhatsApp</span><b>{waPassenger}</b></div>
              <div className="manifes-popup-row"><span>Email Terdaftar</span><b>{emailPassenger}</b></div>
              <div className="manifes-popup-row"><span>Armada Travel</span><b>{namaTravel}</b></div>
              <div className="manifes-popup-row"><span>Rute Layanan</span><b>{pickupKota} → {tujuanKota}</b></div>
              <div className="manifes-popup-row"><span>Biaya Tol & Parkir</span><b>Fasilitas Travel (Gratis)</b></div>
              <div className="manifest-alert-footer-badge">
                <i className="fa-solid fa-shield-halved"></i> E-Tiket ini sah dan resmi diterbitkan oleh TRAVELIND.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER MENU SIDEBAR */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <nav className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header" style={{ padding: '24px 20px', background: 'linear-gradient(135deg, #02596b 0%, #013e4b 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="sidebar-title" style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}><i className="fa-solid fa-layer-group"></i> Menu Navigasi</span>
          <button type="button" className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '20px', cursor: 'pointer' }}><i className="fa-solid fa-xmark"></i></button>
        </div>
        
        <div className="sidebar-profile-card">
          <div className="avatar-circle">{userProfile.inisial}</div>
          <div className="profile-card-text">
            <h6>{userProfile.nama}</h6>
            <p>{userProfile.email}</p>
          </div>
        </div>
        
        <div className="sidebar-content">
          <div className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/home'); }} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-house"></i> Beranda Utama
          </div>
          <div className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/home'); localStorage.setItem('buka_tab_langsung', 'akun'); }} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-circle-user"></i> Akun Saya
          </div>
          <div className="menu-item" onClick={() => { setIsSidebarOpen(false); navigate('/cek-tiket'); }} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-ticket-simple"></i> Pesanan Saya
          </div>
          <div className="menu-divider"></div>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="menu-item">
            <i className="fa-solid fa-headset"></i> Pusat Bantuan
          </a>
        </div>
      </nav>

    </div>
  );
};

export default SuccessView;