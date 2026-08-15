# Deploy Gratis Invitalab

Versi ini sudah disatukan menjadi **satu website** agar desain dan navigasi tidak berpindah ke versi lama.

Struktur penting:

- `index.html` — landing page utama;
- `katalog/` — katalog, Cara Order, dan 10 preview tema;
- `img/`, `site.css`, dan `site.js` — aset landing;
- `rsvp-worker/` — backend RSVP opsional yang dideploy terpisah.

Jangan hanya mengunggah folder `landing` atau `katalog`. Upload/deploy folder `Invitalab-Website` sebagai root website.

## 1. Deploy frontend ke Cloudflare Pages

Jika memakai Direct Upload:

1. buka Cloudflare Dashboard;
2. masuk ke **Workers & Pages**;
3. pilih **Create application** → **Pages** → **Upload assets**;
4. unggah seluruh isi folder `Invitalab-Website` atau ZIP versi final;
5. tunggu deployment selesai;
6. hubungkan domain `invitation.avilab.my.id`.

Jika memakai GitHub:

- Root directory: `/` atau kosong;
- Build command: kosong;
- Build output directory: `.`;
- jangan memilih `landing` atau `katalog` sebagai root terpisah.

Setelah deploy, jalur berikut harus berada pada domain yang sama:

- `/` — landing;
- `/katalog/` — katalog;
- `/katalog/cara-order.html` — Cara Order;
- `/katalog/tema/nama-tema/` — preview undangan.

File `_redirects` juga sudah disiapkan agar `/katalog` dan `/cara-order` tetap mengarah ke halaman yang benar.

## 2. Backend RSVP opsional

Masuk ke folder `rsvp-worker`, lalu ikuti `README.md`. Ringkasnya:

1. jalankan `npm install`;
2. buat database D1;
3. salin `wrangler.toml.example` menjadi `wrangler.toml`;
4. isi ID database dan `ALLOWED_ORIGINS`;
5. pasang migrasi D1;
6. simpan secret `TURNSTILE_SECRET_KEY`, `RATE_LIMIT_SALT`, dan `RSVP_READ_TOKEN`;
7. jalankan `npm test`;
8. deploy Worker;
9. isi URL Worker dan Site Key pada `katalog/rsvp/config.js`;
10. deploy ulang frontend.

`wrangler.toml`, `.dev.vars`, dan seluruh secret tidak boleh dimasukkan ke repository atau frontend publik.

## 3. Checklist setelah deployment

- buka landing dan klik menu **Katalog**;
- dari katalog klik **Home** dan pastikan kembali ke desain landing terbaru;
- buka **Cara Order**, lalu tes tombol Home, Katalog, dan Harga;
- buka seluruh 10 preview tema;
- tes tombol WhatsApp dan pastikan nomor `0851 2268 4872`;
- pastikan tidak ada gambar 404 atau error console;
- uji tampilan HP dan desktop;
- lakukan hard refresh (`Ctrl + Shift + R`) bila browser masih menyimpan versi lama;
- pastikan HTTPS aktif sebelum mengaktifkan RSVP.

Jika subdomain lama `katalog.avilab.my.id` masih aktif, arahkan subdomain tersebut ke `https://invitation.avilab.my.id/katalog/` atau nonaktifkan project Pages lamanya agar pelanggan tidak membuka desain lama dari bookmark.

## 4. Jika RSVP belum diaktifkan

Biarkan placeholder pada `katalog/rsvp/config.js`. Form otomatis dinonaktifkan dan menampilkan keterangan bahwa RSVP belum aktif, sehingga tidak ada data yang seolah-olah terkirim tetapi hilang.

Sebelum memakai template untuk pelanggan, baca `TEMPLATE-CUSTOMIZATION.md` dan `MUSIC-LICENSE.md`.
