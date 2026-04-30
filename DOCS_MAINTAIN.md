# Panduan Maintainability — Helpdesk Ticketing

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Laravel 13 (PHP 8.3+) |
| Frontend | React 19 + Inertia.js 3 + Tailwind CSS 4 |
| Build | Vite 8 |
| Database | PostgreSQL (via Supabase) |
| Auth Web | Laravel Session + Spatie Permission |
| Auth API | Laravel Sanctum (token-based) |
| Cache | File (local) / Redis |
| Queue | Database |

---

## Struktur Direktori Penting

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/          # Controller untuk staff/admin
│   │   ├── Api/            # Controller untuk REST API
│   │   ├── Portal/         # Controller untuk customer
│   │   ├── AuthController.php
│   │   ├── NotificationController.php
│   │   └── Controller.php  # Base controller
│   ├── Middleware/
│   │   ├── HandleInertiaRequests.php  # Share data ke React (CACHED)
│   │   └── ForceRequestUrl.php
│   ├── Requests/           # Form validation
│   └── Resources/
│       └── TicketResource.php  # Transformasi Ticket → JSON
├── Models/
│   ├── User.php            # User + HasApiTokens + HasRoles
│   ├── Ticket.php
│   ├── SawConfiguration.php # Konfigurasi bobot SAW
│   └── ...
├── Services/
│   └── SawService.php      # Algoritma SAW (core)
└── Notifications/
    └── TicketActivityNotification.php
```

---

## Menjalankan Aplikasi

```bash
# Development (menjalankan server + queue + vite + logs sekaligus)
composer run dev

# Atau jalankan terpisah:
php artisan serve           # Server di port 8000
php artisan queue:work      # Queue worker
npm run dev                 # Vite dev server

# Build production
npm run build
php artisan optimize        # Cache config, routes, events, views

# Setelah deploy production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## SAW (Simple Additive Weighting)

### Cara Kerja
1. Sistem menghitung skor prioritas untuk setiap tiket berstatus `open`/`in_progress`
2. 5 kriteria digunakan: Prioritas, Urgensi SLA, Waktu Tunggu, Aktivitas Pelanggan, Kompleksitas
3. Admin dapat menyesuaikan bobot di halaman `/admin/saw`
4. Skor dihitung dengan rumus: `Vi = Σ (wj × rij)`

### Reset ke Default
- Klik tombol "Simpan Bobot" di halaman SAW, atau
- Jalankan endpoint `POST /admin/saw/seed` (pakai form kosong)

### Menambah Kriteria Baru
1. Tambah row di tabel `saw_configurations` via migration atau seeder
2. Tambah case di method `getCriterionValue()` di `app/Services/SawService.php`
3. Restart server

---

## API Routes

Semua route API ada di `routes/api.php` dengan prefix `/api/v1`.

Untuk menambah endpoint baru:
1. Buat controller di `app/Http/Controllers/Api/`
2. Tambah route di `routes/api.php`
3. Gunakan middleware `auth:sanctum` untuk endpoint yang butuh autentikasi

---

## Performance Optimizations (Fase 1)

### Apa yang Sudah Dioptimasi

| # | Optimasi | Lokasi |
|---|----------|--------|
| 1 | Cache user auth & notifikasi | `HandleInertiaRequests.php` — 30 detik cache |
| 2 | Query dashboard digabung pakai FILTER | `Admin/DashboardController.php` — 10 query → 3 query |
| 3 | Cache dashboard stats | `Admin/DashboardController.php` — 60 detik cache |
| 4 | Session & cache pakai file (local) | `.env` — `CACHE_STORE=file`, `SESSION_DRIVER=file` |
| 5 | Code splitting frontend | `app.js` — lazy load halaman |
| 6 | Google Fonts non-blocking | `app.blade.php` — `media="print" onload` |
| 7 | APP_DEBUG=false | `.env` — production mode |
| 8 | Config/route/view caching | `php artisan optimize` |

### Clear Cache Saat Development
```bash
php artisan optimize:clear    # Hapus semua cache
php artisan cache:clear       # Hapus cache data saja
```

---

## Tips Pengembangan

### N+1 Query Prevention
- Selalu gunakan `->with(['relation1', 'relation2'])` saat query
- Cek `TicketResource.php` — field yang dipakai di resource harus di-eager-load
- Gunakan Laravel Debugbar untuk development (opsional)

### Menambah Role Baru
1. Jalankan: `php artisan permission:create-role nama_role`
2. Assign ke user: `$user->assignRole('nama_role')`
3. Update route middleware: `role:staff|admin|nama_role`

### Menambah Halaman Baru (Inertia)
1. Buat file `.tsx` di `resources/js/Pages/Admin/` atau `Portal/`
2. Buat controller method yang return `Inertia::render('Admin/NamaPage', [...])`
3. Tambah route di `routes/web.php`
4. Nama page = path relatif dari `Pages/` tanpa `.tsx`

---

## Backlog Fase 2

| Fitur | Deskripsi |
|-------|-----------|
| Notifikasi Email | Kirim email saat tiket diupdate (gunakan Mail facade Laravel) |
| Export Excel | Export tiket ke Excel (gunakan `maatwebsite/excel`) |
| Riwayat Tiket Customer | Sidebar riwayat tiket customer di halaman detail tiket |
| Reopen Tiket | Customer bisa buka kembali tiket resolved/closed |
| Preview Lampiran | Pratinjau gambar/PDF di modal |
| Dark Mode | Toggle dark/light dengan Tailwind `dark:` class |
| Search Knowledge Base | Full-text search di halaman knowledge base |
