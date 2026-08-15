# Invitalab

**Invitalab** adalah website layanan undangan digital yang dirancang untuk memberikan pengalaman undangan yang modern, personal, dan mudah digunakan.

Website ini menyediakan berbagai pilihan tema undangan, preview langsung, personalisasi nama tamu, informasi acara, galeri, musik, Google Maps, Google Calendar, hingga dukungan RSVP melalui backend opsional berbasis Cloudflare.

> **Undangan digital yang terasa personal.**

---

## ✨ Features

* 🎨 **10 pilihan tema undangan**
* 👤 **Personalisasi nama tamu**
* 📱 **Responsive design** untuk desktop, tablet, dan mobile
* 🗺️ **Google Maps integration**
* 📅 **Google Calendar integration**
* 🖼️ **Galeri foto**
* 🎵 **Musik undangan**
* 💌 **Ucapan dan RSVP**
* 💬 **Pemesanan langsung melalui WhatsApp**
* 🔎 **Preview tema sebelum melakukan pemesanan**
* 🛡️ Backend RSVP dengan validasi dan proteksi spam
* 🌐 Siap di-deploy menggunakan **Cloudflare Pages**

---

## 🎨 Invitation Catalog

Invitalab memiliki **10 tema undangan** dengan gaya visual yang berbeda, mulai dari:

* Minimalis
* Syar'i
* Artistik
* Romantis
* Modern

Setiap tema dapat dibuka melalui halaman preview sehingga pengguna dapat melihat tampilan undangan sebelum memilih desain.

Katalog tersedia melalui:

```text
/katalog/
```

Sedangkan preview setiap tema berada pada struktur:

```text
/katalog/tema/nama-tema/
```

---

## 💰 Packages

Invitalab menyediakan dua paket utama:

### Reguler

**Rp75.000**

Fitur:

* Undangan digital aktif
* Nama tamu personal
* Google Maps
* Google Calendar
* Musik
* Galeri
* Informasi acara
* 1 kali revisi

### Premium

**Rp99.000**

Mencakup seluruh fitur Reguler ditambah:

* RSVP setelah backend diaktifkan
* Live streaming jika tersedia
* Prioritas pengerjaan
* 2 kali revisi

Tema custom tersedia dengan biaya tambahan.

---

## 🛠️ Tech Stack

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript

### Backend RSVP

* Cloudflare Workers
* Cloudflare D1
* Cloudflare Turnstile
* Wrangler

### Deployment

* Cloudflare Pages
* Cloudflare Workers

---

## 📂 Project Structure

```text
Invitalab-Website/
│
├── index.html
├── site.css
├── site.js
├── favicon.png
├── robots.txt
├── sitemap.xml
├── _headers
├── _redirects
│
├── img/
│   └── ...
│
├── katalog/
│   ├── index.html
│   ├── cara-order.html
│   ├── site.css
│   ├── site.js
│   ├── template-utils.js
│   │
│   └── tema/
│       └── ...
│
├── rsvp-worker/
│   ├── package.json
│   ├── README.md
│   └── wrangler.toml.example
│
├── DEPLOY-GRATIS.md
├── TEMPLATE-CUSTOMIZATION.md
└── MUSIC-LICENSE.md
```

---

## 💌 RSVP System

Invitalab menyediakan backend RSVP opsional menggunakan:

**Cloudflare Workers + D1 + Turnstile**

Beberapa mekanisme keamanan yang diterapkan:

* Server-side input validation
* Parameterized D1 queries
* Cloudflare Turnstile verification
* Rate limiting
* Honeypot anti-spam
* Payload size limitation
* Unique submission ID
* Restricted CORS
* Protected RSVP admin endpoint
* Tidak menyimpan IP pengguna secara mentah

Jika backend belum diaktifkan, form RSVP tidak akan mengirim data dan akan menampilkan informasi bahwa fitur belum aktif.

---

## 🚀 Deployment

Frontend Invitalab dapat di-deploy langsung menggunakan **Cloudflare Pages**.

Konfigurasi dasar:

```text
Root directory: /
Build command: -
Build output directory: .
```

Pastikan seluruh folder project digunakan sebagai root deployment agar landing page, katalog, dan seluruh preview tema berada dalam satu website.

Struktur URL:

```text
/
├── katalog/
├── katalog/cara-order.html
└── katalog/tema/nama-tema/
```

Panduan deployment lebih lengkap tersedia di:

```text
DEPLOY-GRATIS.md
```

---

## 🔐 Environment & Security

Credential dan secret **tidak boleh dimasukkan ke repository**.

Beberapa contoh data yang harus tetap private:

```text
TURNSTILE_SECRET_KEY
RATE_LIMIT_SALT
RSVP_READ_TOKEN
```

File konfigurasi lokal seperti berikut juga sebaiknya tidak di-commit:

```text
.env
.env.*
.dev.vars
wrangler.toml
```

Gunakan:

```text
wrangler.toml.example
```

sebagai template konfigurasi.

---

## 🧩 Template Customization

Setiap template undangan dapat disesuaikan dengan informasi pelanggan, seperti:

* Nama pasangan
* Tanggal acara
* Lokasi
* Google Maps
* Galeri
* Musik
* Cerita pasangan
* Nama tamu
* RSVP
* Informasi acara lainnya

Petunjuk kustomisasi tersedia di:

```text
TEMPLATE-CUSTOMIZATION.md
```

---

## 🎵 Music License

Penggunaan musik pada template harus mengikuti ketentuan lisensi dan sumber musik yang sesuai.

Informasi mengenai musik tersedia pada:

```text
MUSIC-LICENSE.md
```

---

## 💻 Local Development

Karena frontend utama menggunakan HTML, CSS, dan JavaScript biasa, project dapat dijalankan menggunakan local server.

Contohnya menggunakan VS Code **Live Server**.

Atau:

```bash
npx serve .
```

Untuk development backend RSVP:

```bash
cd rsvp-worker
npm install
npm run dev
```

Menjalankan test:

```bash
npm test
```

---

## 📱 Responsive Design

Invitalab dirancang agar nyaman digunakan pada berbagai ukuran layar:

* Desktop
* Laptop
* Tablet
* Smartphone

Navigasi, katalog, preview tema, CTA, dan konten undangan menyesuaikan ukuran layar pengguna.

---

## 📦 Repository

Repository ini berisi source code website **Invitalab**, termasuk:

* Landing page
* Katalog undangan
* Preview template
* Halaman cara order
* Asset website
* Backend RSVP
* Dokumentasi deployment
* Dokumentasi kustomisasi template

---

## 👨‍💻 Developer

Developed by **Salman Fidinillah**

GitHub: [@salmanfidinillah](https://github.com/salmanfidinillah)

---

## 📄 License

Project ini dibuat sebagai bagian dari pengembangan layanan **Invitalab**.

Source code, desain, template, dan aset yang terdapat di repository ini tidak diperuntukkan untuk penggunaan ulang secara komersial tanpa izin dari pemilik project.

---

<p align="center">
  <strong>Invitalab</strong><br>
  Undangan digital yang dirancang untuk terasa personal.
</p>

<p align="center">
  © 2026 Invitalab
</p>
