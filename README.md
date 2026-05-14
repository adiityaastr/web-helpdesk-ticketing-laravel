# Helpdesk Ticketing App

Aplikasi helpdesk ticketing berbasis web untuk mengelola tiket bantuan teknis, dibangun dengan Laravel 13 + React 19 (Inertia.js) + Tailwind CSS 4.

---

## Persyaratan Sistem

| Kebutuhan | Versi |
|-----------|-------|
| PHP | ^8.3 |
| Composer | ^2.0 |
| Node.js | ^18.0 |
| NPM | ^9.0 |
| Database | MySQL ^8.0 / MariaDB ^10.4 |
| Ekstensi PHP | pdo_mysql, mbstring, xml, bcmath, curl, zip, fileinfo, openssl, gd |

> Disarankan menggunakan **XAMPP** atau **Laragon** yang sudah menyediakan PHP + MySQL + Apache.

---

## Instalasi

### 1. Clone & Install Dependensi

```bash
git clone <repository-url> ticketing-app
cd ticketing-app
composer install
cp .env.example .env
php artisan key:generate
```

### 2. Konfigurasi Database

Buat database di MySQL (via phpMyAdmin atau terminal):

```sql
CREATE DATABASE helpdesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Edit `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk_db
DB_USERNAME=root
DB_PASSWORD=
```

### 3. Migrasi & Seed

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
```

### 4. Build Frontend

```bash
npm install
npm run build
```

### 5. Jalankan Aplikasi

```bash
php artisan serve
```

Buka browser di `http://127.0.0.1:8000`

---

## Akun Default

| Email | Password | Role | Akses |
|-------|----------|------|-------|
| `admin@helpdesk.com` | `password` | Staff IT | Dashboard, Kelola Tiket, User, Kategori, Departemen, Knowledge Base |
| `staff@helpdesk.com` | `password` | Staff IT | Dashboard, Kelola Tiket, Komentar Internal |
| `user@helpdesk.com` | `password` | Pengguna | Portal Pelanggan, Buat Tiket, Lihat Tiket Sendiri |

### Role & Permission

| Role | Akses |
|------|-------|
| **staff** | Semua akses — CRUD tiket, user, kategori, departemen, knowledge base, dashboard admin |
| **customer** | Buat tiket, lihat tiket sendiri, komentar publik, batalkan tiket, beri rating |

---

## Struktur Halaman

### Portal Pelanggan (role: customer)

| Route | Fungsi |
|-------|--------|
| `/portal/dashboard` | Ringkasan tiket pelanggan |
| `/portal/tickets` | Daftar tiket milik pelanggan |
| `/portal/tickets/create` | Form pembuatan tiket + upload lampiran |
| `/portal/tickets/{id}` | Detail tiket, komentar, batalkan, rating |
| `/portal/knowledge-base` | Artikel bantuan |
| `/notifications` | Riwayat notifikasi |

### Admin Panel (role: staff)

| Route | Fungsi |
|-------|--------|
| `/admin/dashboard` | Statistik, chart, tiket terbaru, beban kerja staff |
| `/admin/tickets` | Kelola semua tiket + filter |
| `/admin/tickets/{id}` | Detail tiket, ubah status/prioritas/penugasan |
| `/admin/users` | CRUD user + assign role |
| `/admin/categories` | CRUD kategori tiket |
| `/admin/departments` | CRUD departemen |
| `/admin/knowledge-base` | CRUD artikel basis pengetahuan |

---

## Fitur Utama

### Tiket Helpdesk
- **Status Flow**: `open` → `in_progress` → `resolved` → `closed` (atau `cancelled`)
- **Konfirmasi Ganda**: Saat staff set `resolved`, pelanggan harus konfirmasi selesai atau tolak
- **Prioritas**: `low`, `medium`, `high`, `critical` + skor SAW otomatis
- **Penugasan**: Staff menugaskan tiket ke staff lain
- **Komentar Internal**: Staff bisa tambah catatan yang tidak terlihat pelanggan
- **Rating**: Pelanggan beri rating 1-5 bintang setelah tiket selesai
- **Lampiran**: Upload file saat buat tiket atau komentar
- **Pembatalan**: Pelanggan bisa batalkan tiket yang masih aktif

### Notifikasi
- Otomatis dikirim saat tiket dibuat, diperbarui, atau dikomentari
- Disimpan di database, ditampilkan dengan badge unread

### Dashboard Admin
- Statistik total, open, in progress, resolved, closed, overdue
- Chart distribusi status dan prioritas (Doughnut Chart)
- Daftar tiket terbaru + beban kerja staff

### Algoritma SAW
- 5 kriteria: Prioritas (C1), Urgensi SLA (C2), Waktu Tunggu (C3), Aktivitas Pelanggan (C4), Kompleksitas (C5)
- Skor otomatis dihitung untuk prioritisasi tiket

---

## Database Schema

### Tabel Utama

| Tabel | Fungsi |
|-------|--------|
| `users` | Pengguna (+ employee_number, position, department_id) |
| `departments` | Departemen organisasi |
| `tickets` | Tiket helpdesk |
| `comments` | Komentar tiket (publik & internal) |
| `categories` | Kategori tiket (soft deletes) |
| `knowledge_bases` | Artikel basis pengetahuan |
| `activity_logs` | Log aktivitas tiket |
| `notifications` | Notifikasi user |
| `saw_configurations` | Konfigurasi bobot SAW |

### Enum Values

| Kolom | Values |
|-------|--------|
| `tickets.priority` | `low`, `medium`, `high`, `critical` |
| `tickets.status` | `open`, `in_progress`, `resolved`, `closed`, `cancelled` |

---

## Development

### Hot Reload (Vite)

```bash
composer dev
```

Menjalankan: `php artisan serve` + `npm run dev` secara bersamaan.

### Manual

```bash
php artisan serve          # Terminal 1
npm run dev                # Terminal 2
```

### Testing

```bash
php artisan test
```

---

## Konfigurasi .env

```env
# Aplikasi
APP_NAME=Helpdesk
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database (XAMPP default)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk_db
DB_USERNAME=root
DB_PASSWORD=

# Driver (file-based, tanpa Redis)
SESSION_DRIVER=file
CACHE_STORE=file
QUEUE_CONNECTION=sync

# Mail (log untuk development)
MAIL_MAILER=log
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Halaman blank putih | Hapus `public/hot`, jalankan `npm run build`, lalu `php artisan optimize:clear` |
| CSS tidak muncul | `npm run build` lalu refresh |
| Login error 419 | `php artisan optimize:clear` |
| Upload lampiran gagal | `php artisan storage:link` |
| Migration error | Pastikan database `helpdesk_db` sudah dibuat di MySQL |
| Ekstensi PHP kurang | Aktifkan di `php.ini` (XAMPP: `C:\xampp\php\php.ini`) |
