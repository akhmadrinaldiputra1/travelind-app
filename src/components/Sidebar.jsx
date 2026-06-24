import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ nama: 'Pengguna Setia', email: 'Akses riwayat perjalanan kamu', inisial: 'U' });

  useEffect(() => {
    const ambilSesiUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const emailUser = session.user.email;
          const namaUser = emailUser.split("@")[0].toUpperCase();
          setProfile({
            nama: namaUser,
            email: emailUser,
            inisial: namaUser.charAt(0)
          });
        }
      } catch (e) {
        console.warn("Sesi auth sidebar info clean.", e);
      }
    };
    ambilSesiUser();
  }, [isOpen]);

  const handleLinkProfilDirect = () => {
    localStorage.setItem('buka_tab_langsung', 'akun');
    onClose();
    navigate('/home'); // Sesuai logika tab internal index.html Anda nanti
  };

  return (
    <>
      {/* Overlay Gelap Latar Belakang */}
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onClose}></div>
      
      {/* Kontainer Utama Menu */}
      <nav className={`sidebar-menu ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title"><i className="fa-solid fa-layer-group"></i> Menu Navigasi</span>
          <button type="button" className="close-sidebar-btn" onClick={onClose} aria-label="Tutup Menu">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="sidebar-profile-card">
          <div className="avatar-circle">{profile.inisial}</div>
          <div className="profile-card-text">
            <h6>{profile.nama}</h6>
            <p>{profile.email}</p>
          </div>
        </div>
        
        <div className="sidebar-content">
          <Link to="/home" className="menu-item" onClick={onClose}>
            <i className="fa-solid fa-house"></i> Beranda Utama
          </Link>
          <div className="menu-item" onClick={handleLinkProfilDirect} style={{ cursor: 'pointer' }}>
            <i className="fa-solid fa-circle-user"></i> Akun Saya
          </div>
          <Link to="/cek-tiket" className="menu-item" onClick={onClose}>
            <i className="fa-solid fa-ticket-simple"></i> Pesanan Saya
          </Link>
          <Link to="/promo" className="menu-item" onClick={onClose}>
            <i className="fa-solid fa-tags"></i> Promo Spesial
          </Link>
          <div className="menu-divider"></div>
          <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="menu-item">
            <i className="fa-solid fa-headset"></i> Pusat Bantuan
          </a>
        </div>
      </nav>
    </>
  );
};

export default Sidebar;