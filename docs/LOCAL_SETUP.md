# Local Setup Guide

This guide walks you through setting up the Gala Event Management System on your local machine.

## Prerequisites

1. **Node.js 20 LTS** - [Download here](https://nodejs.org/)
2. **PostgreSQL 16** - [Download here](https://www.postgresql.org/download/)
3. **npm 10+** (comes with Node.js)
4. **Git** - [Download here](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd gala-event-manager
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Set Up PostgreSQL

### Option A: Local PostgreSQL Installation

1. Install PostgreSQL 16 for your operating system
2. Start the PostgreSQL service
3. Create a database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE gala;

# Exit
\q
```

### Option B: Using Docker

```bash
docker run --name gala-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=gala \
  -p 5432:5432 \
  -d postgres:16
```

### Option C: Cloud PostgreSQL (Supabase, Neon, etc.)

1. Create an account on [Supabase](https://supabase.com/) or [Neon](https://neon.tech/)
2. Create a new project/database
3. Copy the connection string

## Step 4: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gala"

# Authentication - Generate a secure secret
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Raffle/50-50 ticket prices (optional, defaults to $10.00)
NEXT_PUBLIC_RAFFLE_PRICE="10.00"
NEXT_PUBLIC_FIFTY_FIFTY_PRICE="10.00"
```

To generate a secure NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

## Step 5: Set Up the Database Schema

Push the schema to your database:

```bash
npm run db:push
```

This creates all the required tables, indexes, and enums.

## Step 6: Seed the Database

```bash
npm run db:seed
```

This creates:
- **1 admin user**: admin@gala.local / Admin123!
- **1 event**: Annual Gala 2026 with $100,000 goal
- **31 impact board items** across 5 categories
- **7 auction items**

## Step 7: Start the Development Server

```bash
npm run dev
```

The application will be available at **http://localhost:3000**

## Step 8: Log In

1. Navigate to http://localhost:3000
2. You'll be redirected to the login page
3. Enter credentials:
   - **Email**: admin@gala.local
   - **Password**: Admin123!
4. You'll be redirected to the Dashboard

## Verification Checklist

After setup, verify these routes work:

| Route | Description | Expected |
|-------|-------------|----------|
| `/login` | Login page | Login form visible |
| `/dashboard` | Main dashboard | Stats cards, thermometer |
| `/guests` | Guest management | Empty guest list with search |
| `/impact-board` | Impact board | 31 items in grid view |
| `/auction` | Auction management | 7 auction items |
| `/reports` | Reports & export | Summary cards, CSV controls |
| `/settings` | Admin settings | Event config, user management |

## Common Issues

### "Cannot connect to database"
- Verify PostgreSQL is running: `pg_isready`
- Check your DATABASE_URL in `.env.local`
- Ensure the database `gala` exists

### "Module not found" errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

### "Seed failed"
- Make sure the database schema is pushed first: `npm run db:push`
- If re-seeding, you may need to clear existing data first

### Port 3000 already in use
- Kill the existing process: `lsof -ti:3000 | xargs kill -9`
- Or use a different port: `npm run dev -- -p 3001`

## Database Management

```bash
# View database in browser (Drizzle Studio)
npm run db:studio

# Generate migration files
npm run db:generate

# Push schema changes
npm run db:push

# Re-seed database
npm run db:seed
```

## Next Steps

After local setup is verified:
1. Import your guest list via CSV on the Reports page
2. Create volunteer user accounts in Settings
3. Test the check-in flow on the Guests page
4. Review the Dashboard for live stats
