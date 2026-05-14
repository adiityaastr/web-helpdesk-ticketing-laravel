# Arsitektur Sistem - Helpdesk Ticketing System

## 🏗️ Tipe Arsitektur

**Monolithic Architecture** dengan **Client-Server Model**

Sistem dibangun sebagai satu aplikasi monolithic yang menggabungkan backend (Laravel) dan frontend (React) melalui Inertia.js bridge, tanpa memerlukan API terpisah.

---

## 📊 Diagram Arsitektur

Lihat file: `diagrams/01_arsitektur_sistem.puml`

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Browser (Chrome, Firefox, Safari, Edge)            │   │
│  │  - React 19 Components                              │   │
│  │  - Tailwind CSS Styling                             │   │
│  │  - Inertia.js Client                                │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Apache (XAMPP) / php artisan serve                  │   │
│  │  - Web Server                                       │   │
│  │  - Static Assets (CSS, JS, Images)                  │   │
│  │  - SSL/TLS Termination (production)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PHP 8.3 (Application Server)                       │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Laravel 13 Framework                          │ │   │
│  │  │  - Routing & Controllers                       │ │   │
│  │  │  - Inertia.js Response                         │ │   │
│  │  │  - Business Logic                              │ │   │
│  │  │  - Middleware & Policies                       │ │   │
│  │  │  - Event Handling                              │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Services & Repositories                       │ │   │
│  │  │  - SawService (Scoring)                        │ │   │
│  │  │  - NotificationService                         │ │   │
│  │  │  - TicketRepository                            │ │   │
│  │  └────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  DATA LAYER  │  │ CACHE LAYER  │  │ QUEUE LAYER  │
│              │  │              │  │              │
│ MySQL 8.0    │  │ File Cache   │  │ Sync Queue   │
│ (XAMPP)      │  │              │  │              │
│ - Users      │  │ - Sessions   │  │ - Notif      │
│ - Tickets    │  │ - Cache      │  │ - Sync Ops   │
│ - Comments   │  │ - SAW Scores │  │              │
│ - Categories │  │              │  │              │
│ - Departments│  │              │  │              │
│ - etc        │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 🔧 Komponen Utama

### 1. **Frontend Layer** (Client-side)

#### React 19
- **Fungsi**: UI rendering & interaksi user
- **Komponen**: 15+ reusable components
- **State Management**: React Hooks + Context API
- **Styling**: Tailwind CSS 4

#### Inertia.js 3
- **Fungsi**: Bridge antara Laravel & React
- **Cara Kerja**: Server render props → React component
- **Keuntungan**: No separate API, full-stack framework feel

#### Vite 8
- **Fungsi**: Build tool & dev server
- **Fitur**: Hot Module Replacement (HMR), fast build
- **Output**: Optimized bundle untuk production

---

### 2. **Web Server Layer**

#### Apache (XAMPP) / php artisan serve
- **Fungsi**: Web server, static assets
- **Konfigurasi**:
  - Listen port 80 (Apache) atau 8000 (artisan serve)
  - Serve static assets (CSS, JS, images)
  - mod_rewrite untuk Laravel routing

---

### 3. **Application Layer**

#### Laravel 13 Framework
- **Routing**: Web routes (Inertia) + API routes (Sanctum)
- **Controllers**: 8 controller untuk berbagai fitur
- **Models**: 8 model dengan relationship
- **Middleware**: Auth, role, permission checking
- **Policies**: Authorization logic per model

#### Key Services
- **SawService**: Hitung skor SAW
- **NotificationService**: Kirim notifikasi
- **TicketService**: Business logic tiket
- **AuthService**: Authentication & authorization

#### Queue System
- **Driver**: Sync (synchronous)
- **Processing**: Langsung diproses saat request

---

### 4. **Database Layer**

#### MySQL 8.0 (via XAMPP)
- **Charset**: utf8mb4 (support emoji)
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB (transaction support)
- **Tabel**: 9 tabel utama + pivot tables
- **User**: root (tanpa password)

#### Indexing Strategy
- Primary key pada semua tabel
- Foreign key untuk relasi
- Composite index pada kolom yang sering di-filter
- Unique index pada email, slug

---

### 5. **Cache Layer**

#### File Cache
- **Session Storage**: Simpan session user di file
- **Cache Store**: Cache query result, SAW scores di file
- **Driver**: File-based (storage/framework/cache)

#### Cache Strategy
- SAW scores: 60 detik
- Dashboard stats: 300 detik
- Query result: 1 jam
- Session: 120 menit

---

### 6. **Queue Layer**

#### Sync Queue
- **Processing**: Synchronous (langsung diproses)
- **Notification**: Langsung dikirim saat event trigger
- **Keuntungan**: Simple, tidak perlu worker terpisah

---

## 🔄 Alur Request

### Alur 1: Buat Tiket (Synchronous)

