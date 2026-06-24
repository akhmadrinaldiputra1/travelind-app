import { useState } from 'react';

export const useSumateraGeocoding = () => {
  const [isLoading, setIsLoading] = useState(false);

  const DEFAULT_LAT_SUMATERA = -0.9471;
  const DEFAULT_LNG_SUMATERA = 100.4172;

  const dapatkanKoordinatKota = async (namaKota) => {
    if (!namaKota) return null;
    setIsLoading(true);

    try {
      const cekNamaLower = namaKota.toLowerCase();
      
      // 🌟 [BYPASS MUTLAK MUKO-MUKO] Duplikasi dari kodingan handal halaman3.js Anda
      if (cekNamaLower.includes("muko")) {
        console.log("🚀 [REACT BYPASS] Kunci koordinat otomatis ke Mukomuko, Bengkulu!");
        setIsLoading(false);
        return { lat: -2.5833, lng: 101.1167 };
      }

      // Bersihkan singkatan kaku wilayah Sumatera
      const kotaBersih = namaKota
        .replace(/Kab\./gi, '')       
        .replace(/Kabupaten/gi, '')   
        .replace(/Kota/gi, '')        
        .replace(/-/g, ' ')           
        .trim();                      

      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(kotaBersih + ", Indonesia")}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setIsLoading(false);
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
      
      // Fallback Sekunder
      const resFallback = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(kotaBersih)}&limit=1`);
      const dataFallback = await resFallback.json();
      if (dataFallback && dataFallback.length > 0) {
        setIsLoading(false);
        return { lat: parseFloat(dataFallback[0].lat), lng: parseFloat(dataFallback[0].lon) };
      }

    } catch (error) {
      console.warn("Gagal geocoding presisi kota:", namaKota, error);
    }

    setIsLoading(false);
    return { lat: DEFAULT_LAT_SUMATERA, lng: DEFAULT_LNG_SUMATERA };
  };

  return { dapatkanKoordinatKota, isLoading };
};