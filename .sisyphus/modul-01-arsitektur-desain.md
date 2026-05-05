# DOKUMENTASI SISTEM HELPDESK TICKETING

**Versi Dokumen:** 1.0  
**Tanggal:** 5 Mei 2026  
**Bahasa:** Indonesia  
**Framework:** Laravel 13 + React 19 + Inertia.js  

---

## DAFTAR ISI

1. [BAB 1: Arsitektur Sistem](#bab-1-arsitektur-sistem)
   - 1.1 Jenis Arsitektur
   - 1.2 Diagram Arsitektur
   - 1.3 Komponen Docker
2. [BAB 2: Desain Sistem](#bab-2-desain-sistem)
   - 2.1 Use Case Diagram
   - 2.2 Activity Diagram — Alur Tiket
   - 2.3 Activity Diagram — Autentikasi
   - 2.4 Database Design
3. [BAB 3: Implementasi Fitur](#bab-3-implementasi-fitur)
   - 3.1 Fitur Utama 1: Manajemen Tiket (Ticket Management)
   - 3.2 Fitur Utama 2: Dashboard & Prioritas Tiket (SAW)
4. [BAB 4: Algoritma](#bab-4-algoritma)
   - 4.1 Algoritma SAW (Simple Additive Weighting)
   - 4.2 Algoritma Pencarian (Search)
   - 4.3 Algoritma Autentikasi
   - 4.4 Algoritma Notifikasi
5. [BAB 5: Cuplikan Coding](#bab-5-cuplikan-coding)
   - 5.1 Service Layer — TicketService::createTicket()
   - 5.2 SAW Algorithm — calculateScores()
   - 5.3 Middleware — HandleInertiaRequests::share()
   - 5.4 Controller — Portal/TicketController
   - 5.5 React Component — Icon.tsx
   - 5.6 React Component — AppShell.tsx
   - 5.7 API Controller
6. [BAB 6: Pengujian Sistem](#bab-6-pengujian-sistem)
   - 6.1 Metode Testing
   - 6.2 White Box Testing
   - 6.3 Hasil Pengujian
7. [BAB 7: Kendala dan Solusi](#bab-7-kendala-dan-solusi)
   - 7.1 Kendala Teknis
   - 7.2 Kendala Non-Teknis
8. [BAB 8: Analisis dan Evaluasi](#bab-8-analisis-dan-evaluasi)
   - 8.1 Efektivitas Solusi
   - 8.2 Kelebihan Sistem
   - 8.3 Kekurangan Sistem
   - 8.4 Perbandingan dengan Metode Lain
   - 8.5 Usulan Pengembangan
9. [LAMPIRAN](#lampiran)
   - A. Daftar Route Lengkap
   - B. Daftar Tabel Database
   - C. Daftar File Test
   - D. Tech Stack Lengkap

---

## BAB 1: ARSITEKTUR SISTEM

### 1.1 Jenis Arsitektur

Sistem Helpdesk Ticketing ini mengadopsi arsitektur **Monolithic SPA (Single Page Application)**. Meskipun bersifat monolitik pada sisi backend, arsitektur ini menerapkan pemisahan yang jelas antara frontend dan backend melalui pola sebagai berikut:

**Backend:**
- **Laravel 13** sebagai framework PHP monolitik yang menangani seluruh logika bisnis, routing, autentikasi, otorisasi, dan manajemen database.
- **PHP 8.3** sebagai runtime environment.
- **MySQL 8.0** sebagai database relasional utama.
- **Redis 7** sebagai driver cache, session, dan queue.

**Frontend:**
- **React 19** sebagai library UI untuk membangun antarmuka pengguna yang interaktif.
- **Inertia.js v3** sebagai jembatan antara backend Laravel dan frontend React, memungkinkan pembangunan SPA tanpa perlu REST API terpisah untuk komunikasi internal.
- **Tailwind CSS v4** sebagai framework utility-first untuk styling.
- **Vite 8** sebagai build tool dan dev server.

**Pola Komunikasi:**
- Frontend React berkomunikasi dengan backend Laravel **melalui Inertia.js**, bukan melalui REST API terpisah. Inertia.js mengirimkan request ke Laravel sebagai request HTTP standar, dan Laravel merespons dengan props yang dirender oleh React. Ini menghilangkan kebutuhan untuk membangun API layer khusus untuk frontend internal.
- **REST API terpisah** disediakan melalui Laravel Sanctum (`/api/v1/*`) untuk keperluan mobile client atau integrasi eksternal.

Dengan demikian, arsitektur ini dapat dikategorikan sebagai **Monolithic SPA with Internal Ajax Bridge (Inertia.js) + External REST API**, yang menggabungkan kesederhanaan arsitektur monolitik dengan pengalaman pengguna SPA modern.

### 1.2 Diagram Arsitektur

Berikut adalah diagram arsitektur sistem dalam bentuk diagram teks:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────┬───────────────────────────────────────────┤
│   Browser (SPA via Inertia)    │    External API Clients (Mobile, dst.)    │
│   React 19 + Tailwind CSS v4   │    REST Client / Mobile App               │
└──────────────┬──────────────────┴─────────────────┬─────────────────────────┘
               │ HTTP Requests (Inertia.js)         │ REST API (JSON)
               │                                    │ Bearer Token (Sanctum)
               ▼                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          WEB SERVER / REVERSE PROXY                           │
│                         Nginx (stable-alpine) :8000                           │
│  - Melayani static assets (CSS, JS, images)                                   │
│  - Reverse proxy ke PHP-FPM container                                         │
│  - Reverse proxy /api/* ke Laravel                                            │
└──────────────────────────────┬───────────────────────────────────────────────┘
                               │ PHP-FPM FastCGI
                               ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        APPLICATION SERVER (Laravel 13)                        │
│                      PHP-FPM 8.3 Container (app:9000)                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Middleware Pipeline                                                  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │ StartSession │→│ Authenticate  │→│HandleInertia  │→ Controller   │   │
│  │  │ (Redis)      │  │ (Session)    │  │ (Shared Props)│                │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Service Layer                                                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌────────────────┐ ┌──────────────┐ │   │
│  │  │TicketService│ │SawService   │ │DashboardService│ │CommentService│ │   │
│  │  │(394 lines)  │ │(189 lines)  │ │(128 lines)     │ │(79 lines)    │ │   │
│  │  └─────────────┘ └─────────────┘ └────────────────┘ └──────────────┘ │   │
│  │  ┌─────────────────┐                                                  │   │
│  │  │NotificationSvc  │  (49 lines)                                      │   │
│  │  └─────────────────┘                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────┬───────────────┬──────────────────────┬────────────────────────────────┘
       │               │                      │
       ▼               ▼                      ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────┐
│  MySQL 8.0   │ │  Redis 7     │ │  Queue Worker (Redis Queue)  │
│  Database    │ │  Cache +     │ │  php artisan queue:work      │
│  (db:3306)   │ │  Session +   │ │  --tries=3 --max-jobs=1000  │
│              │ │  Queue       │ │                              │
└──────────────┘ └──────────────┘ └──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         DEVELOPMENT TOOLS (Opsional)                          │
│  ┌────────────────────────────────┐                                          │
│  │  Vite Dev Server (Node 22)    │                                          │
│  │  Hot Module Replacement       │                                          │
│  │  :5173                        │                                          │
│  └────────────────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Aliran Request:**

1. **SPA Request (Browser → Inertia.js):** Browser mengirim request HTTP ke Nginx (port 8000). Nginx meneruskan ke PHP-FPM. Laravel memproses request, menjalankan middleware (sesi, autentikasi, Inertia), mengeksekusi controller, dan mengembalikan respons Inertia berisi props JSON + URL komponen React. React merender halaman secara client-side.

2. **API Request (Mobile/External):** Client mengirim request dengan Bearer token Sanctum ke `/api/v1/*`. Nginx meneruskan ke Laravel. Sanctum memvalidasi token, dan controller API mengembalikan respons JSON.

3. **Static Assets:** Nginx melayani file CSS/JS hasil build Vite langsung dari filesystem tanpa melalui PHP-FPM.

4. **Queue Jobs:** Queue worker berjalan sebagai container terpisah, memproses job dari Redis queue secara asynchronous.

### 1.3 Komponen Docker

Sistem menggunakan **Docker Compose** dengan 6 layanan (services) sebagai berikut:

| No | Service | Image | Container | Port | Deskripsi |
|----|---------|-------|-----------|------|-----------|
| 1 | **app** | Custom Dockerfile (PHP 8.3 FPM) | `helpdesk-app` | 9000 (internal) | Application server yang menjalankan PHP-FPM 8.3 dengan seluruh dependensi Laravel |
| 2 | **nginx** | `nginx:stable-alpine` | `helpdesk-nginx` | **8000:80** | Web server + reverse proxy. Meneruskan request ke app container dan melayani static assets |
| 3 | **db** | `mysql:8.0` | `helpdesk-db` | 3306:3306 | Database server MySQL 8.0 dengan healthcheck dan persistent volume |
| 4 | **redis** | `redis:7-alpine` | `helpdesk-redis` | 6379:6379 | In-memory data store untuk cache, session, dan queue driver |
| 5 | **queue** | Custom Dockerfile (sama dengan app) | `helpdesk-queue` | - | Queue worker yang memproses job dari Redis queue (`php artisan queue:work redis`) |
| 6 | **vite** | `node:22-alpine` | `helpdesk-vite` | 5173:5173 | Vite development server dengan Hot Module Replacement (HMR). Hanya aktif dengan profile `dev` (`docker compose --profile dev up vite`) |

**Volume Persisten:**
- `db-data`: Menyimpan data MySQL secara persisten
- `redis-data`: Menyimpan data Redis secara persisten
- `app-storage`: Menyimpan file upload dan log Laravel
- `vite-node-modules`: Menyimpan node_modules terpisah untuk Vite container

**Network:** Semua layanan terhubung melalui network `app-network` (bridge driver).

---

## BAB 2: DESAIN SISTEM

### 2.1 Use Case Diagram

Sistem Helpdesk Ticketing memiliki dua aktor utama: **Customer (Pelapor)** dan **Staff/Admin**.

#### Aktor 1: Customer (Pelapor)

Use case yang dapat dilakukan oleh Customer:

| No | Use Case | Deskripsi |
|----|----------|-----------|
| UC-01 | **Register** | Mendaftarkan akun baru sebagai pelapor |
| UC-02 | **Login** | Masuk ke sistem menggunakan email dan password |
| UC-03 | **Lihat Dashboard** | Melihat dashboard portal dengan statistik tiket pribadi (total, open, in_progress, resolved) |
| UC-04 | **Buat Tiket** | Membuat tiket baru dengan memilih kategori, judul, deskripsi, prioritas, dan attachment |
| UC-05 | **Lihat Tiket** | Melihat daftar tiket yang pernah dibuat dengan filter status, prioritas, dan pencarian |
| UC-06 | **Lihat Detail Tiket** | Melihat detail tiket beserta komentar dan log aktivitas |
| UC-07 | **Komentar Tiket** | Menambahkan komentar pada tiket yang masih aktif (open/in_progress) |
| UC-08 | **Batalkan Tiket** | Membatalkan tiket yang belum selesai (status open atau in_progress) |
| UC-09 | **Konfirmasi Resolusi** | Menyetujui penyelesaian tiket oleh staff (mengubah status menjadi closed) |
| UC-10 | **Tolak Resolusi** | Menolak penyelesaian tiket dengan memberikan alasan (mengembalikan ke in_progress) |
| UC-11 | **Beri Rating** | Memberikan rating 1-5 pada tiket yang sudah resolved |
| UC-12 | **Baca Knowledge Base** | Membaca artikel knowledge base yang dipublikasikan |
| UC-13 | **Lihat Notifikasi** | Melihat dan menandai notifikasi yang sudah dibaca |

#### Aktor 2: Staff/Admin

Use case yang dapat dilakukan oleh Staff/Admin:

| No | Use Case | Deskripsi |
|----|----------|-----------|
| UC-14 | **Login** | Masuk ke sistem dan otomatis diarahkan ke dashboard admin |
| UC-15 | **Lihat Dashboard Admin** | Melihat statistik sistem (total tiket, per status, overdue), grafik prioritas/status, beban kerja staff |
| UC-16 | **Lihat Daftar Tiket** | Melihat semua tiket dengan filter status, prioritas, kategori, pencarian, dan skor prioritas SAW |
| UC-17 | **Lihat Detail Tiket** | Melihat detail tiket termasuk komentar internal dan log aktivitas |
| UC-18 | **Update Tiket** | Mengubah status, prioritas, kategori, assignee, judul, dan deskripsi tiket |
| UC-19 | **Tambah Komentar** | Menambahkan komentar publik atau internal (hanya untuk staff) pada tiket |
| UC-20 | **Kelola User** | CRUD data pengguna (index, store, update, destroy) |
| UC-21 | **Kelola Kategori** | CRUD data kategori tiket |
| UC-22 | **Kelola Knowledge Base** | CRUD artikel knowledge base (create, edit, publish, unpublish) |
| UC-23 | **Kelola Departemen** | CRUD data departemen |
| UC-24 | **Lihat Notifikasi** | Melihat dan menandai notifikasi yang sudah dibaca |

### 2.2 Activity Diagram — Alur Tiket

Berikut adalah alur lengkap siklus hidup tiket dalam bentuk flowchart teks:

```
                          ┌──────────────────────┐
                          │  Customer Membuat     │
                          │  Tiket Baru           │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │  Status: "open"       │
                          │  (Tiket menunggu      │
                          │   diproses staff)     │
                          └──────────┬───────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ Staff Ambil/ │  │ Customer     │  │ Tidak Ada    │
          │ Proses Tiket │  │ Batalkan     │  │ Aktivitas    │
          │ (assign)     │  │ Tiket        │  │              │
          └──────┬───────┘  └──────┬───────┘  └──────────────┘
                 │                 │
                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐
          │ Status:      │  │ Status:      │
          │ "in_progress"│  │ "cancelled"  │
          │ (Staff       │  │ (SELESAI)    │
          │  mengerjakan)│  └──────────────┘
          └──────┬───────┘
                 │
      ┌──────────┼──────────┐
      │          │          │
      ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Staff    │ │ Customer │ │ Customer │
│ Selesai- │ │ Batalkan │ │ Batalkan │
│ kan      │ │          │ │          │
└────┬─────┘ └────┬─────┘ └──────────┘
     │            │
     ▼            ▼
┌──────────┐ ┌──────────┐
│ Status:  │ │ Status:  │
│"resolved"│ │"cancelled"│
│(Menunggu │ │(SELESAI) │
│ konfirm) │ └──────────┘
└────┬─────┘
     │
┌────┼────────────┐
│    │            │
▼    ▼            ▼
┌────────┐  ┌──────────────┐  ┌──────────────┐
│Customer│  │ Customer     │  │ Tidak Ada    │
│Konfir- │  │ Tolak        │  │ Aktivitas    │
│masi    │  │ Resolusi     │  │              │
└───┬────┘  └──────┬───────┘  └──────────────┘
    │              │
    ▼              ▼
┌──────────┐  ┌──────────────┐
│ Status:  │  │ Status:      │
│ "closed" │  │ "in_progress"│
│(SELESAI) │  │ (Dibuka      │
└──────────┘  │  kembali)    │
              └──────────────┘
                   │
                   └──► Kembali ke tahap Staff Mengerjakan
```

**Penjelasan Alur:**

1. **Customer membuat tiket** melalui halaman portal. Sistem menyimpan tiket dengan status awal `open`.
2. **Staff mengambil tiket** dari daftar dan meng-assign ke dirinya sendiri atau staff lain. Status berubah menjadi `in_progress`.
3. **Staff menyelesaikan tiket** setelah masalah terselesaikan. Status berubah menjadi `resolved`. Tiket menunggu konfirmasi dari customer.
4. **Customer mengkonfirmasi resolusi** — status berubah menjadi `closed` (tiket selesai permanen).
5. **ATAU Customer menolak resolusi** — status kembali ke `in_progress`. Staff harus meninjau ulang dan memperbaiki.
6. **Customer dapat membatalkan tiket** kapan saja saat status `open` atau `in_progress`. Status berubah menjadi `cancelled`.

### 2.3 Activity Diagram — Autentikasi

Berikut adalah flowchart proses autentikasi pengguna:

```
                    ┌──────────────────────────┐
                    │  User Mengakses Aplikasi  │
                    │  (GET /)                  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Cek: Apakah User        │
                    │  Sudah Login?            │
                    └──────┬──────────┬────────┘
                           │ YA       │ TIDAK
                           ▼          ▼
              ┌─────────────────┐  ┌─────────────────┐
              │ Cek Role User   │  │ Redirect ke      │
              │ (Spatie)        │  │ Halaman Login    │
              └────┬───────┬────┘  │ (GET /login)     │
                   │       │       └────────┬────────┘
                   ▼       ▼                │
          ┌──────────┐ ┌──────────┐         ▼
          │ staff    │ │ customer │  ┌─────────────────┐
          └────┬─────┘ └────┬─────┘  │ User Input       │
               │            │        │ Email + Password │
               ▼            ▼        └────────┬────────┘
┌────────────────────┐ ┌──────────────┐       │
│ Redirect ke        │ │ Redirect ke  │       ▼
│ Admin Dashboard    │ │ Portal       │  ┌─────────────────┐
│ (admin/dashboard)  │ │ Dashboard    │  │ Validasi         │
└────────────────────┘ │ (portal/     │  │ Credentials      │
                       │  dashboard)  │  │ (bcrypt check)   │
                       └──────────────┘  └────────┬────────┘
                                                   │
                                        ┌──────────┼──────────┐
                                        │ VALID    │          │ INVALID
                                        ▼          │          ▼
                              ┌──────────────┐    │  ┌──────────────┐
                              │ Regenerate   │    │  │ Kembali ke   │
                              │ Session ID   │    │  │ Login dengan │
                              │ (security)   │    │  │ Error Message│
                              └──────┬───────┘    │  └──────────────┘
                                     │            │
                                     ▼            │
                              ┌──────────────┐    │
                              │ Cek Role     │    │
                              │ User (Spatie)│    │
                              └──┬───────┬───┘    │
                                 │       │        │
                                 ▼       ▼        │
                          staff    customer       │
                          │        │              │
                          ▼        ▼              │
                    ┌──────────┐ ┌──────────┐     │
                    │ Redirect │ │ Redirect │     │
                    │ /admin/  │ │ /portal/ │     │
                    │dashboard │ │dashboard │     │
                    └──────────┘ └──────────┘     │
                                                  │
                                                  ▼
                                     (Kembali ke User Input)
```

**Detail Teknis Autentikasi:**

- Sistem menggunakan **Laravel Breeze** (starter kit) untuk scaffolding autentikasi.
- **Session-based authentication** — tidak menggunakan JWT atau token untuk web login.
- **bcrypt hashing** untuk penyimpanan password.
- **Role-based redirect** — setelah login, sistem memeriksa role user (`staff` atau `customer`) menggunakan Spatie Laravel-Permission, lalu mengarahkan ke dashboard yang sesuai.
- **Middleware role Spatie** digunakan pada route groups untuk memastikan hanya user dengan role yang tepat dapat mengakses endpoint tertentu.
- **Session regeneration** setelah login untuk mencegah session fixation attack.

### 2.4 Database Design

#### 2.4.1 ERD / Relasi Tabel

Sistem memiliki 8 tabel utama (ditambah tabel-tabel RBAC dari Spatie Permission dan tabel infrastruktur Laravel). Berikut adalah relasi antar tabel:

```
┌─────────────────────┐       ┌──────────────────────┐
│    departments      │       │     categories       │
├─────────────────────┤       ├──────────────────────┤
│ id (PK)             │       │ id (PK)              │
│ name                │       │ name                 │
│ slug (UNIQUE)       │       │ slug (UNIQUE)        │
│ created_at          │       │ description          │
│ updated_at          │       │ created_at           │
└──────┬──────────────┘       │ updated_at           │
       │                      └──────────┬───────────┘
       │ 1:N                           │ 1:N
       │                               │
       ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         users                                   │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                         │
│ name, email (UNIQUE), password, phone                           │
│ department (string), employee_number, position                  │
│ department_id (FK → departments)                                │
│ email_verified_at, remember_token, created_at, updated_at       │
└──┬───────────────┬───────────────┬───────────────┬─────────────┘
   │ 1:N           │ 1:N           │ 1:N           │ 1:N
   │ (reporter)    │ (assignee)    │ (author)      │ (commenter)
   ▼               ▼               ▼               ▼
┌──────────┐  ┌──────────┐  ┌────────────────┐  ┌──────────────┐
│ tickets  │  │ tickets  │  │knowledge_bases │  │  comments    │
│.user_id  │  │.assigned │  │.author_id      │  │  .user_id    │
│          │  │  _to     │  └────────────────┘  └──────────────┘
└──────────┘  └──────────┘
                                                                  
┌─────────────────────────────────────────────────────────────────┐
│                        tickets                                  │
├─────────────────────────────────────────────────────────────────┤
│ id (PK), uuid (UNIQUE)                                         │
│ user_id (FK → users)                ← Pelapor                  │
│ category_id (FK → categories)       ← Kategori                 │
│ title (string)                                                 │
│ description (text)                                              │
│ priority (ENUM: low/medium/high/critical)                      │
│ status (ENUM: open/in_progress/resolved/closed/cancelled)      │
│ assigned_to (FK → users, nullable)   ← Staff yang ditugaskan   │
│ sla_deadline (datetime, nullable)                              │
│ resolved_at (datetime, nullable)                               │
│ resolved_confirmed_at (timestamp, nullable)                    │
│ cancelled_at (datetime, nullable)                              │
│ rating (unsignedTinyInteger, nullable)                         │
│ rating_comment (text, nullable)                                │
│ created_at, updated_at                                         │
└──────┬──────────────────┬───────────────────────┐
       │ 1:N              │ 1:N                   │ 1:N
       ▼                  ▼                       ▼
┌──────────────┐  ┌─────────────────┐  ┌──────────────────────┐
│  comments    │  │ activity_logs   │  │  notifications       │
│  .ticket_id  │  │ .ticket_id      │  │  (morph: notifiable) │
└──────────────┘  └─────────────────┘  └──────────────────────┘

┌──────────────────────┐     ┌────────────────────────────┐
│     comments         │     │    activity_logs           │
├──────────────────────┤     ├────────────────────────────┤
│ id (PK)              │     │ id (PK)                    │
│ ticket_id (FK)       │     │ user_id (FK, nullable)     │
│ user_id (FK)         │     │ ticket_id (FK, nullable)   │
│ message (text)       │     │ action (string)            │
│ is_internal (boolean)│     │ description (text, null.)   │
│ attachments (json)   │     │ created_at, updated_at     │
│ created_at, updated_at│    └────────────────────────────┘
└──────────────────────┘

┌──────────────────────────────┐     ┌────────────────────────────┐
│     knowledge_bases          │     │  saw_configurations        │
├──────────────────────────────┤     ├────────────────────────────┤
│ id (PK)                      │     │ id (PK)                    │
│ title (string)               │     │ code (string, UNIQUE)     │
│ slug (string, UNIQUE)        │     │ name (string)              │
│ content (longText)           │     │ type (string: benefit/cost)│
│ category_id (FK, nullable)   │     │ weight (decimal, 5,4)      │
│ author_id (FK → users)       │     │ sort_order (integer)       │
│ is_published (boolean)       │     │ created_at, updated_at     │
│ created_at, updated_at       │     └────────────────────────────┘
└──────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│              SPATIE RBAC TABLES (Laravel Permission)             │
├──────────────────────────────────────────────────────────────────┤
│ permissions                    roles                             │
│ ───────────                    ─────                             │
│ id (PK)                        id (PK)                           │
│ name (string)                  name (string)                     │
│ guard_name (string)            guard_name (string)               │
│ created_at, updated_at         created_at, updated_at            │
│                                                                  │
│ model_has_permissions          model_has_roles                   │
│ ─────────────────────          ───────────────                   │
│ permission_id (FK)             role_id (FK)                      │
│ model_type (string)            model_type (string)               │
│ model_id (bigint)              model_id (bigint)                 │
│                                                                  │
│ role_has_permissions                                            │
│ ───────────────────                                             │
│ permission_id (FK)                                              │
│ role_id (FK)                                                    │
└──────────────────────────────────────────────────────────────────┘
```

**Relasi Utama:**
- **users → tickets** (1:N, `user_id`): Seorang user (customer) dapat membuat banyak tiket.
- **users → tickets** (1:N, `assigned_to`): Seorang user (staff) dapat ditugaskan ke banyak tiket.
- **users → comments** (1:N): Seorang user dapat membuat banyak komentar.
- **users → activity_logs** (1:N): Seorang user dapat memiliki banyak log aktivitas.
- **users → knowledge_bases** (1:N, `author_id`): Seorang user (staff) dapat menulis banyak artikel.
- **categories → tickets** (1:N): Satu kategori memiliki banyak tiket.
- **categories → knowledge_bases** (1:N, nullable): Satu kategori memiliki banyak artikel.
- **departments → users** (1:N): Satu departemen memiliki banyak user.
- **tickets → comments** (1:N): Satu tiket memiliki banyak komentar.
- **tickets → activity_logs** (1:N): Satu tiket memiliki banyak log aktivitas.

#### 2.4.2 Spesifikasi Tabel Utama

##### Tabel: `users`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(255) | NOT NULL | Nama lengkap pengguna |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Alamat email untuk login |
| `email_verified_at` | TIMESTAMP | NULLABLE | Waktu verifikasi email |
| `password` | VARCHAR(255) | NOT NULL | Password terenkripsi (bcrypt) |
| `phone` | VARCHAR(255) | NULLABLE | Nomor telepon pengguna |
| `department` | VARCHAR(255) | NULLABLE | Nama departemen (string legacy) |
| `employee_number` | VARCHAR(255) | NULLABLE | Nomor induk pegawai (staff) |
| `position` | VARCHAR(255) | NULLABLE | Jabatan (staff) |
| `department_id` | BIGINT UNSIGNED | NULLABLE, FK → departments | Foreign key ke tabel departments |
| `remember_token` | VARCHAR(100) | NULLABLE | Token "remember me" |
| `created_at` | TIMESTAMP | NULLABLE | Waktu pembuatan record |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan record |

##### Tabel: `tickets`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `uuid` | CHAR(36) | NOT NULL, UNIQUE | UUID unik untuk referensi publik |
| `user_id` | BIGINT UNSIGNED | NOT NULL, FK → users, CASCADE ON DELETE | ID pelapor (customer) |
| `category_id` | BIGINT UNSIGNED | NOT NULL, FK → categories, RESTRICT ON DELETE | ID kategori tiket |
| `title` | VARCHAR(255) | NOT NULL | Judul tiket |
| `description` | TEXT | NOT NULL | Deskripsi detail tiket |
| `priority` | ENUM | NOT NULL, DEFAULT 'medium' | Prioritas: low, medium, high, critical |
| `status` | ENUM | NOT NULL, DEFAULT 'open' | Status: open, in_progress, resolved, closed, cancelled |
| `assigned_to` | BIGINT UNSIGNED | NULLABLE, FK → users, NULL ON DELETE | Staff yang ditugaskan |
| `sla_deadline` | DATETIME | NULLABLE | Batas waktu SLA untuk penyelesaian |
| `resolved_at` | DATETIME | NULLABLE | Waktu tiket diselesaikan (resolved) |
| `resolved_confirmed_at` | TIMESTAMP | NULLABLE | Waktu customer mengkonfirmasi resolusi |
| `cancelled_at` | DATETIME | NULLABLE | Waktu tiket dibatalkan |
| `rating` | TINYINT UNSIGNED | NULLABLE | Rating 1-5 dari pelapor |
| `rating_comment` | TEXT | NULLABLE | Komentar rating |
| `created_at` | TIMESTAMP | NULLABLE | Waktu pembuatan tiket |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan tiket |

##### Tabel: `comments`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `ticket_id` | BIGINT UNSIGNED | NOT NULL, FK → tickets, CASCADE ON DELETE | Tiket terkait |
| `user_id` | BIGINT UNSIGNED | NOT NULL, FK → users, CASCADE ON DELETE | Pengguna yang berkomentar |
| `message` | TEXT | NOT NULL | Isi komentar |
| `is_internal` | BOOLEAN | NOT NULL, DEFAULT false | Flag komentar internal (hanya staff) |
| `attachments` | JSON | NULLABLE | Array path file attachment |
| `created_at` | TIMESTAMP | NULLABLE | Waktu komentar dibuat |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu komentar diperbarui |

##### Tabel: `categories`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(255) | NOT NULL | Nama kategori |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly slug |
| `description` | TEXT | NULLABLE | Deskripsi kategori |
| `created_at` | TIMESTAMP | NULLABLE | Waktu pembuatan |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan |

##### Tabel: `departments`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `name` | VARCHAR(255) | NOT NULL | Nama departemen |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly slug |
| `created_at` | TIMESTAMP | NULLABLE | Waktu pembuatan |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan |

##### Tabel: `knowledge_bases`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `title` | VARCHAR(255) | NOT NULL | Judul artikel |
| `slug` | VARCHAR(255) | NOT NULL, UNIQUE | URL-friendly slug |
| `content` | LONGTEXT | NOT NULL | Konten artikel |
| `category_id` | BIGINT UNSIGNED | NULLABLE, FK → categories, NULL ON DELETE | Kategori artikel |
| `author_id` | BIGINT UNSIGNED | NOT NULL, FK → users, CASCADE ON DELETE | Penulis artikel |
| `is_published` | BOOLEAN | NOT NULL, DEFAULT false | Status publikasi |
| `created_at` | TIMESTAMP | NULLABLE | Waktu pembuatan |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan |

##### Tabel: `activity_logs`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `user_id` | BIGINT UNSIGNED | NULLABLE, FK → users, NULL ON DELETE | Pengguna yang melakukan aksi |
| `ticket_id` | BIGINT UNSIGNED | NULLABLE, FK → tickets, NULL ON DELETE | Tiket terkait |
| `action` | VARCHAR(255) | NOT NULL | Jenis aksi (created, updated, cancelled, dll.) |
| `description` | TEXT | NULLABLE | Deskripsi detail aksi |
| `created_at` | TIMESTAMP | NULLABLE | Waktu aksi |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan |

##### Tabel: `notifications`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | CHAR(36) | PK (UUID) | Primary key UUID |
| `type` | VARCHAR(255) | NOT NULL | Nama class notifikasi (FQCN) |
| `notifiable_type` | VARCHAR(255) | NOT NULL | Tipe model penerima notifikasi |
| `notifiable_id` | BIGINT UNSIGNED | NOT NULL | ID model penerima notifikasi |
| `data` | TEXT | NOT NULL | Data notifikasi (JSON serialized) |
| `read_at` | TIMESTAMP | NULLABLE | Waktu notifikasi dibaca |
| `created_at` | TIMESTAMP | NULLABLE | Waktu notifikasi dibuat |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan |

##### Tabel: `saw_configurations`

| Nama Field | Tipe Data | Constraint | Deskripsi |
|------------|-----------|------------|-----------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| `code` | VARCHAR(255) | NOT NULL, UNIQUE | Kode kriteria (C1, C2, C3, C4, C5) |
| `name` | VARCHAR(255) | NOT NULL | Nama kriteria |
| `type` | VARCHAR(255) | NOT NULL | Tipe kriteria: benefit atau cost |
| `weight` | DECIMAL(5,4) | NOT NULL, DEFAULT 0 | Bobot kriteria (0.0000 - 0.9999) |
| `sort_order` | INTEGER | NOT NULL, DEFAULT 0 | Urutan tampilan |
| `created_at` | TIMESTAMP | NULLABLE | Waktu pembuatan |
| `updated_at` | TIMESTAMP | NULLABLE | Waktu pembaruan |

#### 2.4.3 Tabel RBAC (Spatie Permission)

Sistem menggunakan package **Spatie Laravel-Permission v7.3** untuk manajemen Role-Based Access Control (RBAC). Terdapat 2 role utama: `customer` dan `staff`.

**Tabel RBAC:**

| Tabel | Deskripsi |
|-------|-----------|
| `permissions` | Daftar permission yang tersedia (contoh: `view tickets`, `create tickets`, `update tickets`, `delete tickets`, dll.) |
| `roles` | Daftar role: `customer`, `staff` |
| `model_has_permissions` | Mapping permission langsung ke model User (many-to-many polymorphic) |
| `model_has_roles` | Mapping role ke model User (many-to-many polymorphic). Satu user memiliki satu role: customer ATAU staff. |
| `role_has_permissions` | Mapping permission ke role (many-to-many) |

**Role dan Permission:**

| Role | Permissions |
|------|-------------|
| **customer** | Dapat mengakses area portal. Membuat tiket, melihat tiket sendiri, berkomentar, membatalkan, konfirmasi, memberi rating. |
| **staff** | Dapat mengakses area admin. Melihat semua tiket, mengupdate tiket, mengelola pengguna, kategori, knowledge base, departemen. |

---

