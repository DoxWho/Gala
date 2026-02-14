# Production Deployment Guide

This guide covers deploying the Gala Event Management System to production using Vercel and a cloud PostgreSQL provider.

## Architecture Overview

```
[Users] → [Vercel Edge Network / CDN]
              ↓
        [Next.js App on Vercel]
              ↓
        [PostgreSQL Database]
        (Vercel Postgres / Supabase / Neon)
```

## Option 1: Deploy to Vercel (Recommended)

### Step 1: Set Up Database

**Using Vercel Postgres:**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Create a new project or select existing
3. Go to Storage → Create Database → Postgres
4. Copy the `POSTGRES_URL` connection string

**Using Supabase (Alternative):**
1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the connection string (use "Transaction" mode for serverless)

**Using Neon (Alternative):**
1. Go to [Neon](https://neon.tech/)
2. Create a new project
3. Copy the connection string from the dashboard

### Step 2: Deploy to Vercel

**Via GitHub Integration (Recommended):**
1. Push your code to a GitHub repository
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

**Via Vercel CLI:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` | Yes |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Yes |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Yes |
| `NEXT_PUBLIC_RAFFLE_PRICE` | `10.00` | No (defaults to 10) |
| `NEXT_PUBLIC_FIFTY_FIFTY_PRICE` | `10.00` | No (defaults to 10) |

### Step 4: Run Database Migrations

After the first deployment, run migrations:

```bash
# Option A: Using Vercel CLI with env vars
vercel env pull .env.production.local
DATABASE_URL="your-production-url" npm run db:push

# Option B: Connect to production DB directly
npm run db:push
```

### Step 5: Seed Production Database

```bash
DATABASE_URL="your-production-url" npm run db:seed
```

### Step 6: Verify Deployment

1. Visit `https://your-app.vercel.app/api/health`
   - Should return: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

2. Visit `https://your-app.vercel.app/login`
   - Should show the login form

3. Log in with: admin@gala.local / Admin123!
   - **IMPORTANT: Change this password immediately!**

### Step 7: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Domains
2. Add your custom domain (e.g., `gala.yourorg.com`)
3. Update DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the new domain
5. SSL is automatically provisioned by Vercel

---

## Option 2: Deploy with Docker

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production=false

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### Build and Run

```bash
docker build -t gala-event-manager .
docker run -p 3000:3000 \
  -e DATABASE_URL="your-connection-string" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="https://your-domain.com" \
  -e NEXT_PUBLIC_APP_URL="https://your-domain.com" \
  gala-event-manager
```

---

## Post-Deployment Checklist

### Immediate (Day 0)

- [ ] Application loads at production URL
- [ ] Health check endpoint responds: `/api/health`
- [ ] Login works with admin credentials
- [ ] Dashboard shows correct seed data
- [ ] **Change default admin password**
- [ ] Create volunteer user accounts
- [ ] SSL certificate is active (HTTPS)
- [ ] All environment variables are set

### Before Event (Day -7 to Day -1)

- [ ] Import guest list via CSV
- [ ] Verify all guests imported correctly
- [ ] Test check-in flow on mobile devices
- [ ] Test raffle/50-50 ticket sales
- [ ] Test pledge creation on impact board
- [ ] Test auction item management
- [ ] Test CSV export
- [ ] Train volunteers on the system
- [ ] Test on event venue WiFi (if possible)
- [ ] Create backup of database

### Event Day

- [ ] Verify application is accessible
- [ ] All volunteers can log in
- [ ] Check-in flow working on mobile
- [ ] Dashboard updating in real-time
- [ ] Have offline capability ready (tested)

### Post-Event

- [ ] Export all data to CSV
- [ ] Create final database backup
- [ ] Generate reports for accounting
- [ ] Review audit log for any issues
- [ ] Archive event data

---

## Monitoring & Maintenance

### Health Check

The `/api/health` endpoint returns:
```json
{
  "status": "ok",
  "timestamp": "2026-03-15T18:00:00.000Z",
  "version": "1.0.0"
}
```

### Database Backups

**Vercel Postgres**: Automatic daily backups with 7-day retention.

**Supabase**: Daily backups included. Point-in-time recovery on Pro plan.

**Manual backup**: Use `pg_dump` before major events:
```bash
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Updating the Application

```bash
# Make changes locally
npm run build   # Verify build passes
npm run lint    # Verify no lint errors

# Push to GitHub (triggers Vercel auto-deploy)
git add -A
git commit -m "description of changes"
git push

# Or deploy manually
vercel --prod
```

### Rollback

If a deployment causes issues:
1. Go to Vercel Dashboard → Deployments
2. Find the last working deployment
3. Click the "..." menu → "Promote to Production"

---

## Security Checklist

- [ ] NEXTAUTH_SECRET is a strong random value (not the dev default)
- [ ] Default admin password has been changed
- [ ] DATABASE_URL is not exposed in client-side code
- [ ] All environment variables are set as "Encrypted" in Vercel
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Security headers are active (X-Frame-Options, etc.)

## Troubleshooting

### "Internal Server Error" on any page
- Check Vercel logs: Dashboard → Deployments → [latest] → Functions tab
- Verify DATABASE_URL is correct and database is accessible

### "Unauthorized" errors
- Verify NEXTAUTH_SECRET matches between deployments
- Check NEXTAUTH_URL matches the actual URL

### Database connection issues
- Verify the connection string is correct
- Check if the database accepts connections from Vercel's IP range
- Supabase: Enable "Allow all IPs" in project settings

### Slow page loads
- Check Vercel Analytics for slow routes
- Verify database is in the same region as Vercel deployment
- Check if database connection pool is exhausted
