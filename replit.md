# VideoVault

A YouTube-style video platform with VIP verification to fight fake and AI-generated videos.

## Overview

VideoVault is a web application where users can upload and watch videos. Only verified VIPs can authenticate videos using WebAuthn passkeys. Verified videos show a green badge, rejected videos show a red tag.

## User Roles

### Admin
- Username: `admin`, Password: `admin123`
- Can approve or reject authorization requests from creators
- Can manage all users

### Sample Creators (Pre-created with auth approved)
- Sarah Mitchell (Tech Reviewer): `sarah` / `sarah123`
- Mike Johnson (Travel Vlogger): `mike` / `mike123`
- Emma Davis (Food Creator): `emma` / `emma123`

### Creating New Creators
- Sign up to create an account
- Can upload videos
- Cannot request VIP verification by default
- Can click "Request Auth" in dashboard
- If approved by admin, can select VIPs for video verification

### VIPs (Pre-created, no signup)
- 5 fixed accounts:
  - Anthony (CEO, USA) - password: 123
  - Charles (President, UK) - password: 123
  - Jan (CEO, Germany) - password: 123
  - Yuki (Director, Japan) - password: 123
  - Raj (Chairman, India) - password: 123
- Can approve/disapprove videos they've been requested on
- Must register a passkey for biometric authentication
- Actions trigger passkey challenge (except Ignore)

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Session-based authentication
- **Passkeys**: WebAuthn with @simplewebauthn/server

## Project Structure

```
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── layout/     # Header, Sidebar, MainLayout
│   │   │   └── ui/         # Shadcn UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and auth context
│   │   ├── pages/          # Page components
│   │   │   ├── admin/      # Admin dashboard pages
│   │   │   └── vip/        # VIP dashboard pages
│   │   └── App.tsx         # Main app with routing
│   └── public/             # Static assets
├── server/                 # Backend Express app
│   ├── db.ts               # Database connection
│   ├── storage.ts          # Data access layer
│   ├── routes.ts           # API endpoints
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle schema definitions
└── uploads/                # Uploaded video files
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/signup` - Create creator account
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Videos
- `GET /api/videos` - List all videos
- `GET /api/videos/:id` - Get video by ID
- `GET /api/my-videos` - Get user's videos
- `POST /api/videos` - Upload video (multipart form)
- `POST /api/videos/:id/verification-requests` - Request VIP verification for existing video
- `GET /api/vips` - Get list of VIPs

### Auth Requests
- `GET /api/auth-requests/my` - Get creator's auth request
- `POST /api/auth-requests` - Submit auth request
- `GET /api/admin/auth-requests` - List all requests (admin)
- `POST /api/admin/auth-requests/:id/:action` - Process request (admin)

### VIP Verification
- `GET /api/vip/verification-requests` - Get VIP's queue
- `GET /api/vip/has-passkey` - Check passkey status
- `POST /api/vip/verification-requests/:id/:action` - Process verification

### WebAuthn
- `POST /api/webauthn/register/options` - Get registration options
- `POST /api/webauthn/register/verify` - Verify registration
- `POST /api/webauthn/authenticate/options` - Get auth options

## Database Schema

- `users` - All users (admin, creators, VIPs)
- `videos` - Uploaded videos
- `auth_requests` - Creator authorization requests
- `verification_requests` - VIP verification queue
- `passkeys` - WebAuthn credentials

## Running the App

```bash
npm run dev
```

This starts both the Express backend and Vite dev server.

## Docker Ready

The project is structured for easy Docker containerization:
- Separate client/server concerns
- Environment variable configuration
- PostgreSQL connection via DATABASE_URL
- Static file serving for production
- Trust proxy enabled for reverse proxy deployments

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - Set to "production" for secure cookies and trust proxy
- `RP_ID` - WebAuthn relying party ID (defaults to request host)
- `ORIGIN` - WebAuthn origin URL (defaults to protocol + host)

## Production Deployment Notes

When deploying behind a reverse proxy (Docker, Kubernetes, etc.):
1. Set `NODE_ENV=production` to enable secure cookies and trust proxy
2. Ensure reverse proxy passes `X-Forwarded-Proto` header for HTTPS detection
3. Configure `Host` header correctly for WebAuthn RP ID derivation
4. Optional: Set explicit `RP_ID` and `ORIGIN` environment variables
