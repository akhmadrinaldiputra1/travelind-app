import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import splashVideo from '../assets/splash.mp4'; // Mengimpor video langsung dari src/assets
import '../styles/splash.css'; 

const SplashView = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Durasi video splash screen selama 4 detik sebelum oper ke beranda
    const timer = setTimeout(() => {
      navigate('/home'); 
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      {/* 🎬 Video Splash Screen Premium Full Screen */}
      <video 
        className="splash-video"
        autoPlay 
        muted 
        playsInline
      >
        <source src={splashVideo} type="video/mp4" />
        <h1 className="splash-fallback-title">TRAVELIND</h1>
      </video>
    </div>
  );
};

export default SplashView;