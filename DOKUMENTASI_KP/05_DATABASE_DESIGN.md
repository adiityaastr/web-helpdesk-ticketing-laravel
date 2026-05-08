# Database Design - Helpdesk Ticketing System

## 📊 ER Diagram

Lihat file: `diagrams/07_er_diagram.puml`

---

## 🗄️ Spesifikasi Tabel

### 1. **users** - Tabel Pengguna

```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_department (department)
);
```

**Deskripsi**:
- Menyimpan data user (admin, staff, customer)
- Email unique untuk login
- Password di-hash dengan bcrypt
- Phone & department optional

---

### 2. **roles** - Tabel Role

```sql
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    guard_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Data Default**:
- admin
- staff
- customer

---

### 3. **model_has_roles** - Pivot Table User-Role

```sql
CREATE TABLE model_has_roles (
    model_id INT NOT NULL,
    role_id INT NOT NULL,
    model_type VARCHAR(255) NOT NULL,
    
    PRIMARY KEY (model_id, role_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    
    INDEX idx_model (model_id, model_type)
);
```

**Deskripsi**:
- Relasi many-to-many antara user & role
- Satu user bisa punya multiple role (jarang)
- Biasanya satu user satu role

---

### 4. **tickets** - Tabel Tiket

```sql
CREATE TABLE tickets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    assigned_to INT,
    title VARCHAR(255) NOT NULL,
    description LONGTEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    status ENUM('open', 'in_progress', 'resolved', 'closed', 'cancelled') DEFAULT 'open',
    sla_deadline TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    rating INT,
    rating_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_user_id (user_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_category_id (category_id),
    INDEX idx_created_at (created_at),
    INDEX idx_status_priority (status, priority)
);
```

**Deskripsi**:
- Tabel utama untuk tiket
- UUID untuk unique identifier eksternal
- Status flow: open → in_progress → resolved → closed
- Priority: low, medium, high, critical
- SAW score disimpan di cache, bukan di DB
- Rating 1-5 bintang dari customer

---

### 5. **comments** - Tabel Komentar

```sql
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    message LONGTEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_user_id (user_id),
    INDEX idx_is_internal (is_internal)
);
```

**Deskripsi**:
- Komentar publik (terlihat customer) atau internal (hanya staff)
- Attachments disimpan sebagai JSON array
- Cascade delete saat ticket dihapus

---

### 6. **categories** - Tabel Kategori Tiket

```sql
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug)
);
```

**Data Default**:
- Hardware
- Software
- Jaringan
- Akses Akun
- Lainnya

---

### 7. **knowledge_bases** - Tabel Basis Pengetahuan

```sql
CREATE TABLE knowledge_bases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content LONGTEXT NOT NULL,
    category_id INT,
    author_id INT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_slug (slug),
    INDEX idx_is_published (is_published),
    INDEX idx_category_id (category_id)
);
```

**Deskripsi**:
- Artikel bantuan untuk customer
- Draft (is_published = false) atau publish (is_published = true)
- Hanya artikel publish yang terlihat customer
- Full-text search support

---

### 8. **activity_logs** - Tabel Log Aktivitas

```sql
CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    ticket_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);
```

**Deskripsi**:
- Audit trail untuk semua aktivitas
- Action: create, update, assign, comment, resolve, close, cancel
- Untuk compliance & debugging

---

### 9. **notifications** - Tabel Notifikasi

```sql
CREATE TABLE notifications (
    id CHAR(36) PRIMARY KEY,
    type VARCHAR(255) NOT NULL,
    notifiable_type VARCHAR(255) NOT NULL,
    notifiable_id INT NOT NULL,
    data JSON NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_notifiable (notifiable_type, notifiable_id),
    INDEX idx_read_at (read_at),
    INDEX idx_created_at (created_at)
);
```

**Deskripsi**:
- Notifikasi untuk user
- Type: ticket_created, ticket_assigned, ticket_updated, ticket_resolved, comment_added
- Data: JSON dengan detail notifikasi
- read_at: NULL jika belum dibaca

---

### 10. **saw_configurations** - Tabel Konfigurasi SAW

```sql
CREATE TABLE saw_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('benefit', 'cost') NOT NULL,
    weight DECIMAL(5, 2) NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_code (code)
);
```

**Data Default**:
| Code | Name | Type | Weight |
|------|------|------|--------|
| C1 | Priority | benefit | 0.30 |
| C2 | SLA Urgency | benefit | 0.25 |
| C3 | Wait Time | cost | 0.20 |
| C4 | Customer Activity | benefit | 0.15 |
| C5 | Complexity | benefit | 0.10 |

---

## 🔗 Relasi & Constraint

### Foreign Key Relationships

```
users (1) ──── (M) tickets (user_id)
users (1) ──── (M) tickets (assigned_to)
users (1) ──── (M) comments (user_id)
users (1) ──── (M) knowledge_bases (author_id)
users (1) ──── (M) activity_logs (user_id)

