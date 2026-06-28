import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import useAuthStore from '../store/authStore'; 
import '../styles/cek-tiket.css'; 

const CekTiketView = () => {
  const navigate = useNavigate();
  const { user, bahasaGlobal } = useAuthStore();

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [bookingIdInput, setBookingIdInput] = useState('');
  const [whatsappInput, setWhatsappInput] = useState('');
  const [listTiket, setListTiket] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState('aktif'); 

  // 🌟 Kamus Terjemahan Dinamis Diperluas 100% Bebas Hardcoded
  const t = {
    ID: {
      pageTitle: 'Tiket Saya',
      searchTitle: 'Lacak Tiket Perjalanan',
      searchDescAnonim: 'Masukkan kombinasi Kode Booking dan Nomor WhatsApp valid Anda.',
      searchDescLogin: 'Menampilkan e-tiket yang terikat dengan email aktif Anda secara aman.',
      placeholderBookingId: 'Contoh: TRV-XXXXXX',
      placeholderWa: 'Contoh: 08xxxxxxxx',
      btnCari: 'Verifikasi & Cari Tiket',
      loadingText: 'Menghubungkan ke server...',
      errorTitle: 'Gangguan Sistem',
      errorDesc: 'Gagal memuat data dari database cloud.',
      emptyTitle: 'Keamanan Berlapis',
      emptyDescAnonim: 'Masukkan Kode Booking dan WhatsApp untuk memverifikasi kepemilikan e-tiket resmi.',
      notFoundTitle: 'Tiket Tidak Ditemukan',
      notFoundDesc: 'Tidak ada tiket yang cocok dengan kriteria filter tab saat ini.',
      ikutiKami: 'Ikuti kami',
      alertEmptyAnonim: 'Mohon isi Kode Booking dan Nomor WhatsApp Anda!',
      tabAktif: 'Aktif',
      tabPending: 'Menunggu',
      tabRiwayat: 'Riwayat',
      badgeLunas: 'Siap Berangkat',
      badgePending: 'Menunggu Konfirmasi',
      badgeExpired: 'Sudah Lewat',
      
      labelPassenger: 'Penumpang',
      labelOperator: 'Operator',
      labelDepartureDate: 'Tanggal Keberangkatan',
      labelPaymentMethod: 'Metode Bayar',
      labelTotalPay: 'Total Bayar',
      btnDownloadInvoice: 'Unduh Invoice',
      btnContactDriver: 'Hubungi Driver',
      successAlertText: 'Tiket aktif. Silakan tunjukkan Invoice PDF ke sopir travel saat keberangkatan.',
      sessionActiveTag: 'Sesi Sinkronisasi Akun Aktif',
      pdfTitle: 'E-Tiket Resmi Perjalanan',
      pdfTotal: 'TOTAL BIAYA'
    },
    EN: {
      pageTitle: 'My Tickets',
      searchTitle: 'Track Ticket',
      searchDescAnonim: 'Enter your valid Booking Code and WhatsApp Number combination.',
      searchDescLogin: 'Securely displaying e-tickets tied to your active account email.',
      placeholderBookingId: 'e.g., TRV-XXXXXX',
      placeholderWa: 'e.g., 08xxxxxxxx',
      btnCari: 'Verify & Find Ticket',
      loadingText: 'Connecting to server...',
      errorTitle: 'System Error',
      errorDesc: 'Failed to load data from cloud database.',
      emptyTitle: 'Layered Security',
      emptyDescAnonim: 'Please enter your Booking Code and WhatsApp to verify e-ticket ownership.',
      notFoundTitle: 'No Ticket Found',
      notFoundDesc: 'There are no tickets matching the current tab criteria.',
      ikutiKami: 'Follow us',
      alertEmptyAnonim: 'Please fill in both Booking Code and WhatsApp Number!',
      tabAktif: 'Active',
      tabPending: 'Pending',
      tabRiwayat: 'History',
      badgeLunas: 'Ready to Go',
      badgePending: 'Awaiting Confirmation',
      badgeExpired: 'Expired',
      
      labelPassenger: 'Passenger',
      labelOperator: 'Operator',
      labelDepartureDate: 'Departure Date',
      labelPaymentMethod: 'Payment Method',
      labelTotalPay: 'Total Payment',
      btnDownloadInvoice: 'Download Invoice',
      btnContactDriver: 'Contact Driver',
      successAlertText: 'Active ticket. Please show the Invoice PDF to the driver upon departure.',
      sessionActiveTag: 'Active Account Sync Session',
      pdfTitle: 'Official E-Ticket Manifest',
      pdfTotal: 'TOTAL COST'
    }
  }[bahasaGlobal || 'ID'];

  useEffect(() => {
    if (user && user.email) {
      ambilTiketBerdasarkanEmailSesi(user.email);
    }
  }, [user]);

  const ambilTiketBerdasarkanEmailSesi = async (emailUser) => {
    setIsLoading(true);
    setIsError(false);
    setHasSearched(true);
    try {
      const { data: transaksi, error: errorTrx } = await supabase
        .from("transaksi")
        .select("*")
        .eq("email_penumpang", emailUser);

      if (errorTrx) throw errorTrx;
      await sinkronisasiDanRenderTiket(transaksi || []);
    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const tanganiPencarianTiketAnonim = async () => {
    const bookingInputClean = bookingIdInput.trim().toUpperCase();
    const waInputClean = whatsappInput.trim().replace(/[^0-9]/g, '');

    if (!bookingInputClean || !waInputClean) {
      alert(t.alertEmptyAnonim);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setHasSearched(true);

    try {
      const { data: transaksiList, error: errorTrx } = await supabase
        .from("transaksi")
        .select("*")
        .eq("whatsapp_penumpang", waInputClean);

      if (errorTrx) throw errorTrx;

      const hasilFilterCocok = (transaksiList || []).filter(item => {
        const idString = (item.id || '').toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
        const bIdString = (item.booking_id || '').toString().replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
        return bookingInputClean === `TRV-${idString}` || bookingInputClean === `TRV-${bIdString}` || bookingInputClean === item.booking_id;
      });

      await sinkronisasiDanRenderTiket(hasilFilterCocok);
    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sinkronisasiDanRenderTiket = async (arrayTransaksi) => {
    if (arrayTransaksi.length === 0) {
      setListTiket([]);
      return;
    }

    const { data: semuaBookingTemp } = await supabase.from("booking_temp").select("*");

    const dataLengkap = arrayTransaksi.map(trx => {
      const dataBookingCocok = semuaBookingTemp?.find(b => 
        b.booking_id === trx.booking_id || b.id === trx.booking_id || b.booking_id === trx.id
      );
      
      const tanggalFormatDB = trx.tanggal_perjalanan || trx.tanggal || trx.tanggal_berangkat ||
                              dataBookingCocok?.tanggal_perjalanan || dataBookingCocok?.tanggal || dataBookingCocok?.tanggal_berangkat;

      let tanggalFinal = 'Hari ini';
      let targetObjekTanggal = new Date();

      if (tanggalFormatDB) {
        const formatObj = new Date(tanggalFormatDB);
        if (!isNaN(formatObj.getTime())) {
          targetObjekTanggal = formatObj;
          const opsi = { day: 'numeric', month: 'long', year: 'numeric' };
          tanggalFinal = formatObj.toLocaleDateString(bahasaGlobal === 'ID' ? 'id-ID' : 'en-US', opsi);
        } else {
          tanggalFinal = tanggalFormatDB;
        }
      }

      return {
        ...trx,
        objek_tanggal_asli: targetObjekTanggal,
        tanggal_perjalanan_fix: tanggalFinal,
        rute_asal_fix: trx.rute_asal || trx.asal || dataBookingCocok?.rute_asal || dataBookingCocok?.pickup_kota || 'Padang',
        rute_tujuan_fix: trx.rute_tujuan || trx.tujuan || dataBookingCocok?.rute_tujuan || dataBookingCocok?.tujuan_kota || 'Muko-Muko'
      };
    });

    dataLengkap.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    setListTiket(dataLengkap);
  };

  const dapatkanTiketTerfilter = () => {
    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);

    return listTiket.filter(item => {
      const statusDB = item.status_pesanan || "Menunggu Pembayaran";
      const isLunas = statusDB === "Terkonfirmasi" || statusDB === "Selesai";
      
      const tanggalTiket = new Date(item.objek_tanggal_asli);
      tanggalTiket.setHours(0, 0, 0, 0);

      const isExpired = tanggalTiket < hariIni;

      if (activeTab === 'riwayat') {
        return isExpired || statusDB === "Dibatalkan";
      }
      
      if (activeTab === 'aktif') {
        return isLunas && !isExpired;
      }
      
      if (activeTab === 'pending') {
        return !isLunas && !isExpired;
      }

      return false;
    });
  };

  const tiketTerfilter = dapatkanTiketTerfilter();

  const unduhCetakNotaPDF = async (item) => {
    const idString = (item.id || '').toString().replace(/[^a-zA-Z0-9]/g, '');
    const kodeTiketFix = `TRV-${idString.substring(0, 8).toUpperCase()}`;
    const totalFormat = `Rp ${(item.total_bayar || 0).toLocaleString('id-ID')}`;
    const wadahNotaUIPdf = document.createElement('div');
    wadahNotaUIPdf.style.position = 'absolute';
    wadahNotaUIPdf.style.left = '-9999px'; 
    wadahNotaUIPdf.style.width = '450px'; 

    wadahNotaUIPdf.innerHTML = `
      <div style="background-color: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; padding-bottom: 30px; font-family: sans-serif;">
        <div style="background: linear-gradient(135deg, #0B1F3A 0%, #1A3A60 100%); padding: 30px; color: #ffffff; position: relative;">
          <h1 style="font-size: 26px; font-weight: 800; margin: 0;">TRAVELIND</h1>
          <div style="position: absolute; top: 32px; right: 30px; background: rgba(255,255,255,0.2); padding: 5px 14px; border-radius: 30px; font-size: 12px; font-weight: 700;">
            ${kodeTiketFix}
          </div>
        </div>
        <div style="padding: 24px;">
          <h3 style="font-size: 13px; color: #0B1F3A; text-transform: uppercase; margin-bottom: 16px;">${t.pdfTitle}</h3>
          <div style="background: #f8fafc; padding: 18px; border-radius: 12px; margin-bottom: 20px; line-height: 2;">
            <div><b>${t.labelPassenger}:</b> ${item.nama_penumpang || '-'}</div>
            <div><b>${t.labelOperator}:</b> ${item.nama_travel || '-'}</div>
            <div><b>Rute:</b> ${item.rute_asal_fix} &rarr; ${item.rute_tujuan_fix}</div>
            <div><b>${t.labelDepartureDate}:</b> ${item.tanggal_perjalanan_fix}</div>
          </div>
          <div style="background: #E0FAF7; border: 1px dashed #00D4B8; border-radius: 12px; padding: 16px; font-weight: 700; text-align: center; color:#0B1F3A;">
            ${t.pdfTotal}: ${totalFormat}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(wadahNotaUIPdf);
    try {
      const canvas = await html2canvas(wadahNotaUIPdf, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.addImage(imgData, 'PNG', 35, 20, 140, (canvas.height * 140) / canvas.width);
      pdf.save(`E-Tiket_TRAVELIND_${kodeTiketFix}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      document.body.removeChild(wadahNotaUIPdf);
    }
  };

  return (
    <div className="travelind-luxury-ticket-container">
      
      {/* HEADER BAR MANDIRI (Warna Navy Solid) */}
      <header className="ticket-top-bar">
        <button type="button" className="back-action-btn" onClick={() => navigate('/home')}>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
        </button>
        <h2 className="ticket-page-title">{t.pageTitle}</h2>
        <div style={{ width: '40px' }}></div>
      </header>

      <main className="ticket-main-content">
        
        {/* SECURE INPUT CARD TRACKER */}
        <section className="secure-tracker-card">
          <div className="tracker-card-header">
            <div className="shield-icon-wrapper">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286z"/></svg>
            </div>
            <h4>{t.searchTitle}</h4>
            <p>{user ? t.searchDescLogin : t.searchDescAnonim}</p>
          </div>

          {!user ? (
            <div className="secure-fields-layout-group">
              <div className="styled-input-icon-wrapper">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5zM13.5 14.25v3.75m0-3.75h3.75m-3.75 0H15m3 0h.75m-1.5 0v3.75m3-3.75v3.75m-3 0h3.75"/></svg>
                <input 
                  type="text" 
                  value={bookingIdInput} 
                  onChange={(e) => setBookingIdInput(e.target.value)}
                  placeholder={t.placeholderBookingId}
                  className="styled-form-input-node" 
                />
              </div>
              <div className="styled-input-icon-wrapper">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 2.018a14.991 14.991 0 01-6.507-6.507l2.018-1.514c.361-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                <input 
                  type="tel" 
                  value={whatsappInput} 
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder={t.placeholderWa}
                  className="styled-form-input-node" 
                />
              </div>
              <button type="button" className="btn-tracker-search-submit" onClick={tanganiPencarianTiketAnonim}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"/></svg>
                <span>{t.btnCari}</span>
              </button>
            </div>
          ) : (
            <div className="logged-in-secure-sync-badge">
              <div className="sync-tag-status"><span className="pulse-dot-green"></span> {t.sessionActiveTag}</div>
              <div className="sync-email-label">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>{user.email}</span>
              </div>
            </div>
          )}
        </section>

        {/* FILTER TABS COMPONENT SYSTEM */}
        {hasSearched && !isLoading && !isError && (
          <div className="ticket-filter-tabs-row">
            <button 
              type="button" 
              className={`filter-tab-node ${activeTab === 'aktif' ? 'active-node' : ''}`}
              onClick={() => setActiveTab('aktif')}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{t.tabAktif}</span>
            </button>
            <button 
              type="button" 
              className={`filter-tab-node ${activeTab === 'pending' ? 'active-node' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{t.tabPending}</span>
            </button>
            <button 
              type="button" 
              className={`filter-tab-node ${activeTab === 'riwayat' ? 'active-node' : ''}`}
              onClick={() => setActiveTab('riwayat')}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/></svg>
              <span>{t.tabRiwayat}</span>
            </button>
          </div>
        )}

        {/* OUTPUT AREA CARDS TIKET */}
        <div className="ticket-output-cards-wrapper">
          
          {isLoading && (
            <div className="ticket-loading-state-box">
              <svg className="animate-spin" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8"/></svg>
              <p>{t.loadingText}</p>
            </div>
          )}

          {isError && (
            <div className="ticket-empty-state-card status-error">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
              <h6>{t.errorTitle}</h6>
              <p>{t.errorDesc}</p>
            </div>
          )}

          {!hasSearched && !isLoading && !user && (
            <div className="ticket-empty-state-card status-welcome">
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-3-12h.008v.008H13.5V6zm0 3h.008v.008H13.5V9zm0 3h.008v.008H13.5v-.008zm0 3h.008v.008H13.5V15zM5.625 18H18.375a2.625 2.625 0 002.625-2.625V8.625A2.625 2.625 0 0018.375 6H5.625A2.625 2.625 0 003 8.625v6.75c0 1.45 1.175 2.625 2.625 2.625z"/></svg>
              <h6>{t.emptyTitle}</h6>
              <p>{t.emptyDescAnonim}</p>
            </div>
          )}

          {hasSearched && !isLoading && !isError && tiketTerfilter.length === 0 && (
            <div className="ticket-empty-state-card status-notfound">
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 004.5 15h15a2.25 2.25 0 002.25-2.25m-19.5 0v.25A2.25 2.25 0 004.5 17.5h15a2.25 2.25 0 002.25-2.25v-.25m-19.5 0V9a2.25 2.25 0 012.25-2.25h5.379a1.5 1.5 0 011.06.44l1.19 1.19a1.5 1.5 0 001.06.44h6.562A2.25 2.25 0 0121.75 9v3.75m-19.5 0v.25M9.75 14.25h4.5M12 12v4.5"/></svg>
              <h6>{t.notFoundTitle}</h6>
              <p>{t.notFoundDesc}</p>
            </div>
          )}

          {hasSearched && !isLoading && !isError && tiketTerfilter.map((item) => {
            const statusDB = item.status_pesanan || "Menunggu Pembayaran";
            const isLunas = statusDB === "Terkonfirmasi" || statusDB === "Selesai";
            
            const tanggalTiket = new Date(item.objek_tanggal_asli);
            tanggalTiket.setHours(0,0,0,0);
            const hariIni = new Date();
            hariIni.setHours(0,0,0,0);
            const isExpired = tanggalTiket < hariIni;

            const idMurniString = (item.id || '').toString().replace(/[^a-zA-Z0-9]/g, '');
            const kodeTiketFix = `TRV-${idMurniString.substring(0, 8).toUpperCase()}`;

            let labelBadge = t.badgePending;
            let tipeBadge = 'badge-style-warning';
            if (isExpired) {
              labelBadge = t.badgeExpired;
              tipeBadge = 'badge-style-expired';
            } else if (isLunas) {
              labelBadge = t.badgeLunas;
              tipeBadge = 'badge-style-success';
            }

            return (
              <section key={item.id} className={`luxury-manifest-ticket-card ${isExpired ? 'card-state-expired' : ''}`}>
                <div className="manifest-card-top-header">
                  <span className="manifest-code-badge">
                    <svg style={{marginRight: '4px', inlineSize: '12px'}} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/></svg>
                    {kodeTiketFix}
                  </span>
                  <span className={`status-pill-badge ${tipeBadge}`}>
                    {labelBadge}
                  </span>
                </div>

                {isLunas && !isExpired && (
                  <div className="manifest-success-alert-banner">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span>{t.successAlertText}</span>
                  </div>
                )}

                <div className="manifest-info-grid-body">
                  <div className="manifest-data-line"><span>{t.labelPassenger}</span><b>{item.nama_penumpang || '-'}</b></div>
                  <div className="manifest-data-line"><span>{t.labelOperator}</span><b>{item.nama_travel || '-'}</b></div>
                  
                  {/* DISPLAY RUTE MODERN */}
                  <div className="manifest-route-visual-block">
                    <div className="route-terminal-node">
                      <span className="terminal-dot dot-origin"></span>
                      <span className="terminal-city-text">{item.rute_asal_fix}</span>
                    </div>
                    <div className="route-line-vector-connector">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125a1.125 1.125 0 001.125-1.125V9.75M3.75 14.25h16.5M3.75 14.25V9.75m16.5 4.5V9.75M12 4.875C6.973 4.875 3 8.25 3 9.75h18c0-1.5-3.973-4.875-9-4.875z"/></svg>
                    </div>
                    <div className="route-terminal-node align-node-right">
                      <span className="terminal-dot dot-destination"></span>
                      <span className="terminal-city-text">{item.rute_tujuan_fix}</span>
                    </div>
                  </div>

                  <div className="manifest-data-line"><span>{t.labelDepartureDate}</span><b>{item.tanggal_perjalanan_fix}</b></div>
                  <div className="manifest-data-line"><span>{t.labelPaymentMethod}</span><b>{item.metode_pembayaran || '-'}</b></div>
                  <div className="manifest-data-line grand-total-highlight-line">
                    <span>{t.labelTotalPay}</span>
                    <span className="grand-price-amount">Rp {(item.total_bayar || 0).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <div className="manifest-action-buttons-row">
                  <button type="button" className="card-action-trigger action-download-pdf" onClick={() => unduhCetakNotaPDF(item)}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625A2.25 2.25 0 003.375 5.625v12.75a2.25 2.25 0 002.25 2.25h12.75a2.25 2.25 0 002.25-2.25V14.25z"/></svg>
                    <span>{t.btnDownloadInvoice}</span>
                  </button>
                  <a 
                    href={`https://wa.me/6281234567890?text=Halo%20Admin%20TRAVELIND,%20saya%20ingin%20tanya%20mengenai%20status%20tiket%20${kodeTiketFix}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="card-action-trigger action-contact-driver"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-1.514 2.018a14.991 14.991 0 01-6.507-6.507l2.018-1.514c.361-.272.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
                    <span>{t.btnContactDriver}</span>
                  </a>
                </div>
              </section>
            );
          })}

        </div>

        {/* SOSIAL MEDIA FOOTER */}
        <footer className="ticket-view-footer-block">
          <p>{t.ikutiKami}</p>
          <div className="footer-social-icons-row">
            <a href="#tiktok">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.63 4.14.96.96 2.29 1.52 3.65 1.67v3.79c-1.84-.07-3.62-.77-4.96-2.01-.11-.1-.18-.1-.18.06-.02 2.63.01 5.27-.02 7.9-.11 1.71-.74 3.39-1.89 4.65-1.48 1.48-3.56 2.33-5.67 2.33-2.11 0-4.19-.85-5.67-2.33-1.63-1.63-2.45-3.95-2.26-6.26.23-2.5 1.94-4.7 4.35-5.4 1.19-.34 2.45-.3 3.62.13V0h.01z"/></svg>
            </a>
            <a href="#instagram">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"/></svg>
            </a>
            <a href="#facebook">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/></svg>
            </a>
          </div>
        </footer>

      </main>

    </div>
  );
};

export default CekTiketView;