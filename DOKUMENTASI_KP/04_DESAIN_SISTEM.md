# Desain Sistem - Helpdesk Ticketing System

## 📊 Use Case Diagram

Lihat file: `diagrams/02_use_case_diagram.puml`

### Deskripsi Use Case

#### **Customer Use Cases**

| UC | Nama | Deskripsi |
|----|----|-----------|
| UC1 | Create Ticket | Customer membuat tiket baru dengan judul, deskripsi, kategori, dan lampiran |
| UC2 | View Ticket | Customer melihat detail tiket miliknya |
| UC3 | Add Comment | Customer menambahkan komentar publik pada tiket |
| UC4 | Upload Attachment | Customer upload file lampiran (foto, PDF, dll) |
| UC5 | Rate Ticket | Customer memberi rating 1-5 bintang setelah tiket selesai |
| UC6 | Cancel Ticket | Customer membatalkan tiket yang masih aktif |

#### **Staff Use Cases**

| UC | Nama | Deskripsi |
|----|----|-----------|
| UC7 | Assign Ticket | Staff assign tiket ke diri sendiri atau staff lain |
| UC8 | Update Status | Staff mengubah status tiket (open → in_progress → resolved → closed) |
| UC9 | Add Internal Comment | Staff menambahkan komentar internal (tidak terlihat customer) |
| UC10 | View Dashboard | Staff melihat dashboard dengan statistik & beban kerja |
| UC11 | Manage User | Staff create, read, update, delete user & assign role |
| UC12 | Manage Category | Staff create, read, update, delete kategori tiket |
| UC13 | Configure SAW | Staff konfigurasi bobot kriteria SAW (C1-C5) |
| UC14 | View Analytics | Staff melihat analytics & reporting |
| UC15 | Manage Knowledge Base | Staff create, read, update, delete artikel knowledge base |

#### **System Use Cases**

| UC | Nama | Deskripsi |
|----|----|-----------|
| UC16 | Send Notification | Sistem mengirim notifikasi ke user yang terkait |
| UC17 | Calculate SAW Score | Sistem menghitung skor SAW untuk setiap tiket |
| UC18 | Log Activity | Sistem mencatat semua aktivitas untuk audit trail |

---

## 🔄 Activity Diagram

### Activity 1: Alur Pembuatan & Penanganan Tiket

Lihat file: `diagrams/03_activity_tiket.puml`

**Swimlane**: Customer, Staff, System

**Alur**:
1. Customer buka form buat tiket
2. Isi data (judul, deskripsi, kategori, lampiran)
3. Submit form
4. Sistem validasi input
5. Jika valid:
   - Create ticket di database
   - Generate UUID
   - Set status = "open"
   - Hitung SAW score
   - Send notification ke staff
   - Log activity
6. Staff review tiket
7. Assign ke staff lain (optional)
8. Staff handle tiket:
   - Baca deskripsi & lampiran
   - Add comment (public/internal)
9. Jika selesai:
   - Update status = "resolved"
   - Send notification ke customer
10. Customer confirm selesai:
    - Jika ya → status = "closed", tampilkan form rating
    - Jika tidak → status = "in_progress", staff lanjut handle
11. Customer beri rating & feedback
12. Tiket selesai

### Activity 2: Alur Perhitungan SAW Score

Lihat file: `diagrams/04_activity_saw.puml`

**Alur**:
1. Request list tiket
2. Check file cache
3. Jika cache hit → return cached scores
4. Jika cache miss:
   - Ambil semua tiket dari database
   - Ambil SAW config (bobot W1-W5)
   - **Normalisasi data**:
     - C1 (Priority): r1 = C1 / max(C1)
     - C2 (SLA Urgency): r2 = C2 / max(C2)
     - C3 (Wait Time): r3 = min(C3) / C3 (cost)
     - C4 (Customer Activity): r4 = C4 / max(C4)
     - C5 (Complexity): r5 = C5 / max(C5)
   - **Weighted Sum**: V(i) = (W1×r1) + (W2×r2) + (W3×r3) + (W4×r4) + (W5×r5)
   - **Ranking**: Sort tiket by V(i) DESC
   - Cache scores ke file (TTL 60 detik)
5. Return sorted tiket dengan score
6. Render di frontend

---

## 📋 Flowchart

### Flowchart 1: Proses Login

Lihat file: `diagrams/05_flowchart_login.puml`

```
START
  ↓
Input email & password
  ↓
Validasi input
  ├─ Tidak valid → Error message → Input ulang
  └─ Valid → Query user by email
      ├─ User tidak ditemukan → Error → Input ulang
      └─ User ditemukan → Verify password
          ├─ Password salah → Error → Input ulang
          └─ Password benar → Check user status
              ├─ User tidak aktif → Error
              └─ User aktif → Generate session token
                  ↓
                Store session di file (120 menit)
                Generate API token (Sanctum)
                Create auth cookie (secure, httpOnly)
                Log login activity
                  ↓
                Redirect ke dashboard
                Tampilkan welcome message
                  ↓
                END
```

**Security Measures**:
- Password hashing (bcrypt)
- Session storage (file)
- Secure cookie (httpOnly, secure flag)
- Activity logging
- Rate limiting (optional)

### Flowchart 2: Proses Buat Tiket

