# Web Helpdesk Ticketing System - API Reference

## 📚 API Documentation

**Base URL**: `http://localhost:8000/api/v1`
**Authentication**: Bearer Token (Sanctum)
**Response Format**: JSON

---

## Table of Contents

1. [Authentication](#authentication)
2. [Tickets](#tickets)
3. [Comments](#comments)
4. [Categories](#categories)
5. [Departments](#departments)
6. [Users](#users)
7. [Knowledge Base](#knowledge-base)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

### Register

Create a new user account.

```http
POST /api/v1/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "08123456789"
}
```

**Response (201 Created)**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "role": "customer",
    "created_at": "2026-05-09T05:07:08Z"
  },
  "token": "1|abcdefghijklmnopqrstuvwxyz",
  "message": "User registered successfully"
}
```

---

### Login

Authenticate user and get API token.

```http
POST /api/v1/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  },
  "token": "1|abcdefghijklmnopqrstuvwxyz",
  "message": "Login successful"
}
```

**Response (401 Unauthorized)**
```json
{
  "message": "Invalid credentials",
  "status": 401
}
```

---

### Logout

Revoke API token.

```http
POST /api/v1/logout
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "message": "Logged out successfully"
}
```

---

### Get Current User

Retrieve authenticated user profile.

```http
GET /api/v1/user
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789",
    "role": "customer",
    "department_id": null,
    "employee_number": null,
    "position": null,
    "created_at": "2026-05-09T05:07:08Z"
  }
}
```

---

## Tickets

### List Tickets

Retrieve paginated list of tickets.

```http
GET /api/v1/tickets?page=1&per_page=15&status=open&priority=high&category_id=1
Authorization: Bearer {token}
```

**Query Parameters**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | integer | Page number (default: 1) |
| per_page | integer | Items per page (default: 15) |
| status | string | Filter by status (open, in_progress, resolved, closed, cancelled) |
| priority | string | Filter by priority (low, medium, high, critical) |
| category_id | integer | Filter by category |
| search | string | Search in title/description |
| sort_by | string | Sort field (created_at, updated_at, priority) |
| sort_order | string | Sort order (asc, desc) |

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Login Issue",
      "description": "Cannot login to system",
      "status": "open",
      "priority": "high",
      "category": {
        "id": 1,
        "name": "Technical Support"
      },
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "assigned_to": null,
      "sla_deadline": "2026-05-09T09:07:08Z",
      "resolved_at": null,
      "rating": null,
      "saw_score": 85.5,
      "created_at": "2026-05-09T05:07:08Z",
      "updated_at": "2026-05-09T05:07:08Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 50,
    "per_page": 15,
    "last_page": 4,
    "from": 1,
    "to": 15
  }
}
```

---

### Create Ticket

Create a new support ticket.

```http
POST /api/v1/tickets
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "title": "Login Issue",
  "description": "Cannot login to system",
  "category_id": 1,
  "attachments": [file1, file2]
}
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Ticket title (max 255 chars) |
| description | string | Yes | Ticket description |
| category_id | integer | Yes | Category ID |
| attachments | file[] | No | Max 5 files, 2MB each |

**Response (201 Created)**
```json
{
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Login Issue",
    "description": "Cannot login to system",
    "status": "open",
    "priority": "medium",
    "category_id": 1,
    "user_id": 1,
    "assigned_to": null,
    "sla_deadline": "2026-05-09T09:07:08Z",
    "created_at": "2026-05-09T05:07:08Z"
  },
  "message": "Ticket created successfully"
}
```

---

### Get Ticket Details

Retrieve single ticket with all details.

```http
GET /api/v1/tickets/{id}
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Login Issue",
    "description": "Cannot login to system",
    "status": "open",
    "priority": "high",
    "category": {
      "id": 1,
      "name": "Technical Support",
      "slug": "technical-support"
    },
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    "assigned_to": {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "sla_deadline": "2026-05-09T09:07:08Z",
    "resolved_at": null,
    "rating": null,
    "saw_score": 85.5,
    "comments_count": 3,
    "created_at": "2026-05-09T05:07:08Z",
    "updated_at": "2026-05-09T05:07:08Z"
  }
}
```

---

### Update Ticket

Update ticket details (Admin/Assigned Staff only).

```http
PUT /api/v1/tickets/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Login Issue - Updated",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "critical",
  "assigned_to": 2
}
```

**Request Body** (all optional)
| Field | Type | Description |
|-------|------|-------------|
| title | string | Ticket title |
| description | string | Ticket description |
| status | string | open, in_progress, resolved, closed, cancelled |
| priority | string | low, medium, high, critical |
| assigned_to | integer | User ID to assign |

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "title": "Login Issue - Updated",
    "status": "in_progress",
    "priority": "critical",
    "assigned_to": 2,
    "updated_at": "2026-05-09T05:10:00Z"
  },
  "message": "Ticket updated successfully"
}
```

---

### Delete Ticket

Delete a ticket (Admin only).

```http
DELETE /api/v1/tickets/{id}
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "message": "Ticket deleted successfully"
}
```

---

### Confirm Ticket Resolution

Customer confirms ticket is resolved.

```http
POST /api/v1/tickets/{id}/confirm
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "status": "closed",
    "resolved_at": "2026-05-09T05:10:00Z"
  },
  "message": "Ticket confirmed as resolved"
}
```

---

### Reject Ticket Resolution

Customer rejects resolution and reopens ticket.

