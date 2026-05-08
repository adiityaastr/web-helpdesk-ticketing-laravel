# Deskripsi Sistem - Helpdesk Ticketing System

## 📌 Nama Sistem

**Web-based Helpdesk Ticketing Application**

Sistem manajemen tiket bantuan teknis berbasis web yang dirancang untuk mengelola, melacak, dan menyelesaikan tiket dukungan pelanggan secara efisien.

---

## 🎯 Tujuan Pengembangan

### Tujuan Utama

1. **Mengelola Tiket Bantuan Secara Terpusat**
   - Menyediakan platform tunggal untuk semua tiket support
   - Menghindari tiket yang terlewat atau terlupakan
   - Tracking status tiket real-time

2. **Meningkatkan Efisiensi Penanganan Tiket**
   - Prioritas otomatis berdasarkan multi-kriteria (SAW)
   - Assign otomatis ke staff yang tepat
   - Mengurangi waktu response & resolution

3. **Memberikan Transparansi kepada Pelanggan**
   - Customer dapat melihat status tiket mereka
   - Notifikasi real-time saat ada update
   - History komentar & aktivitas lengkap

4. **Mengotomatisasi Prioritas Tiket**
   - Menggunakan algoritma SAW untuk scoring
   - Mempertimbangkan 5 kriteria (prioritas, urgensi, waktu tunggu, aktivitas, kompleksitas)
   - Ranking otomatis & konsisten

5. **Meningkatkan Kepuasan Pelanggan**
   - Rating & feedback setelah tiket selesai
   - Knowledge base untuk self-service
   - Response time yang cepat

### Tujuan Sekunder

- Mengurangi beban kerja manual staff
- Meningkatkan kolaborasi tim support
- Menyediakan analytics & reporting
- Memudahkan audit trail & compliance

---

## 👥 Pengguna Sistem

### 1. **Admin** (1-2 orang)

**Karakteristik**:
- Pengguna dengan akses penuh ke sistem
- Bertanggung jawab atas konfigurasi & maintenance
- Mengelola user, role, permission

**Fungsi Utama**:
- ✅ Kelola semua tiket (view, edit, delete)
- ✅ Assign tiket ke staff
- ✅ Kelola user (create, edit, delete, assign role)
- ✅ Kelola kategori tiket
- ✅ Kelola knowledge base
- ✅ Konfigurasi SAW (bobot kriteria)
- ✅ Lihat dashboard & analytics
- ✅ Kelola template respons

**Kebutuhan**:
- Interface yang powerful & comprehensive
- Akses ke semua data & fitur
- Reporting & analytics
- Audit trail

---

### 2. **Staff/Support Agent** (5-10 orang)

**Karakteristik**:
- Pengguna yang menangani tiket sehari-hari
- Fokus pada resolusi tiket
- Kolaborasi dengan admin & customer

**Fungsi Utama**:
- ✅ Lihat semua tiket (assigned & unassigned)
- ✅ Update status tiket
- ✅ Tambah komentar publik & internal
- ✅ Assign tiket ke diri sendiri
- ✅ Upload lampiran
- ✅ Lihat knowledge base
- ✅ Lihat dashboard (beban kerja)

**Kebutuhan**:
- Interface yang intuitif & cepat
- Notifikasi tiket baru
- Komentar internal (tidak terlihat customer)
- Template respons cepat
- Lampiran & file management

---

### 3. **Customer/End User** (Unlimited)

**Karakteristik**:
- Pengguna eksternal yang membuat tiket
- Fokus pada tracking & komunikasi
- Tidak perlu akses admin

**Fungsi Utama**:
- ✅ Buat tiket baru
- ✅ Lihat tiket milik sendiri
- ✅ Tambah komentar publik
- ✅ Upload lampiran (foto, file)
- ✅ Batalkan tiket
- ✅ Beri rating & feedback
- ✅ Lihat knowledge base
- ✅ Lihat notifikasi

**Kebutuhan**:
- Interface yang user-friendly
- Proses buat tiket yang simple
- Tracking status real-time
- Notifikasi update
- Knowledge base untuk self-service

---

## 🔍 Latar Belakang Masalah

### Masalah yang Dihadapi

1. **Tiket Support Tidak Terkelola**
   - Tiket masuk via email, chat, phone
   - Tidak ada tracking terpusat
   - Tiket sering terlewat atau terlupakan

2. **Prioritas Tiket Tidak Konsisten**
   - Prioritas ditentukan manual oleh staff
   - Tidak ada standar yang jelas
   - Tiket penting bisa tertunda

3. **Komunikasi Tidak Efisien**
   - Customer tidak tahu status tiket
   - Tidak ada notifikasi otomatis
   - Harus follow-up manual

4. **Beban Kerja Staff Tidak Seimbang**
   - Assign tiket manual & tidak optimal
   - Beberapa staff overload, beberapa idle
   - Tidak ada visibility beban kerja

5. **Tidak Ada Knowledge Base**
   - Customer harus contact support untuk FAQ
   - Beban support meningkat
   - Tidak ada self-service option

### Solusi yang Ditawarkan

| Masalah | Solusi |
|---------|--------|
| Tiket tidak terkelola | Platform terpusat untuk semua tiket |
| Prioritas tidak konsisten | SAW algorithm untuk scoring otomatis |
| Komunikasi tidak efisien | Notifikasi real-time & tracking |
| Beban kerja tidak seimbang | Dashboard untuk visibility & assign optimal |
| Tidak ada knowledge base | Knowledge base dengan search & kategori |