Lihat file: `diagrams/06_flowchart_buat_tiket.puml`

```
START
  ↓
Input judul, deskripsi, kategori
Upload lampiran (optional)
  ↓
Validasi input
  ├─ Judul kosong → Error → Input ulang
  ├─ Deskripsi kosong → Error → Input ulang
  ├─ Kategori tidak valid → Error → Pilih ulang
  └─ Semua valid → Validasi file (jika ada)
      ├─ File size > 20MB → Error → Upload ulang
      ├─ File type tidak aman → Error → Upload ulang
      └─ File valid → Simpan file ke storage
          ↓
        Create Ticket record
        Set user_id, category_id, status, priority
        Generate UUID
        Hitung SAW score
        Cache score ke file
          ↓
        Dispatch TicketCreated event
        Send notification ke staff
        Log activity
          ↓
        Return success response
        Redirect ke detail tiket
        Tampilkan success message
          ↓
        END
```

**Validasi**:
- Judul & deskripsi tidak kosong
- Kategori valid
- File size < 20MB
- File type aman (whitelist)

**Proses**:
- Create ticket record
- Calculate SAW score
- Send notification
- Log activity

---

## 🔐 Sequence Diagram

Lihat file: `diagrams/08_sequence_tiket.puml`

### Alur Sequence: Buat Tiket

```
Customer → Browser: Buka form buat tiket
Browser → Browser: Render form
Customer → Browser: Isi data & submit
Browser → Server: POST /tickets
Server → Controller: Route ke TicketController@store
Controller → Controller: Validasi input
Controller → Service: createTicket(data)
Service → DB: INSERT ticket
DB → Service: ticket_id
Service → Cache: calculateSAW(ticket)
Cache → Service: saw_score
Service → DB: UPDATE ticket SAW score
Service → Notification: Send notification (sync)
Notification → DB: INSERT notification
Service → Controller: return ticket
Controller → Browser: Inertia response
Browser → Browser: Render success
Browser → Customer: Tampilkan detail tiket
```

---

## 📊 State Diagram (Ticket Status)

```
┌─────────────────────────────────────────────────────┐
│                  TICKET STATUS FLOW                  │
└─────────────────────────────────────────────────────┘

    ┌──────────┐
    │   OPEN   │ ← Customer create ticket
    └────┬─────┘
         │ Staff assign & start work
         ▼
    ┌──────────────┐
    │ IN_PROGRESS  │
    └────┬─────────┘
         │ Staff resolve ticket
         ▼
    ┌──────────────┐
    │  RESOLVED    │ ← Waiting customer confirmation
    └────┬─────────┘
         │
         ├─ Customer confirm selesai
         │  ▼
         │ ┌──────────┐
         │ │  CLOSED  │ ← Ticket selesai
         │ └──────────┘
         │
         └─ Customer belum selesai
            ▼
         ┌──────────────┐
         │ IN_PROGRESS  │ ← Back to handling
         └──────────────┘

    ┌──────────┐
    │CANCELLED │ ← Customer cancel anytime
    └──────────┘
```

---

## 🎯 Decision Tree

### Decision 1: Assign Ticket

```
Ticket dibuat
  ├─ Auto-assign enabled?
  │  ├─ Ya → Cari staff dengan beban kerja terendah
  │  │      ├─ Ada staff available?
  │  │      │  ├─ Ya → Assign otomatis
  │  │      │  └─ Tidak → Tetap unassigned
  │  └─ Tidak → Tetap unassigned
  └─ Admin assign manual
     ├─ Pilih staff
     └─ Assign
```

### Decision 2: Prioritas Tiket

```
Ticket dibuat
  ├─ Auto-priority enabled?
  │  ├─ Ya → Hitung SAW score
  │  │      ├─ Score > threshold?
  │  │      │  ├─ Ya → Set priority = high/critical
  │  │      │  └─ Tidak → Set priority = low/medium
  │  └─ Tidak → Set priority = default (medium)
  └─ Admin set manual
     ├─ Pilih priority
     └─ Set
```

## 🏛️ Interaction Overview

### Component Interaction Matrix

| Komponen A | Komponen B | Protokol | Tujuan |
|-----------|-----------|----------|--------|
| Browser | Apache/Server | HTTP/HTTPS | Request web assets |
| Server | Laravel | PHP | Forward request ke Laravel |
| Laravel | MySQL | TCP 3306 | Query database |
| Laravel | File Cache | Filesystem | Cache & session |
| Laravel | Notification | Sync | Send notification |

### Data Flow Diagram

```
[Input] User Action → [Process] Controller → [Storage] Database → [Output] Response
                              ↓
                         [Event] Event Dispatcher
                              ↓
                         [Queue] Queue Worker
                              ↓
                         [Async] Notification/Email
```

---

## 📈 Kesimpulan

Desain sistem Helpdesk Ticketing mencakup:
- **18 use case** untuk 2 role (customer, staff)
- **3 activity diagram** untuk alur utama
- **2 flowchart** untuk proses kritis
- **1 sequence diagram** untuk interaksi komponen
- **State diagram** untuk status tiket
- **Decision tree** untuk logika bisnis

Semua diagram dirancang untuk memastikan sistem berjalan sesuai requirement dan memberikan user experience yang optimal.
