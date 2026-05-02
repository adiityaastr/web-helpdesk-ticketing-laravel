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
| Database | MySQL ^8.0 / PostgreSQL ^16 / SQLite 3 |
| Ekstensi PHP | pdo_mysql / pdo_pgsql / pdo_sqlite, mbstring, xml, bcmath, curl, zip |

> **Catatan:** Aplikasi support 3 driver database — MySQL, PostgreSQL, dan SQLite. Migrasi otomatis menyesuaikan perbedaan sintaks antar driver.

---

## Setup Instalasi

### A. Docker (Direkomendasikan — Production Ready)

```bash
git clone <repository-url> ticketing-app
cd ticketing-app
docker compose up -d --build
```

**Selesai.** Entrypoint otomatis akan:
- Copy `.env.example` → `.env`
- Install dependensi PHP (`composer install`)
- Generate `APP_KEY`
- Buat storage symlink
- Tunggu database siap → jalankan `migrate` + `db:seed`

Buka browser di **`http://localhost:8000`**

| Service | Port | Keterangan |
|---|---|---|
| Nginx | `8000` → `80` | Reverse proxy + static assets |
| PHP-FPM 8.3 | internal | Application server |
| MySQL 8.0 | `3306` | Database (volume persistent) |
| Redis 7 | `6379` | Cache & session driver |
| Queue Worker | internal | Proses notifikasi async |

#### Hot-Reload (Development)

```bash
docker compose --profile dev up -d vite
```

Vite dev server di `http://localhost:5173` — file `public/hot` otomatis dibuat, CSS/JS dimuat via HMR.

Jika tidak pakai Vite, build frontend manual:

```bash
npm install && npm run build
# Hapus public/hot jika ada agar aset build yg digunakan
```

#### Perintah dalam Container

```bash
docker compose exec app php artisan migrate          # Migrasi manual
docker compose exec app php artisan db:seed           # Seed manual
docker compose exec app php artisan migrate:fresh --seed  # Reset DB
docker compose exec app php artisan optimize:clear    # Clear cache
docker compose exec app php artisan storage:link      # Symlink storage
docker compose logs app                               # Lihat log
docker compose restart queue                          # Restart queue worker
```

#### Deploy ke Server

```bash
# 1. Clone & setup
git clone <url> /opt/helpdesk && cd /opt/helpdesk

# 2. Build aset frontend di host (sebelum Docker build)
npm install && npm run build

# 3. Jalankan
docker compose up -d --build

# 4. (Opsional) Setup cron untuk scheduler Laravel
echo "* * * * * docker compose -f /opt/helpdesk/docker-compose.yml exec -T app php artisan schedule:run >> /dev/null 2>&1" | crontab -
```

---

### B. Instalasi Manual (Local Dev)

#### 1. Clone & Install

```bash
git clone <repository-url> ticketing-app
cd ticketing-app
composer install
cp .env.example .env
php artisan key:generate
npm install && npm run build
```

#### 2. Konfigurasi Database

Edit `.env` — pilih salah satu:

<details>
<summary>MySQL / MariaDB</summary>

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=helpdesk_db
DB_USERNAME=root
DB_PASSWORD=your_password
```

```sql
CREATE DATABASE helpdesk_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
</details>

<details>
<summary>PostgreSQL</summary>

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=helpdesk
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

```sql
CREATE DATABASE helpdesk;
```
</details>

<details>
<summary>SQLite (zero-config, cocok untuk dev)</summary>

```env
DB_CONNECTION=sqlite
# DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD tidak diperlukan
```

```bash
php -r "touch('database/database.sqlite');"
```
</details>

#### 3. Migrasi, Seed, Storage

```bash
php artisan migrate
php artisan db:seed
```

Perintah ini akan membuat seluruh tabel dan mengisi data awal:
- **3 user default** (admin, staff, customer) dengan password `password`
- **3 role** (admin, staff, customer) beserta permission-nya
- **5 kategori** tiket (Hardware, Software, Jaringan, Akses Akun, Lainnya)

#### 4. Storage Link

```bash
php artisan storage:link
```

