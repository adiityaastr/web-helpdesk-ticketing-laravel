# Panduan Maintainability — Helpdesk Ticketing

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | React 19 + Inertia.js 3 + Tailwind CSS 4 |
| Build | Vite 8 |
| Database | MySQL 8 / PostgreSQL 16 / SQLite 3 |
| Auth Web | Laravel Session + Spatie Permission |
| Auth API | Laravel Sanctum (token-based) |
| Cache | File (local) / Redis (Docker) |
| Queue | Database |

---

## Struktur Direktori

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/              # Dashboard, Ticket, User, Category, KnowledgeBase, Template
│   │   │   ├── DashboardController.php
│   │   │   ├── TicketController.php
│   │   │   ├── UserController.php
│   │   │   ├── CategoryController.php
│   │   │   ├── KnowledgeBaseController.php
│   │   │   └── TemplateController.php
│   │   ├── Api/                # REST API (Sanctum token)
│   │   │   ├── AuthController.php
│   │   │   └── TicketController.php
│   │   ├── Portal/             # Customer-facing pages
│   │   │   ├── DashboardController.php
│   │   │   ├── TicketController.php
│   │   │   └── KnowledgeBaseController.php
│   │   ├── AuthController.php
│   │   ├── NotificationController.php
│   │   └── Controller.php
│   ├── Middleware/
│   │   ├── HandleInertiaRequests.php  # Shared Inertia props (auth, notifications, flash)
│   │   └── ForceRequestUrl.php
│   ├── Requests/               # Form Request validation
│   │   ├── StoreTicketRequest.php
│   │   ├── StoreCommentRequest.php
│   │   └── UpdateTicketRequest.php
│   └── Resources/
│       └── TicketResource.php   # Ticket → JSON transformation
├── Models/
│   ├── User.php
│   ├── Ticket.php
│   ├── Comment.php
│   ├── Category.php
│   ├── KnowledgeBase.php
│   ├── ActivityLog.php
│   ├── TicketTemplate.php
│   └── SawConfiguration.php
├── Policies/
│   └── TicketPolicy.php
├── Services/
│   └── SawService.php           # SAW priority scoring algorithm
└── Notifications/
    └── TicketActivityNotification.php
```

---

## Menjalankan Aplikasi

### Docker (Production)
```bash
docker compose up -d --build     # Auto .env, migrate, seed
docker compose --profile dev up -d vite  # Hot-reload (opsional)
```

### Local Development
```bash
composer dev                     # server + queue + logs + vite
# atau manual:
php artisan serve                # :8000
php artisan queue:listen         # Queue worker
npm run dev                      # Vite HMR
```

### Build Production
```bash
npm run build
php artisan optimize
```

---

## Alur Tiket (Status Flow)

```
open → in_progress → resolved → (user confirm) → closed
  ↓                    ↓ (user reject)
cancelled          in_progress (reopen)
```

| Status | Arti | Komentar |
|---|---|---|
| `open` | Tiket baru dibuat user | Bisa (user + admin) |
| `in_progress` | Sedang dikerjakan admin | Bisa |
| `resolved` | Admin selesai, tunggu konfirmasi user | Bisa (diskusi) |
| `closed` | User konfirmasi selesai | Dikunci |
| `cancelled` | Dibatalkan user/admin | Dikunci |

### Konfirmasi Ganda
Saat admin set status `resolved`, user melihat panel konfirmasi:
- **Ya, Sudah Selesai** → status `closed`, komentar: "Pelapor mengonfirmasi"
- **Belum, Masih Ada Masalah** → isi alasan → status kembali `in_progress`

---

## SAW (Simple Additive Weighting)

### Cara Kerja
1. Skor prioritas dihitung untuk **semua tiket** dan ditampilkan di kolom SAW pada `/admin/tickets`
2. 5 kriteria: C1 (Prioritas), C2 (Urgensi SLA), C3 (Waktu Tunggu), C4 (Aktivitas Pelanggan), C5 (Kompleksitas)
3. Konfigurasi bobot disimpan di tabel `saw_configurations`
4. Seed default via: `(new SawService())->seedDefaults()`

### Menambah Kriteria Baru
1. Tambah row di `saw_configurations` via migration/seeder
2. Tambah case di `getCriterionValue()` di `SawService.php`
3. Update `seedDefaults()` jika perlu

---

## N+1 Query Prevention
- Selalu gunakan `->with(['relation1', 'relation2'])` saat query
- Cek `TicketResource.php` — field yang dipakai harus di-eager-load
- `HandleInertiaRequests.php` — auth user di-cache 300 detik

---

## Menambah Role Baru
```bash
php artisan permission:create-role nama_role
```
```php
$user->assignRole('nama_role');
```
Update middleware: `role:staff|admin|nama_role`

---

## Menambah Halaman Baru (Inertia)
1. Buat `.tsx` di `resources/js/Pages/Admin/` atau `Portal/`
2. Buat controller method → `Inertia::render('Admin/NamaPage', [...])`
3. Tambah route di `routes/web.php`
4. Nama page = path relatif dari `Pages/` tanpa `.tsx`

---

## Cache

| Command | Fungsi |
|---|---|
| `php artisan optimize:clear` | Hapus semua cache |
| `php artisan cache:clear` | Hapus cache data |
| `php artisan config:cache` | Cache config (production) |
| `php artisan route:cache` | Cache routes (production) |
| `php artisan view:cache` | Cache views (production) |

### Cache Keys yang Digunakan

| Key | TTL | Lokasi |
|---|---|---|
| `admin_dashboard_stats` | 300s | `Admin\DashboardController` |
| `admin_dashboard_charts` | 300s | `Admin\DashboardController` |
| `admin_saw_scores` | 60s | `Admin\TicketController` |
| `portal_dashboard_stats_{id}` | 300s | `Portal\DashboardController` |
| `user_auth_{id}` | 300s | `HandleInertiaRequests` |
| `user_notif_count_{id}` | 60s | `HandleInertiaRequests` |

---

## Performance Optimizations

| # | Optimasi | Lokasi |
|---|----------|--------|
| 1 | DB Indexes (8 indeks) | Migration `add_ticket_indexes` |
| 2 | SAW score cache 60s | `Admin\TicketController` |
| 3 | Debounce search 400ms | `Admin/Tickets/Index.tsx`, `Portal/Tickets/Index.tsx` |
| 4 | System font stack | `app.blade.php`, `app.css` — hapus Google Fonts |
| 5 | Inertia progress bar | `app.blade.php` — NProgress teal |
| 6 | Dashboard stats cache 300s | `Admin\DashboardController` |
| 7 | Auth user cache 300s | `HandleInertiaRequests` |
| 8 | Dashboard queries with `CASE WHEN` | `Admin\DashboardController` |
| 9 | N+1 prevention via `->with()` | Semua controller list |
| 10 | Nginx static asset cache 7d | `nginx/default.conf` |

---

## API Routes

Prefix: `/api/v1`. Semua route di `routes/api.php`.

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/register` | Guest |
| POST | `/login` | Guest |
| POST | `/logout` | Bearer |
| GET | `/user` | Bearer |
| GET | `/tickets` | Bearer |
| POST | `/tickets` | Bearer |
| GET | `/tickets/{id}` | Bearer |
| POST | `/tickets/{id}/comments` | Bearer |

---

## Backlog

| Fitur | Deskripsi |
|---|---|
| Notifikasi Email | Kirim email saat tiket diupdate |
| Export Excel | Export tiket ke Excel |
| Preview Lampiran | Pratinjau gambar/PDF di modal |
| Dark Mode | Toggle dark/light |
| Search Knowledge Base | Full-text search |
