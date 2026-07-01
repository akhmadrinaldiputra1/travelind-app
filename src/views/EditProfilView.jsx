import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
// Impor client supabase kamu (sesuaikan path impor ini dengan proyekmu)
import { supabase } from '../config/supabaseClient'; 
import '../styles/editProfil.css';
import { z } from 'zod';
import DOMPurify from 'dompurify';

const EditProfilView = () => {
  const navigate = useNavigate();
  const { user, bahasaGlobal, checkUser } = useAuthStore();
  const fileInputRef = useRef(null);

  // State Form Biodata & Foto
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nomorTelepon, setNomorTelepon] = useState('');
  const [alamatEmail, setAlamatEmail] = useState('');
  const [previewFoto, setPreviewFoto] = useState(null);
  const [fileFoto, setFileFoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (user) {
      setNamaLengkap(user?.user_metadata?.full_name || '');
      setAlamatEmail(user?.email || '');
      setNomorTelepon(user?.user_metadata?.phone || '');
      setPreviewFoto(user?.user_metadata?.avatar_url || null);
    }
  }, [user]);

  const t = {
    ID: { title: 'Edit Profil', btnSimpan: 'Simpan', subFoto: 'Ketuk foto untuk mengubah', secTitle: 'Data Pribadi', secSub: 'Informasi dasar akun kamu', lblNama: 'NAMA LENGKAP', lblPhone: 'NOMOR TELEPON / WHATSAPP', lblEmail: 'ALAMAT EMAIL RESMI', phNama: 'Masukkan nama lengkap...', phPhone: 'Contoh: 081234567890', loadingTxt: 'Menyimpan...', suksesTxt: '🎉 Profil berhasil diperbarui!' },
    EN: { title: 'Edit Profile', btnSimpan: 'Save', subFoto: 'Tap photo to change', secTitle: 'Personal Data', secSub: 'Basic account information', lblNama: 'FULL NAME', lblPhone: 'PHONE NUMBER / WHATSAPP', lblEmail: 'OFFICIAL EMAIL ADDRESS', phNama: 'Enter full name...', phPhone: 'Example: 081234567890', loadingTxt: 'Saving...', suksesTxt: '🎉 Profile updated successfully!' }
  }[bahasaGlobal || 'ID'];

  // Ambil inisial huruf pertama nama user
  const inisialNama = namaLengkap ? namaLengkap.charAt(0).toUpperCase() : 'U';

  const handleGantiFoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Batasi ukuran file maksimal 5MB agar hemat bandwidth storage
      if (file.size > 5 * 1024 * 1024) {
        alert(bahasaGlobal === 'ID' ? '❌ Ukuran foto melebihi batas maksimal 5MB!' : '❌ File size exceeds maximum limit of 5MB!');
        return;
      }
      setFileFoto(file);
      setPreviewFoto(URL.createObjectURL(file));
    }
  };

