## DAFTAR ISI

4. [BAB 4: Algoritma](#bab-4-algoritma)
   - 4.1 Algoritma SAW (Simple Additive Weighting)
   - 4.2 Algoritma Pencarian (Search)
   - 4.3 Algoritma Autentikasi
   - 4.4 Algoritma Notifikasi

---
## BAB 4: ALGORITMA

### 4.1 Algoritma SAW (Simple Additive Weighting)

#### 4.1.1 Definisi

**Simple Additive Weighting (SAW)** adalah metode Multi-Criteria Decision Making (MCDM) yang digunakan untuk menghitung skor prioritas setiap tiket dalam sistem. SAW dipilih karena kesederhanaan, kecepatan komputasi (O(n)), dan kemudahan interpretasi hasil.

Konsep dasar SAW:
1. Setiap tiket dievaluasi berdasarkan beberapa kriteria (C1-C5).
2. Nilai setiap kriteria dinormalisasi ke rentang [0,1].
3. Skor akhir = jumlah dari (nilai normalisasi × bobot kriteria).
4. Semakin tinggi skor, semakin tinggi prioritas tiket.

#### 4.1.2 Kriteria (C1-C5)

| Kode | Nama | Tipe | Bobot | Deskripsi |
|------|------|------|-------|-----------|
| **C1** | Tingkat Prioritas | Benefit | 0.25 (25%) | Prioritas yang dipilih pelapor: critical(4) > high(3) > medium(2) > low(1) |
| **C2** | Urgensi SLA | Benefit | 0.30 (30%) | Kedekatan dengan deadline SLA. Semakin dekat/melampaui deadline, semakin tinggi urgensi |
| **C3** | Waktu Tunggu | Benefit | 0.20 (20%) | Lamanya tiket menunggu diproses (dalam jam). Semakin lama menunggu, semakin prioritas |
| **C4** | Aktivitas Pelanggan | Benefit | 0.15 (15%) | Total tiket yang pernah dibuat oleh pelapor yang sama. Semakin banyak, semakin prioritas |
| **C5** | Kompleksitas | Cost | 0.10 (10%) | Panjang deskripsi tiket (dalam karakter). Semakin panjang, semakin rendah prioritas (karena butuh waktu lebih lama diproses) |

**Bobot total = 1.00 (100%)**

#### 4.1.3 Langkah Perhitungan

**Langkah 1: Membangun Matriks Keputusan**

Sistem membangun matriks `[ticket_id][C1..C5]` untuk semua tiket di database. Nilai setiap sel dihitung berdasarkan kriteria terkait.

**Langkah 2: Normalisasi**

Untuk setiap kriteria, sistem menghitung nilai maksimum dan minimum dari seluruh tiket, kemudian menerapkan rumus normalisasi:

- **Kriteria Benefit (C1, C2, C3, C4):**
  ```
  X_norm = X / max(X)
  ```
  Di mana `X` adalah nilai kriteria dan `max(X)` adalah nilai maksimum dari semua tiket untuk kriteria tersebut.

- **Kriteria Cost (C5):**
  ```
  X_norm = min(X) / X
  ```
  Di mana `min(X)` adalah nilai minimum dari semua tiket untuk kriteria tersebut.

Penanganan edge case:
- Jika `max(X) == 0`, maka `X_norm = 0`
- Jika `X == 0` pada cost, maka `X_norm = 0` (untuk menghindari division by zero)

**Langkah 3: Weighted Sum**

Setelah normalisasi, skor akhir setiap tiket dihitung dengan:
```
Score(ticket) = Σ (X_normᵢ × Wᵢ) untuk i = 1..5
```
Di mana `Wᵢ` adalah bobot kriteria ke-i.

Hasil skor dibulatkan ke 4 desimal menggunakan `round($score, 4)`.

**Langkah 4: Sorting**

Array skor diurutkan secara descending (dari skor tertinggi ke terendah) menggunakan `arsort()`. Tiket dengan skor tertinggi adalah yang paling prioritas.

#### 4.1.4 Perhitungan Setiap Kriteria

**C1 — Tingkat Prioritas (Benefit, bobot 0.25)**

Nilai dihitung berdasarkan prioritas tiket:
- `critical` → 4.0
- `high` → 3.0
- `medium` → 2.0
- `low` → 1.0
- Default → 1.0

**C2 — Urgensi SLA (Benefit, bobot 0.30)**

Nilai dihitung berdasarkan sisa waktu menuju SLA deadline:
- Jika `sla_deadline` tidak diset → 0
- Jika SLA sudah expired (`hoursRemaining <= 0`) → **10** (nilai maksimum, sangat urgent)
- Jika SLA belum expired → `1 / (hoursRemaining + 1)`

Rumus ini menghasilkan nilai yang semakin besar ketika deadline semakin dekat. Contoh:
- 24 jam tersisa → 1/(24+1) = 0.04
- 1 jam tersisa → 1/(1+1) = 0.50
- 0 jam (expired) → 10

**C3 — Waktu Tunggu (Benefit, bobot 0.20)**

Nilai = selisih waktu antara sekarang dan `created_at` dalam satuan jam:
```
$ticket->created_at->diffInHours(now())
```

**C4 — Aktivitas Pelanggan (Benefit, bobot 0.15)**

Nilai = total tiket yang pernah dibuat oleh user yang sama. Dihitung dengan query agregat:
```sql
SELECT user_id, COUNT(*) as total FROM tickets GROUP BY user_id
```

**C5 — Kompleksitas (Cost, bobot 0.10)**

Nilai = jumlah karakter dalam deskripsi tiket:
```php
mb_strlen($ticket->description ?? '')
```
Menggunakan `mb_strlen()` untuk menghitung karakter multibyte dengan benar.

#### 4.1.5 Contoh Perhitungan

Misalkan terdapat 3 tiket dengan data sebagai berikut:

| Tiket | Prioritas | SLA (jam tersisa) | Umur (jam) | Tiket User | Panjang Deskripsi |
|-------|-----------|-------------------|------------|------------|-------------------|
| T1 | high (3) | -2 (expired) | 48 | 15 | 200 |
| T2 | medium (2) | 5 | 6 | 3 | 500 |
| T3 | critical (4) | 24 | 2 | 20 | 100 |

**Langkah 1: Matriks Keputusan**

| Tiket | C1 | C2 | C3 | C4 | C5 |
|-------|----|----|----|----|----|
| T1 | 3.0 | 10.0 | 48 | 15 | 200 |
| T2 | 2.0 | 0.167 | 6 | 3 | 500 |
| T3 | 4.0 | 0.04 | 2 | 20 | 100 |
| **max** | 4.0 | 10.0 | 48 | 20 | 500 |
| **min** | 2.0 | 0.04 | 2 | 3 | 100 |

**Langkah 2: Normalisasi**

| Tiket | C1 (Benefit) | C2 (Benefit) | C3 (Benefit) | C4 (Benefit) | C5 (Cost) |
|-------|-------------|-------------|-------------|-------------|----------|
| T1 | 3.0/4.0 = 0.75 | 10.0/10.0 = 1.0 | 48/48 = 1.0 | 15/20 = 0.75 | 100/200 = 0.5 |
| T2 | 2.0/4.0 = 0.50 | 0.167/10.0 = 0.0167 | 6/48 = 0.125 | 3/20 = 0.15 | 100/500 = 0.2 |
| T3 | 4.0/4.0 = 1.0 | 0.04/10.0 = 0.004 | 2/48 = 0.042 | 20/20 = 1.0 | 100/100 = 1.0 |

**Langkah 3: Weighted Sum**

| Tiket | C1×0.25 | C2×0.30 | C3×0.20 | C4×0.15 | C5×0.10 | **Skor** |
|-------|---------|---------|---------|---------|---------|----------|
| T1 | 0.1875 | 0.3000 | 0.2000 | 0.1125 | 0.0500 | **0.8500** |
| T2 | 0.1250 | 0.0050 | 0.0250 | 0.0225 | 0.0200 | **0.1975** |
| T3 | 0.2500 | 0.0012 | 0.0083 | 0.1500 | 0.1000 | **0.5095** |

**Langkah 4: Hasil Sorting**

| Peringkat | Tiket | Skor |
|-----------|-------|------|
| 1 | T1 | 0.8500 |
| 2 | T3 | 0.5095 |
| 3 | T2 | 0.1975 |

T1 adalah tiket paling prioritas karena SLA sudah expired (C2=10) dan sudah menunggu 48 jam (C3=48). T2 memiliki prioritas paling rendah karena SLA masih 5 jam dan baru menunggu 6 jam.

### 4.2 Algoritma Pencarian (Search)

Pencarian tiket diimplementasikan menggunakan query SQL `LIKE` pada field `title` dan `description`.

**Implementasi pada `TicketService::getAllTickets()` (baris 320-327):**

```php
->when($filters['search'] ?? null, function ($q, $search) {
    $search = addcslashes($search, '%_');
    $q->where(function ($sub) use ($search) {
        $sub->where('title', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
    });
})
```

**Penjelasan:**
1. Input pencarian dari pengguna di-escape menggunakan `addcslashes($search, '%_')` untuk menangani karakter khusus SQL `%` dan `_` yang merupakan wildcard dalam `LIKE`.
2. Query menggunakan `WHERE ... LIKE '%keyword%'` yang akan mencocokkan keyword di mana saja dalam judul atau deskripsi.
3. Pencarian bersifat case-insensitive (bergantung pada collation database).
4. Pencarian dikombinasikan dengan filter lain (status, prioritas, kategori) menggunakan conditional clauses.

**Keterbatasan:**
- `LIKE '%keyword%'` tidak dapat menggunakan index secara efektif (full table scan untuk field teks).
- Tidak mendukung pencarian fuzzy, stemming, atau relevansi.
- Untuk performa lebih baik pada data besar, direkomendasikan menggunakan **Laravel Scout dengan Meilisearch** atau **MySQL Full-Text Search**.

### 4.3 Algoritma Autentikasi

Sistem menggunakan **session-based authentication** bawaan Laravel dengan Breeze starter kit.

**Flow Autentikasi:**
1. User mengakses halaman login (`GET /login`).
2. User mengirimkan kredensial (email + password) via `POST /login`.
3. Laravel memvalidasi kredensial menggunakan `Auth::attempt()`:
   - Mencari user berdasarkan email.
   - Memverifikasi password dengan `Hash::check()` (bcrypt).
4. Jika valid, session ID di-regenerate untuk keamanan.
5. Setelah login, route `/` memeriksa role user menggunakan `$user->hasRole('staff')`:
   - Staff → redirect ke `admin.dashboard` (`/admin/dashboard`)
   - Customer → redirect ke `portal.dashboard` (`/portal/dashboard`)
6. Middleware `role:staff` / `role:customer` dari Spatie melindungi route groups agar hanya user dengan role yang sesuai dapat mengakses.

**Password Hashing:** Menggunakan `bcrypt` dengan konfigurasi default Laravel (`'password' => 'hashed'` pada cast User model).

### 4.4 Algoritma Notifikasi

Sistem menggunakan **database notification channel** dari Laravel untuk menyimpan dan mengelola notifikasi.

**Flow Notifikasi:**

1. **Pembuatan Notifikasi:** `Notification::send($users, new TicketActivityNotification(...))` mengirim notifikasi ke semua user yang relevan (reporter, assignee, staff).

2. **Penyimpanan:** Notifikasi disimpan di tabel `notifications` dengan struktur polymorphic (`notifiable_type` + `notifiable_id`).

3. **Pengambilan Notifikasi:** User mengakses halaman notifikasi (`GET /notifications`). Controller mengambil notifikasi user via relasi `$user->notifications`.

4. **Mark as Read:** Terdapat dua mekanisme:
   - **Bulk Update:** Endpoint `POST /notifications/read-all` melakukan bulk update untuk menandai semua notifikasi user sebagai telah dibaca.
   - **Notifikasi baru otomatis** ditampilkan di header dengan badge counter.

5. **Cache:** Unread notification count di-cache per user dengan TTL 300 detik di `HandleInertiaRequests` middleware:
   ```php
   'unread_count' => fn () => $user
       ? Cache::remember("user_notif_count_{$user->id}", 300, fn () => $user->unreadNotifications()->count())
       : 0,
   ```

---