```
1. User submit form di browser
   ↓
2. React component kirim POST request ke /tickets
   ↓
3. Apache/artisan serve terima request
   ↓
4. Laravel route handler (TicketController@store)
   ↓
5. Validasi input (StoreTicketRequest)
   ↓
6. Create Ticket di database
   ↓
7. Dispatch event TicketCreated
   ↓
8. Return Inertia response dengan props
   ↓
9. React render component dengan data baru
   ↓
10. Browser tampilkan success message
```

### Alur 2: Kirim Notifikasi (Synchronous)

```
1. Event TicketCreated di-dispatch
   ↓
2. Event listener trigger SendNotification
   ↓
3. Create Notification record di database
   ↓
4. Return response ke user
```

### Alur 3: Hitung SAW Score (Cached)

```
1. Request list tiket
   ↓
2. Check file cache untuk SAW scores
   ↓
3. Jika cache hit → return cached scores
   ↓
4. Jika cache miss:
   a. Ambil semua tiket dari database
   b. Hitung SAW score untuk setiap tiket
   c. Simpan ke file cache (60 detik)
   d. Return scores
   ↓
5. Sort tiket berdasarkan score
   ↓
6. Return ke frontend
```

---

## 🛠️ Technology Stack

### Backend
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Laravel | 13 |
| Language | PHP | 8.3 |
| Web Server | Apache (XAMPP) | 2.4 |
| App Server | PHP | 8.3 |
| Database | MySQL (XAMPP) | 8.0 |
| Cache | File | - |
| Queue | Sync | - |

### Frontend
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Library | React | 19 |
| Bridge | Inertia.js | 3 |
| Styling | Tailwind CSS | 4 |
| Build Tool | Vite | 8 |
| Charts | Chart.js | 4.5 |
| Language | TypeScript | 5 |

### DevOps
| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Local Server | XAMPP/Laragon | Latest |
| Testing | PHPUnit | 12 |
| E2E Testing | Playwright | 1.59 |

---

## 📊 Deployment Architecture

### Development
```
Local Machine (XAMPP/Laragon)
├── Apache (port 80) atau php artisan serve (port 8000)
├── MySQL (port 3306, user: root, no password)
├── PHP 8.3
├── Node.js + Vite Dev Server (port 5173)
└── File-based cache & session (storage/framework/)
```

### Production
```
Server
├── Apache (port 80/443)
├── PHP 8.3
├── MySQL (port 3306)
├── File-based cache & session
└── Monitoring (optional)
```

---

## 🔐 Security Architecture

### Authentication
- **Method**: Session-based + Token-based (Sanctum)
- **Password**: Bcrypt hashing
- **Session**: File storage, 120 menit lifetime

### Authorization
- **Method**: Role-Based Access Control (RBAC)
- **Roles**: staff, customer
- **Policies**: TicketPolicy untuk fine-grained control

### Data Protection
- **HTTPS**: SSL/TLS (production)
- **CSRF**: Token validation
- **SQL Injection**: Prepared statements
- **XSS**: HTML escaping

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless PHP**: Bisa scale multiple instances
- **File Session**: Bisa migrasi ke database session jika perlu scale
- **Database**: Master-slave replication (optional)
- **Load Balancer**: Apache upstream (optional)

### Vertical Scaling
- **PHP Memory**: 512MB per instance
- **MySQL Buffer Pool**: 256MB

### Performance Optimization
- **Database Indexing**: Composite indexes (status+priority, user_id+status)
- **Query Optimization**: Eager loading, select specific columns, pagination
- **Caching**: File cache (SAW scores 60s, dashboard 300s), OPcache (256MB)
- **CDN**: Static assets (optional)

### Monitoring & Observability
- **Application Monitoring**: Laravel Telescope (development)
- **Health Checks**: /health endpoint
- **Logging**: Log channel stack (single + daily)

---

## 🔐 Security Architecture

### Authentication
- **Method**: Session-based (web) + Token-based (Sanctum - API)
- **Password**: Bcrypt hashing (12 rounds)
- **Session**: File storage, 120 menit lifetime
- **Cookie**: Secure, httpOnly, SameSite

### Authorization
- **Method**: Role-Based Access Control (RBAC) via Spatie
- **Roles**: staff (full access), customer (own tickets)
- **Policies**: TicketPolicy untuk fine-grained control per model

### Data Protection
- **HTTPS**: SSL/TLS (production)
- **CSRF**: Token validation (Laravel built-in)
- **SQL Injection**: Prepared statements (Eloquent ORM)
- **XSS**: HTML escaping (Blade + React sanitization)
- **Rate Limiting**: Laravel throttle middleware
- **File Upload**: Size limit 20MB, MIME type whitelist

### Security Headers
| Header | Value |
|--------|-------|
| X-Frame-Options | SAMEORIGIN |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

---

## 🎯 Kesimpulan

Arsitektur Helpdesk Ticketing System dirancang sebagai **monolithic application** yang scalable, secure, dan performant. Dengan menggunakan **Inertia.js**, sistem menggabungkan kekuatan Laravel backend dan React frontend tanpa perlu API terpisah.

Deployment menggunakan **XAMPP/Laragon** untuk development memastikan kemudahan setup dan konsistensi environment.
