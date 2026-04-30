# API Documentation — Helpdesk Ticketing

Base URL: `http://127.0.0.1:8000/api/v1`

---

## Authentication

### Register
```
POST /api/v1/register
Content-Type: application/json

{
    "name": "Nama User",
    "email": "user@example.com",
    "password": "password123",
    "password_confirmation": "password123"
}
```

Response `201`:
```json
{
    "user": {
        "id": 1,
        "name": "Nama User",
        "email": "user@example.com",
        "phone": null,
        "department": null,
        "roles": ["customer"],
        "is_admin": false,
        "is_staff": false,
        "is_customer": true
    },
    "token": "1|laravel_sanctum_token_here..."
}
```

### Login
```
POST /api/v1/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "password123"
}
```

Response `200`:
```json
{
    "user": { ... },
    "token": "1|laravel_sanctum_token_here..."
}
```

### Logout
```
POST /api/v1/logout
Authorization: Bearer {token}
```

Response `200`:
```json
{
    "message": "Logged out."
}
```

### Get Current User
```
GET /api/v1/user
Authorization: Bearer {token}
```

Response `200`:
```json
{
    "id": 1,
    "name": "Nama User",
    "email": "user@example.com",
    "phone": null,
    "department": null,
    "roles": ["customer"],
    "is_admin": false,
    "is_staff": false,
    "is_customer": true
}
```

---

## Tickets

### List Tickets
```
GET /api/v1/tickets
Authorization: Bearer {token}
```

Query Parameters:
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter: open, in_progress, resolved, closed, cancelled |
| priority | string | Filter: low, medium, high, critical |
| search | string | Search title & description |

Response `200`:
```json
{
    "data": [
        {
            "id": 1,
            "uuid": "abc123...",
            "title": "Masalah jaringan",
            "description": "Detail masalah...",
            "priority": "high",
            "status": "open",
            "sla_deadline": "2026-05-01 10:00:00",
            "created_at": "2026-04-30 12:00:00",
            "category": { "id": 1, "name": "Jaringan" },
            "reporter": { "id": 1, "name": "User A", "department": "IT" },
            "assignee": null,
            "is_overdue": false
        }
    ],
    "meta": {
        "current_page": 1,
        "last_page": 1,
        "total": 1
    }
}
```

### Create Ticket
```
POST /api/v1/tickets
Authorization: Bearer {token}
Content-Type: multipart/form-data

category_id: 1
title: "Masalah jaringan"
description: "Detail lengkap masalah..."
priority: high
attachments[]: (file, optional, max 10MB)
```

Response `201`:
```json
{
    "message": "Tiket berhasil dibuat.",
    "data": { ...ticket... }
}
```

### Get Ticket Detail
```
GET /api/v1/tickets/{id}
Authorization: Bearer {token}
```

Response `200`:
```json
{
    "data": { ...ticket_with_comments... }
}
```

### Add Comment
```
POST /api/v1/tickets/{id}/comments
Authorization: Bearer {token}
Content-Type: multipart/form-data

message: "Komentar saya"
attachments[]: (file, optional)
```

Response `200`:
```json
{
    "message": "Komentar berhasil ditambahkan.",
    "data": { ...ticket... }
}
```

---

## Error Responses

### 401 Unauthorized
```json
{
    "message": "Unauthenticated."
}
```

### 403 Forbidden
```json
{
    "message": "Unauthorized."
}
```

### 422 Validation Error
```json
{
    "message": "The email field is required.",
    "errors": {
        "email": ["The email field is required."]
    }
}
```

---

## Token Management

- Token tidak expired (default `null` = never)
- Untuk mengatur expiry: edit `config/sanctum.php` → `'expiration' => 1440` (24 jam dalam menit)
- Prefix token: set `SANCTUM_TOKEN_PREFIX` di `.env`