categories (1) ──── (M) tickets (category_id)
categories (1) ──── (M) knowledge_bases (category_id)

tickets (1) ──── (M) comments (ticket_id)
tickets (1) ──── (M) activity_logs (ticket_id)

roles (1) ──── (M) model_has_roles (role_id)
```

### Cascade Rules

| Relasi | Delete | Update |
|--------|--------|--------|
| users → tickets (user_id) | CASCADE | CASCADE |
| users → tickets (assigned_to) | SET NULL | CASCADE |
| users → comments | CASCADE | CASCADE |
| categories → tickets | RESTRICT | CASCADE |
| categories → knowledge_bases | SET NULL | CASCADE |
| tickets → comments | CASCADE | CASCADE |
| tickets → activity_logs | CASCADE | CASCADE |

---

## 📑 Enum Values

### tickets.priority
- `low` - Prioritas rendah
- `medium` - Prioritas sedang (default)
- `high` - Prioritas tinggi
- `critical` - Prioritas kritis

### tickets.status
- `open` - Tiket baru, belum ditangani
- `in_progress` - Sedang ditangani staff
- `resolved` - Sudah diselesaikan, menunggu konfirmasi customer
- `closed` - Tiket selesai & ditutup
- `cancelled` - Tiket dibatalkan

### comments.is_internal
- `0` - Komentar publik (terlihat customer)
- `1` - Komentar internal (hanya staff)

### knowledge_bases.is_published
- `0` - Draft (tidak terlihat customer)
- `1` - Publish (terlihat customer)

### saw_configurations.type
- `benefit` - Semakin tinggi semakin baik
- `cost` - Semakin rendah semakin baik

---

## 🔍 Indexing Strategy

### Primary Indexes
- Semua tabel punya PRIMARY KEY (id atau uuid)

### Foreign Key Indexes
- Otomatis dibuat saat FK didefinisikan

### Search Indexes
- `users.email` - Untuk login
- `tickets.uuid` - Untuk akses eksternal
- `categories.slug` - Untuk URL-friendly access
- `knowledge_bases.slug` - Untuk URL-friendly access

### Filter Indexes
- `tickets(status, priority)` - Composite index untuk filter
- `tickets(user_id, status)` - Untuk list tiket customer
- `tickets(assigned_to, status)` - Untuk list tiket staff
- `comments(ticket_id)` - Untuk ambil komentar tiket
- `notifications(notifiable_id, read_at)` - Untuk list notifikasi

### Performance Indexes
- `tickets(created_at)` - Untuk sorting by date
- `activity_logs(created_at)` - Untuk audit trail
- `knowledge_bases(is_published)` - Untuk filter artikel publish

---

## 📊 Normalisasi

Semua tabel sudah dinormalisasi ke **3NF (Third Normal Form)**:

1. **1NF**: Semua kolom atomic (tidak ada repeating groups)
2. **2NF**: Semua non-key attributes fully dependent pada primary key
3. **3NF**: Tidak ada transitive dependency

---

## 🎯 Kesimpulan

Database design Helpdesk Ticketing System mencakup:
- **10 tabel utama** dengan relasi yang jelas
- **Proper indexing** untuk performa optimal
- **Cascade rules** untuk data integrity
- **Enum types** untuk data consistency
- **Audit trail** untuk compliance
- **Flexible design** untuk future expansion

Semua tabel sudah dinormalisasi dan siap untuk production deployment.
