# Helpdesk Ticketing App

Aplikasi helpdesk ticketing berbasis web untuk mengelola tiket bantuan teknis, dibangun dengan Laravel 13 + React 19 (Inertia.js) + Tailwind CSS 4.

---

## Persyaratan Sistem

| Kebutuhan | Versi |
|---|---|
| PHP | ^8.3 |
| Composer | ^2.0 |
| Node.js | ^18.0 |
| NPM | ^9.0 |
| MySQL | ^8.0 / MariaDB ^10.6 |
| Ekstensi PHP | pdo_mysql, mbstring, xml, bcmath, curl, zip |

---

## Setup Instalasi Lengkap

### 1. Clone Repository

```bash
git clone <repository-url> ticketing-app
cd ticketing-app
```

### 2. Install Dependensi PHP

```bash
composer install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit file `.env` dan sesuaikan konfigurasi database:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

Buat database MySQL:

```sql
CREATE DATABASE helpdesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Jalankan Migrasi & Seeder

```bash
php artisan migrate
php artisan db:seed
```

Perintah ini akan membuat seluruh tabel dan mengisi data awal:
- **3 user default** (admin, staff, customer) dengan password `password`
- **3 role** (admin, staff, customer) beserta permission-nya
- **5 kategori** tiket (Hardware, Software, Jaringan, Akses Akun, Lainnya)

### 5. Storage Link

```bash
php artisan storage:link
```

Diperlukan agar file lampiran (foto, PDF) yang diupload bisa diakses melalui URL.

### 6. Install Dependensi Frontend & Build

```bash
npm install
npm run build
```

### 7. Jalankan Aplikasi

**Untuk development** (direkomendasikan):

```bash
composer dev
```

Perintah ini menjalankan 4 proses sekaligus:
- `php artisan serve` (backend di port 8000)
- `php artisan queue:listen` (queue worker)
- `php artisan pail` (log viewer)
- `npm run dev` (Vite hot-reload)

**Atau secara manual**:

```bash
php artisan serve        # Terminal 1
php artisan queue:listen # Terminal 2
npm run dev              # Terminal 3
```

Buka browser di `http://127.0.0.1:8000`

---

## Akun Default

Setelah `db:seed`, 3 akun tersedia:

| Email | Password | Role | Akses |
|---|---|---|---|
| `admin@helpdesk.com` | `password` | admin | Dashboard Admin, Kelola Tiket, Kelola User, Kelola Kategori, dll |
| `staff@helpdesk.com` | `password` | staff | Dashboard Admin, Kelola Tiket, Komentar Internal |
| `user@helpdesk.com` | `password` | customer | Portal Pelanggan, Buat Tiket, Lihat Tiket Sendiri |

---

## Arsitektur Aplikasi

### Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | React 19 + Inertia.js 3 |
| Styling | Tailwind CSS 4 |
| Charts | Chart.js + react-chartjs-2 |
| Build Tool | Vite 8 |
| Permissions | spatie/laravel-permission |
| Database | MySQL 8 |

### Alur Data

```
Browser → Inertia.js → Laravel Controller → Inertia Response → React Page
```

Inertia.js berfungsi sebagaipenghubung: controller Laravel mengirim data sebagai props ke komponen React, tanpa perlu API terpisah.

---

## Struktur Halaman

### Portal Pelanggan (role: customer)

| Route | Halaman | Fungsi |
|---|---|---|
| `/portal/dashboard` | Dashboard | Ringkasan tiket pelanggan |
| `/portal/tickets` | Daftar Tiket | Lihat semua tiket milik pelanggan |
| `/portal/tickets/create` | Buat Tiket | Form pembuatan tiket + upload lampiran + kamera |
| `/portal/tickets/{id}` | Detail Tiket | Lihat detail, komentar, batalkan, beri rating |
| `/portal/knowledge-base` | Basis Pengetahuan | Artikel-artikel bantuan |
| `/portal/knowledge-base/{id}` | Artikel | Detail artikel bantuan |
| `/notifications` | Notifikasi | Riwayat notifikasi aktivitas tiket |

### Admin Panel (role: staff, admin)

| Route | Halaman | Fungsi |
|---|---|---|
| `/admin/dashboard` | Dashboard Admin | Statistik, chart, tiket terbaru, beban kerja staff |
| `/admin/tickets` | Kelola Tiket | Daftar semua tiket + filter (status, prioritas, kategori, petugas) |
| `/admin/tickets/{id}` | Detail Tiket | Ubah status/prioritas/penugasan, komentar internal, log aktivitas |
| `/admin/users` | Kelola Pengguna | CRUD user + assign role |
| `/admin/categories` | Kelola Kategori | CRUD kategori tiket |
| `/admin/knowledge-base` | Pusat Bantuan | CRUD artikel basis pengetahuan |
| `/admin/templates` | Template Respon | CRUD template respons cepat untuk komentar |

---

## Fitur Utama

### Tiket Helpdesk

- **SLA Tracking** — Setiap tiket punya deadline berdasarkan prioritas (critical: 2 jam, high: 8 jam, medium: 24 jam, low: 48 jam). Tiket yang melewati SLA ditandai merah.
- **Status Flow** — `open` → `in_progress` → `resolved` → `closed`. Tiket juga bisa `cancelled`.
- **Prioritas** — `low`, `medium`, `high`, `critical` dengan badge warna.
- **Penugasan** — Admin menugaskan staff ke tiket.
- **Komentar Internal** — Staff/admin bisa menambahkan catatan internal yang tidak terlihat pelanggan.
- **Template Respons** — Admin bisa buat template pesan cepat untuk komentar.
- **Rating** — Pelanggan bisa memberi rating (1-5 bintang) setelah tiket selesai.
- **Lampiran** — Upload file (foto, PDF) saat buat tiket atau komentar. Bisa ambil foto langsung dari kamera.
- **Pembatalan** — Pelanggan bisa membatalkan tiket yang masih aktif.