---

## 📊 Scope Sistem

### ✅ Fitur yang Termasuk

#### Core Features
1. **Manajemen Tiket**
   - Create, read, update, delete tiket
   - Status flow: open → in_progress → resolved → closed
   - Konfirmasi ganda saat resolved
   - Komentar publik & internal
   - Lampiran file

2. **Prioritas Otomatis (SAW)**
   - Hitung skor berdasarkan 5 kriteria
   - Normalisasi & weighted sum
   - Cache untuk performa
   - Ranking otomatis

3. **Notifikasi**
   - Event-driven notification
   - Queue worker untuk async
   - Database storage
   - Badge unread

4. **User Management**
   - Create, read, update, delete user
   - Assign role (admin, staff, customer)
   - Permission-based access control

5. **Knowledge Base**
   - Create, read, update, delete artikel
   - Draft & publish status
   - Kategori artikel
   - Search full-text

6. **Dashboard**
   - Statistik tiket
   - Chart distribusi
   - Daftar tiket terbaru
   - Beban kerja staff

#### Supporting Features
7. **Authentication & Authorization**
   - Login/logout
   - Session management
   - API token (Sanctum)
   - Role-based access control

8. **Activity Logging**
   - Track semua perubahan tiket
   - Audit trail
   - History komentar

9. **Rating & Feedback**
   - Customer beri rating 1-5 bintang
   - Feedback text
   - Analytics rating

10. **Template Respons**
    - Admin buat template
    - Staff gunakan untuk respons cepat

---

### ❌ Fitur yang TIDAK Termasuk

1. **Mobile App** - Hanya web (responsive design)
2. **Advanced Reporting** - Hanya basic stats & chart
3. **AI Chatbot** - Manual support only
4. **SLA Automation** - Manual SLA tracking
5. **Multi-channel Support** - Hanya web (tidak email/chat/phone integration)
6. **Video Call** - Hanya text-based communication
7. **Payment Integration** - Tidak ada billing
8. **Third-party Integration** - Standalone system

---

## 🏗️ Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────┐
│                   Browser (Customer/Staff/Admin)     │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Nginx (Web Server)                      │
│         - Reverse proxy                             │
│         - Static assets                             │
│         - SSL/TLS                                   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│         PHP-FPM (Application Server)                │
│         - Laravel 13                                │
│         - Inertia.js                                │
│         - Business logic                            │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌────────┐
    │ MySQL  │  │ Redis  │  │ Queue  │
    │ (Data) │  │(Cache) │  │(Async) │
    └────────┘  └────────┘  └────────┘
```

---

## 📋 Persyaratan Fungsional

### RF1: Manajemen Tiket
- Sistem harus memungkinkan customer membuat tiket
- Sistem harus memungkinkan staff mengupdate status
- Sistem harus memvalidasi input tiket
- Sistem harus menyimpan history tiket

### RF2: Prioritas Otomatis
- Sistem harus menghitung skor SAW
- Sistem harus cache skor 60 detik
- Sistem harus menampilkan ranking
- Sistem harus allow admin konfigurasi bobot

### RF3: Notifikasi
- Sistem harus mengirim notifikasi saat tiket dibuat
- Sistem harus mengirim notifikasi saat status berubah
- Sistem harus menyimpan notifikasi di database
- Sistem harus menampilkan badge unread

### RF4: User Management
- Sistem harus support 3 role (admin, staff, customer)
- Sistem harus enforce permission per role
- Sistem harus allow admin manage user
- Sistem harus support login/logout

### RF5: Knowledge Base
- Sistem harus allow admin create artikel
- Sistem harus support draft & publish
- Sistem harus support search
- Sistem harus allow customer view artikel

---

## 📋 Persyaratan Non-Fungsional

### Performance
- Response time < 300ms (p95)
- Database query < 50ms
- Cache hit rate > 80%
- Support 100+ concurrent users

### Security
- Password hashing (bcrypt)
- CSRF protection
- SQL injection prevention
- XSS protection
- Rate limiting

### Reliability
- Uptime > 99%
- Data backup daily
- Error logging & monitoring
- Graceful error handling

### Scalability
- Horizontal scaling via Docker
- Database indexing
- Query optimization
- Caching strategy

### Usability
- Responsive design (mobile-friendly)
- Intuitive UI/UX
- Fast load time
- Accessibility (WCAG)

---

## 📈 Metrik Kesuksesan

| Metrik | Target | Cara Ukur |
|--------|--------|-----------|
| Response Time | < 300ms | APM monitoring |
| Uptime | > 99% | Uptime monitoring |
| User Satisfaction | > 4/5 | Survey & rating |
| Ticket Resolution Time | < 24 jam | Analytics |
| Cache Hit Rate | > 80% | Redis stats |
| Test Coverage | > 70% | PHPUnit report |

---

## 🎓 Kesimpulan

Helpdesk Ticketing System dirancang untuk mengatasi masalah manajemen tiket support yang tidak terkelola dengan baik. Sistem ini menyediakan platform terpusat, prioritas otomatis, notifikasi real-time, dan analytics untuk meningkatkan efisiensi support team dan kepuasan customer.

Dengan 3 role pengguna (admin, staff, customer) dan fitur-fitur lengkap, sistem ini siap untuk production deployment dan dapat scale sesuai kebutuhan.