Diperlukan agar file lampiran (foto, PDF) yang diupload bisa diakses melalui URL.

#### 6. Install Dependensi Frontend & Build

```bash
npm install
npm run build
```

#### 7. Jalankan Aplikasi

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
| Database | MySQL 8 / PostgreSQL 16 / SQLite 3 |
| Prioritas | SAW (Simple Additive Weighting) |

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

- **Status Flow** — `open` → `in_progress` → `resolved` → (user confirm) → `closed`. Tiket juga bisa `cancelled`.
- **Konfirmasi Ganda** — Saat admin set `resolved`, user harus konfirmasi: **Ya, Selesai** (→ `closed`) atau **Belum, Masih Ada Masalah** (→ `in_progress`). Histori komentar tetap tampil sebagai bukti.
- **Prioritas** — `low`, `medium`, `high`, `critical` dengan badge warna + skor SAW.
- **Penugasan** — Admin menugaskan staff ke tiket.
- **Komentar Internal** — Staff/admin bisa menambahkan catatan internal yang tidak terlihat pelanggan.
- **Komentar Terkunci** — Otomatis dikunci saat tiket `closed` atau `cancelled`.
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
├── resolved_at, resolved_confirmed_at, cancelled_at
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

saw_configurations
├── id, code (unique), name, type (benefit/cost)
├── weight (decimal), sort_order
└── timestamps

personal_access_tokens
├── id, tokenable_type, tokenable_id
├── name, token, abilities (JSON)
├── last_used_at, expires_at
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

### SAW — Prioritas Otomatis

Skor SAW (Simple Additive Weighting) dihitung otomatis untuk semua tiket dan ditampilkan di kolom **SAW** pada halaman `/admin/tickets`. 5 kriteria: C1 (Prioritas), C2 (Urgensi SLA), C3 (Waktu Tunggu), C4 (Aktivitas Pelanggan), C5 (Kompleksitas). Skor di-cache 60 detik untuk performa.

---

## Performa & Optimasi

| Optimasi | Keterangan |
|---|---|
| DB Indexes | `tickets(status, priority, user_id, assigned_to)`, `comments(ticket_id)`, `notifications(notifiable_id, read_at)` |
| Cache SAW | Skor SAW di-cache 60 detik via Redis/file |
| Debounce Search | Input search ditunda 400ms — kurangi request server |
| System Fonts | Font system stack (tanpa Google Fonts CDN) — FCP lebih cepat |
| Inertia Progress | Progress bar teal saat navigasi antar halaman |
| N+1 Prevention | Semua list pakai `->with()` eager loading |
| Cache Dashboard | Stats dashboard admin di-cache 300 detik |
| Static Assets | Cache 7 hari via Nginx untuk CSS/JS/font

---

## Perintah yang Berguna

```bash
# === Lokal ===

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

# === Docker ===

# Jalankan semua service
docker compose up -d

# Masuk ke container app
docker compose exec app bash

# Jalankan perintah artisan dalam container
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
docker compose exec app php artisan storage:link

# Restart service tertentu
docker compose restart app nginx queue
```

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Halaman putih / blank hitam | Hapus `public/hot` lalu `npm run build` dan `php artisan optimize:clear` |
| Halaman 500 error | `php artisan optimize:clear` lalu `npm run build` |
| CSS tidak muncul | `npm run build` lalu `php artisan optimize:clear` |
| Asset mengarah ke `localhost:5173` | Hapus file `public/hot` agar aplikasi menggunakan aset build |
| Upload lampiran gagal | Pastikan `php artisan storage:link` sudah dijalankan dan `storage/app/public` writable |
| Login error 419 | `php artisan optimize:clear`, hapus cookie browser |
| Permission denied saat queue | Pastikan `storage/` dan `bootstrap/cache/` writable |
| Notifikasi tidak muncul | Pastikan `php artisan queue:listen` sedang berjalan |
| Role tidak tersedia | `php artisan db:seed --class=RolePermissionSeeder` |
| Kategori kosong | `php artisan db:seed --class=CategorySeeder` |
| Migration error di SQLite | Pastikan file `database/database.sqlite` sudah dibuat (`touch database/database.sqlite`) |
