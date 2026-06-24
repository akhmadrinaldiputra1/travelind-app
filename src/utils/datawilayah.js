// ==========================================================================
// 🌟 TRAVELIND MASTER DATA: SELURUH KOTA & KABUPATEN SE-SUMATERA (FIXED)
// ==========================================================================
const dataWilayahSumatera = [
  // --- SUMATERA BARAT ---
  { nama: "Kota Padang", prov: "Sumatera Barat" }, { nama: "Kota Bukittinggi", prov: "Sumatera Barat" },
  { nama: "Kota Payakumbuh", prov: "Sumatera Barat" }, { nama: "Kota Pariaman", prov: "Sumatera Barat" },
  { nama: "Kota Solok", prov: "Sumatera Barat" }, { nama: "Kota Sawahlunto", prov: "Sumatera Barat" },
  { nama: "Kota Padang Panjang", prov: "Sumatera Barat" }, { nama: "Kab. Padang Pariaman", prov: "Sumatera Barat" },
  { nama: "Kab. Agam", prov: "Sumatera Barat" }, { nama: "Kab. Lima Puluh Kota", prov: "Sumatera Barat" },
  { nama: "Kab. Tanah Datar", prov: "Sumatera Barat" }, { nama: "Kab. Pasaman", prov: "Sumatera Barat" },
  { nama: "Kab. Pasaman Barat", prov: "Sumatera Barat" }, { nama: "Kab. Pesisir Selatan", prov: "Sumatera Barat" },
  { nama: "Kab. Solok", prov: "Sumatera Barat" }, { nama: "Kab. Solok Selatan", prov: "Sumatera Barat" },
  { nama: "Kab. Sijunjung", prov: "Sumatera Barat" }, { nama: "Kab. Dharmasraya", prov: "Sumatera Barat" },
  { nama: "Kab. Kepulauan Mentawai", prov: "Sumatera Barat" },

  // --- RIAU & KEPULAUAN RIAU ---
  { nama: "Kota Pekanbaru", prov: "Riau" }, { nama: "Kota Dumai", prov: "Riau" },
  { nama: "Kota Batam", prov: "Kepulauan Riau" }, { nama: "Kota Tanjungpinang", prov: "Kepulauan Riau" },
  { nama: "Kab. Kampar", prov: "Riau" }, { nama: "Kab. Bengkalis", prov: "Riau" },
  { nama: "Kab. Indragiri Hilir", prov: "Riau" }, { nama: "Kab. Indragiri Hulu", prov: "Riau" },
  { nama: "Kab. Pelalawan", prov: "Riau" }, { nama: "Kab. Rokan Hulu", prov: "Riau" },
  { nama: "Kab. Rokan Hilir", prov: "Riau" }, { nama: "Kab. Siak", prov: "Riau" },
  { nama: "Kab. Kuantan Singingi", prov: "Riau" }, { nama: "Kab. Kepulauan Meranti", prov: "Riau" },
  { nama: "Kab. Karimun", prov: "Kepulauan Riau" }, { nama: "Kab. Bintan", prov: "Kepulauan Riau" },
  { nama: "Kab. Natuna", prov: "Kepulauan Riau" }, { nama: "Kab. Lingga", prov: "Kepulauan Riau" },

  // --- SUMATERA UTARA ---
  { nama: "Kota Medan", prov: "Sumatera Utara" }, { nama: "Kota Binjai", prov: "Sumatera Utara" },
  { nama: "Kota Pematangsiantar", prov: "Sumatera Utara" }, { nama: "Kota Tebing Tinggi", prov: "Sumatera Utara" },
  { nama: "Kota Sibolga", prov: "Sumatera Utara" }, { nama: "Kota Tanjungbalai", prov: "Sumatera Utara" }, 
  { nama: "Kota Padangsidimpuan", prov: "Sumatera Utara" }, { nama: "Kota Gunungsitoli", prov: "Sumatera Utara" },
  { nama: "Kab. Deli Serdang", prov: "Sumatera Utara" }, { nama: "Kab. Langkat", prov: "Sumatera Utara" },
  { nama: "Kab. Karo", prov: "Sumatera Utara" }, { nama: "Kab. Simalungun", prov: "Sumatera Utara" },
  { nama: "Kab. Asahan", prov: "Sumatera Utara" }, { nama: "Kab. Labuhanbatu", prov: "Sumatera Utara" },
  { nama: "Kab. Tapanuli Utara", prov: "Sumatera Utara" }, { nama: "Kab. Tapanuli Tengah", prov: "Sumatera Utara" },
  { nama: "Kab. Tapanuli Selatan", prov: "Sumatera Utara" }, { nama: "Kab. Mandailing Natal", prov: "Sumatera Utara" },
  { nama: "Kab. Nias", prov: "Sumatera Utara" }, { nama: "Kab. Serdang Bedagai", prov: "Sumatera Utara" },
  { nama: "Kab. Batu Bara", prov: "Sumatera Utara" },

  // --- JAMBI & BENGKULU ---
  { nama: "Kota Jambi", prov: "Jambi" }, { nama: "Kota Sungai Penuh", prov: "Jambi" },
  { nama: "Kota Bengkulu", prov: "Bengkulu" }, { nama: "Kab. Muaro Jambi", prov: "Jambi" },
  { nama: "Kab. Bungo", prov: "Jambi" }, { nama: "Kab. Merangin", prov: "Jambi" },
  { nama: "Kab. Tebo", prov: "Jambi" }, { nama: "Kab. Sarolangun", prov: "Jambi" },
  { nama: "Kab. Kerinci", prov: "Jambi" }, { nama: "Kab. Batanghari", prov: "Jambi" },
  { nama: "Kab. Tanjung Jabung Barat", prov: "Jambi" }, { nama: "Kab. Tanjung Jabung Timur", prov: "Jambi" },
  { nama: "Kab. Rejang Lebong", prov: "Bengkulu" }, { nama: "Kab. Muko-Muko", prov: "Bengkulu" },

  // --- SUMATERA SELATAN, LAMPUNG & BANGKA BELITUNG ---
  { nama: "Kota Palembang", prov: "Sumatera Selatan" }, { nama: "Kota Lubuklinggau", prov: "Sumatera Selatan" },
  { nama: "Kota Pagar Alam", prov: "Sumatera Selatan" }, { nama: "Kota Prabumulih", prov: "Sumatera Selatan" },
  { nama: "Kota Bandar Lampung", prov: "Lampung" }, { nama: "Kota Metro", prov: "Lampung" },
  { nama: "Kota Pangkalpinang", prov: "Bangka Belitung" }, { nama: "Kab. Ogan Komering Ilir", prov: "Sumatera Selatan" },
  { nama: "Kab. Ogan Komering Ulu", prov: "Sumatera Selatan" }, { nama: "Kab. Muara Enim", prov: "Sumatera Selatan" },
  { nama: "Kab. Lahat", prov: "Sumatera Selatan" }, { nama: "Kab. Musi Banyuasin", prov: "Sumatera Selatan" },
  { nama: "Kab. Lampung Selatan", prov: "Lampung" }, { nama: "Kab. Lampung Tengah", prov: "Lampung" },
  { nama: "Kab. Lampung Utara", prov: "Lampung" }, { nama: "Kab. Bangka", prov: "Bangka Belitung" }, { nama: "Kab. Belitung", prov: "Bangka Belitung" },

  // --- ACEH ---
  { nama: "Kota Banda Aceh", prov: "Aceh" }, { nama: "Kota Lhokseumawe", prov: "Aceh" },
  { nama: "Kota Langsa", prov: "Aceh" }, { nama: "Kota Sabang", prov: "Aceh" },
  { nama: "Kota Subulussalam", prov: "Aceh" }, { nama: "Kab. Aceh Besar", prov: "Aceh" },
  { nama: "Kab. Aceh Utara", prov: "Aceh" }, { nama: "Kab. Aceh Timur", prov: "Aceh" },
  { nama: "Kab. Aceh Barat", prov: "Aceh" }, { nama: "Kab. Aceh Selatan", prov: "Aceh" },
  { nama: "Kab. Pidie", prov: "Aceh" }, { nama: "Kab. Bireuen", prov: "Aceh" },
  { nama: "Kab. Aceh Tengah", prov: "Aceh" }, { nama: "Kab. Aceh Tenggara", prov: "Aceh" }
];

export default dataWilayahSumatera;