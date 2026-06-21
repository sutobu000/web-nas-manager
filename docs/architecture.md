# Architecture

## System Overview

```
┌─────────────────────────────────┐
│  Browser (iPhone / iPad / Mac)  │
│  React (RSC + Client Components)│
└──────────┬──────────────────────┘
           │ HTTP / HTTPS
           ▼
┌─────────────────────────────────┐
│  Next.js App (Docker)           │
│  Port: 3000                     │
│  ├─ App Router (RSC)            │
│  │   ├─ /                       │  Drive list
│  │   ├─ /login                  │  Login page
│  │   ├─ /files/[[...path]]      │  File browser
│  │   ├─ /search                 │  Search results
│  │   ├─ /favorites              │  Favorites list
│  │   └─ /tags/[tag]             │  Files by tag
│  └─ API Routes (/api)           │
│      ├─ /api/drives             │  Drive list (drives.json)
│      ├─ /api/files              │  List / delete
│      ├─ /api/files/upload       │
│      ├─ /api/files/mkdir        │
│      ├─ /api/files/rename       │
│      ├─ /api/files/download     │
│      ├─ /api/files/stream       │  Range Request
│      ├─ /api/files/search       │  Recursive search
│      ├─ /api/files/metadata     │  EXIF / GPS
│      ├─ /api/files/tags         │  Tags & favorites
│      ├─ /api/thumbnail          │  Thumbnail cache
│      └─ /api/auth/*             │  JWT auth
└──────────┬──────────────────────┘
           │ Node.js fs
           ▼
┌─────────────────────────────────┐
│  Docker Volumes                 │
│  /data/<id>  ← host path        │  One mount per drives.json entry
│  /config/drives.json ← ro mount │  Drive definitions (UI)
│  /cache/thumbnails  ← volume    │  Thumbnail cache
└─────────────────────────────────┘
```

## Container Configuration

```
docker-compose.yml
└─ nas-filemanager (Next.js, node:20-alpine)
    Port: 3000
    Volumes:
      /data/<id>  ← host path  (one per drives.json entry; <id> matches the drive id)
      /config/drives.json  ← ./drives.json:ro  (drive definitions shown in the UI)
      /cache/thumbnails  ← named volume (thumbnail cache)
```

## Volume Mapping

Drives are defined in `drives.json` (see the README). For each entry, mount the host directory to `/data/<id>` in `docker-compose.yml`, where `<id>` matches the drive's `id`. Add or remove mounts to match your own setup — there is no fixed number of drives.

| Docker path | Host path (example) | Description |
|-------------|---------------------|-------------|
| `/data/photos` | `/mnt/photos` (or `E:\photos`) | Drive whose id is `photos` |
| `/data/backup` | `/mnt/backup` (or `F:\backup`) | Drive whose id is `backup` |
| `/config/drives.json` | `./drives.json` (read-only) | Drive definitions for the UI |
| `/cache/thumbnails` | named volume | Thumbnail cache |

When no `drives.json` is present, the app shows `/data` as a single drive, so a minimal setup only needs one mount to `/data`.

On Docker Desktop with the WSL2 backend you can use Windows-style host paths (e.g. `E:\photos`).

## API Design

### GET /api/files?path=

Returns directory listing.

```typescript
// Response
{
  path: string;
  items: {
    name: string;
    type: "file" | "directory";
    size: number;
    modified: string;       // ISO 8601
    extension: string;
    isImage: boolean;
    isVideo: boolean;
    thumbnailUrl?: string;
    tags?: string[];
    favorite?: boolean;
  }[];
  breadcrumbs: { name: string; path: string }[];
}
```

### DELETE /api/files

Delete a file or folder.

```typescript
// Request body
{ path: string; }

// Response
{ success: boolean; }
```

### POST /api/files/upload

Upload a file via multipart form (max 2GB).

```typescript
// Request: multipart/form-data
// - file: File
// - path: string  (destination directory)

// Response
{ success: boolean; name: string; size: number; }
```

### POST /api/files/mkdir

Create a folder.

```typescript
// Request
{ path: string; name: string; }

// Response
{ success: boolean; path: string; }
```

### POST /api/files/rename

Rename a file or folder.

```typescript
// Request
{ path: string; newName: string; }

// Response
{ success: boolean; }
```

