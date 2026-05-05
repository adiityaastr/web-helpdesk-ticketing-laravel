## DAFTAR ISI

3. [BAB 3: Implementasi Fitur](#bab-3-implementasi-fitur)
   - 3.1 Fitur Utama 1: Manajemen Tiket (Ticket Management)
   - 3.2 Fitur Utama 2: Dashboard & Prioritas Tiket (SAW)

---
## BAB 3: IMPLEMENTASI FITUR

### 3.1 Fitur Utama 1: Manajemen Tiket (Ticket Management)

#### 3.1.1 Alur Kerja

Fitur Manajemen Tiket adalah fitur inti sistem. Berikut adalah alur kerja lengkap dari perspektif teknis:

**A. Customer Membuat Tiket**
- URL: `POST /portal/tickets`
- Controller: `Portal\TicketController@store`
- Form Request: `StoreTicketRequest` (validasi input)
- Policy: `TicketPolicy::create()`
- Service: `TicketService::createTicket()`
- Response: Redirect ke halaman detail tiket dengan flash message

**B. Staff Melihat Daftar Tiket**
- URL: `GET /admin/tickets`
- Controller: `Admin\TicketController@index`
- Service: `TicketService::getAllTickets()` — query dengan filter (status, prioritas, kategori, pencarian)
- SAW: `SawService::getScores()` — menambahkan skor prioritas ke setiap tiket
- Response: Render halaman Admin/Tickets/Index dengan data tiket + skor SAW

**C. Staff Mengupdate Tiket**
- URL: `PUT /admin/tickets/{ticket}`
- Controller: `Admin\TicketController@update`
- Form Request: `UpdateTicketRequest` (validasi input)
- Policy: `TicketPolicy::update()`
- Service: `TicketService::updateTicket()`
- Response: Redirect ke halaman detail tiket dengan flash message

**D. Customer Berkomentar**
- URL: `POST /portal/tickets/{ticket}/comments`
- Controller: `Portal\TicketController@comment`
- Form Request: `StoreCommentRequest`
- Policy: `TicketPolicy::comment()`
- Service: `CommentService::addCommentWithAttachments()`
- Notifikasi: `NotificationService::notifyTicketUpdate()`
- Response: Redirect ke halaman detail tiket

**E. Staff Berkomentar (Publik/Internal)**
- URL: `POST /admin/tickets/{ticket}/comments`
- Controller: `Admin\TicketController@comment`
- Parameter `is_internal`: true (hanya staff yang bisa melihat) atau false (publik)
- Service: `CommentService::addCommentWithAttachments()`
- Notifikasi: Hanya dikirim jika komentar publik (bukan internal)

**F. Customer Mengkonfirmasi Resolusi**
- URL: `POST /portal/tickets/{ticket}/confirm`
- Controller: `Portal\TicketController@confirmResolution`
- Service: `TicketService::confirmResolution()`
- Status berubah: `resolved` → `closed`
- Timestamp `resolved_confirmed_at` di-set

**G. Customer Menolak Resolusi**
- URL: `POST /portal/tickets/{ticket}/reject`
- Controller: `Portal\TicketController@rejectResolution`
- Service: `TicketService::rejectResolution()`
- Status berubah: `resolved` → `in_progress`
- Timestamp `resolved_at` di-null-kan
- Alasan penolakan wajib diisi (max 500 karakter)

#### 3.1.2 Logika Program — Pembuatan Tiket

Berikut adalah step-by-step logika pembuatan tiket pada `TicketService::createTicket()`:

**Step 1: Upload Attachment**
Sistem memeriksa apakah request mengandung file attachment. Jika ada, setiap file diupload ke storage path `tickets/attachments` pada disk `public`. Path file disimpan dalam array `$attachmentPaths`.

**Step 2: Pembuatan Record Tiket**
Sistem memanggil `Ticket::query()->create()` dengan data:
- `user_id`: ID pengguna yang login (pelapor)
- `category_id`: ID kategori yang dipilih
- `title`: Judul tiket
- `description`: Deskripsi tiket
- `priority`: Prioritas (low/medium/high/critical)
- `status`: Di-set ke `'open'`

**Step 3: Komentar Otomatis**
Sistem membuat komentar awal pada tiket:
- `user_id`: ID pelapor
- `message`: "Tiket berhasil dibuat."
- `is_internal`: false (publik)
- `attachments`: Array path file yang diupload

**Step 4: Activity Log**
Sistem mencatat log aktivitas:
- `user_id`: ID pelapor
- `action`: "created"
- `description`: "Tiket dibuat oleh pelapor."

**Step 5: Notifikasi**
Sistem mengirim notifikasi ke semua pengguna yang terkait:
- Reporter tiket
- Assignee (jika ada, meskipun saat pembuatan biasanya null)
- Semua staff (notifyAllStaff = true)

**Step 6: Cache Invalidation**
Sistem menghapus beberapa cache yang sudah tidak valid:
- `portal_dashboard_stats_{user_id}`: Statistik dashboard pelapor
- `admin_dashboard_stats`: Statistik dashboard admin
- `admin_dashboard_charts`: Data grafik admin
- `admin_saw_scores`: Skor SAW (via `SawService::invalidateCache()`)

#### 3.1.3 Logika Program — Pembaruan Tiket oleh Admin

Berikut adalah step-by-step logika pembaruan tiket pada `TicketService::updateTicket()`:

**Step 1: Normalisasi Payload**
Sistem menggabungkan data baru dengan data existing. Fields `title` dan `description` dipertahankan jika tidak diubah.

**Step 2: Penanganan Transisi Status**
- Jika status berubah ke `resolved`: Set `resolved_at = now()`, hapus `cancelled_at`.
- Jika status berubah ke `cancelled`: Set `cancelled_at = now()`, hapus `resolved_at`.
- Jika status kembali ke `in_progress` (dari resolved/cancelled): Hapus timestamp terkait.

**Step 3: Eksekusi Update**
Sistem memanggil `$ticket->update($payload)` untuk menyimpan perubahan.

**Step 4: Cache Invalidation**
Sistem menghapus cache yang terpengaruh:
- `admin_dashboard_stats`
- `admin_dashboard_charts`
- `admin_saw_scores`

**Step 5: Activity Log**
Sistem mendeteksi perubahan dan mencatat log:
- Jika status berubah: "Status berubah dari {old} menjadi {new}"
- Jika assignee berubah: "Ditugaskan ke {nama}"

**Step 6: Notifikasi**
Sistem mengirim notifikasi ke reporter dan assignee (jika ada).

#### 3.1.4 Integrasi API

Sistem menyediakan REST API untuk mobile client atau integrasi eksternal melalui endpoint `/api/v1/*` dengan Laravel Sanctum sebagai mekanisme autentikasi.

**Endpoint API Tersedia:**

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/v1/register` | Guest | Registrasi pengguna baru |
| POST | `/api/v1/login` | Guest | Login dan mendapatkan token Sanctum |
| POST | `/api/v1/logout` | Sanctum | Logout dan menghapus token |
| GET | `/api/v1/user` | Sanctum | Mendapatkan data pengguna yang login |
| GET | `/api/v1/tickets` | Sanctum | Mendapatkan daftar tiket pengguna |
| POST | `/api/v1/tickets` | Sanctum | Membuat tiket baru |
| GET | `/api/v1/tickets/{ticket}` | Sanctum | Mendapatkan detail tiket |
| POST | `/api/v1/tickets/{ticket}/comments` | Sanctum | Menambahkan komentar |

**Alur Autentikasi API:**
1. Client melakukan POST `/api/v1/login` dengan email dan password.
2. Server memvalidasi kredensial dan mengembalikan token Sanctum (plain text token).
3. Client menyertakan token di header `Authorization: Bearer {token}` pada request selanjutnya.
4. Sanctum middleware (`auth:sanctum`) memvalidasi token pada setiap request.

### 3.2 Fitur Utama 2: Dashboard & Prioritas Tiket (SAW)

#### 3.2.1 Alur Kerja

**Dashboard Admin** (`GET /admin/dashboard`):
1. Controller `Admin\DashboardController@index` memanggil `DashboardService` untuk mengambil data.
2. `getAdminStats()`: Menghitung statistik tiket menggunakan satu query SQL agregat:
   - Total tiket, open, in_progress, resolved, closed, overdue
   - Data di-cache selama 300 detik
3. `getAdminCharts()`: Mengelompokkan tiket berdasarkan prioritas dan status untuk grafik Chart.js:
   - `priorityChart`: Label = prioritas, Values = jumlah tiket per prioritas
   - `statusChart`: Label = status, Values = jumlah tiket per status
4. `getRecentTickets(10)`: Mengambil 10 tiket terbaru dengan informasi reporter, assignee, dan kategori.
5. `getStaffWorkload()`: Menghitung beban kerja setiap staff berdasarkan jumlah tiket yang di-assign.
6. Hasil dirender melalui Inertia.js ke komponen React `Admin/Dashboard`.

**Dashboard Portal** (`GET /portal/dashboard`):
1. Controller `Portal\DashboardController@index` memanggil `DashboardService`.
2. `getRecentTickets(5, $user)`: 5 tiket terbaru milik pengguna.
3. `getPortalStats($user)`: Statistik tiket pribadi (total, open, in_progress, resolved).

**Cache Invalidation:**
- Setiap kali tiket dibuat, di-update, atau dihapus, cache dashboard dihapus.
- Cache otomatis dibuat kembali pada request berikutnya.

#### 3.2.2 Logika Program — DashboardService

`DashboardService::getAdminStats()` menggunakan **satu query SQL** untuk menghitung semua statistik, menghindari N+1 query problem:

```sql
SELECT
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
    COUNT(CASE WHEN status NOT IN ('resolved', 'closed', 'cancelled')
          AND sla_deadline IS NOT NULL
          AND sla_deadline < ? THEN 1 END) as overdue
FROM tickets
```

Query ini dieksekusi dalam `Cache::remember('admin_dashboard_stats', 300, ...)` sehingga hasilnya di-cache selama 5 menit. Query di-cache menggunakan Redis dalam environment production atau database/file dalam environment development.

`DashboardService::getAdminCharts()` mengeksekusi dua query terpisah yang juga di-cache:
1. `SELECT priority, COUNT(*) as total FROM tickets GROUP BY priority`
2. `SELECT status, COUNT(*) as total FROM tickets GROUP BY status`

Kedua hasil dikembalikan dalam format `{ labels: [...], values: [...] }` yang kompatibel dengan Chart.js di frontend.

---

