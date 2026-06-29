import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { supabase } from '../config/supabaseClient'; // Pastikan path client supabase kamu benar
import '../styles/coinSaya.css';

const CoinSayaView = () => {
  const navigate = useNavigate();
  const { user, bahasaGlobal, checkUser } = useAuthStore();

  const [saldoCoin, setSaldoCoin] = useState(0);
  const [riwayatCoin, setRiwayatCoin] = useState([]);
  const [loadingFetch, setLoadingFetch] = useState(true);

  // Fungsi mengambil koin real-time dari tabel profiles Supabase
  const fetchUserCoins = async () => {
    if (!user) return;
    try {
      setLoadingFetch(true);
      
      // Ambil data terbaru dari tabel profiles berdasarkan ID user login
      const { data, error } = await supabase
        .from('profiles')
        .select('coins')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setSaldoCoin(data.coins || 0);
      }
    } catch (err) {
      console.error('Gagal mengambil data koin:', err.message);
      // Fallback ke user_metadata jika profile belum sinkron
      setSaldoCoin(user.user_metadata?.coins || 0);
    } finally {
      setLoadingFetch(false);
    }
  };

  useEffect(() => {
    fetchUserCoins();
    
    // Simulasi riwayat transaksi koin (Bisa disesuaikan jika nanti kamu membuat tabel 'coin_transactions')
    setRiwayatCoin([
      { id: 1, tipe: 'in', jumlah: 200, judul: 'Bonus Pengguna Baru', tanggal: 'Baru Saja', deskripsi: 'Selamat datang di Travelind! Nikmati bonus koin pertamamu.' }
    ]);
  }, [user]);

  const t = {
    ID: {
      title: 'Coin Saya',
      cardTitle: 'Total Saldo Coin',
      btnTukar: 'Tukar Voucher',
      secTitle: 'Riwayat Transaksi',
      emptyTitle: 'Belum Ada Transaksi',
      emptyDesc: 'Kumpulkan Coin dari setiap perjalanan kamu di TRAVELIND dan nikmati potongan harganya!',
      txtMasuk: 'Coin Masuk',
      txtKeluar: 'Coin Digunakan',
      loadingTxt: 'Memuat Saldo...'
    },
    EN: {
      title: 'My Coins',
      cardTitle: 'Total Coin Balance',
      btnTukar: 'Redeem Voucher',
      secTitle: 'Transaction History',
      emptyTitle: 'No Transactions Yet',
      emptyDesc: 'Collect Coins from your every journey on TRAVELIND and enjoy premium discounts!',
      txtMasuk: 'Coins Received',
      txtKeluar: 'Coins Used',
      loadingTxt: 'Loading Balance...'
    }
  }[bahasaGlobal || 'ID'];

  return (
    <div className="travelind-luxury-coin-container">
      
      {/* HEADER NAVY FIXED */}
      <header className="coin-top-bar">
        <button type="button" className="back-action-btn" onClick={() => navigate('/profil')} title="Kembali">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
        </button>
        <h2 className="coin-page-title">{t.title}</h2>
        <div style={{ width: '40px' }}></div>
      </header>

      {/* INTERNAL SCROLLER */}
      <div className="coin-main-content">
        
        {/* LUXURY GOLDEN PREMIUM CARD DISPLAY */}
        <div className="luxury-golden-card-balance">
          <div className="gold-card-bg-glow"></div>
          <div className="gold-card-header-row">
            <span className="gold-card-label-title">{t.cardTitle}</span>
            <div className="gold-brand-chip-logo">T-COIN</div>
          </div>
          
          <div className="gold-card-amount-wrapper">
            <div className="gold-coin-icon-geometric">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.214.165c2.193 1.69 5.378 1.69 7.572 0L17 15.182m-8.571-5.118L9 9.899c2.193-1.69 5.378-1.69 7.572 0l.214.165m-8.572 2.51h7.572"/>
              </svg>
            </div>
            <h1 className="gold-balance-text">
              {loadingFetch ? t.loadingTxt : saldoCoin.toLocaleString('id-ID')}
            </h1>
          </div>

          <button type="button" className="btn-redeem-gold-capsule" onClick={() => navigate('/promo')}>
            {t.btnTukar}
          </button>
        </div>

        {/* RIWAYAT TRANSAKSI SECTION */}
        <div className="coin-history-section-wrapper">
          <h3 className="coin-history-section-title">{t.secTitle}</h3>
          
          {!user || riwayatCoin.length === 0 ? (
            <div className="coin-empty-state-card">
              <div className="empty-state-icon-box">
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98c.834 0 1.584-.46 1.953-1.187l.833-1.667a2.25 2.25 0 011.953-1.187h3.86M2.25 13.5l1.05-4.2A2.25 2.25 0 015.483 7.5h13.034a2.25 2.25 0 012.183 1.8l1.05 4.2M2.25 13.5v6.75A2.25 2.25 0 004.5 22.5h15a2.25 2.25 0 002.25-2.25V13.5M9 11.25v1.5M12 9.75v3M15 11.25v1.5"/>
                </svg>
              </div>
              <h4>{t.emptyTitle}</h4>
              <p>{t.emptyDesc}</p>
            </div>
          ) : (
            <div className="coin-ledger-list-gap">
              {riwayatCoin.map((item) => (
                <div key={item.id} className="coin-ledger-row-card">
                  <div className="ledger-card-left-block">
                    <div className={`ledger-type-badge-icon ${item.tipe === 'in' ? 'node-income' : 'node-expense'}`}>
                      {item.tipe === 'in' ? (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"/>
                        </svg>
                      )}
                    </div>
                    <div className="ledger-meta-details">
                      <h4 className="ledger-item-title">{item.judul}</h4>
                      <span className="ledger-item-date">{item.tanggal} · <small>{item.tipe === 'in' ? t.txtMasuk : t.txtKeluar}</small></span>
                      <p className="ledger-item-desc">{item.deskripsi}</p>
                    </div>
                  </div>
                  
                  <div className={`ledger-card-right-amount ${item.tipe === 'in' ? 'text-income' : 'text-expense'}`}>
                    {item.tipe === 'in' ? '+' : '-'}{item.jumlah.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default CoinSayaView;