```http
POST /api/v1/tickets/{id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Issue still persists"
}
```

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "status": "in_progress",
    "resolved_at": null
  },
  "message": "Ticket reopened"
}
```

---

### Rate Ticket

Customer rates resolved ticket (1-5 stars).

```http
POST /api/v1/tickets/{id}/rate
Authorization: Bearer {token}
Content-Type: application/json

{
  "rating": 5,
  "feedback": "Great support!"
}
```

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "rating": 5,
    "feedback": "Great support!"
  },
  "message": "Rating submitted successfully"
}
```

---

### Cancel Ticket

Customer cancels ticket.

```http
POST /api/v1/tickets/{id}/cancel
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Issue resolved on my own"
}
```

**Response (200 OK)**
```json
{
  "data": {
    "id": 1,
    "status": "cancelled"
  },
  "message": "Ticket cancelled"
}
```

---

## Comments

### Create Comment

Add comment to ticket.

```http
POST /api/v1/tickets/{ticket_id}/comments
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "message": "Please check the error log",
  "is_internal": false,
  "attachments": [file1]
}
```

**Request Body**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| message | string | Yes | Comment text |
| is_internal | boolean | No | Internal note (staff only) |
| attachments | file[] | No | Max 5 files, 2MB each |

**Response (201 Created)**
```json
{
  "data": {
    "id": 1,
    "ticket_id": 1,
    "user": {
      "id": 1,
      "name": "John Doe"
    },
    "message": "Please check the error log",
    "is_internal": false,
    "attachments": [
      {
        "id": 1,
        "filename": "error.log",
        "url": "/storage/tickets/comments/error.log"
      }
    ],
    "created_at": "2026-05-09T05:07:08Z"
  },
  "message": "Comment added successfully"
}
```

---

### List Comments

Get all comments for a ticket.

```http
GET /api/v1/tickets/{ticket_id}/comments?page=1&per_page=10
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "ticket_id": 1,
      "user": {
        "id": 1,
        "name": "John Doe"
      },
      "message": "Please check the error log",
      "is_internal": false,
      "attachments": [],
      "created_at": "2026-05-09T05:07:08Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 5,
    "per_page": 10
  }
}
```

---

### Delete Comment

Delete a comment.

```http
DELETE /api/v1/comments/{id}
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "message": "Comment deleted successfully"
}
```

---

## Categories

### List Categories

Get all ticket categories.

```http
GET /api/v1/categories
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Technical Support",
      "slug": "technical-support",
      "description": "Technical issues and troubleshooting"
    },
    {
      "id": 2,
      "name": "Billing",
      "slug": "billing",
      "description": "Billing and payment issues"
    }
  ]
}
```

---

### Create Category (Admin only)

```http
POST /api/v1/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Feature Request",
  "description": "New feature requests"
}
```

**Response (201 Created)**
```json
{
  "data": {
    "id": 3,
    "name": "Feature Request",
    "slug": "feature-request",
    "description": "New feature requests"
  }
}
```

---

## Departments

### List Departments

Get all departments.

```http
GET /api/v1/departments
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Support",
      "slug": "support"
    },
    {
      "id": 2,
      "name": "Sales",
      "slug": "sales"
    }
  ]
}
```

---

## Users

### List Users (Admin only)

```http
GET /api/v1/users?page=1&per_page=15&role=staff
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "customer",
      "department_id": null,
      "created_at": "2026-05-09T05:07:08Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 50,
    "per_page": 15
  }
}
```

---

### Create User (Admin only)

```http
POST /api/v1/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "staff",
  "department_id": 1,
  "employee_number": "EMP001",
  "position": "Support Specialist"
}
```

**Response (201 Created)**
```json
{
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "staff",
    "department_id": 1
  }
}
```

---

## Knowledge Base

### List Knowledge Base Articles

```http
GET /api/v1/knowledge-base?page=1&per_page=10&category_id=1&published=true
Authorization: Bearer {token}
```

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": 1,
      "title": "How to Reset Password",
      "slug": "how-to-reset-password",
      "content": "Follow these steps...",
      "category": {
        "id": 1,
        "name": "Getting Started"
      },
      "author": {
        "id": 1,
        "name": "Admin"
      },
      "is_published": true,
      "created_at": "2026-05-09T05:07:08Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 25,
    "per_page": 10
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "message": "Validation failed",
  "errors": {
    "email": ["The email field is required"],
    "password": ["The password must be at least 8 characters"]
  },
  "status": 422
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limiting

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/register` | 5 | 1 minute |
| `/api/v1/login` | 5 | 1 minute |
| Other endpoints | 60 | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1620000000
```

### Rate Limit Response (429)

```json
{
  "message": "Too many requests. Please try again later.",
  "status": 429
}
```

---

## Examples

### Complete Ticket Creation Flow

```bash
# 1. Register
curl -X POST http://localhost:8000/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'

# Response includes token

# 2. Create Ticket
curl -X POST http://localhost:8000/api/v1/tickets \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login Issue",
    "description": "Cannot login",
    "category_id": 1
  }'

# 3. Add Comment
curl -X POST http://localhost:8000/api/v1/tickets/1/comments \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Please check error log"
  }'

# 4. Rate Ticket
curl -X POST http://localhost:8000/api/v1/tickets/1/rate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "feedback": "Great support!"
  }'
```

---

**Last Updated**: 2026-05-09
**API Version**: v1
**Status**: Production Ready
