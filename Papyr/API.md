# API.md

## API Overview
Papyr uses a RESTful API built with Next.js API routes. All endpoints are prefixed with `/api` and return JSON responses. Authentication is handled via Supabase Auth tokens (JWT) sent in the Authorization header.

## Authentication
All API endpoints (except public health checks) require a valid JWT token:
```
Authorization: Bearer <access_token>
```
The token is verified using Supabase's JWT secret.

## Response Format
All responses follow this structure:
```json
{
  "success": boolean,
  "data": object | array | null,
  "error": {
    "code": string,
    "message": string
  } | null
}
```
Successful responses have `"success": true` and data in the `"data"` field.
Error responses have `"success": false` and error details in the `"error"` field.

## Status Codes
- 200: Successful request
- 201: Resource created
- 400: Bad request (validation error)
- 401: Unauthorized (missing/invalid token)
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 409: Conflict (e.g., duplicate resource)
- 500: Internal server error
- 503: Service unavailable (e.g., database connection issues)

## Endpoints

### Authentication
*Handled by Supabase Auth; custom endpoints only for specific needs.*

#### GET `/api/auth/session`
Returns the current session user data.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "User Name",
    "avatar_url": "https://..."
  }
}
```

### Books
#### GET `/api/books`
List all books for the authenticated user.
**Query Parameters**:
- `limit`: number (default: 20)
- `offset`: number (default: 0)
- `archived`: boolean (optional filter)
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "My Ledger",
      "cover_color": "#3B82F6",
      "created_at": "2026-07-31T10:00:00Z",
      "updated_at": "2026-07-31T10:00:00Z",
      "page_count": 12
    }
  ]
}
```

#### POST `/api/books`
Create a new book.
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "title": "string (required)",
  "cover_color": "string (required, hex color)"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Ledger",
    "cover_color": "#3B82F6",
    "created_at": "2026-07-31T10:00:00Z",
    "updated_at": "2026-07-31T10:00:00Z"
  }
}
```

#### GET `/api/books/[id]`
Get a specific book with its pages and metadata.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Ledger",
    "cover_color": "#3B82F6",
    "created_at": "2026-07-31T10:00:00Z",
    "updated_at": "2026-07-31T10:00:00Z",
    "pages": [
      {
        "id": "uuid",
        "title": "January",
        "position": 0
      }
    ]
  }
}
```

#### PUT `/api/books/[id]`
Update a book.
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "title": "string (optional)",
  "cover_color": "string (optional, hex color)"
}
```
**Response**: Same as GET `/api/books/[id]`

#### DELETE `/api/books/[id]`
Delete a book and all its contents.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": null
}
```

### Pages
#### POST `/api/pages`
Add a new page to a book.
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "book_id": "uuid (required)",
  "title": "string (optional)",
  "position": "integer (optional, defaults to end)"
}
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "book_id": "uuid",
    "title": "January",
    "position": 2,
    "created_at": "2026-07-31T10:00:00Z",
    "updated_at": "2026-07-31T10:00:00Z"
  }
}
```

#### PUT `/api/pages/[id]`
Update a page (title, position).
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "title": "string (optional)",
  "position": "integer (optional)"
}
```
**Response**: Returns updated page object.

#### DELETE `/api/pages/[id]`
Remove a page from its book.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": null
}
```

### Tables
#### POST `/api/tables`
Create a new table on a page.
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "page_id": "uuid (required)",
  "title": "string (optional)",
  "columns": "array (required, min 1)",
  "rows": "number (required, min 1)",
  "position_x": "number (default 0)",
  "position_y": "number (default 0)"
}
```
**Column format**: `[{id: string, label: string, width: number}]`
**Response**: Returns the created table object.

#### PUT `/api/tables/[id]`
Update table properties (title, dimensions, position).
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "title": "string (optional)",
  "columns": "array (optional)",
  "rows": "number (optional)",
  "position_x": "number (optional)",
  "position_y": "number (optional)"
}
```
**Response**: Returns updated table object.

#### DELETE `/api/tables/[id]`
Delete a table and all its cells.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": null
}
```

