import React, { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { z } from 'zod';
import DOMPurify from 'dompurify';

const LoginView = ({ initialMode = 'login', closePopup }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailAlert, setShowEmailAlert] = useState(false);
  
  // 🌟 STATE UNTUK TOMBOL MATA PASSWORD
  const [showPassword, setShowPassword] = useState(false);

 const handleSubmitAction = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setShowEmailAlert(false);

    // 1. Bersihkan Data Input dari Karakter Ilegal (Anti-XSS Injection)
    const emailClean = email.trim();
    const passwordClean = password;
    const fullNameClean = DOMPurify.sanitize(fullName.trim());

    // 2. Definisikan Aturan Skema Keamanan Menggunakan Zod
    const loginSchema = z.object({
      email: z.string().email({ message: "Format email resmi tidak valid." }),
      password: z.string().min(6, { message: "Kata sandi minimal harus terdiri dari 6 karakter." })
    });

    const registerSchema = z.object({
      fullName: z.string().min(3, { message: "Nama lengkap minimal harus terdiri dari 3 karakter." }),
      email: z.string().email({ message: "Format email resmi tidak valid." }),
      password: z.string().min(6, { message: "Kata sandi pendaftaran minimal harus 6 karakter demi keamanan." })
    });

    // 3. Eksekusi Validasi Sesuai Mode Auth
    const dataToValidate = mode === 'login' 
      ? { email: emailClean, password: passwordClean }
      : { fullName: fullNameClean, email: emailClean, password: passwordClean };

    const hasilValidasi = mode === 'login' 
      ? loginSchema.safeParse(dataToValidate)
      : registerSchema.safeParse(dataToValidate);

    if (!hasilValidasi.success) {
      setErrorMsg(hasilValidasi.error.errors[0].message);
      setIsLoading(false);
      return; // Stop eksekusi, blokir request ke Supabase Auth
    }

    // 4. Jalankan Alur Autentikasi Supabase Jika Lolos Sensor Keamanan
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailClean,
          password: passwordClean,
        });
        
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setShowEmailAlert(true);
            return;
          }
          if (error.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error("Email atau password kamu salah");
          }
          throw error;
        }

        if (closePopup) closePopup();
        window.location.reload(); 
        
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: emailClean,
          password: passwordClean,
          options: {
            data: {
              full_name: fullNameClean // Data nama yang masuk ke trigger database sudah 100% bersih
            },
            emailRedirectTo: window.location.origin + '/profil'
          }
        });

        if (error) throw error;

        if (data?.user && data.user.identities && data.user.identities.length === 0) {
          setErrorMsg('Email ini sudah terdaftar. Silakan gunakan menu masuk.');
        } else {
          setShowEmailAlert(true);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Operasi gagal, periksa kembali data input.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-content-pure-injector">
      {showEmailAlert ? (
        <div style={{ textAlign: 'center', padding: '20px 10px' }}>
          <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: '54px', color: 'var(--primary-teal)', marginBottom: '16px' }}></i>
          <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#2d3748', margin: '0 0 8px 0' }}>Pendaftaran Terkirim!</h4>
          <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: '1.6', margin: '0 0 24px 0' }}>
            <b>Silakan confirm di email kamu ya</b> untuk mengaktifkan akun TRAVELIND milikmu.
          </p>
          <button className="btn-login-primary" onClick={() => { setShowEmailAlert(false); if (closePopup) closePopup(); }}>
            Saya Mengerti
          </button>
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-teal)', margin: '0 0 6px 0', textAlign: 'center' }}>
            {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0 20px 0' }}>
            {mode === 'login' ? 'Masuk untuk mengakses layanan premium TRAVELIND' : 'Daftar sekarang dan nikmati perjalanan antar kota yang nyaman'}
          </p>

          {errorMsg && <div className="login-error-badge">{errorMsg}</div>}

          <form onSubmit={handleSubmitAction} className="login-form-group">
            {mode === 'register' && (
              <div className="input-field">
                <label>Nama Lengkap</label>
                <input 
                  type="text" 
                  placeholder="Masukkan Nama Anda" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required 
                />
              </div>
            )}

            <div className="input-field">
              <label>Email Resmi</label>
              <input 
                type="email" 
                placeholder="contoh@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <div className="input-field">
              <label>Kata Sandi (Password)</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: '46px' }} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#a0aec0',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  tabIndex="-1" 
                >
                  {showPassword ? (
                    <i className="fa-solid fa-eye-slash" style={{ color: 'var(--primary-teal)' }}></i>
                  ) : (
                    <i className="fa-solid fa-eye"></i>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login-primary" disabled={isLoading} style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              {isLoading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '16px' }}></i>
                  <span>Connecting...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Masuk Sekarang' : 'Daftar Akun Baru'}</span>
              )}
            </button>
          </form>

          <p style={{ fontSize: '13px', color: '#4a5568', marginTop: '24px', textAlign: 'center' }}>
            {mode === 'login' ? (
              <>
                Belum punya akun?{' '}
                <span style={{ color: 'var(--primary-teal)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setMode('register')}>
                  Daftar Sekarang
                </span>
              </>
            ) : (
              <>
                Sudah punya akun?{' '}
                <span style={{ color: 'var(--primary-teal)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setMode('login')}>
                  Masuk Sini
                </span>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
};

export default LoginView;