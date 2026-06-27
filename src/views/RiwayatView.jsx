import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import useAuthStore from '../store/authStore';
import '../styles/profil.css'; 

const RiwayatView = () => {
  const navigate = useNavigate();
  
  // Ambil data sesi global dan bahasa dari Zustand
  const { user, isLoading: authLoading, bahasaGlobal } = useAuthStore();
  
  const [daftarRiwayat, setDaftarRiwayat] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    // 🛡️ LOADING GUARD: Tunggu Zustand memverifikasi sesi
    if (authLoading) return;

    // Jika user tidak login, kembalikan ke profil untuk memicu laci login popup
    if (!user) {
      navigate('/profil');
      return;
    }

    const muatDataTransaksiSukses = async () => {
      setIsLoadingData(true);
      try {
        const emailPenyaring = user.email.trim();
        // 🌟 KONDISI VALID SESUAI DENGAN LOGIKA SUCCESSVIEW.JSX
        const STATUS_VALID = ['Terkonfirmasi', 'Selesai'];

        // Ambil semua data dari tabel transaksi yang statusnya sudah valid (Lunas/Dikonfirmasi Admin)
        // Dan dicocokkan berdasarkan email penumpang aktif
        const { data, error } = await supabase
          .from('transaksi')
          .select('*')
          .ilike('email_penumpang', `%${emailPenyaring}%`)
          .in('status_pesanan', STATUS_VALID)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log("📡 Riwayat transaksi sukses tersinkronisasi:", data);
        setDaftarRiwayat(data || []);
      } catch (err) {
        console.error('Gagal memuat manifes riwayat:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    muatDataTransaksiSukses();
  }, [user, authLoading, navigate]);

  // Formatter Tanggal seperti di halaman sukses
  const formatTanggalIndo = (timestamp) => {
    if (!timestamp) return 'Baru Saja';
    const d = new Date(timestamp);
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  if (authLoading) {
    return (
      <div className="app-container app-profil-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '32px', color: 'var(--primary-teal)' }}></i>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Memuat Catatan Perjalanan...</p>
      </div>
    );
  }

  return (
    <div className="app-container app-profil-container">
      
      {/* CURVED HEADER */}
      <div className="profil-curved-header-bg" style={{ height: '90px' }}></div>
      
      <header className="profil-header-nav" style={{ padding: '16px' }}>
        <button className="back-btn" onClick={() => navigate('/profil')}>
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h2>{bahasaGlobal === 'ID' ? 'RIWAYAT PERJALANAN' : 'TRAVEL HISTORY'}</h2>
      </header>

      {/* LIST KARTU MANIFES RIWAYAT */}
      <main className="content-wrapper" style={{ padding: '20px', overflowY: 'auto', zIndex: 2, position: 'relative', marginTop: '10px', height: 'calc(100vh - 160px)', boxSizing: 'border-box' }}>
        <div className="history-list-housing">
          
          {isLoadingData && (
            <div className="loading-state-history" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '24px', color: 'var(--primary-teal)', marginBottom: '10px' }}></i>
              <p>{bahasaGlobal === 'ID' ? 'Sinkronisasi riwayat tiket...' : 'Synchronizing ticket history...'}</p>
            </div>
          )}

          {!isLoadingData && daftarRiwayat.length === 0 && (
            <div className="empty-state-history" style={{ padding: '50px 16px', textAlign: 'center' }}>
              <i className="fa-solid fa-receipt" style={{ fontSize: '44px', color: '#cbd5e0', marginBottom: '14px' }}></i>
              <h5 style={{ fontSize: '15px', fontWeight: '700', color: '#4a5568', margin: 0 }}>
                {bahasaGlobal === 'ID' ? 'Belum Ada Perjalanan' : 'No Travel History'}
              </h5>
              <p style={{ fontSize: '12px', color: '#8c96a3', marginTop: '6px', lineHeight: '1.5' }}>
                {bahasaGlobal === 'ID' 
                  ? 'Tiket perjalanan kamu yang sudah dikonfirmasi lunas oleh Admin akan otomatis tertera di sini.' 
                  : 'Your travel tickets confirmed as paid by Admin will automatically appear here.'}
              </p>
            </div>
          )}

          {!isLoadingData && daftarRiwayat.map((trx) => {
            // Pembuatan kode mockup 8 digit seperti di SuccessView
            const idMurniString = trx.id ? trx.id.toString().replace(/-/g, "") : "TEMP"; 
            const kodeTiketFix = `TRV-${idMurniString.substring(0, 8).toUpperCase()}`;

            return (
              <div key={trx.id} className="history-item-card" style={{ background: '#ffffff', borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid #edf2f7' }}>
                
                <div className="history-header-row" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #e2e8f0', paddingBottom: '10px', marginBottom: '12px' }}>
                  <span className="history-code" style={{ fontWeight: '700', color: 'var(--primary-teal)', fontSize: '13px' }}>{kodeTiketFix}</span>
                  <span className="history-date" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{formatTanggalIndo(trx.created_at)}</span>
                </div>
                
                <div className="history-body-row" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div className="history-icon-box" style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e6f2f5', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--primary-teal)' }}>
                    <i className="fa-solid fa-van-shuttle"></i>
                  </div>
                  <div className="history-route-info">
                    <div className="history-route-title" style={{ fontSize: '14px', fontWeight: '700', color: '#2d3748' }}>
                      {trx.nama_travel || 'Mitra TRAVELIND'}
                    </div>
                    <div className="history-travel-name" style={{ color: 'var(--primary-teal)', fontWeight: '700', fontSize: '13px', marginTop: '2px' }}>
                      {trx.pickup_kota} → {trx.tujuan_kota}
                    </div>
                  </div>
                </div>
                
                <div className="history-detail-sub-specs" style={{ margin: '12px 0', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#4a5568', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>📍 Alamat Jemput: <b style={{ color: '#2d3748' }}>{trx.pickup_alamat || '-'}</b></div>
                  <div>🏁 Alamat Antar: <b style={{ color: '#2d3748' }}>{trx.tujuan_alamat || '-'}</b></div>
                  <div>👥 Manifes Kursi: <b style={{ color: '#2d3748' }}>{trx.penumpang || '1'} Orang</b></div>
                </div>
                
                <div className="history-footer-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <div className="history-price" style={{ color: '#2d3748', fontSize: '15px', fontWeight: '800' }}>
                    Rp {(trx.total_bayar || trx.total_bayar_final || 0).toLocaleString('id-ID')}
                  </div>
                  <span className="badge-success-outline-pay" style={{ backgroundColor: '#e6f7ef', color: '#27ae60', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>
                    {trx.status_pesanan}
                  </span>
                </div>
                
              </div>
            );
          })}

        </div>
      </main>

      {/* STICKY BOTTOM NAVIGATION BAR */}
      <nav className="fixed-bottom-nav-profil">
        <button className="nav-link-item" onClick={() => navigate('/home')}>
          <i className="fa-solid fa-house"></i>
          <span>{bahasaGlobal === 'ID' ? 'Beranda' : 'Home'}</span>
        </button>
        <button className="nav-link-item" onClick={() => navigate('/cek-tiket')}>
          <i className="fa-solid fa-ticket"></i>
          <span>{bahasaGlobal === 'ID' ? 'Tiket Saya' : 'My Tickets'}</span>
        </button>
        <button className="nav-link-item active" onClick={() => navigate('/profil')}>
          <i className="fa-solid fa-user"></i>
          <span>{bahasaGlobal === 'ID' ? 'Profil' : 'Profile'}</span>
        </button>
      </nav>

    </div>
  );
};

export default RiwayatView;