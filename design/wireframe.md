# Wireframe — Helpdesk Ticketing Application

> Grayscale structural representations. Focus: layout, hierarchy, interactive elements.
> Markers: `[BTN]` button, `[LINK]` link, `[INPUT]` text input, `[SELECT]` dropdown, `[TEXTAREA]` text area, `[CHECKBOX]` checkbox, `[BADGE]` status badge, `[ICON]` icon, `[AVATAR]` user avatar, `[RATING]` star rating, `[DATA:…]` data placeholder, `[TEXT:…]` text placeholder.

---

## Application Shell (Main Layout)

### Desktop

```
+------------------+----------------------------------------------------------+
|     SIDEBAR      |               TOP HEADER BAR                             |
|    (288px)       |  [BTN:hamburger]  [INPUT:Cari tiket...]  [ICON:bell]    |
|                  +----------------------------------------------------------+
| [ICON:logo]      |                                                          |
| [LINK:Dashboard] |                                                          |
| [LINK:Kelola     |                 MAIN CONTENT AREA                        |
|  Tiket]          |                 (padding: 24px)                          |
| [LINK:Pengguna]  |                                                          |
| [LINK:Kategori]  |                                                          |
| [LINK:Departemen]|                                                          |
| [LINK:Pusat      |                                                          |
|  Bantuan]        |                                                          |
|                  |                                                          |
| [BTN:Buat Tiket] |                                                          |
| ================ |                                                          |
| [AVATAR]         |                                                          |
| [TEXT:User Name] |                                                          |
| [LINK:Logout]    |                                                          |
+------------------+----------------------------------------------------------+
```

### Sidebar Variants

**AdminLayout** (6 nav items, active item filled background):

```
+--------------------+
| [ICON:logo]        |
|                    |
| [LINK:Dashboard]   |  ← active: filled bg
| [LINK:Kelola Tiket]|
| [LINK:Pengguna]    |
| [LINK:Kategori]    |
| [LINK:Departemen]  |
| [LINK:Pusat       |
|  Bantuan]          |
|                    |
+--------------------+
```

**PortalLayout** (3 nav items, no CTA by default on sidebar; active item has left border):

```
+--------------------+
| [ICON:logo]        |
|                    |
| [LINK:Dashboard]   |  ← active: left border indicator
| [LINK:Tiket Saya]  |
| [LINK:Basis       |
|  Pengetahuan]      |
|                    |
| [BTN:Buat Tiket   |
|  Baru]             |
| ===================|
| [AVATAR]           |
| [TEXT:User Name]   |
| [LINK:Logout]      |
+--------------------+
```

### Mobile

```
+------------------------------------------+
| TOP HEADER BAR                            |
| [BTN:hamburger]  [ICON:bell]             |
+------------------------------------------+
|                                           |
|            MAIN CONTENT AREA              |
|                                           |
|                                           |
+------------------------------------------+
```

- Sidebar hidden off-screen; toggled by hamburger BTN as an overlay/drawer from left.
- Bottom navigation bar optional (not in scope for this wireframe).

---

---

## 1. Login — `/login`

*Standalone — no application shell.*

```
+------------------------------------------------------------------+
|                                                                    |
|                                                                    |
|                   +-------------------------------------------+    |
|                   |                                           |    |
|                   |           [ICON:helpdesk logo]            |    |
|                   |                                           |    |
|                   |          [TEXT: Helpdesk Ticketing]       |    |
|                   |          (heading, large)                 |    |
|                   |                                           |    |
|                   |      [TEXT: Masuk ke akun Anda]           |    |
|                   |      (subtitle)                           |    |
|                   |                                           |    |
|                   |      [INPUT: Email]                      |    |
|                   |                                           |    |
|                   |      [INPUT: Password]                   |    |
|                   |                                           |    |
|                   |      [CHECKBOX: Ingat saya]              |    |
|                   |                                           |    |
|                   |      [BTN: Masuk]  (full width)          |    |
|                   |                                           |    |
|                   |      [LINK: Belum punya akun?           |    |
|                   |              Daftar sekarang]             |    |
|                   |                                           |    |
|                   +-------------------------------------------+    |
|                                                                    |
|                                                                    |
+------------------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Centered card (max-w-sm) | Logo icon, heading, subtitle, form, footer link |
| Form | Email INPUT, Password INPUT, Remember me CHECKBOX, Masuk BTN |
| Footer link | Text + LINK to `/register` |

---

## 2. Register — `/register`

*Standalone — no application shell.*

```
+------------------------------------------------------------------+
|                                                                    |
|                                                                    |
|                   +-------------------------------------------+    |
|                   |                                           |    |
|                   |           [ICON:helpdesk logo]            |    |
|                   |                                           |    |
|                   |         [TEXT: Buat Akun Baru]           |    |
|                   |         (heading, large)                  |    |
|                   |                                           |    |
|                   |      [INPUT: Nama Lengkap]               |    |
|                   |                                           |    |
|                   |      [INPUT: Email]                      |    |
|                   |                                           |    |
|                   |      [INPUT: Telepon]   [INPUT: Departemen]|
|                   |      (side by side)                       |    |
|                   |                                           |    |
|                   |      [INPUT: Password]                   |    |
|                   |                                           |    |
|                   |      [INPUT: Konfirmasi Password]        |    |
|                   |                                           |    |
|                   |      [BTN: Daftar]  (full width)         |    |
|                   |                                           |    |
|                   |      [LINK: Sudah punya akun? Masuk]     |    |
|                   |                                           |    |
|                   +-------------------------------------------+    |
|                                                                    |
|                                                                    |
+------------------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Centered card (max-w-md) | Logo, heading, subtitle, form, footer link |
| Form row | Telepon INPUT + Departemen INPUT side by side |
| Footer link | Text + LINK to `/login` |

**Mobile**: Card spans full width with 16px horizontal padding. Side-by-side fields stack vertically.

---

## 3. Portal Dashboard — `/portal/dashboard`

*PortalLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (PortalLayout)   +----------------------------------------------------------+
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | [TEXT: Halo, {name}]                                | |
|                  | | [TEXT: Selamat datang di portal helpdesk]           | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +-------+ +-------+ +-------+ +-----------------------+  |
|                  | |       | |       | |       | |                       |  |
|                  | | [ICON]| | [ICON]| | [ICON]| | [ICON:plus]           |  |
|                  | |       | |       | |       | |                       |  |
|                  | |[TEXT: | |[TEXT: | |[TEXT: | | [TEXT:Total Tiket]    |  |
|                  | | 3]    | | 12]   | | 5]    | |                       |  |
|                  | |[TEXT: | |[TEXT: | |[TEXT: | | [TEXT:4]              |  |
|                  | |Tiket  | |Total  | |Disel- | |                       |  |
|                  | |Aktif] | |Tiket] | |saikan]| | [LINK:Buat Tiket      |  |
|                  | |       | |       | |       | |  Baru]                |  |
|                  | |(●Aktif| |       | |       | |                       |  |
|                  | | ○SLA) | |       | |       | |                       |  |
|                  | +-------+ +-------+ +-------+ +-----------------------+  |
|                  |                                                          |
|                  | +-------------------------------+ +-------------------+  |
|                  | |                               | |                   |  |
|                  | | Tiket Terbaru                 | | Basis Pengetahuan |  |
|                  | |                     [LINK:    | |                   |  |
|                  | |                   Lihat Semua]| | [ICON:book]       |  |
|                  | |                               | |                   |  |
|                  | | +---------------------------+ | | [TEXT: Temukan    |  |
|                  | | | [#UUID-001]               | | |  solusi dari...]  |  |
|                  | | | [BADGE:Open] [TEXT:title] | | |                   |  |
|                  | | | [TEXT:2025-01-15]    [>]  | | | [LINK:Lihat      |  |
|                  | | +---------------------------+ | |  Semua Artikel]   |  |
|                  | | | [#UUID-002]               | | +-------------------+  |
|                  | | | [BADGE:Pending] [TEXT:...]| |                          |
|                  | | | [TEXT:2025-01-14]    [>]  | |                          |
|                  | | +---------------------------+ |                          |
|                  | | | [#UUID-003]               | |                          |
|                  | | | [BADGE:Open] [TEXT:...]   | |                          |
|                  | | | [TEXT:2025-01-13]    [>]  | |                          |
|                  | | +---------------------------+ |                          |
|                  | +-------------------------------+                          |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Welcome header | Greeting TEXT with user name, subtitle TEXT |
| Stats row (4 cards) | Tiket Aktif (count + two dot indicators: filled for active, empty for SLA overdue), Total Tiket, Diselesaikan, Buat Tiket Baru CTA |
| Left 2/3 | "Tiket Terbaru" section header + Lihat Semua LINK, vertical list of ticket row cards |
| Ticket row | UUID label, status BADGE, title TEXT, date TEXT, chevron indicator `>` |
| Right 1/3 | "Basis Pengetahuan" card with book ICON, descriptive TEXT, Lihat Semua Artikel LINK |

**Mobile**: Stats row becomes 2×2 grid. Left/right columns stack vertically with "Tiket Terbaru" on top.

---

## 4. Portal Tickets Index — `/portal/tickets`

*PortalLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (PortalLayout)   +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Tiket Saya]                       [BTN:Buat     |
|                  |                                            Tiket Baru]    |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | [INPUT: Cari tiket...]  [SELECT:Semua Status]       | |
|                  | |                          [SELECT:Semua Prioritas]    | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | [#TKT-001] [BADGE:Open] [BADGE:Tinggi]              | |
|                  | | [TEXT: Printer kantor rusak]                         | |
|                  | | [TEXT: Hardware · John Doe]    [TEXT:2025-01-15] [>]| |
|                  | +------------------------------------------------------+ |
|                  | +------------------------------------------------------+ |
|                  | | [#TKT-002] [BADGE:Diproses] [BADGE:Sedang]          | |
|                  | | [TEXT: Permintaan reset password email]              | |
|                  | | [TEXT: IT Support · —]         [TEXT:2025-01-14] [>]| |
|                  | +------------------------------------------------------+ |
|                  | +------------------------------------------------------+ |
|                  | | [#TKT-003] [BADGE:Selesai] [BADGE:Rendah]           | |
|                  | | [TEXT: Update software]                              | |
|                  | | [TEXT: Software · Jane]        [TEXT:2025-01-10] [>]| |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  |   [ Empty State, if no tickets: ]                        |
|                  |   +--------------------------------------------------+  |
|                  |   |                                                  |  |
|                  |   |           [ICON:inbox]                           |  |
|                  |   |                                                  |  |
|                  |   |      [TEXT: Belum ada tiket]                    |  |
|                  |   |      [LINK: Buat tiket pertama Anda]            |  |
|                  |   |                                                  |  |
|                  |   +--------------------------------------------------+  |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Tiket Saya" heading + Buat Tiket Baru BTN |
| Filter bar | Search INPUT, Status SELECT, Prioritas SELECT |
| Ticket list | Vertical list of ticket cards |
| Ticket row | UUID label, two BADGEs (status + priority), title TEXT, category · assignee TEXT, date TEXT, chevron |
| Empty state | Inbox ICON, "Belum ada tiket" TEXT, "Buat tiket pertama Anda" LINK |

**Mobile**: Filter bar stacks: INPUT full width, SELECTs side by side below. Ticket rows same layout, compact.

---

## 5. Portal Tickets Create — `/portal/tickets/create`

*PortalLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (PortalLayout)   +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Buat Tiket Baru]                                  |
|                  | [TEXT: Isi formulir untuk membuat tiket baru]            |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | |                                                      | |
|                  | | [TEXT: Kategori]                                    | |
|                  | | [SELECT: Pilih Kategori]                            | |
|                  | |                                                      | |
|                  | | [TEXT: Judul]                                       | |
|                  | | [INPUT: Masukkan judul tiket]                       | |
|                  | |                                                      | |
|                  | | [TEXT: Deskripsi Lengkap]                           | |
|                  | | [TEXTAREA: Jelaskan masalah secara detail]          | |
|                  | | (6 rows)                                            | |
|                  | |                                                      | |
|                  | | [TEXT: Prioritas]                                   | |
|                  | | [SELECT: Pilih Prioritas]                           | |
|                  | | (Kritis / Tinggi / Sedang / Rendah)                  | |
|                  | |                                                      | |
|                  | | [TEXT: Lampiran]                                    | |
|                  | | [BTN:Ambil Foto]  [BTN:Pilih File]                  | |
|                  | |                                                      | |
|                  | | +--------+ +--------+ +--------+                   | |
|                  | | |[THUMB] | |[THUMB] | |[THUMB] |                   | |
|                  | | |[BTN:X] | |[BTN:X] | |[BTN:X] |                   | |
|                  | | +--------+ +--------+ +--------+                   | |
|                  | |                                                      | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | [BTN: Kirim Tiket]           [LINK: Batal]               |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Buat Tiket Baru" heading, instructional subtitle |
| Form card | Full-width card containing all fields |
| Fields | Kategori SELECT, Judul INPUT, Deskripsi TEXTAREA (6 rows), Prioritas SELECT |
| Lampiran section | Ambil Foto BTN, Pilih File BTN, thumbnail preview grid (each with remove BTN) |
| Form actions | Kirim Tiket BTN (primary), Batal LINK |

**Mobile**: Form card full width. Lampiran buttons stack vertically. Thumbnail grid 2 cols.

---

## 6. Portal Tickets Show — `/portal/tickets/{id}`

*PortalLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (PortalLayout)   +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Printer kantor rusak] [BADGE:Open] [BADGE:Tinggi]|
|                  | [#TKT-2025-001]                                         |
|                  | [BTN:Batalkan]  [BTN:Hapus]         [LINK:← Kembali]    |
|                  |                                                          |
|                  | +-------------------------------+ +-------------------+  |
|                  | |                               | |                   |  |
|                  | | Deskripsi                     | | Detail Tiket      |  |
|                  | |                               | |                   |  |
|                  | | [TEXT: Printer di lantai 2    | | Kategori          |  |
|                  | |  tidak bisa mencetak.         | | [TEXT:Hardware]   |  |
|                  | |  Sudah dicoba restart...]     | |                   |  |
|                  | |                               | | Pelapor           |  |
|                  | +-------------------------------+ | [TEXT:John Doe]   |  |
|                  |                                 | |                   |  |
|                  | +-------------------------------+ | Departemen         |  |
|                  | |                               | | [TEXT:Keuangan]   |  |
|                  | | Komentar (3)                  | |                   |  |
|                  | |                               | | Ditugaskan ke      |  |
|                  | | +---------------------------+ | | [TEXT:Jane Tech]  |  |
|                  | | | [AVATAR] [TEXT:Admin]     | | |                   |  |
|                  | | | [TEXT:2025-01-15 10:30]  | | | Diselesaikan       |  |
|                  | | | [TEXT: Bisa tolong       | | | [TEXT:—]          |  |
|                  | | |  cek kabel powernya?]    | | |                   |  |
|                  | | +---------------------------+ | | Dibatalkan         |  |
|                  | |                               | | [TEXT:—]          |  |
|                  | | +---------------------------+ | +-------------------+  |
|                  | | | [AVATAR] [TEXT:John]     | |                          |
|                  | | | [TEXT:2025-01-15 11:00] | |                          |
|                  | | | [TEXT: Sudah, tetap...]  | |                          |
|                  | | +---------------------------+ |                          |
|                  | |                               |                          |
|                  | | [TEXTAREA: Tulis komentar]  |                          |
|                  | | [INPUT:Lampiran (opsional)] |                          |
|                  | | [BTN: Kirim Komentar]       |                          |
|                  | +-------------------------------+                          |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Konfirmasi Penyelesaian       (shown if resolved)    | |
|                  | | [TEXT: Apakah masalah sudah terselesaikan?]          | |
|                  | | [BTN: Ya, Sudah Selesai]  [BTN: Belum Selesai]     | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Beri Rating                     (rating form)        | |
|                  | | [RATING: ☆ ☆ ☆ ☆ ☆]                                | |
|                  | | [TEXTAREA: Komentar tambahan (opsional)]             | |
|                  | | [BTN: Kirim Rating]                                 | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Rating Anda                      (read-only display)  | |
|                  | | [RATING: ★ ★ ★ ★ ☆]                                | |
|                  | | [TEXT: Respon cepat dan membantu.]                    | |
|                  | +------------------------------------------------------+ |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | Title TEXT, status BADGE, priority BADGE, UUID label, action BTNs (Batalkan, Hapus), Kembali LINK |
| Left 2/3 — Deskripsi card | Full description TEXT |
| Left 2/3 — Komentar card | Section heading "Komentar (n)", list of comment items (AVATAR, author TEXT, timestamp TEXT, body TEXT), komentar TEXTAREA, lampiran INPUT (optional), Kirim Komentar BTN |
| Left 2/3 — Konfirmasi card | Conditional: shown when resolved. Question TEXT, Ya BTN + Belum BTN |
| Left 2/3 — Rating form | Conditional: shown when resolved & not yet rated. RATING stars (clickable), TEXTAREA (optional), Kirim Rating BTN |
| Left 2/3 — Rating display | Conditional: shown when already rated. RATING stars (read-only), comment TEXT |
| Right 1/3 — Detail Tiket card | Field-value pairs: Kategori, Pelapor, Departemen, Ditugaskan ke, Diselesaikan, Dibatalkan |

**Mobile**: Left/right columns stack vertically: Detail Tiket card moves between Deskripsi and Komentar, or to bottom (TBD by UX preference). Action buttons may condense into a dropdown.

---

## 7. Portal KnowledgeBase — `/portal/knowledge-base`

*PortalLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (PortalLayout)   +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Basis Pengetahuan]                                 |
|                  | [TEXT: Temukan solusi untuk masalah umum]                 |
|                  |                                                          |
|                  | +-------------------+ +-------------------+ +-------------------+ |
|                  | |                   | |                   | |                   | |
|                  | | [BADGE:Hardware]  | | [BADGE:Software]  | | [BADGE:Jaringan]  | |
|                  | |                   | |                   | |                   | |
|                  | | [TEXT: Cara       | | [TEXT: Cara       | | [TEXT: Troubles-  | |
|                  | |  mengganti       | |  instal ulang    | |  hooting WiFi    | |
|                  | |  tinta printer]  | |  Microsoft Office| |  kantor]         | |
|                  | |                   | |                   | |                   | |
|                  | | [TEXT:           | | [TEXT:           | | [TEXT:           | |
|                  | |  15 Jan 2025]    | |  10 Jan 2025]    | |  05 Jan 2025]    | |
|                  | +-------------------+ +-------------------+ +-------------------+ |
|                  |                                                          |
|                  | +-------------------+ +-------------------+ +-------------------+ |
|                  | |                   | |                   | |                   | |
|                  | | [BADGE:Email]    | | [BADGE:Umum]     | | [BADGE:Hardware]  | |
|                  | |                   | |                   | |                   | |
|                  | | [TEXT: Setting   | | [TEXT: Panduan   | | [TEXT: Mengganti  | |
|                  | |  email di        | |  pengguna baru]  | |  keyboard]        | |
|                  | |  Outlook]        | |                   | |                   | |
|                  | |                   | |                   | |                   | |
|                  | | [TEXT:           | | [TEXT:           | | [TEXT:           | |
|                  | |  02 Jan 2025]    | |  28 Des 2024]    | |  20 Des 2024]    | |
|                  | +-------------------+ +-------------------+ +-------------------+ |
|                  |                                                          |
|                  |   [ Empty State, if no articles: ]                       |
|                  |   +--------------------------------------------------+  |
|                  |   |                                                  |  |
|                  |   |            [ICON:book-open]                     |  |
|                  |   |                                                  |  |
|                  |   |       [TEXT: Belum ada artikel]                 |  |
|                  |   |                                                  |  |
|                  |   +--------------------------------------------------+  |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Basis Pengetahuan" heading, descriptive subtitle |
| Article grid (3 cols) | Cards: category BADGE, title TEXT, date TEXT |
| Empty state | Book ICON, "Belum ada artikel" TEXT |

**Mobile**: Grid collapses to single column. Cards stack vertically.

---

## 8. Portal KnowledgeBase Show — `/portal/knowledge-base/{id}`

*PortalLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (PortalLayout)   +----------------------------------------------------------+
|                  |                                                          |
|                  | [LINK: ← Kembali ke Basis Pengetahuan]                    |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | |                                                      | |
|                  | | [BADGE: Hardware]                                    | |
|                  | |                                                      | |
|                  | | [TEXT: Cara Mengganti Tinta Printer] (heading)       | |
|                  | |                                                      | |
|                  | | [TEXT: Ditulis oleh Admin · 15 Januari 2025]        | |
|                  | |                                                      | |
|                  | | ==============================================       | |
|                  | |                                                      | |
|                  | | [TEXT: Langkah-langkah mengganti tinta printer:     | |
|                  | |                                                      | |
|                  | | 1. Buka penutup printer                             | |
|                  | |                                                      | |
|                  | | 2. Keluarkan cartridge lama dengan hati-hati        | |
|                  | |                                                      | |
|                  | | 3. Masukkan cartridge baru sesuai slot               | |
|                  | |                                                      | |
|                  | | 4. Tutup penutup dan tunggu printer melakukan       | |
|                  | |    kalibrasi otomatis                               | |
|                  | |                                                      | |
|                  | | Catatan: Gunakan hanya tinta original untuk         | |
|                  | | hasil terbaik.]                                      | |
|                  | |                                                      | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Breadcrumb | Back LINK to knowledge base index |
| Article card | Category BADGE, title heading TEXT, author · date TEXT, separator, rich content TEXT (formatted body) |

**Mobile**: Same layout; card spans full width.

---

## 9. Admin Dashboard — `/admin/dashboard`

*AdminLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (AdminLayout)    +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Dashboard Admin]                                   |
|                  | [TEXT: Ringkasan sistem helpdesk]                         |
|                  |                                                          |
|                  | +-------+ +-------+ +-------+ +-------+ +-------+ +-----+ |
|                  | |[ICON] | |[ICON] | |[ICON] | |[ICON] | |[ICON] | |[ICON]| |
|                  | |       | |       | |       | |       | |       | |      | |
|                  | |[TEXT: | |[TEXT: | |[TEXT: | |[TEXT: | |[TEXT: | |[TEXT: | |
|                  | |128]   | | 23]   | | 45]   | | 42]   | | 18]   | | 5]   | |
|                  | |       | |       | |       | |       | |       | |      | |
|                  | |[TEXT: | |[TEXT: | |[TEXT: | |[TEXT: | |[TEXT: | |[TEXT: | |
|                  | |Total  | |Me-    | |Di-    | |Sele-  | |Di-    | |Mele-  | |
|                  | |Tiket] | |nunggu]| |proses]| |sai]   | |tutup] | |wati   | |
|                  | |       | |       | |       | |       | |       | |SLA]   | |
|                  | +-------+ +-------+ +-------+ +-------+ +-------+ +-----+ |
|                  |                                                          |
|                  | +-------------------------+ +---------------------------+ |
|                  | |                         | |                           | |
|                  | | Distribusi Status       | | Distribusi Prioritas      | |
|                  | |                         | |                           | |
|                  | |     (doughnut)          | |      (doughnut)           | |
|                  | |    /--------\           | |     /--------\            | |
|                  | |   /  Menunggu \         | |    /  Kritis   \          | |
|                  | |  |    (23)     |        | |   |    (12)     |         | |
|                  | |  |             |        | |   |              |         | |
|                  | |  |  Diproses   |        | |   |  Tinggi     |         | |
|                  | |  |   (45)      |        | |   |   (35)      |         | |
|                  | |  |             |        | |   |              |         | |
|                  | |  |  Selesai    |        | |   |  Sedang     |         | |
|                  | |  |   (42)      |        | |   |   (48)      |         | |
|                  | |  |             |        | |   |              |         | |
|                  | |  |  Ditutup    |        | |   |  Rendah     |         | |
|                  | |  |   (18)      |        | |   |   (33)      |         | |
|                  | |   \           /         | |    \           /          | |
|                  | |    \--------/           | |     \--------/           | |
|                  | |                         | |                           | |
|                  | +-------------------------+ +---------------------------+ |
|                  |                                                          |
|                  | +-------------------------------+ +-------------------+  |
|                  | |                               | |                   |  |
|                  | | Tiket Terbaru                 | | Beban Kerja Staff |  |
|                  | |                  [LINK:       | |                   |  |
|                  | |               Lihat Semua]    | | John Doe: 8 tiket |  |
|                  | |                               | | Jane Tech: 5      |  |
|                  | | Judul | Prio | Status | Assgn | | Bob IT: 3 tiket   |  |
|                  | | ------+------+--------+-------| | Alice: 2 tiket    |  |
|                  | | Print |Tinggi|Diproses| Jane  | | Eva: 1 tiket      |  |
|                  | | Reset |Sedang|Menunggu| John  | |                   |  |
|                  | | WiFi  |Kritis|Diproses| Bob   | |                   |  |
|                  | | Email |Rendah|Selesai | Alice | |                   |  |
|                  | +-------------------------------+ +-------------------+  |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Dashboard Admin" heading, subtitle TEXT |
| Stats row (6 cards) | Total, Menunggu, Diproses, Selesai, Ditutup, Melewati SLA — each with ICON + count + label |
| Chart row (2 cols) | Doughnut chart: Distribusi Status (5 segments) + Doughnut chart: Distribusi Prioritas (4 segments) |
| Left 2/3 — Tiket Terbaru | Table header: Judul, Prioritas, Status, Ditugaskan. 4+ data rows. Lihat Semua LINK |
| Right 1/3 — Beban Kerja Staff | Vertical list of staff names with ticket counts |

**Mobile**: Stats row becomes 3×2 or 2×3 grid. Charts stack vertically. Left/right columns stack: table first, then staff workload.

---

## 10. Admin Tickets Index — `/admin/tickets`

*AdminLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (AdminLayout)    +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Kelola Tiket]                                      |
|                  | [TEXT: Kelola semua tiket helpdesk]                       |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | [INPUT: Cari tiket...] [SELECT:Status]               | |
|                  | |                        [SELECT:Prioritas]            | |
|                  | |                        [SELECT:Kategori]             | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Judul           |Pelapor |Kategori|Prioritas|Status   | |
|                  | | (SLA)           |        |        |         |         | |
|                  | |-----------------+--------+--------+---------+---------| |
|                  | | Printer rusak   |John Doe|Hardware|[BADGE:  |[BADGE:  | |
|                  | | [BADGE:SLA OK]  |        |        | Tinggi] |Diproses]| |
|                  | |-----------------+--------+--------+---------+---------| |
|                  | | Reset password  |Sarah K.|IT      |[BADGE:  |[BADGE:  | |
|                  | | [BADGE:SLA Warn]|        |        | Sedang] |Menunggu]| |
|                  | |-----------------+--------+--------+---------+---------| |
|                  | | WiFi kantor     |Bob M.  |Jaringan|[BADGE:  |[BADGE:  | |
|                  | | [BADGE:SLA Over]|        |        | Kritis] |Diproses]| |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Petugas   | Tanggal     | SAW Score |                 | |
|                  | |           |             |           |                 | |
|                  | |-----------+-------------+-----------|                 | |
|                  | | Jane Tech | 2025-01-15  | 0.85      |                 | |
|                  | |-----------+-------------+-----------|                 | |
|                  | | John Admin| 2025-01-14  | 0.62      |                 | |
|                  | |-----------+-------------+-----------|                 | |
|                  | | Bob IT    | 2025-01-14  | 0.91      |                 | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  |   [ Pagination: ← 1 2 3 ... 10 → ]                      |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Kelola Tiket" heading, subtitle TEXT |
| Filter bar | Search INPUT, Status SELECT, Prioritas SELECT, Kategori SELECT |
| Data table | Columns: Judul (with SLA BADGE), Pelapor, Kategori, Prioritas (BADGE), Status (BADGE), Petugas, Tanggal, SAW Score |
| SLA badges | SLA OK (on time), SLA Warn (approaching deadline), SLA Over (overdue) — visually distinct |
| Pagination | Page number links, prev/next arrows |

**Mobile**: Table scrolls horizontally. Filters stack vertically. Some columns may be hidden behind an expand row or condensed into a stacked card layout per row.

---

## 11. Admin Tickets Show — `/admin/tickets/{id}`

*AdminLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (AdminLayout)    +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Printer kantor rusak] [BADGE:Diproses] [BADGE:Tinggi]|
|                  | [#TKT-2025-001] [TEXT: SLA: 2 jam 15 menit tersisa]       |
|                  |              [LINK:← Kembali]      [BTN:Hapus]            |
|                  |                                                          |
|                  | +-------------------------------+ +-------------------+  |
|                  | |                               | |                   |  |
|                  | | Deskripsi                     | | Detail Tiket      |  |
|                  | |                               | |                   |  |
|                  | | [TEXT: Printer di lantai 2    | | ID Tiket          |  |
|                  | |  tidak bisa mencetak...]      | | [TEXT:#TKT-001]  |  |
|                  | |                               | |                   |  |
|                  | +-------------------------------+ | Pelapor           |  |
|                  |                                 | | [TEXT:John Doe]   |  |
|                  | +-------------------------------+ |                   |  |
|                  | |                               | | Departemen         |  |
|                  | | Kelola Tiket                  | | [TEXT:Keuangan]   |  |
|                  | |                               | |                   |  |
|                  | | [SELECT: Ubah Status]         | | Kategori          |  |
|                  | | [SELECT: Ubah Prioritas]      | | [TEXT:Hardware]   |  |
|                  | | [SELECT: Assign ke Petugas]   | |                   |  |
|                  | |                               | | Ditugaskan ke      |  |
|                  | | [BTN: Simpan Perubahan]       | | [TEXT:Jane Tech]  |  |
|                  | |                               | |                   |  |
|                  | +-------------------------------+ | Diselesaikan       |  |
|                  |                                 | | [TEXT:—]          |  |
|                  | +-------------------------------+ |                   |  |
|                  | |                               | | Dikonfirmasi       |  |
|                  | | Komentar (4)                  | | [TEXT:—]          |  |
|                  | |                               | |                   |  |
|                  | | +---------------------------+ | | Dibatalkan         |  |
|                  | | | [AVATAR] [TEXT:Jane]      | | | [TEXT:—]          |  |
|                  | | | [TEXT:15-01 10:00]       | | +-------------------+  |
|                  | | | [TEXT: Sudah dicek...]   | |                          |
|                  | | +---------------------------+ | +-------------------+  |
|                  | |                               | |                   |  |
|                  | | +---------------------------+ | | Log Aktivitas     |  |
|                  | | | [AVATAR] [TEXT:Admin]    | | |                   |  |
|                  | | | [TEXT:15-01 10:15]      | | | ● 15 Jan 10:15    |  |
|                  | | | [TEXT: Internal note:   | | |   Admin mengubah  |  |
|                  | | |  perlu dicek hardware]  | | |   status ke      |  |
|                  | | | [BADGE:Internal]        | | |   Diproses        |  |
|                  | | +---------------------------+ | |                   |  |
|                  | |                               | | ● 15 Jan 10:00    |  |
|                  | | [TEXTAREA: Tulis komentar]  | |   Tiket Dibuat    |  |
|                  | | [CHECKBOX: Catatan Internal]| |                   |  |
|                  | | [INPUT:Lampiran]            | | ● 15 Jan 09:00    |  |
|                  | | [BTN: Kirim Komentar]       | |   Jane ditugaskan |  |
|                  | +-------------------------------+ +-------------------+  |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Rating Pengguna                      (read-only)      | |
|                  | | [RATING: ★ ★ ★ ★ ☆]                                | |
|                  | | [TEXT: Respon cukup cepat.]                         | |
|                  | +------------------------------------------------------+ |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | Title TEXT, status BADGE, priority BADGE, UUID + SLA time remaining TEXT, Kembali LINK, Hapus BTN |
| Left 2/3 — Deskripsi card | Full description TEXT |
| Left 2/3 — Kelola Tiket card | Status SELECT, Prioritas SELECT, Assign SELECT, Simpan Perubahan BTN |
| Left 2/3 — Komentar card | "Komentar (n)" heading. Each comment: AVATAR, author TEXT, timestamp TEXT, body TEXT. Internal notes marked with internal BADGE. Comment TEXTAREA, Catatan Internal CHECKBOX, lampiran INPUT, Kirim Komentar BTN |
| Left 2/3 — Rating display | RATING stars (read-only) + comment TEXT from user |
| Right 1/3 — Detail Tiket card | ID, Pelapor, Departemen, Kategori, Ditugaskan ke, Diselesaikan, Dikonfirmasi, Dibatalkan |
| Right 1/3 — Log Aktivitas card | Vertical timeline: bullet points with timestamp + action description |

**Mobile**: Left/right stack vertically. Detail Tiket moves to top or below Deskripsi. Kelola Tiket form compacts. Log Aktivitas below Detail Tiket.

---

## 12. Admin Users Index — `/admin/users`

*AdminLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (AdminLayout)    +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Kelola Pengguna]             [BTN: Tambah Pengguna]|
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | [INPUT: Cari pengguna...]     [SELECT: Semua Peran]  | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Nama    | Email          | Dept   | Peran           | |
|                  | |---------+----------------+--------+-----------------| |
|                  | |John Doe |john@mail.com   |Keuangan|[BADGE:Admin]    | |
|                  | |---------+----------------+--------+-----------------| |
|                  | |Sarah K. |sarah@mail.com  |IT      |[BADGE:Pengguna]| |
|                  | |---------+----------------+--------+-----------------| |
|                  | |Bob M.   |bob@mail.com    |HRD     |[BADGE:Pengguna]| |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | NIP            | Jabatan          | Aksi             | |
|                  | |----------------+------------------+------------------| |
|                  | | 19850101...    | [BADGE:Kepala    | [BTN:Edit]       | |
|                  | |                |  Departemen]     | [BTN:Hapus]      | |
|                  | |----------------+------------------+------------------| |
|                  | | 19900202...    | [BADGE:Staff]    | [BTN:Edit]       | |
|                  | |                |                  | [BTN:Hapus]      | |
|                  | |----------------+------------------+------------------| |
|                  | | 19920303...    | [BADGE:Staff]    | [BTN:Edit]       | |
|                  | |                |                  | [BTN:Hapus]      | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  |   [ Pagination: ← 1 2 3 ... 10 → ]                      |
|                  |                                                          |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Kelola Pengguna" heading + Tambah Pengguna BTN |
| Filter bar | Search INPUT, Peran SELECT |
| Data table | Nama, Email, Departemen, Peran (BADGE), NIP, Jabatan (BADGE), Aksi (Edit/Hapus BTNs) |
| Pagination | Prev/next, page numbers |

### Modal: Tambah / Edit Pengguna

```
+------------------------------------------------------------------+
|                                                                    |
|            +-------------------------------------------+           |
|            |                                           |           |
|            |  [TEXT: Tambah Pengguna / Edit Pengguna]  |           |
|            |                                    [BTN:X]|           |
|            |                                           |           |
|            |  [INPUT: Nama Lengkap]                    |           |
|            |                                           |           |
|            |  [INPUT: Email]                           |           |
|            |                                           |           |
|            |  [INPUT: Telepon]                         |           |
|            |                                           |           |
|            |  [SELECT: Departemen]  [SELECT: Jabatan]  |           |
|            |                                           |           |
|            |  [TEXT: NIP: 19850101...] (read-only)     |           |
|            |                                           |           |
|            |  [INPUT: Password]  [BTN:toggle show]     |           |
|            |                                           |           |
|            |  [SELECT: Peran]                          |           |
|            |                                           |           |
|            |  [BTN: Simpan]         [BTN: Batal]       |           |
|            |                                           |           |
|            +-------------------------------------------+           |
|            (overlay backdrop)                                       |
+------------------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Modal overlay | Dimmed backdrop, centered card |
| Header | Title TEXT + close BTN (X) |
| Form fields | Nama Lengkap INPUT, Email INPUT, Telepon INPUT, Departemen SELECT + Jabatan SELECT (side by side), NIP TEXT (read-only, auto from user data), Password INPUT + toggle visibility BTN, Peran SELECT |
| Actions | Simpan/Tambah BTN, Batal BTN |

### Confirm Dialog: Hapus Pengguna

```
+------------------------------------------------------------------+
|                                                                    |
|                 +----------------------------------+              |
|                 |                                  |              |
|                 |  [TEXT: Konfirmasi Hapus]        |              |
|                 |                                  |              |
|                 |  [TEXT: Apakah Anda yakin ingin  |              |
|                 |   menghapus pengguna ini?]       |              |
|                 |                                  |              |
|                 |  [BTN: Hapus]    [BTN: Batal]    |              |
|                 |                                  |              |
|                 +----------------------------------+              |
|                 (overlay backdrop)                                 |
+------------------------------------------------------------------+
```

**Mobile**: Table scrolls horizontally. Modal fills screen width with 16px padding.

---

## 13. Admin Categories Index — `/admin/categories`

*AdminLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (AdminLayout)    +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Kelola Kategori]           [BTN: Tambah Kategori] |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Nama         | Slug          | Deskripsi             | |
|                  | |--------------+---------------+-----------------------| |
|                  | | Hardware     | hardware      | Masalah perangkat     | |
|                  | |              |               | keras                 | |
|                  | |--------------+---------------+-----------------------| |
|                  | | Software     | software      | Masalah aplikasi      | |
|                  | |              |               | dan program           | |
|                  | |--------------+---------------+-----------------------| |
|                  | | Jaringan     | jaringan      | Masalah koneksi       | |
|                  | |              |               | internet & LAN        | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Jumlah Tiket  | Aksi                                 | |
|                  | |---------------+--------------------------------------| |
|                  | | 45            | [BTN:Edit]  [BTN:Hapus]              | |
|                  | |---------------+--------------------------------------| |
|                  | | 32            | [BTN:Edit]  [BTN:Hapus]              | |
|                  | |---------------+--------------------------------------| |
|                  | | 18            | [BTN:Edit]  [BTN:Hapus]              | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Kelola Kategori" heading + Tambah Kategori BTN |
| Data table | Nama, Slug, Deskripsi, Jumlah Tiket, Aksi (Edit/Hapus BTNs) |

### Modal: Tambah / Edit Kategori

```
+------------------------------------------------------------------+
|                                                                    |
|            +-------------------------------------------+           |
|            |                                           |           |
|            |  [TEXT: Tambah Kategori / Edit Kategori]  |           |
|            |                                    [BTN:X]|           |
|            |                                           |           |
|            |  [INPUT: Nama Kategori]                   |           |
|            |                                           |           |
|            |  [TEXTAREA: Deskripsi Kategori]           |           |
|            |  (3 rows)                                  |           |
|            |                                           |           |
|            |  [BTN: Simpan]         [BTN: Batal]       |           |
|            |                                           |           |
|            +-------------------------------------------+           |
|            (overlay backdrop)                                       |
+------------------------------------------------------------------+
```

### Confirm Dialog: Hapus Kategori

```
+------------------------------------------------------------------+
|                                                                    |
|                 +----------------------------------+              |
|                 |                                  |              |
|                 |  [TEXT: Konfirmasi Hapus]        |              |
|                 |                                  |              |
|                 |  [TEXT: Apakah Anda yakin ingin  |              |
|                 |   menghapus kategori ini? Tiket  |              |
|                 |   terkait akan kehilangan        |              |
|                 |   kategorinya.]                  |              |
|                 |                                  |              |
|                 |  [BTN: Hapus]    [BTN: Batal]    |              |
|                 |                                  |              |
|                 +----------------------------------+              |
|                 (overlay backdrop)                                 |
+------------------------------------------------------------------+
```

**Mobile**: Table scrolls horizontally. Modal full width.

---

## 14. Admin Departments Index — `/admin/departments`

*AdminLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (AdminLayout)    +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Kelola Departemen]       [BTN: Tambah Departemen]|
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Nama              | Slug              | Aksi          | |
|                  | |-------------------+-------------------+---------------| |
|                  | | Keuangan          | keuangan          | [BTN:Edit]    | |
|                  | |                   |                   | [BTN:Hapus]   | |
|                  | |-------------------+-------------------+---------------| |
|                  | | IT                | it                | [BTN:Edit]    | |
|                  | |                   |                   | [BTN:Hapus]   | |
|                  | |-------------------+-------------------+---------------| |
|                  | | HRD               | hrd               | [BTN:Edit]    | |
|                  | |                   |                   | [BTN:Hapus]   | |
|                  | |-------------------+-------------------+---------------| |
|                  | | Umum              | umum              | [BTN:Edit]    | |
|                  | |                   |                   | [BTN:Hapus]   | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Kelola Departemen" heading + Tambah Departemen BTN |
| Data table | Nama, Slug, Aksi (Edit/Hapus BTNs) |

### Modal: Tambah / Edit Departemen

```
+------------------------------------------------------------------+
|                                                                    |
|            +-------------------------------------------+           |
|            |                                           |           |
|            |  [TEXT: Tambah Departemen /                |           |
|            |          Edit Departemen]                 |           |
|            |                                    [BTN:X]|           |
|            |                                           |           |
|            |  [INPUT: Nama Departemen]                 |           |
|            |                                           |           |
|            |  [BTN: Simpan]         [BTN: Batal]       |           |
|            |                                           |           |
|            +-------------------------------------------+           |
|            (overlay backdrop)                                       |
+------------------------------------------------------------------+
```

**Mobile**: Table scrolls horizontally. Modal full width.

---

## 15. Admin KnowledgeBase Index — `/admin/knowledge-base`

*AdminLayout sidebar.*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (AdminLayout)    +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Pusat Bantuan]            [BTN: Tambah Artikel]   |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Judul            | Kategori  | Status              | |
|                  | |------------------+-----------+---------------------| |
|                  | | Cara mengganti   | Hardware  | [BADGE:Publikasi]   | |
|                  | | tinta printer    |           |                     | |
|                  | |------------------+-----------+---------------------| |
|                  | | Instal ulang     | Software  | [BADGE:Draft]       | |
|                  | | Microsoft Office |           |                     | |
|                  | |------------------+-----------+---------------------| |
|                  | | Troubleshooting  | Jaringan  | [BADGE:Publikasi]   | |
|                  | | WiFi kantor      |           |                     | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | | Penulis       | Aksi                                 | |
|                  | |---------------+--------------------------------------| |
|                  | | Admin         | [BTN:Edit]  [BTN:Hapus]              | |
|                  | |---------------+--------------------------------------| |
|                  | | Admin         | [BTN:Edit]  [BTN:Hapus]              | |
|                  | |---------------+--------------------------------------| |
|                  | | Jane Tech     | [BTN:Edit]  [BTN:Hapus]              | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Pusat Bantuan" heading + Tambah Artikel BTN |
| Data table | Judul, Kategori, Status (Publikasi/Draft BADGE), Penulis, Aksi (Edit/Hapus BTNs) |

### Modal: Tambah / Edit Artikel

```
+------------------------------------------------------------------+
|                                                                    |
|            +-------------------------------------------+           |
|            |                                           |           |
|            |  [TEXT: Tambah Artikel / Edit Artikel]    |           |
|            |                                    [BTN:X]|           |
|            |                                           |           |
|            |  [INPUT: Judul Artikel]                   |           |
|            |                                           |           |
|            |  [SELECT: Kategori]                       |           |
|            |                                           |           |
|            |  [TEXTAREA: Konten Artikel]               |           |
|            |  (6 rows)                                  |           |
|            |                                           |           |
|            |  [CHECKBOX: Publikasikan artikel]         |           |
|            |                                           |           |
|            |  [BTN: Simpan]         [BTN: Batal]       |           |
|            |                                           |           |
|            +-------------------------------------------+           |
|            (overlay backdrop)                                       |
+------------------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Form fields | Judul INPUT, Kategori SELECT, Konten TEXTAREA (6 rows), Publikasikan CHECKBOX |
| Actions | Simpan BTN, Batal BTN |

**Mobile**: Table scrolls horizontally. Modal full width.

---

## 16. Notifications — `/notifications`

*Sidebar depends on user role (AdminLayout or PortalLayout).*

```
+------------------+----------------------------------------------------------+
| SIDEBAR          | TOP HEADER BAR                                           |
| (role-based)     +----------------------------------------------------------+
|                  |                                                          |
|                  | [TEXT: Notifikasi]                                       |
|                  | [TEXT: Pusat pemberitahuan Anda]                         |
|                  |                                         [BTN:Tandai       |
|                  |                                          Semua Dibaca]    |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | |                                                      | |
|                  | | [ICON:status-change]                                 | |
|                  | |                                                      | |
|                  | | [TEXT: Status tiket diperbarui]                     | |
|                  | | [TEXT: Tiket #TKT-001 berubah status ke Diproses]   | |
|                  | |                                                      | |
|                  | | [TEXT: 5 menit yang lalu]    [BADGE:Baru]           | |
|                  | |                                                      | |
|                  | +------------------------------------------------------+ |
|                  |   (unread notification — slightly darker background)    |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | |                                                      | |
|                  | | [ICON:comment]                                       | |
|                  | |                                                      | |
|                  | | [TEXT: Komentar baru pada tiket]                    | |
|                  | | [TEXT: Admin menambahkan komentar pada tiket Anda]   | |
|                  | |                                                      | |
|                  | | [TEXT: 1 jam yang lalu]                             | |
|                  | |                                                      | |
|                  | +------------------------------------------------------+ |
|                  |   (read notification — lighter background)              |
|                  |                                                          |
|                  | +------------------------------------------------------+ |
|                  | |                                                      | |
|                  | | [ICON:ticket-created]                                | |
|                  | |                                                      | |
|                  | | [TEXT: Tiket baru dibuat]                            | |
|                  | | [TEXT: Tiket #TKT-042 berhasil dibuat]              | |
|                  | |                                                      | |
|                  | | [TEXT: 2 jam yang lalu]                             | |
|                  | |                                                      | |
|                  | +------------------------------------------------------+ |
|                  |                                                          |
|                  |   [ Empty State, if no notifications: ]                 |
|                  |   +--------------------------------------------------+  |
|                  |   |                                                  |  |
|                  |   |            [ICON:bell-off]                      |  |
|                  |   |                                                  |  |
|                  |   |       [TEXT: Belum ada notifikasi]              |  |
|                  |   |                                                  |  |
|                  |   +--------------------------------------------------+  |
+------------------+----------------------------------------------------------+
```

| Zone | Contents |
|------|----------|
| Page header | "Notifikasi" heading, subtitle TEXT, Tandai Semua Dibaca BTN |
| Notification list | Vertical list of notification cards, each with: action ICON, title TEXT, description TEXT, timestamp TEXT, Baru BADGE (if unread) |
| Unread state | Slightly darker/emphasized background shading |
| Read state | Lighter background shading, no Baru BADGE |
| Empty state | Bell-off ICON, "Belum ada notifikasi" TEXT |

**Mobile**: Notification cards span full width. Tandai Semua Dibaca BTN may move below header.

---

## Element Reference

| Marker | Meaning |
|--------|---------|
| `[BTN:label]` | Clickable button |
| `[LINK:label]` | Hyperlink / anchor |
| `[INPUT:placeholder]` | Text input field |
| `[SELECT:label]` | Dropdown / combo box |
| `[TEXTAREA:label]` | Multi-line text area |
| `[CHECKBOX:label]` | Checkbox toggle |
| `[BADGE:label]` | Status/chip badge |
| `[ICON:name]` | Icon (SVG or icon font) |
| `[AVATAR]` | User avatar image/circle |
| `[RATING:stars]` | Star rating (☆ empty, ★ filled) |
| `[TEXT:content]` | Static text content |
| `[DATA:content]` | Dynamic data placeholder |

---

## Mobile Adaptation Summary

| Page(s) | Adaptation |
|---------|------------|
| All | Sidebar hidden; opened via hamburger BTN as overlay drawer. Header bar simplified. |
| Login / Register | Card spans full width with 16px padding. Side-by-side fields stack vertically. |
| Portal Dashboard | Stats 2×2 grid. Left/right columns stack vertically. |
| Portal Tickets Index | Filters stack vertically. Table becomes card list. |
| Portal Tickets Create | Form full width, lampiran buttons stack (2-col thumb grid). |
| Portal Tickets Show | Left/right stack: Detail card moves below Deskripsi. Action BTNs may collapse to dropdown. |
| Portal KnowledgeBase | Grid collapses to single column. |
| Admin Dashboard | Stats 3×2 or 2×3 grid. Charts stack vertically. Columns stack. |
| Admin Tables (Tickets, Users, Categories, Departments, KB) | Horizontal scroll on table. Filters stack. |
| Modals | Full-width with 16px side padding. |
| Notifications | Cards full width. Tandai BTN moves below header. |
