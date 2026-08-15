# Invitalab RSVP Worker

Backend RSVP gratis untuk undangan Invitalab menggunakan Cloudflare Workers, D1, dan Turnstile. Folder ini siap dikonfigurasi, diuji, lalu di-deploy secara terpisah dari website statis.

## Keamanan yang sudah diterapkan

- validasi input di server;
- query D1 terparameterisasi;
- Turnstile diverifikasi di server;
- pembatasan 5 pengiriman per IP per 10 menit tanpa menyimpan IP mentah;
- CORS hanya untuk domain yang didaftarkan;
- honeypot antispam;
- batas payload 16 KB dan panjang setiap kolom;
- ID pengiriman unik agar klik ganda tidak membuat data ganda;
- output JSON dan pesan form tidak menggunakan HTML dari pengguna.
- daftar nama dan ucapan RSVP dilindungi token admin dan tidak terbuka untuk publik.

## Persiapan

1. Masuk ke folder ini dan jalankan `npm install`.
2. Login dengan `npx wrangler login`.
3. Buat database: `npx wrangler d1 create invitalab-rsvp`.
4. Salin `wrangler.toml.example` menjadi `wrangler.toml`.
5. Masukkan `database_id` dari langkah 3 dan domain website pada `ALLOWED_ORIGINS`.
6. Terapkan tabel: `npm run db:migrate:remote`.
7. Buat widget Turnstile di dashboard Cloudflare untuk domain undangan.
8. Simpan secret tanpa memasukkannya ke source code:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   npx wrangler secret put RATE_LIMIT_SALT
   npx wrangler secret put RSVP_READ_TOKEN
   ```

   Gunakan teks acak panjang dan berbeda untuk `RATE_LIMIT_SALT` serta `RSVP_READ_TOKEN`.

9. Jalankan `npm test`, kemudian `npm run deploy`.
10. Isi URL Worker dan Site Key di `katalog/rsvp/config.js`.

## Pengembangan lokal

Gunakan `npm run db:migrate:local`, lalu `npm run dev`. Untuk pengujian lokal Turnstile, gunakan test Site Key dan Secret Key resmi Cloudflare; jangan gunakan test key pada website produksi.

## Mengganti ID acara

Setiap form memiliki atribut `data-event-id`. Saat template digunakan untuk pelanggan, ubah nilainya menjadi ID unik, misalnya `salman-aisyah-2026`. Gunakan hanya huruf, angka, tanda hubung, atau garis bawah sepanjang 3–64 karakter.

## Membaca hasil RSVP

Daftar RSVP tidak dapat dibaca langsung dari browser publik. Pemilik dapat mengambilnya melalui terminal dengan token admin:

```bash
read -s INVITALAB_RSVP_READ_TOKEN
curl -H "Authorization: Bearer $INVITALAB_RSVP_READ_TOKEN" \
  "https://URL-WORKER.workers.dev/api/rsvp?eventId=salman-aisyah-2026"
unset INVITALAB_RSVP_READ_TOKEN
```

Jangan menaruh `RSVP_READ_TOKEN`, `TURNSTILE_SECRET_KEY`, atau `RATE_LIMIT_SALT` di file frontend maupun repository.

## Catatan privasi

Endpoint admin `GET /api/rsvp?eventId=...` menampilkan maksimal 50 RSVP terbaru. Jangan meminta tamu menulis nomor telepon, alamat, atau data sensitif pada kolom ucapan.
