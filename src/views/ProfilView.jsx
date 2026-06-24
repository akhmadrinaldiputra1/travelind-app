import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import '../styles/profil.css'; 

const ProfilView = () => {
  const navigate = useNavigate();

  // State dasar untuk menyimpan data user dan riwayat
  const [userMeta, setUserMeta] = useState({ nama: '', email: '' });
  const [daftarRiwayat, setDaftarRiwayat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    // 1. Ambil data identitas user dari local storage browser
    const emailSesi = localStorage.getItem("email_penumpang") || "";
    const namaSesi = localStorage.getItem("nama_penumpang") || "Penumpang TRAVELIND";

    if (!emailSesi) {
      setIsLoading(false);
      setUserMeta({ nama: 'Belum Masuk', email: 'Silakan isi identitas di form order' });
      return; 
    }

    setUserMeta({ nama: namaSesi, email: emailSesi });

    // 2. Tarik data transaksi yang benar-benar SUDAH DIKONFIRMASI oleh Admin
    const muatRiwayatLunas = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
        const emailTarget = emailSesi.trim();

        // Kueri Supabase: Ambil dari tabel 'transaksi', COCOKKAN email,
        // dan FILTER hanya status yang sah dari admin (Terkonfirmasi / Sudah Dikonfirmasi / Selesai)
        const { data: dataTransaksi, error: errorTrx } = await supabase
          .from("transaksi")
          .select("*")
          .eq("email_penumpang", emailTarget)
          .in("status_pesanan", ["Terkonfirmasi", "Sudah Dikonfirmasi", "Selesai"])
          .order("created_at", { ascending: false });

        if (errorTrx) throw errorTrx;

        setDaftarRiwayat(dataTransaksi || []);

      } catch (err) {
        console.error("Gagal memuat riwayat lunas:", err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    muatRiwayatLunas();
  }, [navigate]);

  // Fungsi pembantu format tanggal Indonesia
  const formatTanggalIndo = (timestamp) => {
    if (!timestamp) return "Baru Saja";
    const opsi = { day: 'numeric', month: 'short', year: 'numeric' };
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? timestamp : d.toLocaleDateString('id-ID', opsi);
  };

  return (
    <div className="app-container app-profil-container">
      
      {/* HEADER ATAS */}
      <header className="main-header profil-isolated-header">
        <div className="header-left">
          <div className="back-btn" onClick={() => navigate('/home')}>
            <i className="fa-solid fa-arrow-left"></i>
          </div>
          <h2 className="page-title">Profil Akun</h2>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="content-wrapper" style={{ overflowY: 'auto' }}>
        
        {/* KARTU PROFIL USER */}
        <section className="premium-card profile-user-card">
          <div className="user-avatar-housing">
            <img src="https://cdn-icons-png.flaticon.com/512/3177/3177440.png" alt="Avatar" />
          </div>
          <div className="user-meta-strings">
            <h4>{userMeta.nama}</h4>
            <p>{userMeta.email}</p>
            <span className="badge-member-status"><i className="fa-solid fa-medal"></i> Penumpang Setia</span>
          </div>
        </section>

        {/* JUDUL SEKSI RIWAYAT */}
        <div className="section-divider-title">
          <h5><i className="fa-solid fa-circle-check" style={{ color: '#27ae60' }}></i> Riwayat Perjalanan Sukses</h5>
        </div>

        {/* DAFTAR KARTU RIWAYAT */}
        <div className="history-list-housing">
          
          {isLoading && (
            <div className="loading-state-history">
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              <p>Memeriksa data riwayat perjalanan...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="empty-state-history" style={{ color: '#eb5757' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <p>Gagal mengambil data dari server.</p>
            </div>
          )}

          {/* JIKA BELUM ADA YANG DIKONFIRMASI ADMIN (Skenario Utama Kamu) */}
          {!isLoading && !isError && daftarRiwayat.length === 0 && (
            <div className="empty-state-history">
              <i className="fa-solid fa-receipt" style={{ fontSize: '28px', marginBottom: '8px', color: '#b0bac5' }}></i>
              <p>Tidak ada riwayat perjalanan aktif.<br />
                <span style={{ fontSize: '11px', color: '#8c96a3' }}>
                  Pesanan yang belum dikonfirmasi oleh admin tidak akan muncul di sini. Silakan pantau status di menu <b>Cek Tiket</b>.
                </span>
              </p>
            </div>
          )}

          {/* LOOPING DATA JIKA SUDAH DIKONFIRMASI ADMIN */}
          {!isLoading && !isError && daftarRiwayat.map((transaksi) => {
            // Mengambil murni 8 digit awal dari kolom "id" (Primary Key Tabel Transaksi)
            const idMurni = String(transaksi.id || '');
            const idBersih = idMurni.replace(/[^a-zA-Z0-9]/g, '');
            const kodeTiketFix = `TRV-${idBersih.substring(0, 8).toUpperCase()}`;

            return (
              <div key={transaksi.id} className="history-item-card">
                <div className="history-header-row">
                  <span className="history-code">{kodeTiketFix}</span>
                  <span className="history-date">{formatTanggalIndo(transaksi.created_at)}</span>
                </div>
                
                <div className="history-body-row">
                  <div className="history-icon-box" style={{ background: '#e6f4ea', color: '#137333' }}>
                    <i className="fa-solid fa-van-shuttle"></i>
                  </div>
                  <div className="history-route-info">
                    <div className="history-route-title">Perjalanan Antar Kota</div>
                    <div className="history-travel-name">{transaksi.nama_travel || 'Armada TRAVELIND'}</div>
                  </div>
                </div>

                {/* AREA DETAIL DATA PENUMPANG DAN ALAMAT ASLI DARI TABEL TRANSAKSI */}
                <div className="history-detail-sub-specs" style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#4a5568', margin: '8px 0', border: '1px solid #edf2f7', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div><i className="fa-solid fa-users" style={{ width: '18px', color: '#02596b' }}></i> Jumlah Penumpang: <b>{transaksi.penumpang || '1'} Orang</b></div>
                  <div><i className="fa-solid fa-location-dot" style={{ width: '18px', color: '#eb5757' }}></i> Titik Jemput: <span style={{ fontSize: '11px' }}>{transaksi.pickup_alamat || '-'}</span></div>
                  <div><i className="fa-solid fa-route" style={{ width: '18px', color: '#27ae60' }}></i> Titik Antar: <span style={{ fontSize: '11px' }}>{transaksi.tujuan_alamat || '-'}</span></div>
                </div>
                
                <div className="history-footer-row">
                  <div className="history-price">
                    Rp {(transaksi.total_bayar || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="badge-history-status status-success">
                    Terkonfirmasi
                  </span>
                </div>
              </div>
            );
          })}

        </div>

        {/* TOMBOL LOGOUT UNTUK BERSIHKAN SESI */}
        <button type="button" className="btn-logout-danger" onClick={() => { localStorage.clear(); navigate('/home'); }}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i> Keluar dari Sesi Akun
        </button>

      </main>

      {/* NAVIGASI BAWAH */}
      <nav className="bottom-nav-bar">
        <div className="nav-item" onClick={() => navigate('/home')}>
          <i className="fa-solid fa-house"></i>
          <span>Beranda</span>
        </div>
        <div className="nav-item" onClick={() => navigate('/cek-tiket')}>
          <i className="fa-solid fa-ticket"></i>
          <span>Cek Tiket</span>
        </div>
        <div className="nav-item active">
          <i className="fa-solid fa-user"></i>
          <span>Akun</span>
        </div>
      </nav>

    </div>
  );
};

export default ProfilView;