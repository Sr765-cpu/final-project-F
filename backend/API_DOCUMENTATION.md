# EventNest API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### Register New User
**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "address": "123 Main St, City",
  "role": "user"
}
```

**Validation Rules:**
- `name`: 2-100 characters
- `email`: Valid email format
- `password`: Min 8 characters, must contain uppercase, lowercase, and number
- `address`: 5-200 characters
- `role`: Either "user" or "participant"

**Response (201):**
```json
{
  "message": "Account created successfully",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "address": "123 Main St, City",
    "isActive": true,
    "createdAt": "2025-11-11T10:00:00.000Z"
  },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Login
**POST** `/auth/login`

Authenticate and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "user"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Logout
**POST** `/auth/logout`

Logout and invalidate current session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### Refresh Token
**POST** `/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Get Current User Profile
**GET** `/auth/me`

Get authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "address": "123 Main St, City",
    "isActive": true,
    "lastLogin": "2025-11-11T10:00:00.000Z",
    "createdAt": "2025-11-11T09:00:00.000Z"
  }
}
```

---

### Get Active Sessions
**GET** `/auth/sessions`

Get all active sessions for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "...",
      "createdAt": "2025-11-11T10:00:00.000Z",
      "expiresAt": "2025-11-18T10:00:00.000Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ]
}
```

---

### Revoke Session
**DELETE** `/auth/sessions/:sessionId`

Revoke a specific session.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Session revoked successfully"
}
```

---

### Revoke All Other Sessions
**POST** `/auth/sessions/revoke-all`

Revoke all sessions except the current one.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "All other sessions revoked successfully"
}
```

---

## Event Endpoints

### Get All Events
**GET** `/events`

Get list of all events with RSVPs and volunteers.

**Response (200):**
```json
{
  "events": [
    {
      "id": "...",
      "title": "Community Cleanup Drive",
      "category": "Environment",
      "organizer": "Green Earth",
      "city": "Mumbai",
      "start": "2025-11-15T09:00:00.000Z",
      "end": "2025-11-15T17:00:00.000Z",
      "banner": "https://...",
      "desc": "Join us for a community cleanup...",
      "ongoing": false,
      "rsvps": [...],
      "volunteers": [...],
      "createdAt": "2025-11-11T10:00:00.000Z"
    }
  ]
}
```

---

### Create Event
**POST** `/events`

Create a new event.

**Request Body:**
```json
{
  "title": "Community Cleanup Drive",
  "category": "Environment",
  "organizer": "Green Earth",
  "city": "Mumbai",
  "start": "2025-11-15T09:00:00.000Z",
  "end": "2025-11-15T17:00:00.000Z",
  "banner": "https://...",
  "desc": "Join us for a community cleanup...",
  "ongoing": false
}
```

**Response (201):**
```json
{
  "event": { ... }
}
```

---

### Update Event
**PUT** `/events/:id`

Update an existing event.

**Request Body:** (partial update supported)
```json
{
  "title": "Updated Title",
  "ongoing": true
}
```

**Response (200):**
```json
{
  "event": { ... }
}
```

---

### Delete Event
**DELETE** `/events/:id`

Delete an event (cascades to RSVPs and volunteers).

**Response (200):**
```json
{
  "ok": true
}
```

---

### RSVP to Event
**POST** `/events/:id/rsvp`

RSVP to an event. Authenticated users will have their RSVP linked to their account.

**Headers:** `Authorization: Bearer <token>` (optional)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Looking forward to it!"
}
```

**Response (201):**
```json
{
  "message": "RSVP successful",
  "rsvp": {
    "id": "...",
    "eventId": "...",
    "userId": "..." or null,
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Looking forward to it!",
    "status": "confirmed",
    "createdAt": "2025-11-11T10:00:00.000Z"
  }
}
```

**Error (409):** Duplicate RSVP
```json
{
  "message": "You have already RSVP'd to this event"
}
```

---

### Volunteer for Event
**POST** `/events/:id/volunteer`

Sign up as a volunteer for an event.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "speciality": "First Aid",
  "availableDates": "Nov 15-20",
  "message": "Happy to help!",
  "status": "Available"
}
```

**Response (201):**
```json
{
  "volunteer": { ... }
}
```

---

## User RSVP Management

### Get User's RSVPs
**GET** `/users/me/rsvps`

Get all RSVPs for the authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "rsvps": [
    {
      "id": "...",
      "eventId": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "message": "...",
      "status": "confirmed",
      "createdAt": "2025-11-11T10:00:00.000Z",
      "event": {
        "id": "...",
        "title": "Community Cleanup Drive",
        "start": "2025-11-15T09:00:00.000Z",
        ...
      }
    }
  ]
}
```

---

### Cancel User's RSVP
**DELETE** `/users/me/rsvps/:rsvpId`

