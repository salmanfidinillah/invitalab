# Panduan Data Template Invitalab

Seluruh 10 template di `katalog/tema/` adalah preview. Data nama, tanggal, lokasi, rekening, Instagram, Maps, Calendar, streaming, meeting, dan RSVP di dalamnya adalah data demo dan wajib diganti sebelum undangan pelanggan diterbitkan.

## Alur aman membuat undangan pelanggan

1. Duplikat hanya folder tema yang dipilih.
2. Ganti nama mempelai, orang tua, tanggal, waktu, alamat, dan foto.
3. Samakan tanggal tampilan, URL Google Calendar, serta variabel countdown.
4. Ganti URL Maps, Instagram, streaming/meeting, rekening, dan penerima hadiah.
5. Ganti `data-event-id="demo-..."` dengan ID acara unik.
6. Uji dengan `?to=Nama+Tamu` memakai nama pendek dan panjang.
7. Hapus `data-template-mode="demo"` hanya setelah seluruh data demo selesai diganti.

## Titik konfigurasi

- `minimalis-modern/index.html`: gunakan objek `weddingConfig`; data utama template sudah terkumpul di satu bagian.
- Template lain: cari komentar `Countdown`, atribut `data-event-id`, tag `<audio>`, serta URL yang mengandung `google.com/maps`, `calendar.google.com`, `instagram.com`, `youtube.com`, atau `zoom.us`.
- Musik bersama: `katalog/musik/invitalab-ambient.mp3`.
- Konfigurasi RSVP bersama: `katalog/rsvp/config.js`.

Jangan menaruh token admin RSVP, secret Turnstile, password pelanggan, nomor identitas, atau data sensitif lain di HTML publik. Password meeting dan nomor rekening yang ada pada preview hanyalah data demo.

