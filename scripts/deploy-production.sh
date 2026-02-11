#!/bin/bash
set -e

echo "========================================="
echo "  Gala Event Manager - Production Deploy"
echo "========================================="
echo ""

# 1. Pre-deployment checks
echo "Step 1: Running pre-deployment checks..."
echo "  - Type checking..."
npx tsc --noEmit
echo "  - Linting..."
npx next lint
echo "  - Building..."
npx next build
echo "  Pre-deployment checks passed!"
echo ""

# 2. Database migrations (if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  echo "Step 2: Running database migrations..."
  npx drizzle-kit push
  echo "  Database schema pushed!"
else
  echo "Step 2: Skipping database migrations (DATABASE_URL not set)"
  echo "  Set DATABASE_URL to your production database to run migrations"
fi
echo ""

# 3. Deploy to Vercel
echo "Step 3: Deploying to Vercel..."
if command -v vercel &> /dev/null; then
  vercel --prod
  echo "  Deployed to Vercel!"
else
  echo "  Vercel CLI not installed. Install with: npm i -g vercel"
  echo "  Or deploy via GitHub integration at vercel.com"
  exit 1
fi
echo ""

# 4. Health check
echo "Step 4: Running health check..."
DEPLOY_URL=$(vercel inspect --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$DEPLOY_URL" ]; then
  sleep 10
  echo "  Checking $DEPLOY_URL/api/health..."
  curl -sf "https://$DEPLOY_URL/api/health" && echo ""
  echo "  Health check passed!"
else
  echo "  Could not determine deployment URL. Check manually."
fi
echo ""

echo "========================================="
echo "  Deployment complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Verify the app at your production URL"
echo "  2. Change the default admin password"
echo "  3. Import your guest list via CSV"
echo "  4. Create volunteer user accounts"