### Cells
#### POST `/api/cells`
Create or update a cell's content.
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "table_id": "uuid (required)",
  "row_index": "integer (required)",
  "column_index": "integer (required)",
  "content_type": "string (required, 'ink'|'text'|'empty')",
  "content_data": "object (optional, depends on type)"
}
```
**Response**: Returns the updated cell object.

#### GET `/api/cells`
Retrieve cells for a specific table (useful for initial load).
**Query Parameters**:
- `table_id`: uuid (required)
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "table_id": "uuid",
      "row_index": 0,
      "column_index": 0,
      "content_type": "ink",
      "content_data": {
        "stroke_ids": ["uuid1", "uuid2"]
      }
    }
  ]
}
```

#### DELETE `/api/cells/[id]`
Delete a cell (sets it to empty state).
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": null
}
```

### Strokes
#### POST `/api/strokes`
Save stroke data for a cell.
**Headers**: Authorization: Bearer <token>
**Body**:
```json
{
  "cell_id": "uuid (required)",
  "points": "array (required, see Stroke Point format)",
  "tool": "string (required)",
  "color": "string (required, hex)",
  "width": "number (required)",
  "smoothed": "boolean (optional, default true)"
}
```
**Stroke Point format**: `{x: number, y: number, pressure?: number, timestamp: number, tiltX?: number, tiltY?: number, twist?: number}`
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cell_id": "uuid",
    "created_at": "2026-07-31T10:00:00Z"
  }
}
```

#### GET `/api/strokes/[id]`
Retrieve a specific stroke.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cell_id": "uuid",
    "points": [...],
    "tool": "pen",
    "color": "#000000",
    "width": 2.0,
    "smoothed": true,
    "created_at": "2026-07-31T10:00:00Z"
  }
}
```

#### DELETE `/api/strokes/[id]`
Delete a stroke.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": null
}
```

#### GET `/api/strokes/by-cell/[cell_id]`
Get all strokes for a specific cell.
**Headers**: Authorization: Bearer <token>
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "cell_id": "uuid",
      "points": [...],
      "tool": "pen",
      "color": "#000000",
      "width": 2.0,
      "smoothed": true,
      "created_at": "2026-07-31T10:00:00Z"
    }
  ]
}
```

### Export
#### GET `/api/export/[type]`
Export data in various formats.
**Path Parameters**:
- `type`: "png", "json", "svg" (for now)
**Query Parameters**:
- `id`: uuid (required, ID of what to export: cell, table, page, book)
**Headers**: Authorization: Bearer <token>
**Response**:
- For `png`/`svg`: Binary image data with appropriate Content-Type
- For `json`: JSON representation of the requested object

### Health & Utilities
#### GET `/api/health`
Simple health check (no authentication required).
**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-07-31T10:00:00Z",
  "version": "1.0.0"
}
```

#### GET `/api/config`
Get public configuration (no authentication required).
**Response**:
```json
{
  "app": {
    "name": "Papyr",
    "version": "1.0.0"
  },
  "features": {
    "pressure_sensitivity": true,
    "offline_sync": true,
    "real_time_collaboration": false
  },
  "limits": {
    "max_stroke_points": 1000,
    "max_cells_per_table": 10000,
    "max_pages_per_book": 1000
  }
}
```

## Error Responses
### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Title is required and must be less than 100 characters"
  }
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

### Permission Error (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this resource"
  }
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Book with ID 'xxx' not found"
  }
}
```

## Rate Limiting
API endpoints are rate-limited to prevent abuse:
- 100 requests per minute per IP address
- Burst limit of 20 requests
- Exceeding limits returns 429 (Too Many Requests)

## Versioning
API version is not currently versioned in the URL; breaking changes will be communicated via deprecation headers and will maintain backward compatibility for at least one release cycle.

## WebSocket / Realtime
Future real-time collaboration features will use Supabase Realtime via WebSocket connection at `realtime.supabase.co`.

## Documentation
This document is generated from the codebase and should be kept in sync with actual API implementations.

## Version
- Document Version: 1.0.0
- Last Updated: 2026-07-31