# VideoVault v1.2

A YouTube-style video platform with WebAuthn passkey verification by VIPs to combat fake and AI-generated videos.

## What's New in v1.2

**Post-Upload VIP Verification Requests** - Creators can now request VIP verification for videos they've already uploaded through the video detail page, allowing flexible verification workflows.

## Overview

VideoVault is a secure video platform that empowers creators to have their content authenticated by verified VIPs using biometric passkey authentication (cross-device QR code + phone biometrics). The platform features a three-tier role system with role-based dashboards, real-time notifications, and a verification workflow to combat deepfakes and AI-generated content.

### Key Features

- **Role-Based Access Control**: Admin, Creators, and VIPs with distinct dashboards
- **Video Upload & Discovery**: YouTube-style 3-column grid layout with instant publishing
- **WebAuthn Passkey Authentication**: Cross-device biometric authentication using QR codes
- **VIP Verification System**: 
  - Request verification at upload time or later
  - Multiple VIP selection
  - Real-time notification queue
  - Verification badges displayed on video titles
- **Admin Approval Workflow**: Admins approve/reject creator authentication requests
- **Analytics Dashboard**: View count tracking and creator statistics
- **Verification Timeline**: Chronological history of verification events

## User Roles

### Admin
- **Credentials**: `admin` / `admin123`
- **Capabilities**:
  - Approve or reject creator authorization requests
  - Manage user access and permissions
  - View platform analytics

### Creators (Pre-created, Auth-Approved)
- **Sample Accounts**:
  - Sarah Mitchell (Tech Reviewer): `sarah` / `sarah123`
  - Mike Johnson (Travel Vlogger): `mike` / `mike123`
  - Emma Davis (Food Creator): `emma` / `emma123`
- **Capabilities**:
  - Upload videos with optional VIP selection at upload time
  - Request VIP verification for existing videos
  - View analytics and verification status
  - Request authorization upgrade from admin

### Creating New Creators
1. Sign up to create an account
2. Click "Request Auth" in dashboard
3. Admin approves the request
4. Once approved, can request VIP verification for videos

### VIPs (Pre-created, No Signup)
- **Sample Accounts** (all password: `123`):
  - Anthony (CEO, USA)
  - Charles (President, UK)
  - Jan (CEO, Germany)
  - Yuki (Director, Japan)
  - Raj (Chairman, India)
- **Capabilities**:
  - Review videos in verification queue
  - Approve/reject videos using WebAuthn passkey
  - View verification history and timeline

## Tech Stack

- **Frontend**: React 18 with TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based (backend) + WebAuthn passkeys (verification)
- **Passkeys**: @simplewebauthn/server + @simplewebauthn/browser
- **Real-time**: WebSocket notifications
- **Forms**: React Hook Form with Zod validation
- **State Management**: TanStack React Query (TanStack Query)

## Project Structure

```
├── client/                      # Frontend React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/         # Header, Sidebar, MainLayout
│   │   │   └── ui/             # Shadcn UI components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and auth context
│   │   ├── pages/              # Page components
│   │   │   ├── admin/          # Admin dashboard pages
│   │   │   └── vip/            # VIP dashboard pages
│   │   ├── App.tsx             # Main app with routing
│   │   └── index.css           # Styling and theming
│   └── public/                 # Static assets
├── server/
│   ├── db.ts                   # Database connection
│   ├── storage.ts              # Data access layer (Drizzle)
│   ├── routes.ts               # API endpoints
│   ├── webauthn.ts             # WebAuthn service
│   ├── notifications.ts        # WebSocket notifications
│   ├── vite.ts                 # Vite integration
│   └── index.ts                # Server entry point
├── shared/
│   └── schema.ts               # Drizzle ORM schema + Zod types
├── uploads/                    # Uploaded video files (local storage)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
└── drizzle.config.ts
```

## Database Schema

- **users** - All users (admin, creators, VIPs) with auth and profile data
- **videos** - Uploaded videos with metadata
- **auth_requests** - Creator authorization requests to admins
- **verification_requests** - VIP verification queue with status tracking
- **passkeys** - WebAuthn credentials for VIP authentication

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/signup` - Create creator account
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Videos
- `GET /api/videos` - List all videos (paginated)
- `GET /api/videos/:id` - Get video by ID with verification status
- `GET /api/my-videos` - Get authenticated user's videos
- `POST /api/videos` - Upload video (multipart form-data)
- `POST /api/videos/:id/verification-requests` - **[v1.2]** Request VIP verification for existing video
- `GET /api/vips` - Get list of all VIPs

### Creator Authentication Requests
- `GET /api/auth-requests/my` - Get current creator's auth request
- `POST /api/auth-requests` - Submit new auth request
- `GET /api/admin/auth-requests` - List all requests (admin only)
- `POST /api/admin/auth-requests/:id/:action` - Process request (admin only)

### VIP Verification
- `GET /api/vip/verification-requests` - Get VIP's pending verification queue
- `GET /api/vip/has-passkey` - Check if VIP has registered passkey
- `POST /api/vip/verification-requests/:id/:action` - Process verification with passkey
- `GET /api/vip/verification-requests/:id/authenticate` - Get authentication challenge

### WebAuthn
- `POST /api/webauthn/register/options` - Get passkey registration challenge
- `POST /api/webauthn/register/verify` - Verify and save passkey credential
- `POST /api/webauthn/authenticate/options` - Get passkey authentication challenge
- `POST /api/webauthn/authenticate/verify` - Verify passkey authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd videovault

# Install dependencies
npm install
```