### Notifikasi

- Notifikasi otomatis dikirim ke pelapor dan petugas saat tiket dibuat, diperbarui, atau dikomentari.
- Disimpan di database, ditampilkan di halaman notifikasi dengan badge unread.
- Admin bisa menandai semua notifikasi sebagai dibaca.

### Dashboard Admin

- Statistik total, open, in progress, resolved, closed, overdue
- Chart distribusi status dan prioritas (Doughnut Chart)
- Daftar tiket terbaru
- Beban kerja staff (jumlah tiket yang ditugaskan)

### Basis Pengetahuan

- Artikel bisa berstatus draft atau publish
- Hanya artikel publish yang terlihat pelanggan
- Dikelompokkan per kategori

---

## Alur Perizinan (Policy)

### TicketPolicy

| Aksi | customer | staff | admin |
|---|---|---|---|
| Lihat tiket sendiri (`view`) | ✅ | ✅ | ✅ |
| Lihat semua tiket | ❌ | ✅ | ✅ |
| Buat tiket (`create`) | ✅ | ✅ | ✅ |
| Update tiket (`update`) | Hanya tiket sendiri yang masih aktif | ✅ | ✅ |
| Hapus tiket (`delete`) | Hanya tiket sendiri yang open/cancelled | ✅ | ✅ |
| Komentar (`comment`) | Hanya tiket sendiri | ✅ | ✅ |
| Batalkan (`cancel`) | Hanya tiket sendiri yang masih aktif | ✅ | ✅ |

### Yang Bisa Diubah Admin di Tiket

| Field | Bisa diubah admin? |
|---|---|
| Status | ✅ |
| Prioritas | ✅ |
| Ditugaskan ke (assigned_to) | ✅ |
| Judul | ❌ (data asli pelanggan) |
| Deskripsi | ❌ (data asli pelanggan) |
| Kategori | ❌ (data asli pelanggan) |

### Role Middleware

| Route Group | Middleware |
|---|---|
| Portal (dashboard, buat tiket) | `auth` + `role:customer` |
| Portal (lihat, komentar, rating) | `auth` + `role:customer|staff|admin` |
| Admin (semua) | `auth` + `role:staff|admin` |
| Notifikasi | `auth` |

---

## Database Schema

### Tabel Utama

```
users
├── id, name, email, password, phone, department
├── timestamps
└── (pivot: model_has_roles → roles)

tickets
├── id, uuid (unique), user_id (FK), category_id (FK)
├── title, description, priority, status
├── assigned_to (FK users, nullable), sla_deadline
├── resolved_at, cancelled_at
├── rating, rating_comment
└── timestamps

comments
├── id, ticket_id (FK), user_id (FK)
├── message, is_internal, attachments (JSON)
└── timestamps

categories
├── id, name, slug (unique), description
└── timestamps

knowledge_bases
├── id, title, slug (unique), content (longText)
├── category_id (FK, nullable), author_id (FK)
├── is_published (boolean)
└── timestamps

ticket_templates
├── id, title, content, category_id (FK, nullable)
├── created_by (FK users)
└── timestamps

activity_logs
├── id, user_id (FK, nullable), ticket_id (FK, nullable)
├── action, description
└── timestamps

notifications
├── id (UUID), type, notifiable_type, notifiable_id
├── data (JSON), read_at
└── timestamps
```

### Enum Values

| Kolom | Values |
|---|---|
| `tickets.priority` | `low`, `medium`, `high`, `critical` |
| `tickets.status` | `open`, `in_progress`, `resolved`, `closed`, `cancelled` |
| `comments.is_internal` | `0` (publik), `1` (internal) |
| `knowledge_bases.is_published` | `0` (draft), `1` (publish) |

---

## Konfigurasi Tambahan

### Queue Worker (Produksi)

Aplikasi menggunakan `QUEUE_CONNECTION=database`. Untuk produksi, jalankan:

```bash
php artisan queue:work --daemon
```

Atau set up sebagai systemd service / Supervisor.

### Cron (Produksi)

Tambahkan ke crontab server:

```bash
* * * * * php /path/to/ticketing-app/artisan schedule:run >> /dev/null 2>&1
```

### Storage

Pastikan folder berikut writable oleh web server:

```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

File lampiran tiket disimpan di `storage/app/public/tickets/` dan diakses via `http://domain/storage/tickets/...`.

---

## Perintah yang Berguna

```bash
# Setup lengkap dari nol
composer setup

# Development (server + queue + logs + vite)
composer dev

# Build aset untuk produksi
npm run build

# Jalankan test
composer test

# Reset database
php artisan migrate:fresh --seed

# Bersihkan cache
php artisan optimize:clear

# Buat storage link
php artisan storage:link

# Jalankan queue worker
php artisan queue:listen
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Halaman putih / 500 error | `php artisan optimize:clear` lalu `npm run build` |
| CSS tidak muncul | `npm run build` lalu `php artisan optimize:clear` |
| Upload lampiran gagal | Pastikan `php artisan storage:link` sudah dijalankan dan `storage/app/public` writable |
| Login error 419 | `php artisan optimize:clear`, hapus cookie browser |
| Permission denied saat queue | Pastikan `storage/` dan `bootstrap/cache/` writable |
| Notifikasi tidak muncul | Pastikan `php artisan queue:listen` sedang berjalan |
| Role tidak tersedia | `php artisan db:seed --class=RolePermissionSeeder` |
| Kategori kosong | `php artisan db:seed --class=CategorySeeder` |