const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');

    // 1. Sanitasi dan Pembersihan Input Teks (Anti-XSS Injection)
    const namaClean = DOMPurify.sanitize(namaLengkap.trim());
    const phoneClean = nomorTelepon.replace(/[^0-9]/g, ''); // Hanya izinkan angka desimal murni

    // 2. Definisikan Skema Validasi Menggunakan Zod
    const profileSchema = z.object({
      nama: z.string().min(3, { message: bahasaGlobal === 'ID' ? "❌ Nama lengkap minimal harus 3 karakter." : "❌ Full name must be at least 3 characters." }),
      phone: z.string().min(10, { message: bahasaGlobal === 'ID' ? "❌ Nomor telepon minimal harus 10 digit angka murni." : "❌ Phone number must be at least 10 digits." }).max(15, { message: "❌ Maksimal 15 digit." })
    });

    const hasilValidasi = profileSchema.safeParse({
      nama: namaClean,
      phone: phoneClean
    });

    if (!hasilValidasi.success) {
      setStatusMsg(hasilValidasi.error.errors[0].message);
      setLoading(false);
      return; // Stop mutasi data jika melanggar skema
    }

    try {
      let finalAvatarUrl = previewFoto;

      // 3. Jika user mendeteksi ada file baru yang dipilih
      if (fileFoto) {
        const fileExt = fileFoto.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data: sessionData } = await supabase.auth.getSession();
        const tokenAman = sessionData?.session?.access_token;

        if (!tokenAman) {
          throw new Error("Sesi login kamu kedaluwarsa. Silakan keluar lalu masuk akun kembali.");
        }

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, fileFoto, { 
            cacheControl: '0', 
            upsert: true,
            headers: {
              Authorization: `Bearer ${tokenAman}`
            }
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        if (!data || !data.publicUrl) {
          throw new Error("Gagal mendapatkan Public URL dari Storage.");
        }

        finalAvatarUrl = `${data.publicUrl}?t=${Date.now()}`;
      }

      // 4. Update user_metadata akun di Supabase Auth dengan data ter-sanitasi
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: namaClean,
          phone: phoneClean,
          avatar_url: finalAvatarUrl
        }
      });

      if (updateError) throw updateError;

      if (typeof checkUser === 'function') {
        await checkUser();
      }

      setStatusMsg(t.suksesTxt);
      
      setTimeout(() => {
        setStatusMsg('');
        navigate('/profil');
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setStatusMsg(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="travelind-luxury-edit-profile-container">
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* HEADER DENGAN TOMBOL SIMPAN DI ATAS (SESUAI GAMBAR) */}
        <header className="edit-profile-top-bar">
          <button type="button" className="back-action-btn" onClick={() => navigate('/profil')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
          </button>
          <h2 className="edit-profile-page-title">{t.title}</h2>
          <button type="submit" className="btn-save-capsule-top" disabled={loading}>
            {loading ? t.loadingTxt : t.btnSimpan}
          </button>
        </header>

        {/* AREA VISUAL NAVY BACKGROUND EXTENDED */}
        <div className="edit-profile-hero-badge-section">
          <input type="file" ref={fileInputRef} onChange={handleGantiFoto} accept="image/*" style={{ display: 'none' }} />
          
          <div className="avatar-squircle-container" onClick={() => fileInputRef.current.click()}>
            <div className="avatar-squircle-frame">
              {previewFoto ? (
                <img src={previewFoto} alt="Avatar" />
              ) : (
                <div className="avatar-initials-fallback">{inisialNama}</div>
              )}
            </div>
            <div className="floating-camera-badge">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 1110 8.625t-3.173-2.45zm0 0a2.31 2.31 0 00-3.173 2.45l-.022.022a7.417 7.417 0 001.258 1.258l.022-.022A2.31 2.31 0 006.827 6.175zM15.75 12c0 .181-.038.354-.108.511a1.688 1.688 0 01-1.144 1.144c-.157.07-.33.108-.511.108H4.5c-.181 0-.354-.038-.511-.108a1.688 1.688 0 01-1.144-1.144A1.688 1.688 0 012.736 12h13.014zM21 12c0 1.657-1.343 3-3 3H4.5C2.843 15 1.5 13.657 1.5 12V9c0-1.657 1.343-3 3-3h1.303c.53 0 1.033-.21 1.408-.586l1.076-1.076C8.663 3.962 9.166 3.75 9.697 3.75h4.606c.53 0 1.034.212 1.409.587l1.076 1.076c.375.375.877.587 1.408.587H19.5c1.657 0 3 1.343 3 3v3z" />
              </svg>
            </div>
          </div>
          <h3 className="avatar-text-display-name">{namaLengkap || 'Traveler'}</h3>
          <p className="avatar-text-action-hint">{t.subFoto}</p>
        </div>

        {/* SCROLLER KONTEN PUTIH DI BAWAH */}
        <div className="edit-profile-main-content">
          
          {statusMsg && (
            <div className={`status-message-alert ${statusMsg.startsWith('❌') ? 'err-node' : ''}`}>
              {statusMsg}
            </div>
          )}

          <div className="edit-profile-card-form">
            
            {/* SUB-HEADER DATA PRIBADI (SESUAI GAMBAR) */}
            <div className="section-form-sub-header">
              <div className="sub-header-icon-box">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
              </div>
              <div className="sub-header-text-block">
                <h4>{t.secTitle}</h4>
                <p>{t.secSub}</p>
              </div>
            </div>

            <hr className="form-divider-line" />

            {/* FIELD INPUT NAMA LENGKAP */}
            <div className="edit-profile-form-group">
              <label htmlFor="input-nama-lengkap">{t.lblNama} <span style={{ color: 'var(--coral)' }}>*</span></label>
              <div className="input-with-icon-wrapper">
                <svg className="input-leading-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                </svg>
                <input id="input-nama-lengkap" type="text" value={namaLengkap} onChange={(e) => setNamaLengkap(e.target.value)} placeholder={t.phNama} required />
                {namaLengkap.length > 2 && (
                  <svg className="input-trailing-success-icon" width="16" height="16" fill="none" stroke="#00D4B8" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                )}
              </div>
            </div>

            {/* FIELD INPUT PHONE */}
            <div className="edit-profile-form-group">
              <label htmlFor="input-nomor-telepon">{t.lblPhone}</label>
              <div className="input-with-icon-wrapper">
                <svg className="input-leading-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-7.305 7.305m0 0l-3.75-3.75M15 4.5h6m0 0v6m0-6L14.25 11.25"/>
                </svg>
                <input id="input-nomor-telepon" type="tel" value={nomorTelepon} onChange={(e) => setNomorTelepon(e.target.value)} placeholder={t.phPhone} />
              </div>
            </div>

            {/* FIELD INPUT EMAIL (READ ONLY) */}
            <div className="edit-profile-form-group disabled-node-style">
              <label htmlFor="input-alamat-email">{t.lblEmail}</label>
              <div className="input-with-icon-wrapper">
                <svg className="input-leading-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/>
                </svg>
                <input id="input-alamat-email" type="email" value={alamatEmail} disabled title={t.phEmailDisabled} />
              </div>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProfilView;