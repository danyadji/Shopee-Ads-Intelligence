# Shopee Intel Collector (extension)

Extension Chrome Manifest V3. Membaca halaman Shopee yang Anda buka,
lalu mengirim datanya ke dashboard. Tidak mengeruk pencarian otomatis,
tidak berjalan di latar, hanya bekerja saat popup dibuka.

## Pasang

1. Buka `chrome://extensions`, aktifkan Developer mode.
2. Load unpacked, pilih folder `extension`.
3. Buka `http://localhost:3000` lewat `npm run dev` agar inbox aktif.

## Pakai

1. Buka halaman produk kompetitor di `shopee.co.id`.
2. Klik ikon extension. Periksa judul, harga, terjual, rating.
3. Tekan Kirim (dashboard harus jalan) atau Salin lalu Impor di section Kompetitor.
4. Di halaman pencarian, extension menampilkan sampai 10 kartu. Pilih satu untuk mengisi form.

## Batas

- Selektor mengikuti tampilan Shopee saat ini. Selalu periksa angka sebelum dikirim.
- Inbox tersimpan di `.data/inbox.json` lokal dan tidak ikut deploy.
- Patuhi ketentuan Shopee. Extension ini hanya membaca halaman yang Anda buka sendiri.