### Environment Setup

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/videovault

# Session
SESSION_SECRET=your-random-session-secret-key

# WebAuthn (optional, defaults to request host)
RP_ID=localhost
ORIGIN=http://localhost:5000

# Node environment
NODE_ENV=development
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# If schema conflicts occur, force push (use cautiously)
npm run db:push -- --force
```

### Run the Application

```bash
npm run dev
```

The application will start on `http://localhost:5000`

- Frontend: Served by Vite dev server
- Backend: Express server on port 5000
- Database: PostgreSQL connection via DATABASE_URL

## Usage

### For Creators

1. **Sign Up** - Create an account on the landing page
2. **Upload Video** - Navigate to upload page, add video, title, description
3. **Request VIP Verification** - Select VIPs at upload time OR request verification later from video detail page
4. **Request Authorization** - Click "Request Auth" to ask admin to become auth-approved
5. **Track Verification** - View timeline and status of verification requests

### For VIPs

1. **Login** - Use pre-created VIP account
2. **Register Passkey** - Set up biometric authentication in account settings
3. **Review Queue** - View pending verification requests
4. **Verify Videos** - Authenticate with passkey and approve/reject videos
5. **View History** - Track all verification activity

### For Admins

1. **Login** - Use admin account
2. **Review Requests** - Check creator authorization requests
3. **Process Requests** - Approve or reject creators
4. **View Analytics** - Monitor platform metrics

## Docker Deployment

The project is structured for Docker containerization:

```bash
# Build Docker image
docker build -t videovault:1.2 .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e SESSION_SECRET=... \
  -e NODE_ENV=production \
  videovault:1.2
```

### Production Deployment Notes

When deploying behind a reverse proxy (Docker, Kubernetes, etc.):

1. Set `NODE_ENV=production` for secure cookies and trust proxy
2. Ensure reverse proxy passes `X-Forwarded-Proto` header for HTTPS detection
3. Configure `Host` header correctly for WebAuthn RP ID derivation
4. Optional: Set explicit `RP_ID` and `ORIGIN` environment variables for WebAuthn

## Development Guidelines

### Code Structure
- **Frontend**: Feature-based components in `/client/src`
- **Backend**: API routes in `server/routes.ts`, data access in `server/storage.ts`
- **Shared**: Types and schemas in `shared/schema.ts`
- **Styling**: Tailwind CSS with Shadcn UI components

### Adding Features
1. Define schema in `shared/schema.ts`
2. Implement storage methods in `server/storage.ts`
3. Add API routes in `server/routes.ts`
4. Build frontend pages/components in `client/src/pages` and `client/src/components`

### Running Tests
```bash
# Frontend tests (if configured)
npm run test

# Build check
npm run build
```

## Troubleshooting

### WebAuthn Issues
- **"No matching passkeys" error**: Verify credential IDs are stored/retrieved correctly
- **Domain mismatch**: Ensure `RP_ID` and `ORIGIN` match your deployment domain
- **Browser support**: Use Chrome/Edge for best WebAuthn support

### Database Connection
- **Connection refused**: Verify PostgreSQL is running and DATABASE_URL is correct
- **Schema mismatch**: Run `npm run db:push` to sync schema

### Video Upload Issues
- **File too large**: Check Express multer configuration in `server/index.ts`
- **Format not supported**: Verify browser supports HTML5 video playback

## Version History

### v1.2 (Current)
- Post-upload VIP verification requests
- Improved video detail page with VIP selection interface
- Enhanced verification workflow flexibility
- Server-side VIP validation

### v1.1
- WebAuthn cross-device authentication (QR code + phone biometrics)
- Real-time notifications via WebSocket
- Verification timeline with color-coded status indicators
- VIP batch verification UI

### v1.0
- Initial release with video upload/discovery
- Role-based access control (Admin, Creator, VIP)
- Basic VIP verification at upload time
- Session-based authentication

## License

MIT

## Support

For issues, feature requests, or questions, please create an issue in the repository.
