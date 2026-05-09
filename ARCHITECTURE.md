# Web Helpdesk Ticketing System - Dokumentasi Arsitektur

## 📋 Daftar Isi
1. [Overview Sistem](#overview-sistem)
2. [Tech Stack](#tech-stack)
3. [Arsitektur Sistem](#arsitektur-sistem)
4. [Komponen Utama](#komponen-utama)
5. [Database Schema](#database-schema)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Endpoints](#api-endpoints)
8. [Caching Strategy](#caching-strategy)
9. [Queue & Background Jobs](#queue--background-jobs)
10. [Deployment](#deployment)

---

## Overview Sistem

Web Helpdesk Ticketing System adalah aplikasi manajemen tiket support berbasis web yang dibangun dengan Laravel 13 dan React 19. Sistem ini memungkinkan pelanggan untuk membuat tiket support dan staff untuk mengelola serta menyelesaikan tiket tersebut.

### Fitur Utama
- ✅ Manajemen tiket dengan status tracking
- ✅ Sistem prioritas dan SLA management
- ✅ Knowledge base untuk self-service
- ✅ Real-time notifications
- ✅ Activity logging & audit trail
- ✅ Role-based access control
- ✅ Rating & feedback system
- ✅ Advanced ticket prioritization (SAW algorithm)

---

## Tech Stack

### Backend
| Komponen | Versi | Fungsi |
|----------|-------|--------|
| Laravel | 13.8 | Framework PHP |
| PHP | 8.3+ | Runtime |
| MySQL | 8.0 | Database |
| Redis | 7 | Cache & Queue |
| Laravel Sanctum | - | API Authentication |
| Spatie Permission | - | RBAC |

### Frontend
| Komponen | Versi | Fungsi |
|----------|-------|--------|
| React | 19.2.5 | UI Framework |
| Inertia.js | 3.0.3 | SSR Bridge |
| Tailwind CSS | 4.0.0 | Styling |
| Vite | 8.0.0 | Build Tool |

### Infrastructure
| Komponen | Versi | Fungsi |
|----------|-------|--------|
| Docker | Latest | Containerization |
| Nginx | 1.26 | Web Server |
| PHP-FPM | 8.3 | App Server |
| MailHog | - | Email Testing |
| Adminer | - | DB Management |

---

## Arsitektur Sistem

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  React + Inertia.js + Tailwind CSS                          │
│  (Admin Portal | Customer Portal | Auth Pages)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    WEB SERVER LAYER                          │
│  Nginx (Port 8000) | Vite Dev (Port 5173) | SSL/TLS        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                          │
│  Routes → Middleware → Controllers → Services → Models      │
│  (Laravel 13 + PHP 8.3)                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                │
│  MySQL 8.0 | Redis 7 | File Storage                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                INFRASTRUCTURE LAYER                          │
│  PHP-FPM | Queue Worker | Docker | MailHog | Adminer       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Request → Route → Middleware → Controller → Service → Model → Database
                                    ↓
                              Cache Layer
                                    ↓
                              Response → Inertia → React → Browser
```

---

## Komponen Utama

### 1. Controllers

#### Admin Controllers
- `DashboardController`: Dashboard stats, charts, recent tickets
- `TicketController`: Manage all tickets (list, show, update, delete, comment)
- `UserController`: CRUD users dengan roles/departments
- `CategoryController`: Manage ticket categories
- `DepartmentController`: Manage departments
- `KnowledgeBaseController`: Manage knowledge base articles

#### Portal Controllers
- `DashboardController`: User stats dan recent tickets
- `TicketController`: Create, list, show, comment, rate, cancel, confirm/reject
- `KnowledgeBaseController`: Browse published articles

#### API Controllers
- `AuthController`: Register, login, logout, user profile
- `TicketController`: API ticket operations

### 2. Services

| Service | Tanggung Jawab |
|---------|----------------|
| `TicketService` | Ticket lifecycle (create, update, cancel, confirm, reject, rate, delete) |
| `CommentService` | Comment management dengan file attachments |
| `NotificationService` | Notify related users pada ticket events |
| `DashboardService` | Dashboard stats dan charts (cached) |
| `SawService` | SAW algorithm untuk ticket prioritization |
| `CacheManager` | Centralized cache key management |
| `AuditLogger` | Audit logging untuk tickets, auth, admin actions |

### 3. Models

| Model | Deskripsi |
|-------|-----------|
| `User` | Authentication & Authorization |
| `Ticket` | Core ticketing system |
| `Comment` | Ticket discussions |
| `Category` | Ticket classification |
| `Department` | Organizational structure |
| `KnowledgeBase` | Self-service articles |
| `ActivityLog` | Audit trail |
| `SawConfiguration` | SAW algorithm settings |
| `Notification` | User notifications |

### 4. Traits

- `TrackTicketActivity`: Log ticket activities dan invalidate caches

---

## Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    department_id BIGINT FOREIGN KEY,
    employee_number VARCHAR(50),
    position VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Tickets
```sql
CREATE TABLE tickets (
    id BIGINT PRIMARY KEY,
    uuid VARCHAR(36) UNIQUE,
    user_id BIGINT FOREIGN KEY,
    category_id BIGINT FOREIGN KEY,
    title VARCHAR(255),
    description LONGTEXT,
    priority ENUM('low', 'medium', 'high', 'critical'),
    status ENUM('open', 'in_progress', 'resolved', 'closed', 'cancelled'),
    assigned_to BIGINT FOREIGN KEY,
    sla_deadline TIMESTAMP,
    resolved_at TIMESTAMP,
    rating INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Comments
```sql
CREATE TABLE comments (
    id BIGINT PRIMARY KEY,
    ticket_id BIGINT FOREIGN KEY,
    user_id BIGINT FOREIGN KEY,
    message LONGTEXT,
    is_internal BOOLEAN,
    attachments JSON,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### ActivityLogs
```sql
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY,
    user_id BIGINT FOREIGN KEY,
    ticket_id BIGINT FOREIGN KEY,
    action VARCHAR(100),
    description LONGTEXT,
    created_at TIMESTAMP
);
```

#### Notifications
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY,
    notifiable_id BIGINT FOREIGN KEY,
    type VARCHAR(255),
    data JSON,
    read_at TIMESTAMP,
    created_at TIMESTAMP
);
```

### Relationships

```
Users
  ├─ has many Tickets (user_id)
  ├─ has many Tickets (assigned_to)
  ├─ has many Comments
  ├─ has many ActivityLogs
  ├─ belongs to Department
  └─ has many Notifications

Tickets
  ├─ belongs to User (creator)
  ├─ belongs to User (assignee)
  ├─ belongs to Category
  ├─ has many Comments
  └─ has many ActivityLogs

Categories
  ├─ has many Tickets
  └─ has many KnowledgeBase

Comments
  ├─ belongs to Ticket
  └─ belongs to User

Departments
  └─ has many Users

KnowledgeBase
  ├─ belongs to Category
  └─ belongs to User (author)
```

---

## Authentication & Authorization

### Authentication Methods

#### 1. Web Authentication (Session-based)
- Menggunakan Laravel Breeze
- Session cookie: `LARAVEL_SESSION`
- Middleware: `auth:web`
- Routes: `/login`, `/register`, `/logout`

#### 2. API Authentication (Token-based)
- Menggunakan Laravel Sanctum
- Bearer token di Authorization header
- Middleware: `auth:sanctum`
- Endpoints: `/api/v1/register`, `/api/v1/login`, `/api/v1/logout`

### Authorization (RBAC)

#### Roles
- **Customer**: Dapat membuat tiket, melihat tiket sendiri, comment, rate, cancel
- **Staff**: Dapat mengelola semua tiket, assign, resolve, internal comments, manage references

#### Policies
- `TicketPolicy`: view, create, update, delete, comment, cancel
- `CategoryPolicy`: view, create, update, delete
- `DepartmentPolicy`: view, create, update, delete
- `KnowledgeBasePolicy`: view, create, update, delete

#### Middleware
- `HandleInertiaRequests`: Share auth data, notifications, flash messages
- `ForceRequestUrl`: URL consistency
- `SecurityHeaders`: Security headers

---

## API Endpoints

### Authentication Endpoints

```
POST /api/v1/register
  Body: { email, password, name, phone }
  Response: { user, token }

POST /api/v1/login
  Body: { email, password }
  Response: { user, token }

POST /api/v1/logout
  Headers: Authorization: Bearer {token}
  Response: { message }

GET /api/v1/user
  Headers: Authorization: Bearer {token}
  Response: { user }
```

### Ticket Endpoints

```
GET /api/v1/tickets
  Query: page, per_page, status, priority, category_id
  Response: { data: [...], meta: {...} }

POST /api/v1/tickets
  Body: { title, description, category_id, attachments }
  Response: { data: {...} }

GET /api/v1/tickets/{id}
  Response: { data: {...} }

PUT /api/v1/tickets/{id}
  Body: { title, description, priority, status, assigned_to }
  Response: { data: {...} }

DELETE /api/v1/tickets/{id}
  Response: { message }

POST /api/v1/tickets/{id}/comments
  Body: { message, is_internal, attachments }
  Response: { data: {...} }

GET /api/v1/tickets/{id}/comments
  Query: page, per_page
  Response: { data: [...], meta: {...} }
```

### Admin Endpoints

```
GET/POST /api/v1/users
GET/PUT/DELETE /api/v1/users/{id}

GET/POST /api/v1/categories
GET/PUT/DELETE /api/v1/categories/{id}

GET/POST /api/v1/departments
GET/PUT/DELETE /api/v1/departments/{id}

GET/POST /api/v1/knowledge-base
GET/PUT/DELETE /api/v1/knowledge-base/{id}
```

### Response Format

#### Success Response
```json
{
  "data": {
    "id": 1,
    "title": "Ticket Title",
    "status": "open",
    "priority": "high",
    "created_at": "2026-05-09T05:00:00Z"
  },
  "meta": {
    "current_page": 1,
    "total": 100,
    "per_page": 15
  },
  "status": 200
}
```

#### Error Response
```json
{
  "message": "Error description",
  "errors": {
    "field": ["Error message"]
  },
  "status": 400
}
```

---

## Caching Strategy

### Cache Keys

| Key | TTL | Fungsi |
|-----|-----|--------|
| `admin_dashboard_stats` | 5 min | Admin dashboard statistics |
| `admin_dashboard_charts` | 5 min | Admin dashboard charts |
| `portal_dashboard_stats_{userId}` | 5 min | Customer dashboard stats |
| `admin_saw_scores` | 5 min | SAW prioritization scores |
| `reference_categories` | 1 hour | Category reference data |
| `reference_departments` | Forever | Department reference data |
| `user_auth_{userId}` | 1 hour | User authentication data |
| `user_notif_count_{userId}` | 5 min | User notification count |

### Cache Invalidation

Cache di-invalidate pada event:
- Ticket create/update/delete
- Category/Department changes
- Rating submission
- Comment creation

---

## Queue & Background Jobs

### Queue Configuration
- Driver: Redis
- Fallback: Database
- Worker: Dedicated container

### Queued Operations
- `TicketActivityNotification`: Notify users on ticket changes
- Email sending: Via MailHog (development)

### Queue Worker
```bash
# Start queue worker
php artisan queue:work redis --queue=default --tries=3 --timeout=90
```

---

## Ticket Lifecycle

### Status Flow

```
OPEN
  ↓
IN_PROGRESS (Staff assigns)
  ↓
RESOLVED (Staff marks resolved)
  ↓
CLOSED (Customer confirms)
  ↓
COMPLETED (Customer rates)

Alternative paths:
- RESOLVED → IN_PROGRESS (Customer rejects)
- Any status → CANCELLED (Customer cancels)
```

### SLA Management

- Deadline dihitung berdasarkan priority
- Warning: 4 hours remaining
- Overdue detection: `isOverdue()`

---

## File Handling

### Constants
- Max file size: 2MB
- Max files per upload: 5
- Allowed types: jpg, jpeg, png, pdf
- Storage path: `storage/app/public/tickets/`

### Attachment Storage
- Comments: `tickets/comments/`
- Ticket creation: `tickets/attachments/`
- Cascade delete on comment/ticket deletion

---

## Deployment

### Docker Services

```yaml
services:
  app:
    image: php:8.3-fpm
    ports: [9000]
    volumes: [./:/var/www/html]
    
  nginx:
    image: nginx:1.26
    ports: [8000:80]
    depends_on: [app]
    
  db:
    image: mysql:8.0
    ports: [3306]
    environment:
      MYSQL_DATABASE: helpdesk
      MYSQL_ROOT_PASSWORD: root
    
  redis:
    image: redis:7
    ports: [6379]
    
  queue:
    image: php:8.3-fpm
    command: php artisan queue:work
    depends_on: [redis, db]
    
  mailhog:
    image: mailhog/mailhog
    ports: [1025, 8025]
    
  adminer:
    image: adminer
    ports: [8080]
    depends_on: [db]
```

### Setup Instructions

```bash
# 1. Clone repository
git clone <repo-url>
cd web-helpdesk-ticketing-laravel

# 2. Setup environment
cp .env.example .env
docker compose up -d

# 3. Install dependencies
docker compose exec app composer install
docker compose exec app npm install

# 4. Generate app key
docker compose exec app php artisan key:generate

# 5. Run migrations
docker compose exec app php artisan migrate

# 6. Seed database (optional)
docker compose exec app php artisan db:seed

# 7. Build frontend
docker compose exec app npm run build

# 8. Start development
docker compose exec app composer run dev
```

### Health Checks

- PHP-FPM: `http://localhost:9000/ping`
- Nginx: `http://localhost:8000/health`
- MySQL: `mysql -h localhost -u root -p`
- Redis: `redis-cli ping`

---

## Security Best Practices

✅ CSRF protection (Laravel default)
✅ Password hashing (bcrypt)
✅ SQL injection prevention (parameterized queries)
✅ Authorization policies on all resources
✅ Soft deletes for data protection
✅ SSL/TLS encryption
✅ Rate limiting on auth endpoints
✅ Input validation & sanitization

---

## Performance Optimization

✅ Multi-level caching (Redis)
✅ Async notifications (Queue Worker)
✅ Paginated API responses
✅ Database indexing
✅ Query optimization
✅ Asset minification (Vite)
✅ Lazy loading components

---

## Monitoring & Logging

- Activity logs: `activity_logs` table
- Error logs: `storage/logs/laravel.log`
- Queue logs: Queue worker output
- Email logs: MailHog interface (http://localhost:8025)

---

## Troubleshooting

### Common Issues

**1. Database Connection Error**
```bash
# Check MySQL is running
docker compose ps

# Check credentials in .env
docker compose exec app php artisan tinker
>>> DB::connection()->getPdo();
```

**2. Queue Not Processing**
```bash
# Check Redis connection
docker compose exec redis redis-cli ping

# Restart queue worker
docker compose restart queue
```

**3. Cache Issues**
```bash
# Clear all cache
docker compose exec app php artisan cache:clear

# Clear specific cache
docker compose exec app php artisan cache:forget key_name
```

**4. File Upload Issues**
```bash
# Check storage permissions
docker compose exec app chmod -R 775 storage/app/public

# Create symlink
docker compose exec app php artisan storage:link
```

---

## Dokumentasi Tambahan

- **API Documentation**: `/docs` (Swagger/OpenAPI)
- **Database Diagram**: Lihat `ARCHITECTURE.md`
- **Deployment Guide**: Lihat `DEPLOYMENT.md`
- **API Reference**: Lihat `API.md`

---

**Last Updated**: 2026-05-09
**Version**: 1.0.0
