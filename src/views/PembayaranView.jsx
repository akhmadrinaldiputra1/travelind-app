import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import '../styles/pembayaran.css'; 

const PembayaranView = () => {
  const navigate = useNavigate();

  // ----------------==========================================================
  // ⚡️ LAYER STATE CONTROLLER
  // ----------------------------------------------------------------==========
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [userProfile, setUserProfile] = useState({ nama: 'Pengguna Setia', email: 'Akses riwayat perjalanan kamu', inisial: 'U' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

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

    const fetchUserSessionData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const emailUser = session.user.email;
          const namaUser = emailUser.split("@")[0].toUpperCase();
          setUserProfile({ nama: namaUser, email: emailUser, inisial: namaUser.charAt(0) });
        }
      } catch (e) { console.warn(e); }
    };
    fetchUserSessionData();

    return () => clearInterval(intervalCountdown);
  }, [navigate]);

  // --------------------------------------------------------------------------
  // 📄 VOUCHER ENGINE LOGIC
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

      const voucherTersedia = listVoucher.filter(v => !(v.sekali_pakai && v.sudah_dipakai));
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
    if (!kodeTarget) {
      return;
    }

    setVoucherStatusNotif({ text: '⏳ Memvalidasi kode kupon ke cloud...', color: '#4a5568' });

    try {
      const hariIni = new Date().toISOString().split('T')[0];
      const emailVal = localStorage.getItem("email_penumpang") || "anonim@guest.com";

      const { data: promoData, error } = await supabase
        .from("promo")
        .select("*")
        .eq("kode_promo", kodeTarget)
        .maybeSingle();

      if (error) throw error;
      if (!promoData) {
        setVoucherStatusNotif({ text: `❌ Kode kupon "${kodeTarget}" tidak terdaftar di sistem kami.`, color: '#e11d48' });
        resetDiskonVoucher(); return;
      }
      if (promoData.tanggal_kedaluwarsa < hariIni) {
        setVoucherStatusNotif({ text: `❌ Masa berlaku kupon "${kodeTarget}" sudah berakhir (Kedaluwarsa).`, color: '#e11d48' });
        resetDiskonVoucher(); return;
      }
      if (promoData.sekali_pakai && promoData.sudah_dipakai) {
        setVoucherStatusNotif({ text: `❌ Kupon sekali pakai ini sudah hangus diklaim.`, color: '#e11d48' });
        resetDiskonVoucher(); return;
      }
      if (promoData.tipe_promo === 'BARU') {
        const { data: historyTransaksi } = await supabase
          .from("transaksi")
          .select("*")
          .eq("email_penumpang", emailVal)
          .limit(1);

        if (historyTransaksi && historyTransaksi.length > 0) {
          setVoucherStatusNotif({ text: `❌ Kupon khusus pengguna baru. Anda sudah pernah melakukan transaksi.`, color: '#e11d48' });
          resetDiskonVoucher(); return;
        }
      }

      setNominalDiskonAktif(parseInt(promoData.nominal_potongan || 0));
      setIdVoucherTerpakai(promoData.id);
      setKodeVoucherTerpakai(promoData.kode_promo);
      setVoucherStatusNotif({ text: `🎉 Kupon "${kodeTarget}" BERHASIL diterapkan! Hemat Rp ${parseInt(promoData.nominal_potongan).toLocaleString('id-ID')}`, color: '#27ae60' });

    } catch (err) {
      setVoucherStatusNotif({ text: `❌ Terjadi kesalahan jaringan saat memvalidasi kupon.`, color: '#e11d48' });
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
        alert("Ukuran berkas melebihi batas maksimal 5MB!");
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
  // 🛡️ SUBMIT ENGINE (PEMANTIK DATA MANIFESTASI KE TABEL TRANSAKSI)
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
    const namaTravel = localStorage.getItem("travelNama") || "Armada Reguler";

    // 🌟 PEMANTIK OTOMATIS: Ambil data manifestasi dari lokal memori yang diisi oleh booking_temp
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

      if (storageError) {
        throw new Error("Gagal mengunggah foto.");
      }

      const { data: publicUrlData } = supabase.storage.from("bukti-transfer").getPublicUrl(namaFileUnik);
      const urlGambarBukti = publicUrlData.publicUrl;

      if (idVoucherTerpakai !== null) {
        await supabase.from("promo").update({ sudah_dipakai: true }).eq("id", idVoucherTerpakai);
      }

      // 🌟 INTEGRASI PEMANTIK: Menyimpan 3 kolom pelengkap langsung ke tabel transaksi resmi
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
            
            // Kolom baru hasil denormalisasi rujukan Anda (Pastikan kolom ini sudah ada di Supabase)
            penumpang: parseInt(jumlahPenumpangFix), 
            pickup_alamat: pickupAlamatFix,
            tujuan_alamat: tujuanAlamatFix
          }
        ]);

      if (dbError) {
        throw new Error("Gagal menyimpan catatan transaksi.");
      }

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
    <div className="app-container">
      <header className="main-header">
        <div className="header-left">
          <div className="back-btn" onClick={() => navigate(-1)} title="Kembali">
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <h2 className="page-title">Pembayaran</h2>
        </div>
        <button type="button" className="menu-btn" onClick={() => setIsSidebarOpen(true)} aria-label="Menu">
          <i className="fa-solid fa-bars-staggered"></i>
        </button>
      </header>

      <div className="progress-container">
        <div className="steps">
          <div className="step active"><i className="fa-solid fa-check"></i><span>Pencarian</span></div>
          <div className="step active"><i className="fa-solid fa-check"></i><span>Pilih Travel</span></div>
          <div className="step active"><i className="fa-solid fa-check"></i><span>Pemesanan</span></div>
          <div className="step current"><span className="step-num">4</span><span>Pembayaran</span></div>
        </div>
      </div>

      <main className="content-wrapper">
        <section className="premium-card checkout-header-card">
          <div className="total-payment-box">
            <span className="card-label">Total Pembayaran</span>
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
              <span>Selesaikan pembayaran sebelum <b id="timerDisplay">{countdownText}</b> WIB</span>
            </div>
          </div>
        </section>

        <section className="premium-card">
          <h4 className="section-title">Pilih Metode Pembayaran</h4>
          <div className="payment-options-list">
            <label className={`payment-option-item ${paymentMethod === 'BCA' ? 'active' : ''}`} htmlFor="methodBCA">
              <input type="radio" name="paymentMethod" id="methodBCA" value="BCA" checked={paymentMethod === 'BCA'} onChange={() => setPaymentMethod('BCA')} />
              <div className="option-details">
                <div className="option-icon-wrapper"><i className="fa-solid fa-bank"></i></div>
                <div className="option-text">
                  <h6>Transfer Bank</h6>
                  <p>Bayar melalui rekening bank resmi</p>
                </div>
              </div>
              <div className="custom-radio-circle"></div>
            </label>
            
            <label className={`payment-option-item ${paymentMethod === 'QRIS' ? 'active' : ''}`} htmlFor="methodQRIS">
              <input type="radio" name="paymentMethod" id="methodQRIS" value="QRIS" checked={paymentMethod === 'QRIS'} onChange={() => setPaymentMethod('QRIS')} />
              <div className="option-details">
                <div className="option-icon-wrapper"><i className="fa-solid fa-qrcode"></i></div>
                <div className="option-text">
                  <h6>QRIS</h6>
                  <p>Bayar dengan QRIS E-Wallet</p>
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
                  <span className="card-label">No. Rekening</span>
                  <h4>1234 5678 9010</h4>
                </div>
                <button type="button" className="copy-btn" onClick={() => navigator.clipboard.writeText('123456789010')}>
                  <i className="fa-regular fa-copy"></i> Salin
                </button>
              </div>
              <div className="rek-holder"><span className="card-label">Atas Nama</span><h5>Aldi Travelind</h5></div>
              <div className="info-alert-box"><i className="fa-solid fa-circle-info"></i><p>Pastikan nominal transfer sesuai dengan total pembayaran. Termasuk biaya admin jika ada.</p></div>
            </div>
          ) : (
            <div id="contentQRIS">
              <div className="qris-center-wrapper">
                <span className="qris-logo-text">QRIS Interaktif</span>
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TRAVELIND-STARTUP-DUMMY-PAYMENT" alt="QRIS Code" className="qris-image" />
                <p className="qris-instruction-text">Pindai QR di atas menggunakan aplikasi mobile banking Anda.</p>
              </div>
            </div>
          )}
        </section>

        <section className="premium-card">
          <h4 className="section-title">Cara Pembayaran</h4>
          <ol className="instruction-steps-list">
            <li>Lakukan transfer ke rekening di atas.</li>
            <li>Pastikan nominal yang ditransfer sudah sesuai.</li>
            <li>Setelah berhasil transfer, upload bukti pembayaran.</li>
            <li>Pesanan akan segera dikonfirmasi otomatis oleh sistem.</li>
          </ol>
        </section>

        <section className="premium-card">
          <h4 className="section-title"><i className="fa-solid fa-ticket" style={{ color: 'var(--primary-teal)', marginRight: '4px' }}></i> Kupon Promo Travel</h4>
          <div className="voucher-input-wrapper">
            <div className="voucher-field-group">
              <i className="fa-solid fa-tags voucher-input-icon"></i>
              <input type="text" value={inputVoucher} onChange={(e) => setInputVoucher(e.target.value)} placeholder="Masukkan kode promo Anda..." autoComplete="off" style={{ textTransform: 'uppercase' }} />
              <button type="button" className="btn-select-voucher-popup" onClick={bukaModalPilihVoucher}>
                Pilih <i className="fa-solid fa-chevron-down" style={{ fontSize: '10px', marginLeft: '2px' }}></i>
              </button>
            </div>
            <button type="button" className="btn-apply-voucher" onClick={() => eksekusiValidasiVoucherCustomer()}>Terapkan</button>
          </div>
          {voucherStatusNotif.text && (
            <div id="notifikasiStatusVoucher" style={{ marginTop: '10px', fontSize: '11px', fontWeight: '600', color: voucherStatusNotif.color }}>
              {voucherStatusNotif.text}
            </div>
          )}
        </section>

        <section className="premium-card">
          <h4 className="section-title">Upload Bukti Pembayaran</h4>
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
                <h6>Upload Bukti Transfer</h6>
                <p>Format: JPG, PNG (Maks. 5MB)</p>
              </div>
            ) : (
              <div className="upload-preview-container" id="previewContainer" onClick={(e) => e.stopPropagation()}>
                <img src={imagePreviewUrl} id="imgPreview" alt="Bukti Transfer" />
                <button type="button" className="remove-img-btn" onClick={handleRemovePreviewImage}><i className="fa-solid fa-trash"></i> Hapus Foto</button>
              </div>
            )}
          </div>
        </section>

        <p className="privacy-notice-text"><i className="fa-solid fa-lock"></i> Data Anda aman. Kami tidak menyimpan informasi rekening Anda.</p>
      </main>

      <div className="bottom-sticky-action-bar-wrapper">
        <div className="bottom-sticky-action-bar">
          <div className="price-display-left" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase' }}>Total Bayar</span>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary-teal)' }}>Rp {grandTotalFinal.toLocaleString('id-ID')}</span>
          </div>
          
          <button type="button" id="btnConfirmPayment" className="btn-submit-payment" onClick={submitPaymentConfirmation} disabled={isSubmitting}>
            {isSubmitting ? (
              <><i className="fa-solid fa-spinner fa-spin"></i> Memproses...</>
            ) : (
              <>Saya sudah bayar <i className="fa-solid fa-chevron-right" style={{ fontSize: '12px', marginLeft: '6px' }}></i></>
            )}
          </button>
        </div>
        <p className="verification-notice-subtext">
          Dengan klik tombol di atas, pembayaran diverifikasi oleh tim kami
        </p>
      </div>

      {isModalVoucherOpen && (
        <div className="modal-voucher-overlay active" onClick={() => setIsModalVoucherOpen(false)}>
          <div className="modal-voucher-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-voucher-header">
              <h5><i className="fa-solid fa-ticket" style={{ color: 'var(--primary-teal)' }}></i> Pilih Voucher Tersedia</h5>
              <button type="button" className="btn-close-voucher" onClick={() => setIsModalVoucherOpen(false)}><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="modal-voucher-body" id="daftarVoucherPopUpArea">
              {isFetchVoucherLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ color: 'var(--primary-teal)', fontSize: '18px', marginBottom: '8px' }}></i>
                  <br />Memanggil daftar voucher aktif...
                </div>
              ) : listVoucherCloud.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8c96a3', fontSize: '12px' }}>
                  <i className="fa-solid fa-ticket-simple" style={{ fontSize: '24px', marginBottom: '6px' }}></i>
                  <br />Tidak ada voucher promo yang tersedia saat ini.
                </div>
              ) : (
                listVoucherCloud.map((v) => (
                  <div className="popup-promo-ticket-item" id={v.id} key={v.id}>
                    <div className="popup-ticket-info">
                      <h6>{v.kode_promo} (Potongan Rp {parseInt(v.nominal_potongan).toLocaleString('id-ID')})</h6>
                      <p>{v.judul} - {v.deskripsi}</p>
                      <span><i className="fa-solid fa-user-tag"></i> {v.tipe_promo === 'BARU' ? 'Khusus Transaksi Pertama' : 'Semua Pengguna'}</span>
                    </div>
                    <div className="btn-use-popup-voucher" onClick={() => pilihKuponDariPopUp(v.kode_promo)}>Gunakan</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isWarningModalOpen && (
        <div className="modal-warning-overlay active" onClick={() => setIsWarningModalOpen(false)}>
          <div className="modal-warning-content" onClick={(e) => e.stopPropagation()}>
            <div className="warning-icon-animated">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h5>Bukti Transfer Kosong</h5>
            <p>Mohon unggah bukti foto transfer Anda terlebih dahulu sebelum menekan tombol konfirmasi pembayaran.</p>
            <button type="button" className="btn-dismiss-warning" onClick={() => setIsWarningModalOpen(false)}>
              Mengerti & Unggah Foto
            </button>
          </div>
        </div>
      )}

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <nav className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title"><i className="fa-solid fa-layer-group"></i> Menu Navigasi</span>
          <button type="button" className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}><i className="fa-solid fa-xmark"></i></button>
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

export default PembayaranView;