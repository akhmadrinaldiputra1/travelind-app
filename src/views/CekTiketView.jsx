import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useAuthStore from '../store/authStore'; // 🌟 1. Import Zustand Store
import '../styles/cek-tiket.css'; 

const CekTiketView = () => {
  const navigate = useNavigate();

  // 🌟 2. Tarik State Bahasa dari Store
  const { bahasaGlobal } = useAuthStore();

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [whatsappInput, setWhatsappInput] = useState('');
  const [nomorSesiAkun, setNomorSesiAkun] = useState('');
  const [listTiket, setListTiket] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isError, setIsError] = useState(false);

  // 🌟 3. Kamus Terjemahan Dinamis (Sinkronisasi dengan Beranda)
  const t = {
    ID: {
      pageTitle: 'Cek Status Tiket',
      searchTitle: 'Lacak Tiket Perjalanan',
      searchDesc: 'Masukkan Nomor WhatsApp penumpang yang didaftarkan saat memesan tiket.',
      placeholderWa: 'Contoh: 08xx-xxxx-xxxx',
      btnGunakanNomor: 'Gunakan Nomor WhatsApp Saya',
      btnCari: 'Cari Tiket Saya',
      loadingText: 'Menghubungkan ke Supabase Cloud Server...',
      errorTitle: 'Terjadi Gangguan Sistem',
      errorDesc: 'Gagal memuat data dari cloud server database.',
      emptyTitle: 'Belum ada pencarian',
      emptyDesc: 'Silakan ketik nomor WhatsApp Anda di atas untuk melihat status manifes e-tiket.',
      notFoundTitle: 'Tiket Tidak Ditemukan',
      notFoundDesc: 'Nomor tidak ditemukan di tabel transaksi TRAVELIND.',
      ikutiKami: 'Ikuti kami',
      navBtmHome: 'Beranda',
      navBtmTiket: 'Tiket Saya',
      navBtmProfil: 'Profil',
      alertEmpty: 'Silakan ketik nomor WhatsApp Anda terlebih dahulu!'
    },
    EN: {
      pageTitle: 'Check Ticket Status',
      searchTitle: 'Track Travel Ticket',
      searchDesc: 'Enter the passenger\'s WhatsApp Number registered when booking the ticket.',
      placeholderWa: 'Example: 08xx-xxxx-xxxx',
      btnGunakanNomor: 'Use My WhatsApp Number',
      btnCari: 'Find My Ticket',
      loadingText: 'Connecting to Supabase Cloud Server...',
      errorTitle: 'System Error Occurred',
      errorDesc: 'Failed to load data from the cloud database server.',
      emptyTitle: 'No Search Yet',
      emptyDesc: 'Please type your WhatsApp number above to see the e-ticket manifest status.',
      notFoundTitle: 'Ticket Not Found',
      notFoundDesc: 'Number not found in TRAVELIND transaction table.',
      ikutiKami: 'Follow us',
      navBtmHome: 'Home',
      navBtmTiket: 'My Tickets',
      navBtmProfil: 'Profile',
      alertEmpty: 'Please enter your WhatsApp number first!'
    }
  }[bahasaGlobal || 'ID'];

  // ----------------==========================================================
  // 🔄 LIFECYCLE DETECTION: SHORTCUT WHATSAPP SESSION ENGINE
  // ----------------------------------------------------------------==========
  useEffect(() => {
    const ambilSesiNomorWhatsAppUser = async () => {
      const emailTerbaca = localStorage.getItem("email_penumpang");
      if (!emailTerbaca) return;

      try {
        const { data, error } = await supabase
          .from("transaksi")
          .select("whatsapp_pembeli, whatsapp_penumpang")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const nomorKetemu = data[0].whatsapp_pembeli || data[0].whatsapp_penumpang;
          if (nomorKetemu) setNomorSesiAkun(nomorKetemu);
        }
      } catch (e) {
        console.warn("Gagal memuat otomatis nomor sesi akun:", e);
      }
    };

    ambilSesiNomorWhatsAppUser();
  }, []);

  // --------------------------------------------------------------------------
  // 🔍 CORE ENGINE: SEARCH METHOD BY WHATSAPP WITH AUTO-JOIN DATA
  // --------------------------------------------------------------------------
  const tanganiPencarianTiket = async (overrideNomor = null) => {
    const nomorTarget = (overrideNomor || whatsappInput).trim().replace(/[^0-9]/g, '');
    
    if (!nomorTarget) {
      alert(t.alertEmpty);
      return;
    }

    setWhatsappInput(nomorTarget);
    setIsLoading(true);
    setIsError(false);
    setHasSearched(true);

    try {
      const { data: semuaTransaksi, error: errorTrx } = await supabase
        .from("transaksi")
        .select("*");

      if (errorTrx) throw errorTrx;

      const { data: semuaBookingTemp } = await supabase
        .from("booking_temp")
        .select("*");

      if (semuaTransaksi && semuaTransaksi.length > 0) {
        const hasilFilterLokal = semuaTransaksi.filter(item => {
          const waPenumpang = String(item.whatsapp_penumpang || '').replace(/[^0-9]/g, '');
          const waPembeli = String(item.whatsapp_pembeli || '').replace(/[^0-9]/g, '');
          const waUser = String(item.whatsapp || '').replace(/[^0-9]/g, '');

          return waPenumpang === nomorTarget || waPembeli === nomorTarget || waUser === nomorTarget;
        });

        const transaksiDenganDataLengkap = hasilFilterLokal.map(trx => {
          const dataBookingCocok = semuaBookingTemp?.find(b => 
            (b.booking_id && b.booking_id === trx.booking_id) || 
            (b.id && b.id === trx.booking_id) ||
            (b.booking_id && b.booking_id === trx.id)
          );
          
          const tanggalFormatDB = trx.tanggal_perjalanan || trx.tanggal || trx.tanggal_berangkat ||
                                  dataBookingCocok?.tanggal_perjalanan || dataBookingCocok?.tanggal || dataBookingCocok?.tanggal_berangkat;

          let tanggalFinal = 'Hari ini';
          if (tanggalFormatDB) {
            const formatObj = new Date(tanggalFormatDB);
            if (!isNaN(formatObj.getTime())) {
              const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
              tanggalFinal = formatObj.toLocaleDateString('id-ID', opsi);
            } else {
              tanggalFinal = tanggalFormatDB;
            }
          }

          return {
            ...trx,
            tanggal_perjalanan_fix: tanggalFinal,
            rute_asal_fix: trx.rute_asal || trx.asal || dataBookingCocok?.rute_asal || dataBookingCocok?.asal || dataBookingCocok?.pickup_kota || 'Bukittinggi',
            rute_tujuan_fix: trx.rute_tujuan || trx.tujuan || dataBookingCocok?.rute_tujuan || dataBookingCocok?.tujuan || dataBookingCocok?.tujuan_kota || 'Medan'
          };
        });

        transaksiDenganDataLengkap.sort((a, b) => {
          const waktuA = new Date(a.created_at || 0);
          const waktuB = new Date(b.created_at || 0);
          return waktuB - waktuA; 
        });

        setListTiket(transaksiDenganDataLengkap);
      } else {
        setListTiket([]);
      }

    } catch (err) {
      console.error("Gagal melakukan pencarian silang tabel:", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const jalankanShortcutNomorSaya = () => {
    if (nomorSesiAkun) {
      tanganiPencarianTiket(nomorSesiAkun);
    }
  };

  // ----------------==========================================================
  // 🖨️ PREMIUM ENGINE: DIRECT AUTO-DOWNLOAD PDF FOR MOBILE WITHOUT PRINT WINDOW
  // ----------------------------------------------------------------==========
  const unduhCetakNotaPDF = async (item) => {
    const idString = (item.id || '').toString().replace(/[^a-zA-Z0-9]/g, '');
    const kodeTiketFix = `TRV-${idString.substring(0, 8).toUpperCase()}`;
    const totalFormat = `Rp ${(item.total_bayar || 0).toLocaleString('id-ID')}`;
    const statusSaatIni = item.status_pesanan || "Menunggu Pembayaran";
    const isLunas = statusSaatIni === "Terkonfirmasi" || statusSaatIni === "Selesai";

    const wadahNotaUIPdf = document.createElement('div');
    wadahNotaUIPdf.style.position = 'absolute';
    wadahNotaUIPdf.style.left = '-9999px'; 
    wadahNotaUIPdf.style.top = '0px';
    wadahNotaUIPdf.style.width = '450px'; 

    wadahNotaUIPdf.innerHTML = `
      <div style="background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; padding-bottom: 30px;">
        <div style="background: linear-gradient(135deg, #02596b 0%, #013e4b 100%); padding: 30px; color: #ffffff; position: relative;">
          <h1 style="font-size: 26px; font-weight: 800; font-family: sans-serif; margin: 0; letter-spacing: 1px;">TRAVELIND</h1>
          <p style="font-size: 11px; color: #f2994a; font-weight: 700; font-family: sans-serif; text-transform: uppercase; margin-top: 3px; letter-spacing: 0.5px;">Mitra Resmi Perjalanan Anda</p>
          <div style="position: absolute; top: 32px; right: 30px; background: rgba(255,255,255,0.18); padding: 5px 14px; border-radius: 30px; font-size: 12px; font-weight: 700; font-family: sans-serif; border: 1px solid rgba(255,255,255,0.2); text-transform: uppercase;">
            ${kodeTiketFix}
          </div>
        </div>
        
        <div style="padding: 24px; font-family: sans-serif;">
          <h3 style="font-size: 13px; font-weight: 700; color: #02596b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">Manifes E-Tiket Resmi</h3>
          
          <div style="background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding-bottom: 10px; border-bottom: 1px solid #edf2f7; margin-bottom: 10px;">
              <span style="color: #64748b;">Nama Penumpang</span>
              <span style="font-weight: 600; color: #0f172a;">${item.nama_penumpang || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding-bottom: 10px; border-bottom: 1px solid #edf2f7; margin-bottom: 10px;">
              <span style="color: #64748b;">Armada Penyedia</span>
              <span style="font-weight: 600; color: #0f172a;">${item.nama_travel || '-'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding-bottom: 10px; border-bottom: 1px solid #edf2f7; margin-bottom: 10px;">
              <span style="color: #64748b;">Rute Perjalanan</span>
              <span style="font-weight: 700; color: #02596b;">${item.rute_asal_fix} &rarr; ${item.rute_tujuan_fix}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; padding-bottom: 10px; border-bottom: 1px solid #edf2f7; margin-bottom: 10px;">
              <span style="color: #64748b;">Tanggal Berangkat</span>
              <span style="font-weight: 600; color: #0f172a;">${item.tanggal_perjalanan_fix}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
              <span style="color: #64748b;">Metode Pembayaran</span>
              <span style="font-weight: 600; color: #0f172a;">${item.metode_pembayaran || '-'}</span>
            </div>
          </div>

          <div style="background: #e6f0f2; border: 1px dashed #02596b; border-radius: 12px; padding: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <span style="font-size: 12px; font-weight: 700; color: #02596b;">TOTAL BIAYA TIKET</span>
            <span style="font-size: 18px; font-weight: 800; color: #02596b;">${totalFormat}</span>
          </div>

          <div style="text-align: center; margin-top: 15px;">
            <div style="padding: 6px 24px; font-size: 13px; font-weight: 800; text-transform: uppercase; border-radius: 6px; border: 2px dashed ${isLunas ? '#27ae60' : '#f2994a'}; color: ${isLunas ? '#27ae60' : '#f2994a'}; display: inline-block; transform: rotate(-1deg);">
              ${statusSaatIni}
            </div>
          </div>

          <div style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 30px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            <p>E-Tiket ini sah diterbitkan secara digital oleh sistem TRAVELIND.</p>
            <p style="font-weight: 600; color: #64748b; margin-top: 2px;">Harap simpan file PDF ini di ponsel Anda untuk ditunjukkan kepada sopir travel.</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wadahNotaUIPdf);

    try {
      const canvas = await html2canvas(wadahNotaUIPdf, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const lebarKomponenPDF = 140; 
      const tinggiKomponenPDF = (canvas.height * lebarKomponenPDF) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 35, 20, lebarKomponenPDF, tinggiKomponenPDF);
      pdf.save(`E-Tiket_TRAVELIND_${kodeTiketFix}.pdf`);
    } catch (err) {
      console.error("Gagal mengunduh file berkas PDF secara instan:", err);
      alert("Gagal mendownload PDF otomatis. Harap coba lagi.");
    } finally {
      document.body.removeChild(wadahNotaUIPdf);
    }
  };

  return (
    <div className="app-container">
      
      {/* HEADER BAR */}
      <header className="main-header">
        <div className="header-left">
          <div className="back-btn" onClick={() => navigate('/home')} title={t.navBtmHome}>
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <h2 className="page-title">{t.pageTitle}</h2>
        </div>
        <div style={{ width: '24px' }}></div>
      </header>

      <main className="content-wrapper">
        
        {/* CARDS INPUT FORM PENCARIAN */}
        <section className="premium-card search-card">
          <div className="search-header">
            <i className="fa-solid fa-ticket-simple icon-teal-large"></i>
            <h4>{t.searchTitle}</h4>
            <p>{t.searchDesc}</p>
          </div>

          <div className="input-field-wrapper">
            <div className="input-with-icon">
              <i className="fa-brands fa-whatsapp"></i>
              <input 
                type="tel" 
                value={whatsappInput} 
                onChange={(e) => setWhatsappInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && tanganiPencarianTiket()}
                placeholder={t.placeholderWa}
                className="form-input-styled" 
              />
            </div>
            
            {nomorSesiAkun && (
              <div className="shortcut-number-wrapper">
                <button type="button" className="btn-use-my-number" onClick={jalankanShortcutNomorSaya}>
                  <i className="fa-solid fa-user-check"></i> {t.btnGunakanNomor}
                </button>
              </div>
            )}
          </div>

          <button type="button" className="btn-search-submit" onClick={() => tanganiPencarianTiket()}>
            <i className="fa-solid fa-magnifying-glass"></i> {t.btnCari}
          </button>
        </section>

        {/* OUTPUT AREA HASIL PELACAKAN */}
        <div className="result-container">
          
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#8c96a3', fontSize: '13px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '28px', color: '#02596b', marginBottom: '12px' }}></i>
              <br />{t.loadingText}
            </div>
          )}

          {isError && (
            <div className="empty-state-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i className="fa-solid fa-circle-xmark" style={{ fontSize: '36px', color: '#e11d48', margin: '0 0 10px 0' }}></i>
              <h6>{t.errorTitle}</h6>
              <p>{t.errorDesc}</p>
            </div>
          )}

          {!hasSearched && !isLoading && (
            <div className="empty-state-box">
              <i className="fa-solid fa-folder-open empty-icon"></i>
              <h6>{t.emptyTitle}</h6>
              <p>{t.emptyDesc}</p>
            </div>
          )}

          {hasSearched && !isLoading && !isError && listTiket.length === 0 && (
            <div className="empty-state-box" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '36px', color: '#f2994a', marginBottom: '12px' }}></i>
              <h6>{t.notFoundTitle}</h6>
              <p>{t.notFoundDesc}</p>
            </div>
          )}

          {hasSearched && !isLoading && !isError && listTiket.map((item) => {
            const statusSaatIni = item.status_pesanan || "Menunggu Pembayaran";
            const isLunas = statusSaatIni === "Terkonfirmasi" || statusSaatIni === "Selesai";
            const idMurniString = (item.id || '').toString().replace(/[^a-zA-Z0-9]/g, '');
            const kodeTiketFix = `TRV-${idMurniString.substring(0, 8).toUpperCase()}`;

            return (
              <section 
                key={item.id} 
                className="premium-card" 
                style={{ borderLeft: `5px solid ${isLunas ? '#27ae60' : '#f2994a'}`, background: '#fff', textAlign: 'left' }}
              >
                <div className="ticket-row-header">
                  <span className="ticket-code-label"><i className="fa-solid fa-qrcode"></i> {kodeTiketFix}</span>
                  <span className={`badge ${isLunas ? 'badge-success' : 'badge-warning'}`}>
                    {statusSaatIni}
                  </span>
                </div>

                {isLunas && (
                  <div className="notif-success-alert-box">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>E-Tiket resmi telah otomatis terkirim ke WhatsApp / Email kamu!</span>
                  </div>
                )}

                <div className="ticket-info-body">
                  <div className="info-line"><span>Nama Penumpang</span><b>{item.nama_penumpang || '-'}</b></div>
                  <div className="info-line"><span>Armada Travel</span><b>{item.nama_travel || '-'}</b></div>
                  
                  <div className="info-line">
                    <span>Rute Perjalanan</span>
                    <b style={{ color: '#02596b', fontWeight: '700' }}>
                      {item.rute_asal_fix} <i className="fa-solid fa-arrow-right" style={{ fontSize: '10px', margin: '0 4px' }}></i> {item.rute_tujuan_fix}
                    </b>
                  </div>

                  <div className="info-line"><span>Tanggal Perjalanan</span><b>{item.tanggal_perjalanan_fix}</b></div>
                  <div className="info-line"><span>Metode Bayar</span><b>{item.metode_pembayaran || '-'}</b></div>
                  <div className="info-line grand-total-line">
                    <span>Total Bayar</span>
                    <span>Rp {(item.total_bayar || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="action-box-row">
                  <button type="button" className="btn-card-action btn-secondary-action" onClick={() => unduhCetakNotaPDF(item)}>
                    <i className="fa-solid fa-file-invoice"></i> Invoice
                  </button>
                  <a 
                    href={`https://wa.me/6281234567890?text=Halo%20Admin%20TRAVELIND,%20saya%20ingin%20konfirmasi%20tiket%20${kodeTiketFix}%20atas%20nama%20${item.nama_penumpang}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="btn-card-action btn-primary-action"
                  >
                    <i className="fa-brands fa-whatsapp"></i> Hubungi CS
                  </a>
                </div>
              </section>
            );
          })}

        </div>

        <footer className="main-footer" style={{ marginTop: 'auto', padding: '20px 0', textAlign: 'center', background: 'transparent' }}>
          <p className="footer-title" style={{ fontSize: '13px', color: '#2b2b2b', margin: '0 0 10px 0', fontWeight: '700' }}>{t.ikutiKami}</p>
          <div className="social-icons" style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '20px' }}>
            <a href="#" aria-label="TikTok" style={{ color: '#02596b' }}><i className="fa-brands fa-tiktok"></i></a>
            <a href="#" aria-label="Instagram" style={{ color: '#02596b' }}><i className="fa-brands fa-instagram"></i></a>
            <a href="#" aria-label="Facebook" style={{ color: '#02596b' }}><i className="fa-brands fa-facebook"></i></a>
          </div>
        </footer>

      </main>

     {/* 🌟 FIXED BOTTOM NAV BAR (TERISOLASI AMAN - TIDAK MERUSAK BERANDA) */}
      <nav className="bottom-nav-cek-tiket">
        <button type="button" className="nav-link-cek-tiket" onClick={() => navigate('/home')}>
          <i className="fa-solid fa-house"></i>
          <span>{t.navBtmHome}</span>
        </button>
        <button type="button" className="nav-link-cek-tiket active" onClick={() => navigate('/cek-tiket')}>
          <i className="fa-solid fa-ticket"></i>
          <span>{t.navBtmTiket}</span>
        </button>
        <button type="button" className="nav-link-cek-tiket" onClick={() => navigate('/profil')}>
          <i className="fa-solid fa-user"></i>
          <span>{t.navBtmProfil}</span>
        </button>
      </nav>

    </div>
  );
};

export default CekTiketView;