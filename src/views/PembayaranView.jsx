import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import useAuthStore from '../store/authStore'; // 🌟 Integrasi Zustand Store Global untuk Multibahasa
import '../styles/pembayaran.css'; 

const PembayaranView = () => {
  const navigate = useNavigate();
  const { bahasaGlobal } = useAuthStore(); // 🌟 Mengambil status bahasa global dinamis

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [isModalVoucherOpen, setIsModalVoucherOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('BCA');
  const [countdownText, setCountdownText] = useState('02:00:00');
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);

  // ----------------==========================================================
  // ⚡️ VOUCHER & PRICING ENGINE STATE
  // ----------------------------------------------------------------==========
  const [inputVoucher, setInputVoucher] = useState('');
  const [voucherStatusNotif, setVoucherStatusNotif] = useState({ text: '', color: '#4a5568' });
  const [listVoucherCloud, setListVoucherCloud] = useState([]);
  const [isFetchVoucherLoading, setIsFetchVoucherLoading] = useState(false);

  const [nominalDiskonAktif, setNominalDiskonAktif] = useState(0);
  const [idVoucherTerpakai, setIdVoucherTerpakai] = useState(null);
  const [kodeVoucherTerpakai, setKodeVoucherTerpakai] = useState('');

  // --------------------------------------------------------------------------
  // ⚡️ PROFIL & FILE PREVIEW STATE
  // --------------------------------------------------------------------------
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // 🌟 Kamus Terjemahan Otomatis Dinamis (Sinkron 100% dengan Halaman Sebelumnya)
  const t = {
    ID: {
      pageTitle: 'Pembayaran',
      step1: 'Cari',
      step2: 'Pilih',
      step3: 'Isi Data',
      step4: 'Bayar',
      totalBayarLabel: 'Total Pembayaran',
      timerInfo: 'Selesaikan pembayaran sebelum ',
      wibText: ' WIB',
      metodeTitle: 'Pilih Metode Pembayaran',
      tfBank: 'Transfer Bank',
      tfBankDesc: 'Bayar melalui rekening bank resmi',
      qrisTitle: 'QRIS',
      qrisDesc: 'Bayar dengan QRIS E-Wallet',
      rekLabel: 'No. Rekening',
      salinBtn: 'Salin',
      anLabel: 'Atas Nama',
      bcaInfoText: 'Pastikan nominal transfer sesuai dengan total pembayaran. Termasuk biaya admin jika ada.',
      qrisLogoText: 'QRIS Interaktif',
      qrisInstruction: 'Pindai QR di atas menggunakan aplikasi mobile banking Anda.',
      caraTitle: 'Cara Pembayaran',
      step1Desc: 'Lakukan transfer ke rekening di atas.',
      step2Desc: 'Pastikan nominal yang ditransfer sudah sesuai.',
      step3Desc: 'Setelah berhasil transfer, upload bukti pembayaran.',
      step4Desc: 'Pesanan akan segera dikonfirmasi otomatis oleh sistem.',
      kuponTitle: 'Kupon Promo Travel',
      kuponPlaceholder: 'Masukkan kode promo Anda...',
      kuponPilihBtn: 'Pilih ',
      kuponTerapkanBtn: 'Terapkan',
      uploadTitle: 'Upload Bukti Pembayaran',
      uploadPromptH6: 'Upload Bukti Transfer',
      uploadPromptP: 'Format: JPG, PNG (Maks. 5MB)',
      uploadRemoveBtn: 'Hapus Foto',
      safeDataNotice: 'Data Anda aman. Kami tidak menyimpan informasi rekening Anda.',
      btnActionSubmit: 'Saya sudah bayar ',
      btnProcessing: 'Memproses...',
      verificationNotice: 'Dengan klik tombol di atas, pembayaran diverifikasi oleh tim kami',
      modalVoucherTitle: 'Pilih Voucher Tersedia',
      voucherLoading: 'Memanggil daftar voucher aktif...',
      voucherEmpty: 'Tidak ada voucher promo yang tersedia saat ini.',
      voucherGunakan: 'Gunakan',
      voucherKhususBaru: 'Khusus Transaksi Pertama',
      voucherSemuaUser: 'Semua Pengguna',
      modalWarnTitle: 'Bukti Transfer Kosong',
      modalWarnDesc: 'Mohon unggah bukti foto transfer Anda terlebih dahulu sebelum menekan tombol konfirmasi pembayaran.',
      modalWarnBtn: 'Mengerti & Unggah Foto',
      valVoucherLoadingCloud: '⏳ Memvalidasi kode kupon ke cloud...',
      valVoucherNotReg: ' tidak terdaftar di sistem kami.',
      valVoucherExpired: ' sudah berakhir (Kedaluwarsa).',
      valVoucherUsed: '❌ Kupon sekali pakai ini sudah hangus diklaim.',
      valVoucherNewUserOnly: '❌ Kupon khusus pengguna baru. Anda sudah pernah melakukan transaksi.',
      valVoucherSuccess: '🎉 Kupon berhasil diterapkan! Hemat Rp ',
      valVoucherNetError: '❌ Terjadi kesalahan jaringan saat memvalidasi kupon.',
      fileSizeAlert: 'Ukuran berkas melebihi batas maksimal 5MB!'
    },
    EN: {
      pageTitle: 'Payment',
      step1: 'Search',
      step2: 'Book',
      step3: 'Details',
      step4: 'Pay',
      totalBayarLabel: 'Total Payment',
      timerInfo: 'Complete your payment before ',
      wibText: ' WIB',
      metodeTitle: 'Select Payment Method',
      tfBank: 'Bank Transfer',
      tfBankDesc: 'Pay via official bank account',
      qrisTitle: 'QRIS',
      qrisDesc: 'Pay with QRIS E-Wallet',
      rekLabel: 'Account Number',
      salinBtn: 'Copy',
      anLabel: 'On Behalf Of',
      bcaInfoText: 'Make sure the transfer amount matches the total payment. Interbank fees may apply.',
      qrisLogoText: 'Interactive QRIS',
      qrisInstruction: 'Scan the QR above using your mobile banking or e-wallet application.',
      caraTitle: 'Payment Instructions',
      step1Desc: 'Transfer money to the account listed above.',
      step2Desc: 'Double-check that the transfer amount matches perfectly.',
      step3Desc: 'After a successful transfer, upload your payment proof receipt.',
      step4Desc: 'Your booking order will be confirmed automatically by our system.',
      kuponTitle: 'Travel Promo Coupon',
      kuponPlaceholder: 'Enter your promo code here...',
      kuponPilihBtn: 'Select ',
      kuponTerapkanBtn: 'Apply',
      uploadTitle: 'Upload Payment Proof Receipt',
      uploadPromptH6: 'Upload Transfer Receipt',
      uploadPromptP: 'Format: JPG, PNG (Max. 5MB)',
      uploadRemoveBtn: 'Remove Photo',
      safeDataNotice: 'Your data is secured. We do not store your banking credentials.',
      btnActionSubmit: 'I have transferred ',
      btnProcessing: 'Processing...',
      verificationNotice: 'By clicking the button above, the payment will be verified by our team',
      modalVoucherTitle: 'Select Available Voucher',
      voucherLoading: 'Fetching active voucher list...',
      voucherEmpty: 'No promo vouchers are available at the moment.',
      voucherGunakan: 'Use',
      voucherKhususBaru: 'First Transaction Only',
      voucherSemuaUser: 'All Users',
      modalWarnTitle: 'Transfer Proof is Empty',
      modalWarnDesc: 'Please upload a photo of your transfer receipt before clicking the confirm payment button.',
      modalWarnBtn: 'Understood & Upload',
      valVoucherLoadingCloud: '⏳ Validating coupon code to cloud...',
      valVoucherNotReg: ' is not registered in our system.',
      valVoucherExpired: ' has expired.',
      valVoucherUsed: '❌ This single-use coupon has already been claimed.',
      valVoucherNewUserOnly: '❌ New users coupon only. You have made transactions before.',
      valVoucherSuccess: '🎉 Coupon applied successfully! Saved Rp ',
      valVoucherNetError: '❌ Network error occurred while validating coupon.',
      fileSizeAlert: 'File size exceeds maximum limit of 5MB!'
    }
  }[bahasaGlobal || 'ID'];

  // --------------------------------------------------------------------------
  // ⚡️ CORE DATA DARI LOCAL STORAGE
  // --------------------------------------------------------------------------
  const hargaTiket = parseInt(localStorage.getItem("travelHarga")) || 0;
  const jumlahPenumpang = parseInt(localStorage.getItem("penumpang")) || 1;
  const grandTotalAwal = (hargaTiket * jumlahPenumpang) + 2000;
  const grandTotalFinal = grandTotalAwal - nominalDiskonAktif;

  useEffect(() => {
    if (!localStorage.getItem("travelHarga")) {
      navigate('/home');
      return;
    }

    let timerDuration = 2 * 60 * 60;
    const intervalCountdown = setInterval(() => {
      let hours = Math.floor(timerDuration / 3600);
      let minutes = Math.floor((timerDuration % 3600) / 60);
      let seconds = timerDuration % 60;
      
      setCountdownText(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );

      if (--timerDuration < 0) {
        clearInterval(intervalCountdown);
        navigate('/home');
      }
    }, 1000);

    return () => clearInterval(intervalCountdown);
  }, [navigate]);

  // --------------------------------------------------------------------------
  // 📄 VOUCHER ENGINE LOGIC (PERBAIKAN SINKRONISASI FILTER CLOUD)
  // --------------------------------------------------------------------------
  const bukaModalPilihVoucher = async () => {
    setIsModalVoucherOpen(true);
    setIsFetchVoucherLoading(true);
    try {
      const hariIni = new Date().toISOString().split('T')[0];
      const { data: listVoucher, error } = await supabase
        .from("promo")
        .select("*")
        .gte("tanggal_kedaluwarsa", hariIni)
        .order("id", { ascending: false });

      if (error) throw error;

      // 🌟 PERBAIKAN: Validasi filter diperbaiki agar kupon bernilai umum/null tidak hilang
      const voucherTersedia = listVoucher.filter(v => {
        if (v.sekali_pakai === true && v.sudah_dipakai === true) {
          return false;
        }
        return true;
      });
      setListVoucherCloud(voucherTersedia);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchVoucherLoading(false);
    }
  };

  const pilihKuponDariPopUp = (kodeKupon) => {
    setInputVoucher(kodeKupon);
    setIsModalVoucherOpen(false);
    eksekusiValidasiVoucherCustomer(kodeKupon);
  };

  const eksekusiValidasiVoucherCustomer = async (overrideKode = '') => {
    const kodeTarget = (overrideKode || inputVoucher).toUpperCase().trim();
    if (!kodeTarget) return;

    setVoucherStatusNotif({ text: t.valVoucherLoadingCloud, color: '#4a5568' });

    try {
      const hariIni = new Date().toISOString().split('T')[0];
      const emailVal = localStorage.getItem("email_penumpang") || "anonim@guest.com";

      // 🌟 PERBAIKAN: Gunakan ilike untuk menghindari kegagalan casing huruf kapital/kecil di DB
      const { data: listPromoData, error } = await supabase
        .from("promo")
        .select("*")
        .ilike("kode_promo", kodeTarget);

      if (error) throw error;
      
      const promoData = listPromoData && listPromoData.length > 0 ? listPromoData[0] : null;

      if (!promoData) {
        setVoucherStatusNotif({ text: `❌ Kode kupon "${kodeTarget}"${t.valVoucherNotReg}`, color: '#e11d48' });
        resetDiskonVoucher(); return;
      }
      if (promoData.tanggal_kedaluwarsa < hariIni) {
        setVoucherStatusNotif({ text: `❌ Masa berlaku kupon "${kodeTarget}"${t.valVoucherExpired}`, color: '#e11d48' });
        resetDiskonVoucher(); return;
      }
      if (promoData.sekali_pakai && promoData.sudah_dipakai) {
        setVoucherStatusNotif({ text: t.valVoucherUsed, color: '#e11d48' });
        resetDiskonVoucher(); return;
      }
      if (promoData.tipe_promo === 'BARU') {
        const { data: historyTransaksi } = await supabase
          .from("transaksi")
          .select("*")
          .eq("email_penumpang", emailVal)
          .limit(1);

        if (historyTransaksi && historyTransaksi.length > 0) {
          setVoucherStatusNotif({ text: t.valVoucherNewUserOnly, color: '#e11d48' });
          resetDiskonVoucher(); return;
        }
      }

      setNominalDiskonAktif(parseInt(promoData.nominal_potongan || 0));
      setIdVoucherTerpakai(promoData.id);
      setKodeVoucherTerpakai(promoData.kode_promo);
      setVoucherStatusNotif({ text: `${t.valVoucherSuccess}${parseInt(promoData.nominal_potongan).toLocaleString('id-ID')}`, color: '#27ae60' });

    } catch (err) {
      setVoucherStatusNotif({ text: t.valVoucherNetError, color: '#e11d48' });
      resetDiskonVoucher();
    }
  };

  const resetDiskonVoucher = () => {
    setNominalDiskonAktif(0);
    setIdVoucherTerpakai(null);
    setKodeVoucherTerpakai('');
  };

  // ----------------==========================================================
  // 📸 UPLOAD PREVIEW ENGINE
  // ----------------------------------------------------------------==========
  const handleZoneWrapperClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChangeTrigger = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(t.fileSizeAlert);
        return;
      }
      setSelectedFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePreviewImage = (e) => {
    e.stopPropagation();
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // --------------------------------------------------------------------------
  // 🛡️ SUBMIT ENGINE
  // --------------------------------------------------------------------------
  const submitPaymentConfirmation = async () => {
    if (!selectedFile) {
      setIsWarningModalOpen(true);
      return;
    }

    const namaVal = localStorage.getItem("nama_penumpang") || "Pengguna Anonim";
    const emailVal = localStorage.getItem("email_penumpang") || "anonim@guest.com";
    const waVal = localStorage.getItem("whatsapp_penumpang") || "-";
    const booking_id = localStorage.getItem("booking_id") || "TRV-" + Date.now();
    const namaTravel = localStorage.getItem("travelNama") || "Armada Travelind";

    const jumlahPenumpangFix = localStorage.getItem("penumpang") || "1";
    const pickupAlamatFix = localStorage.getItem("pickup_alamat") || localStorage.getItem("pickup") || "-";
    const tujuanAlamatFix = localStorage.getItem("tujuan_alamat") || localStorage.getItem("tujuan") || "-";

    setIsSubmitting(true);

    try {
      const fileExtension = selectedFile.name.split('.').pop();
      const namaFileUnik = `${booking_id}-${Date.now()}.${fileExtension}`;

      const { error: storageError } = await supabase.storage
        .from("bukti-transfer")
        .upload(namaFileUnik, selectedFile);

      if (storageError) throw new Error("Gagal mengunggah foto.");

      const { data: publicUrlData } = supabase.storage.from("bukti-transfer").getPublicUrl(namaFileUnik);
      const urlGambarBukti = publicUrlData.publicUrl;

      if (idVoucherTerpakai !== null) {
        await supabase.from("promo").update({ sudah_dipakai: true }).eq("id", idVoucherTerpakai);
      }

      const { error: dbError } = await supabase
        .from("transaksi")
        .insert([
          {
            booking_id: booking_id,
            metode_pembayaran: paymentMethod,
            nama_travel: namaTravel,
            status_pesanan: "Menunggu Konfirmasi",
            total_bayar: grandTotalFinal,
            nama_penumpang: namaVal,
            email_penumpang: emailVal, 
            whatsapp_penumpang: waVal,
            bukti_pembayaran: urlGambarBukti,
            penumpang: parseInt(jumlahPenumpangFix), 
            pickup_alamat: pickupAlamatFix,
            tujuan_alamat: tujuanAlamatFix
          }
        ]);

      if (dbError) throw new Error("Gagal menyimpan catatan transaksi.");

      localStorage.setItem("status_pesanan", "Menunggu Konfirmasi");
      localStorage.setItem("metode_pembayaran", paymentMethod);
      localStorage.setItem("total_bayar_final", grandTotalFinal);

      navigate('/success'); 

    } catch (err) {
      console.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="travelind-booking-wrapper">
      
      <div className="sticky-top-layout-block">
        <header className="main-header">
          <div className="header-left">
            <button type="button" className="back-btn" onClick={() => navigate(-1)}>
              <i className="fa-solid fa-arrow-left"></i>
            </button>
            <h2 className="page-title">{t.pageTitle}</h2>
          </div>
        </header>

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
            <div className="step-node active">
              <span className="circle-node">4</span>
              <span className="node-label">{t.step4}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="booking-content-scroller">
        
        <section className="premium-card checkout-header-card">
          <div className="total-payment-box">
            <span className="card-label">{t.totalBayarLabel}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              {nominalDiskonAktif > 0 ? (
                <>
                  <h2 className="payment-amount harga-asli-dicoret">Rp {grandTotalAwal.toLocaleString('id-ID')}</h2>
                  <h2 className="payment-amount harga-hemat-baru">Rp {grandTotalFinal.toLocaleString('id-ID')}</h2>
                </>
              ) : (
                <h2 className="payment-amount">Rp {grandTotalAwal.toLocaleString('id-ID')}</h2>
              )}
            </div>
            <div className="countdown-timer-wrapper">
              <i className="fa-regular fa-clock icon-orange"></i>
              <span>{t.timerInfo}<b id="timerDisplay">{countdownText}</b>{t.wibText}</span>
            </div>
          </div>
        </section>

        <section className="premium-card">
          <h4 className="section-title">{t.metodeTitle}</h4>
          <div className="payment-options-list">
            <label className={`payment-option-item ${paymentMethod === 'BCA' ? 'active' : ''}`} htmlFor="methodBCA">
              <input type="radio" name="paymentMethod" id="methodBCA" value="BCA" checked={paymentMethod === 'BCA'} onChange={() => setPaymentMethod('BCA')} />
              <div className="option-details">
                <div className="option-icon-wrapper"><i className="fa-solid fa-bank"></i></div>
                <div className="option-text">
                  <h6>{t.tfBank}</h6>
                  <p>{t.tfBankDesc}</p>
                </div>
              </div>
              <div className="custom-radio-circle"></div>
            </label>
            
            <label className={`payment-option-item ${paymentMethod === 'QRIS' ? 'active' : ''}`} htmlFor="methodQRIS">
              <input type="radio" name="paymentMethod" id="methodQRIS" value="QRIS" checked={paymentMethod === 'QRIS'} onChange={() => setPaymentMethod('QRIS')} />
              <div className="option-details">
                <div className="option-icon-wrapper"><i className="fa-solid fa-qrcode"></i></div>
                <div className="option-text">
                  <h6>{t.qrisTitle}</h6>
                  <p>{t.qrisDesc}</p>
                </div>
              </div>
              <div className="custom-radio-circle"></div>
            </label>
          </div>
        </section>

        <section className="premium-card" id="detailPembayaranArea">
          {paymentMethod === 'BCA' ? (
            <div id="contentBCA">
              <div className="bank-identity-row"><span className="bank-name-badge">Bank BCA</span></div>
              <div className="rekening-box">
                <div className="rek-numbers">
                  <span className="card-label">{t.rekLabel}</span>
                  <h4>1234 5678 9010</h4>
                </div>
                <button type="button" className="copy-btn" onClick={() => navigator.clipboard.writeText('123456789010')}>
                  <i className="fa-regular fa-copy"></i> {t.salinBtn}
                </button>
              </div>
              <div className="rek-holder"><span className="card-label">{t.anLabel}</span><h5>Aldi Travelind</h5></div>
              <div className="info-alert-box"><i className="fa-solid fa-circle-info"></i><p>{t.bcaInfoText}</p></div>
            </div>
          ) : (
            <div id="contentQRIS">
              <div className="qris-center-wrapper">
                <span className="qris-logo-text">{t.qrisLogoText}</span>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TRAVELIND-STARTUP-DUMMY-PAYMENT" alt="QRIS Code" className="qris-image" />
                <p className="qris-instruction-text">{t.qrisInstruction}</p>
              </div>
            </div>
          )}
        </section>

        <section className="premium-card">
          <h4 className="section-title">{t.caraTitle}</h4>
          <ol className="instruction-steps-list">
            <li>{t.step1Desc}</li>
            <li>{t.step2Desc}</li>
            <li>{t.step3Desc}</li>
            <li>{t.step4Desc}</li>
          </ol>
        </section>

        <section className="premium-card">
          <h4 className="section-title"><i className="fa-solid fa-ticket" style={{ color: 'var(--primary-teal)', marginRight: '4px' }}></i> {t.kuponTitle}</h4>
          <div className="voucher-input-wrapper">
            <div className="voucher-field-group">
              <i className="fa-solid fa-tags voucher-input-icon"></i>
              <input type="text" value={inputVoucher} onChange={(e) => setInputVoucher(e.target.value)} placeholder={t.kuponPlaceholder} autoComplete="off" style={{ textTransform: 'uppercase' }} />
              <button type="button" className="btn-select-voucher-popup" onClick={bukaModalPilihVoucher}>
                {t.kuponPilihBtn} <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', marginLeft: '2px' }}></i>
              </button>
            </div>
            <button type="button" className="btn-apply-voucher" onClick={() => eksekusiValidasiVoucherCustomer()}>{t.kuponTerapkanBtn}</button>
          </div>
          {voucherStatusNotif.text && (
            <div id="notifikasiStatusVoucher" style={{ marginTop: '10px', fontSize: '11px', fontWeight: '600', color: voucherStatusNotif.color }}>
              {voucherStatusNotif.text}
            </div>
          )}
        </section>

        <section className="premium-card">
          <h4 className="section-title">{t.uploadTitle}</h4>
          <div className="upload-zone-wrapper" id="uploadZone" onClick={handleZoneWrapperClick}>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="file-hidden-input" 
              onChange={handleFileChangeTrigger}
              onClick={(e) => e.stopPropagation()}
            />
            
            {!imagePreviewUrl ? (
              <div className="upload-prompt" id="uploadPrompt">
                <i className="fa-solid fa-cloud-arrow-up upload-icon"></i>
                <h6>{t.uploadPromptH6}</h6>
                <p>{t.uploadPromptP}</p>
              </div>
            ) : (
              <div className="upload-preview-container" id="previewContainer" onClick={(e) => e.stopPropagation()}>
                <img src={imagePreviewUrl} id="imgPreview" alt="Bukti Transfer" />
                <button type="button" className="remove-img-btn" onClick={handleRemovePreviewImage}><i className="fa-solid fa-trash"></i> {t.uploadRemoveBtn}</button>
              </div>
            )}
          </div>
        </section>

        <p className="privacy-notice-text"><i className="fa-solid fa-lock"></i> {t.safeDataNotice}</p>
        
        <div className="page-bottom-copyright-footer">
          <p>©️ 2026 TRAVELIND Startup. v2.0.0</p>
        </div>
      </div>

      <div className="bottom-sticky-action-bar-wrapper">
        <div className="bottom-sticky-action-bar">
          <div className="price-display-left" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase' }}>{t.totalBayarLabel}</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-teal)' }}>Rp {grandTotalFinal.toLocaleString('id-ID')}</span>
          </div>
          
          <button type="button" id="btnConfirmPayment" className="btn-submit-payment" onClick={submitPaymentConfirmation} disabled={isSubmitting}>
            {isSubmitting ? (
              <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> {t.btnProcessing}</>
            ) : (
              <>{t.btnActionSubmit} <i className="fa-solid fa-chevron-right" style={{ fontSize: '12px', marginLeft: '6px' }}></i></>
            )}
          </button>
        </div>
        <p className="verification-notice-subtext">
          {t.verificationNotice}
        </p>
      </div>

      {isModalVoucherOpen && (
        <div className="modal-voucher-overlay active" onClick={() => setIsModalVoucherOpen(false)}>
          <div className="modal-voucher-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-voucher-header">
              <h5><i className="fa-solid fa-ticket" style={{ color: 'var(--primary-teal)' }}></i> {t.modalVoucherTitle}</h5>
              <button type="button" className="btn-close-voucher" onClick={() => setIsModalVoucherOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-voucher-body" id="daftarVoucherPopUpArea">
              {isFetchVoucherLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--primary-teal)', fontSize: '18px', marginBottom: '8px' }}></i>
                  <br />{t.voucherLoading}
                </div>
              ) : listVoucherCloud.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8c96a3', fontSize: '12px' }}>
                  <i className="fa-solid fa-ticket-simple" style={{ fontSize: '24px', marginBottom: '6px' }}></i>
                  <br />{t.voucherEmpty}
                </div>
              ) : (
                listVoucherCloud.map((v) => (
                  <div className="popup-promo-ticket-item" id={v.id} key={v.id}>
                    <div className="popup-ticket-info">
                      <h6>{v.kode_promo} (Potongan Rp {parseInt(v.nominal_potongan).toLocaleString('id-ID')})</h6>
                      <p>{v.judul} - {v.deskripsi}</p>
                      <span><i className="fa-solid fa-user-tag"></i> {v.tipe_promo === 'BARU' ? t.voucherKhususBaru : t.voucherSemuaUser}</span>
                    </div>
                    <div className="btn-use-popup-voucher" onClick={() => pilihKuponDariPopUp(v.kode_promo)}>{t.voucherGunakan}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isWarningModalOpen && (
        <div className="popup-container-overlay alert-fade-backdrop" onClick={() => setIsWarningModalOpen(false)}>
          <div className="luxury-alert-card alert-error-bounce" onClick={(e) => e.stopPropagation()}>
            <div className="luxury-icon-wrapper">
              <div className="luxury-pulse-ring"></div>
              <i className="fa-solid fa-triangle-exclamation luxury-alert-icon"></i>
            </div>
            <div className="luxury-alert-body alert-text-center">
              <h3 className="luxury-alert-title">{t.modalWarnTitle}</h3>
              <p className="luxury-alert-desc">{t.modalWarnDesc}</p>
            </div>
            <div className="luxury-alert-footer no-top-border">
              <button type="button" className="btn-luxury-dismiss" onClick={() => setIsWarningModalOpen(false)}>
                {t.modalWarnBtn}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PembayaranView;