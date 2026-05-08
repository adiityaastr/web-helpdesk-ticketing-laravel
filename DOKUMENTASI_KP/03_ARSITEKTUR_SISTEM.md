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
│  │  Nginx 1.26 (Web Server)                            │   │
│  │  - Reverse Proxy                                    │   │
│  │  - Static Assets (CSS, JS, Images)                  │   │
│  │  - SSL/TLS Termination                              │   │
│  │  - Gzip Compression                                 │   │
│  │  - Rate Limiting                                    │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ FastCGI
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PHP-FPM 8.3 (Application Server)                   │   │
│  │  ┌────────────────────────────────────────────────┐ │   │
│  │  │  Laravel 13 Framework                          │ │   │
│  │  │  - Routing & Controllers                       │ │   │
│  │  │  - Inertia.js Response                         │ │   │
│  │  │  - Business Logic                              │ │   │
│  │  │  - Middleware & Policies                       │ │   │
│  │  │  - Event & Queue Handling                      │ │   │
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
│ MySQL 8.0    │  │ Redis 7      │  │ Redis Queue  │
│              │  │              │  │              │
│ - Users      │  │ - Sessions   │  │ - Notif Jobs │
│ - Tickets    │  │ - Cache      │  │ - Mail Jobs  │
│ - Comments   │  │ - SAW Scores │  │ - Async Ops  │
│ - Categories │  │              │  │              │
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

#### Nginx 1.26
- **Fungsi**: Reverse proxy, static assets, SSL/TLS
- **Konfigurasi**:
  - Listen port 80 (HTTP)
  - Proxy ke PHP-FPM port 9000
  - Serve static assets (CSS, JS, images)
  - Gzip compression level 6
  - Cache static assets 7 hari
  - Rate limiting

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
- **Driver**: Redis Queue
- **Jobs**: SendNotification, ProcessTicket
- **Worker**: Async processing

---

### 4. **Database Layer**

#### MySQL 8.0
- **Charset**: utf8mb4 (support emoji)
- **Collation**: utf8mb4_unicode_ci
- **Engine**: InnoDB (transaction support)
- **Tabel**: 8 tabel utama + pivot tables

#### Indexing Strategy
- Primary key pada semua tabel
- Foreign key untuk relasi
- Composite index pada kolom yang sering di-filter
- Unique index pada email, slug

---

### 5. **Cache Layer**

#### Redis 7
- **Session Storage**: Simpan session user
- **Cache Store**: Cache query result, SAW scores
- **Queue Driver**: Redis Queue untuk async jobs
- **Persistence**: RDB + AOF

#### Cache Strategy
- SAW scores: 60 detik
- Dashboard stats: 300 detik
- Query result: 1 jam
- Session: 120 menit

---

### 6. **Queue Layer**

#### Redis Queue
- **Job Processing**: Async notification, email
- **Worker**: PHP-FPM container khusus
- **Retry**: 3 kali retry jika gagal
- **Timeout**: 3600 detik per job

---

## 🔄 Alur Request

### Alur 1: Buat Tiket (Synchronous)

```
1. User submit form di browser
   ↓
2. React component kirim POST request ke /tickets
   ↓
3. Nginx terima request, proxy ke PHP-FPM
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

### Alur 2: Kirim Notifikasi (Asynchronous)

```
1. Event TicketCreated di-dispatch
   ↓
2. Event listener trigger SendNotificationJob
   ↓
3. Job di-push ke Redis Queue
   ↓
4. Queue worker ambil job dari queue
   ↓
5. Execute SendNotificationJob
   ↓
6. Create Notification record di database
   ↓
7. Broadcast notification ke user (optional)
   ↓
8. Job selesai, remove dari queue
```

### Alur 3: Hitung SAW Score (Cached)

```
1. Request list tiket
   ↓
2. Check Redis cache untuk SAW scores
   ↓
3. Jika cache hit → return cached scores
   ↓
4. Jika cache miss:
   a. Ambil semua tiket dari database
   b. Hitung SAW score untuk setiap tiket
   c. Simpan ke Redis cache (60 detik)
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
| Web Server | Nginx | 1.26 |
| App Server | PHP-FPM | 8.3 |
| Database | MySQL | 8.0 |
| Cache | Redis | 7 |
| Queue | Redis Queue | 7 |

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
| Containerization | Docker | 24 |
| Orchestration | Docker Compose | 2.20 |
| Testing | PHPUnit | 12 |
| E2E Testing | Playwright | 1.59 |

---

## 📊 Deployment Architecture

### Development
```
Local Machine
├── Docker Desktop
├── docker-compose.yml (8 services)
├── Nginx (port 8000)
├── PHP-FPM (internal)
├── MySQL (port 3306)
├── Redis (port 6379)
├── Queue Worker
├── MailHog (port 8025)
├── Adminer (port 8080)
└── Vite Dev Server (port 5173)
```

### Production
```
Server
├── Docker Engine
├── docker-compose.yml (5 services)
├── Nginx (port 80/443)
├── PHP-FPM (internal)
├── MySQL (internal)
├── Redis (internal)
├── Queue Worker
└── Monitoring (optional)
```

---

## 🔐 Security Architecture

### Authentication
- **Method**: Session-based + Token-based (Sanctum)
- **Password**: Bcrypt hashing
- **Session**: Redis storage, 120 menit lifetime

### Authorization
- **Method**: Role-Based Access Control (RBAC)
- **Roles**: admin, staff, customer
- **Policies**: TicketPolicy untuk fine-grained control

### Data Protection
- **HTTPS**: SSL/TLS termination di Nginx
- **CSRF**: Token validation
- **SQL Injection**: Prepared statements
- **XSS**: HTML escaping

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Stateless PHP-FPM**: Bisa scale multiple instances
- **Redis Session**: Shared session store
- **Database**: Master-slave replication (optional)
- **Load Balancer**: Nginx upstream (optional)

### Vertical Scaling
- **PHP Memory**: 512MB per instance
- **MySQL Buffer Pool**: 256MB
- **Redis Memory**: 256MB
- **Nginx Worker**: Auto-tuned

### Performance Optimization
- **Database Indexing**: Composite indexes
- **Query Optimization**: Eager loading, select specific columns
- **Caching**: Redis cache, OPcache
- **CDN**: Static assets (optional)

---

## 🎯 Kesimpulan

Arsitektur Helpdesk Ticketing System dirancang sebagai **monolithic application** yang scalable, secure, dan performant. Dengan menggunakan **Inertia.js**, sistem menggabungkan kekuatan Laravel backend dan React frontend tanpa perlu API terpisah.

Deployment via **Docker** memastikan konsistensi antara development dan production, serta memudahkan scaling horizontal.
