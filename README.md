# Gala Event Management System

A production-ready, multi-user gala event management web application with real-time collaboration, offline-first architecture, and mobile-responsive design. Built to handle concurrent editing by multiple volunteers during a live fundraising event with spotty WiFi conditions.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript 5, Tailwind CSS 3.4, shadcn/ui (Radix UI)
- **State Management**: Zustand (global state) + React Query (server state)
- **Backend**: Next.js API Routes + tRPC
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Authentication**: NextAuth.js 4 with JWT sessions
- **Offline**: Dexie.js (IndexedDB wrapper) with operation queueing
- **Real-time**: Socket.io + polling fallback

## Features

### Guest & Attendance Management
- Real-time searchable guest list with party groupings
- Individual guest check-in status toggling
- Quick add for walk-ins and plus-ones
- Raffle/50-50 ticket quantity tracking per guest

### Donation & Impact Board
- Multi-select impact board pledge assignment per guest
- Custom pledge amount override capability
- Pre-pledged vs gala-night donation flagging
- Impact board item filtering by category
- Live totals per impact board item

### Raffle & 50/50 Tracking
- Quantity tracking per guest
- Incremental sales recording
- Live revenue totals

### Auction Management
- Auction item catalog
- Winning party assignment with final bid amount
- Quick add for new auction items during event
- Live auction revenue totals

### Dashboard & Analytics
- Real-time attendance counter (checked-in / total invited)
- Live fundraising thermometer with goal tracking
- Breakdown: Gala-night donations + Pre-pledges + Combined total
- Pre-loaded initial totals: Ticket sales, Sponsorships, Pre-pledges

### Data Import/Export
- CSV import for initial guest list
- One-click CSV export of complete event data
- Export includes: guests, attendance, donations, pledges, auction results

### Authentication & Authorization
- Email/password authentication with secure session management
- Role-based access control (Admin / Volunteer)
- Session timeout after 8 hours of inactivity
- Audit logging of all user actions

### Offline-First
- Local-first data storage using IndexedDB
- Operation queueing during offline periods
- Automatic sync when connection restores
- Visual offline/online status indicator

## Getting Started

### Prerequisites
- Node.js 20 LTS
- PostgreSQL 16
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your database URL and auth secret

# Run database migrations
npm run db:push

# Seed the database with initial data
npm run db:seed

# Start the development server
npm run dev
```

### Default Admin Credentials
- Email: `admin@gala.local`
- Password: `Admin123!`
- **Change this password immediately after first login**

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for JWT signing (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Application URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `NEXT_PUBLIC_RAFFLE_PRICE` | Default raffle ticket price (default: 10.00) |
| `NEXT_PUBLIC_FIFTY_FIFTY_PRICE` | Default 50/50 ticket price (default: 10.00) |

## CSV Import Format

The CSV import expects the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| `partyName` | Yes | Name of the guest's party group |
| `firstName` | Yes | Guest's first name |
| `lastName` | Yes | Guest's last name |
| `email` | No | Guest's email address |
| `phone` | No | Guest's phone number |
| `primaryContact` | No | Primary contact for the party |

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Drizzle Studio (DB browser)
```

## Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Authentication pages (login, register)
│   ├── (dashboard)/        # Protected dashboard pages
│   └── api/                # API routes (auth, tRPC, CSV, health)
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── layout/             # Header, Sidebar, ConnectionStatus
│   ├── dashboard/          # Dashboard-specific components
│   ├── guests/             # Guest management components
│   ├── impact-board/       # Impact board components
│   ├── auction/            # Auction components
│   └── shared/             # Shared utility components
├── lib/
│   ├── db/                 # Database schema and connection
│   ├── auth/               # NextAuth configuration
│   ├── trpc/               # tRPC server and routers
│   ├── offline/            # IndexedDB and sync management
│   ├── socket/             # Real-time communication
│   ├── csv/                # CSV import/export handlers
│   └── utils/              # Utility functions
├── hooks/                  # Custom React hooks
├── store/                  # Zustand state stores
└── types/                  # TypeScript type definitions
```

## User Roles

| Feature | Admin | Volunteer |
|---------|-------|-----------|
| View Dashboard | Yes | Yes |
| Guest Check-in | Yes | Yes |
| Add Walk-in Guests | Yes | Yes |
| Sell Raffle/50-50 | Yes | Yes |
| Record Pledges | Yes | Yes |
| Manage Auction | Yes | Read + Assign Winners |
| View Reports | Yes | Yes |
| CSV Import | Yes | No |
| CSV Export | Yes | Yes |
| User Management | Yes | No |
| Event Settings | Yes | No |
| Audit Log | Yes | No |

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in the Vercel dashboard and connect a PostgreSQL database.

### Docker (Alternative)

Build and run with Docker using the standard Next.js Dockerfile approach.

## Security

- HTTPS enforced in production
- Passwords hashed with bcrypt (12 rounds)
- JWT session tokens with 8-hour expiry
- Role-based access control enforced server-side
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM parameterized queries
- XSS protection via React's automatic escaping
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Audit logging of all data modifications
- Rate limiting on API endpoints

## License

Private - All rights reserved.
