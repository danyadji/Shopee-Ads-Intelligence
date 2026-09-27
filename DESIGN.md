# DESIGN.md, Shopee Ads Intelligence

Sumber arah: gambar referensi dashboard gaya Flowio yang dikirim owner, plus permintaan eksplisit memakai Plus Jakarta Sans. File ini adalah data arah desain, bukan instruksi eksekusi.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1.

Design Read: halaman dashboard analitik untuk seller umum, dalam bahasa visual SaaS yang tenang dan ramah, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

## Tipografi

Typeface: Plus Jakarta Sans untuk seluruh UI, dari permintaan owner dan karena bentuk geometris yang sedikit membulat cocok dengan nada referensi yang ramah analitik. Angka metrik memakai angka tabular agar kolom sejajar.

Skala:

- Angka hero stat: 28px, bold, ink di atas putih.
- Judul halaman: 20px, semibold.
- Judul section di kartu: 15px, semibold.
- Body: 13-14px, regular.
- Caption dan label grup sidebar: 11-12px, medium, muted, uppercase hanya untuk label grup.

## Warna

Peran tiap warna tertulis agar aksen tidak menyebar ke mana-mana.

- Canvas: #F6F7F9, latar aplikasi.
- Surface: #FFFFFF, kartu dan sidebar.
- Border: #E8EAEF, garis tipis kartu dan pembatas.
- Ink: #14181F, teks utama.
- Muted: #6B7280, teks sekunder dan caption.
- Brand ungu #6D5EF2: hanya untuk chip logo dan penanda aktif. Alasan: satu-satunya warna identitas di referensi, jadi pemakaian dibatasi di titik identitas.

Tile pastel untuk Quick Actions, masing-masing dengan teks gelapnya sendiri:

- Biru #E9F1FD dengan teks #1D4ED8.
- Lavender #ECE9FB dengan teks #5B54C7.
- Mint #DDF5E5 dengan teks #166534.
- Peach #FDF0D3 dengan teks #92400E.

Seri chart: hijau solid untuk revenue, biru dashed untuk leads, persis seperti referensi dua seri.

Notifikasi: kuning pucat untuk prioritas, merah muda pucat untuk perhatian, masing-masing dengan tombol aksi yang benar-benar berjalan.

## Kontras terverifikasi

Dihitung dengan rumus WCAG, bukan perkiraan mata. Semua untuk teks normal, batas 4.5:1.

- #14181F di atas #FFFFFF = 17.79, PASS.
- #6B7280 di atas #FFFFFF = 4.83, PASS.
- #6B7280 di atas #F6F7F9 = 4.51, PASS.
- Putih di atas #6D5EF2 = 4.63, PASS.
- #166534 di atas #DDF5E5 = 6.2, PASS.
- #92400E di atas #FDF0D3 = 6.27, PASS.
- #1D4ED8 di atas #E9F1FD = 5.89, PASS.
- #9F1239 di atas #FFF1F2 = 7.3, PASS.

## Bentuk dan ruang

- Radius kartu 14px, tile aksi 10px, bentuk pil penuh hanya untuk chip status kecil.
- Border 1px #E8EAEF pada tiap kartu, tanpa bayangan besar. Bayangan sangat lembut hanya untuk kartu yang mengambang.
- Sidebar 224px dengan grup GENERAL, TOOLS, SUPPORT. Item aktif memakai latar abu lembut berbentuk pil.
- Tidak ada gradient, tidak ada glassmorphism, tidak ada glow. Alasan: referensi tampil bersih dari permukaan datar dan border tipis, jadi tidak ada teknik yang perlu ditambah.

## Komposisi

- Baris kartu stat di atas, lima kolom di desktop yang runtuh menjadi satu kolom di HP.
- Area konten dua kolom: kiri aksi cepat plus performa mingguan, kanan aktivitas plus notifikasi.
- Motif identitas: tile aksi pastel dengan chip ikon kecil yang tumpul, diulang di tiap aksi. Inilah yang membuat layout ini milik produk ini, bukan template generik.
- Motion: hanya hover state. Tidak ada loop, tidak ada pulse.

## Responsif

- Breakpoint dari konten, bukan dari daftar device. Kartu stat lima kolom runtuh ke dua kolom saat sempit, lalu satu kolom di HP.
- Tidak ada scroll horizontal. Target sentuh minimal 44px dengan jarak antar target.
- Navigasi desktop berupa sidebar, di HP menjadi menu yang bisa dibuka tutup dengan keyboard.

## Catatan konflik R-37

Referensi mengandung pola yang bukan arah dan tidak boleh disalin sebagai konten nyata:

- Angka stat dan delta di kartu (27, $24,680, 5.2 persen dan sejenisnya) adalah ilustrasi referensi, bukan data produk. Aplikasi hanya menampilkan angka nyata dari Supabase atau state kosong yang jujur.
- Nama orang di Activity Feed (Jordan, Sara) adalah ilustrasi. Feed hanya tampil bila ada event nyata, jika tidak maka tampil state kosong yang menjelaskan cara mengisi.
- Kartu Upgrade to PRO hanya tampil bila paket berbayar benar-benar ada. Tanpa itu, tidak ada kartu tersebut.