### GET /api/files/download?path=

Download a file with `Content-Disposition: attachment`.

### GET /api/files/stream?path=

Stream a video file. Supports HTTP Range Requests (206 Partial Content).

Supported formats: MP4, WebM, MOV, AVI, MKV, M4V, WMV.

### GET /api/files/search?q=&path=

Recursively search for files and folders matching the query string.
- Optional `path` parameter scopes the search to a subdirectory.
- Returns up to 200 results; `truncated: true` when the limit is reached.
- Maximum traversal depth: 10 levels.

```typescript
// Response
{
  query: string;
  results: (FileInfo & { path: string })[];
  total: number;
  truncated: boolean;
}
```

### GET /api/files/metadata?path=

Returns EXIF / GPS metadata for an image file.
RAW files use partial file reads to extract the embedded JPEG before parsing — avoids loading full RAW files (100MB+) into memory.

```typescript
// Response
{
  metadata: {
    camera?: { make?: string; model?: string };
    lens?: string;
    settings?: {
      iso?: number;
      aperture?: number;
      shutterSpeed?: string;  // e.g. "1/250s"
      focalLength?: number;
    };
    gps?: { latitude: number; longitude: number; altitude?: number };
    datetime?: string;        // ISO 8601
    dimensions?: { width: number; height: number };
  } | null;
}
```

### GET /api/files/tags

Multi-mode tag/favorites query endpoint:

| Query params | Description |
|--------------|-------------|
| `?path=` | Get tags & favorite for a specific file |
| `?favorites=true` | List all favorited files |
| `?tag=<name>` | List files with a given tag |
| `?list=true` | List all tag names |

### POST /api/files/tags

Update tags or favorite status for a file.

```typescript
// Request
{
  path: string;
  favorite?: boolean;
  tags?: string[];
}

// Response
{ success: boolean; path: string; favorite: boolean; tags: string[]; }
```

### GET /api/thumbnail?path=

Returns a thumbnail image. Generates on first access and caches to `/cache/thumbnails`.

Supported sources:
- Standard images: JPEG, PNG, WebP, GIF, BMP, AVIF, TIFF, HEIC/HEIF
- RAW files: RAF (FUJIFILM), CR2/CR3 (Canon), NEF/NRW (Nikon), ARW/SRF/SR2 (Sony), DNG, ORF, RW2, PEF, X3F — thumbnail extracted from embedded JPEG

### POST /api/auth/login

Authenticate and receive a JWT cookie.

```typescript
// Request
{ username: string; password: string; }

// Response (success)
{ success: true }

// Rate limiting: 5 failures → 30-second lockout per IP
```

### POST /api/auth/logout

Clear the JWT cookie.

### GET /api/auth/session

Check current session validity. Returns 200 if authenticated, 401 otherwise.

## Security

### Path Traversal Protection

Every API route validates the requested path before any file operation:

```typescript
function validatePath(requestedPath: string): string {
  const resolved = path.resolve(DATA_ROOT, requestedPath);
  if (!resolved.startsWith(DATA_ROOT + "/") && resolved !== DATA_ROOT) {
    throw new Error("Access denied");
  }
  return resolved;
}
```

### Authentication

JWT stored in an HttpOnly cookie. All file API routes check the session cookie via middleware. Login is rate-limited: 5 failed attempts per IP trigger a 30-second lockout.

When `JWT_SECRET` is unset, the middleware skips authentication in development for convenience, but **fails closed in production** (`NODE_ENV=production`): every request returns 503 until `JWT_SECRET` is configured.

### Upload Limits

Maximum file size per upload request: 2GB (`MAX_UPLOAD_SIZE` constant).

## Thumbnail Pipeline

```
Request /api/thumbnail?path=foo.RAF
  │
  ├─ Cache hit? → return cached JPEG
  │
  ├─ RAW file?
  │   └─ extractRawJpeg() — partial file read (first ~2MB)
  │       └─ scan for embedded JPEG SOI marker
  │
  └─ sharp().resize(320).jpeg() → write to /cache/thumbnails/ → return
```

## Tags & Favorites Persistence

Tags and favorites are stored in a JSON file at `DATA_ROOT/.web-nas-tags.json`. The `tagsDb.ts` module provides read/write helpers with in-memory caching.
