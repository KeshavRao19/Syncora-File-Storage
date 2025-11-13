# Syncora File Storage - Setup Guide

## Phase 1: File Upload/Download System

This guide will help you set up the basic file upload and download system using Cloudflare R2.

---

## Prerequisites

- Node.js 20.9.0 or higher
- pnpm (or npm)
- PostgreSQL database
- Cloudflare R2 account

---

## Step 1: Install Dependencies

```bash
pnpm install
```

---

## Step 2: Environment Configuration

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

### Required Environment Variables

#### Basic Configuration
```env
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_UPLOAD_URL=http://localhost:3000/api/files/upload
SITE_URL=http://localhost:3000
```

#### Database
```env
DATABASE_URL=postgresql://username:password@localhost:5432/syncora
```

#### Cloudflare R2 (Required for file storage)
```env
NEXT_PUBLIC_CLOUDFLARE_URL=https://your-account.r2.cloudflarestorage.com
CLOUDFLARE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
CLOUDFLARE_ACCESS_KEY_ID=your-access-key-id
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=your-bucket-name
```

### Getting Cloudflare R2 Credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Create a new bucket (e.g., `syncora-files`)
4. Go to **R2 API Tokens** and create a new API token
5. Copy the **Access Key ID** and **Secret Access Key**
6. The endpoint will be: `https://<account-id>.r2.cloudflarestorage.com`

---

## Step 3: Start PostgreSQL Database

### Using Docker Compose (Recommended)

```bash
docker-compose up -d
```

This will start a PostgreSQL database on `localhost:5432`.

### Manual PostgreSQL Setup

If you have PostgreSQL installed locally:

```bash
createdb syncora
```

Update your `DATABASE_URL` in `.env`:
```env
DATABASE_URL=postgresql://your-username:your-password@localhost:5432/syncora
```

---

## Step 4: Run Database Migrations

Generate and run the database schema:

```bash
# Generate migration files
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate
```

Alternatively, push schema directly (for development):

```bash
pnpm drizzle-kit push
```

---

## Step 5: Start the Development Server

```bash
pnpm dev
```

The application will be available at: **http://localhost:3000**

---

## Testing the File Upload/Download System

1. Open http://localhost:3000 in your browser
2. Click **"Upload Files"** button
3. Drag and drop files or click to browse
4. Files will be uploaded to Cloudflare R2
5. View your uploaded files in the file browser
6. Click **"Download"** to retrieve files
7. Click **"Delete"** to move files to trash

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── files/           # API routes for file operations
│   │       ├── route.ts            # GET /api/files (list files)
│   │       ├── upload/
│   │       │   └── route.ts        # POST /api/files/upload
│   │       └── [id]/
│   │           ├── route.ts        # GET, PATCH, DELETE /api/files/[id]
│   │           └── download/
│   │               └── route.ts    # GET /api/files/[id]/download
│   ├── page.tsx             # Home page with FileManager
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   └── file-manager/        # File management components
│       ├── FileUpload.tsx          # Drag-and-drop upload component
│       ├── FileBrowser.tsx         # File listing component
│       └── FileManager.tsx         # Combined manager component
├── db/
│   ├── index.ts            # Database connection
│   ├── schema/             # Drizzle ORM schemas
│   │   ├── users.ts               # User accounts
│   │   ├── sessions.ts            # Auth sessions
│   │   ├── files.ts               # File metadata
│   │   └── folders.ts             # Folder structure
│   └── migrations/         # Database migrations
├── lib/
│   ├── storage/            # Storage services
│   │   ├── r2-client.ts           # Cloudflare R2 operations
│   │   └── file-service.ts        # File business logic
│   └── utils/
│       └── file-utils.ts          # Utility functions
└── hooks/
    └── use-file-upload.ts  # File upload hook
```

---

## Database Schema

### Users Table
- User authentication (Lucia auth compatible)
- Storage quota tracking (5GB default)
- Stripe subscription integration ready
- 2FA support fields

### Files Table
- File metadata (name, size, mime type)
- R2 storage key reference
- Folder organization
- Sharing capabilities (public links, tokens)
- Trash functionality
- Encryption metadata (for Phase 2)

### Folders Table
- Hierarchical folder structure
- Parent-child relationships
- Sharing support

### Sessions Table
- Lucia auth sessions

---

## API Endpoints

### Upload File
```bash
POST /api/files/upload
Content-Type: multipart/form-data

Body:
- file: File
- userId: string
- folderId?: string (optional)
- isPublic?: boolean (optional)

Response:
{
  "success": true,
  "file": {
    "id": "uuid",
    "name": "filename.pdf",
    "size": 1024,
    "mimeType": "application/pdf",
    "createdAt": "2025-11-13T..."
  }
}
```

### List Files
```bash
GET /api/files?userId=user123&folderId=null&includeTrash=false

Response:
{
  "success": true,
  "files": [...]
}
```

### Get File Metadata
```bash
GET /api/files/{fileId}?userId=user123

Response:
{
  "success": true,
  "file": {...}
}
```

### Get Download URL
```bash
GET /api/files/{fileId}/download?userId=user123

Response:
{
  "success": true,
  "downloadUrl": "https://..."
}
```

### Update File
```bash
PATCH /api/files/{fileId}
Content-Type: application/json

Body:
{
  "userId": "user123",
  "name": "new-name.pdf",
  "description": "Updated description",
  "isPublic": true
}

Response:
{
  "success": true,
  "file": {...}
}
```

### Delete File
```bash
DELETE /api/files/{fileId}?userId=user123&permanent=false

Response:
{
  "success": true,
  "message": "File moved to trash"
}
```

---

## Known Limitations (Phase 1)

1. **Authentication**: Currently using placeholder `userId`. You'll need to integrate proper authentication (Lucia Auth) to get the actual user ID from the session.

2. **No Encryption**: Files are stored in plaintext on R2. Encryption will be added in Phase 2.

3. **No Resumable Uploads**: Large files are uploaded in a single request. Consider implementing multipart uploads for files > 100MB.

4. **Basic Error Handling**: Production apps should have more robust error handling and retry logic.

---

## Next Steps: Phase 2 (Encryption)

After Phase 1 is working, we'll implement:

1. **Zero-Knowledge Encryption**
   - Client-side encryption using Web Crypto API
   - Key derivation from user password
   - AES-256-GCM encryption

2. **Server-Side Encryption Option**
   - Transparent encryption for convenience
   - Server-managed keys

3. **Hybrid Approach**
   - User chooses encryption method per file
   - Settings to toggle default behavior

---

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` format
- Verify credentials

### R2 Upload Failures
- Verify R2 credentials
- Check bucket name is correct
- Ensure CORS is configured on R2 bucket

### CORS Errors
Add CORS configuration to your R2 bucket:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"]
  }
]
```

---

## Support

For issues or questions, please check:
- Project README
- Drizzle ORM docs: https://orm.drizzle.team
- Cloudflare R2 docs: https://developers.cloudflare.com/r2
- Next.js docs: https://nextjs.org/docs