Cancel a specific RSVP.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "RSVP cancelled successfully"
}
```

---

## Template Endpoints

### Get All Templates
**GET** `/templates`

Get all event templates (excludes soft-deleted by default).

**Query Parameters:**
- `includeDeleted`: "true" to include soft-deleted templates

**Response (200):**
```json
{
  "templates": [
    {
      "id": "...",
      "title": "Workshop Template",
      "description": "...",
      "datetime": "2025-11-15T10:00:00.000Z",
      "location": "Conference Hall A",
      "images": ["https://...", "https://..."],
      "agenda": "...",
      "organizer": "Tech Community",
      "category": "Technology",
      "likes": 42,
      "comments": [...],
      "versions": [...],
      "createdAt": "2025-11-11T10:00:00.000Z"
    }
  ]
}
```

---

### Create Template
**POST** `/templates`

Create a new event template.

**Request Body:**
```json
{
  "title": "Workshop Template",
  "description": "A template for tech workshops",
  "datetime": "2025-11-15T10:00:00.000Z",
  "location": "Conference Hall A",
  "images": ["https://...", "https://..."],
  "agenda": "Introduction, Main Session, Q&A",
  "organizer": "Tech Community",
  "category": "Technology"
}
```

**Response (201):**
```json
{
  "template": { ... }
}
```

---

### Update Template
**PUT** `/templates/:id`

Update a template (saves previous version).

**Request Body:** (partial update supported)
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "template": { ... }
}
```

---

### Soft Delete Template
**DELETE** `/templates/:id`

Soft delete a template (can be restored).

**Response (200):**
```json
{
  "ok": true
}
```

---

### Restore Template
**POST** `/templates/:id/restore`

Restore a soft-deleted template.

**Response (200):**
```json
{
  "template": { ... }
}
```

---

### Like Template
**POST** `/templates/:id/like`

Increment the like count for a template.

**Response (200):**
```json
{
  "likes": 43
}
```

---

### Comment on Template
**POST** `/templates/:id/comment`

Add a comment to a template.

**Request Body:**
```json
{
  "author": "John Doe",
  "text": "Great template!"
}
```

**Response (201):**
```json
{
  "comment": {
    "id": "...",
    "templateId": "...",
    "author": "John Doe",
    "text": "Great template!",
    "createdAt": "2025-11-11T10:00:00.000Z"
  }
}
```

---

### Clone/Remix Template
**POST** `/templates/:id/clone`

Create a copy of a template for remixing.

**Response (201):**
```json
{
  "template": {
    "title": "Workshop Template (Remix)",
    ...
  }
}
```

---

## Volunteer Management

### Get All Volunteers
**GET** `/volunteers`

Get aggregated volunteer data across all events.

**Response (200):**
```json
{
  "volunteers": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "speciality": "First Aid",
      "status": "Available",
      "eventTitle": "Community Cleanup Drive",
      "eventDate": "2025-11-15T09:00:00.000Z",
      "eventCity": "Mumbai"
    }
  ],
  "stats": {
    "totalVolunteers": 150,
    "availableVolunteers": 120,
    "totalEvents": 25,
    "upcomingEvents": 8
  }
}
```

---

## Dashboard Endpoints

### Get Dashboard KPIs
**GET** `/dashboard/kpis`

Get key performance indicators.

**Response (200):**
```json
{
  "totals": {
    "events": 24,
    "registrations": 1234,
    "revenue": 425000,
    "upcoming": 6
  }
}
```

---

### Get Recent Activities
**GET** `/activities`

Get recent platform activities.

**Response (200):**
```json
{
  "items": [
    {
      "type": "Event",
      "title": "Cleanup Drive created",
      "time": "2m ago"
    }
  ]
}
```

---

### Get Alerts
**GET** `/alerts`

Get system alerts.

**Response (200):**
```json
{
  "items": [
    {
      "level": "warning",
      "msg": "Payment gateway latency increased"
    }
  ]
}
```

---

### Get Performance Analytics
**GET** `/analytics/performance`

Get performance metrics.

**Response (200):**
```json
{
  "series": [10, 12, 11, 13, 15, 14, 18]
}
```

---

### Get Registrations
**GET** `/registrations`

Get registration data.

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "eventId": 1,
      "name": "Maya"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "message": "Resource already exists"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error"
}
```

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints** (login/register): 5 requests per 15 minutes per IP

---

## Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Password Hashing**: bcrypt with salt rounds of 12
3. **Session Management**: Track and revoke sessions
4. **Rate Limiting**: Prevent brute force attacks
5. **Helmet.js**: Security headers
6. **CORS**: Configurable cross-origin resource sharing
7. **Input Validation**: express-validator for all inputs
8. **SQL Injection Protection**: Prisma ORM with parameterized queries
9. **Duplicate Prevention**: Unique constraints on critical data

---

## Best Practices

1. Always use HTTPS in production
2. Store JWT_SECRET securely (environment variable)
3. Implement token refresh before expiry
4. Handle token expiration gracefully on frontend
5. Store tokens securely (httpOnly cookies recommended)
6. Implement CSRF protection for cookie-based auth
7. Regular security audits and dependency updates
8. Monitor rate limit violations
9. Log authentication attempts
10. Implement account lockout after failed attempts
