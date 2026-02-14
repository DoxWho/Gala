# Gala Event Management System - Feature & Business Rules Reference

## Table of Contents

1. [User Roles & Permissions](#1-user-roles--permissions)
2. [Event Configuration](#2-event-configuration)
3. [Guest & Attendance Management](#3-guest--attendance-management)
4. [Sponsorship & Ticket Management](#4-sponsorship--ticket-management)
5. [Raffle Ticket Sales](#5-raffle-ticket-sales)
6. [50/50 Ticket Sales](#6-5050-ticket-sales)
7. [Impact Board & Pledges](#7-impact-board--pledges)
8. [Auction Management](#8-auction-management)
9. [Dashboard & Analytics](#9-dashboard--analytics)
10. [Data Import (CSV)](#10-data-import-csv)
11. [Data Export (CSV / ShulCloud)](#11-data-export-csv--shulcloud)
12. [Pre-Imported vs Gala-Night Transactions](#12-pre-imported-vs-gala-night-transactions)
13. [Offline-First & Sync](#13-offline-first--sync)
14. [Security & Audit](#14-security--audit)

---

## 1. User Roles & Permissions

### Roles

| Role | Description |
|------|-------------|
| **Admin** | Full access: user management, event config, data import/export, all operations |
| **Volunteer** | Operational access: check-in, ticket sales, pledges, auction viewing |

### Permission Matrix

| Feature | Admin | Volunteer |
|---------|:-----:|:---------:|
| View Dashboard | Yes | Yes |
| Guest Check-In | Yes | Yes |
| Add Walk-In / Plus-One Guests | Yes | Yes |
| Sell Raffle Tickets | Yes | Yes |
| Sell 50/50 Tickets | Yes | Yes |
| Record Impact Board Pledges | Yes | Yes |
| View Auction Items | Yes | Yes |
| Assign Auction Winners | Yes | Yes |
| Assign Sponsored Tickets | Yes | Yes |
| View Reports | Yes | Yes |
| CSV Export | Yes | Yes |
| CSV Import | Yes | No |
| Event Settings (name, goal, pricing) | Yes | No |
| User Management (create, deactivate) | Yes | No |
| Set Sponsorship Tiers | Yes | No |
| View Audit Log | Yes | No |
| Ticket Pricing Configuration | Yes | No |

### Authentication Rules

- Email/password credentials-based login
- JWT session tokens, stored as HTTP-only cookies
- Session timeout: **8 hours** of inactivity
- Passwords hashed with bcrypt (12 rounds)
- Failed logins return generic "Invalid credentials" (no user enumeration)

---

## 2. Event Configuration

### Initial Amounts (Pre-Loaded)

These are set in Admin > Settings and included in the fundraising total from the start:

| Field | Description | Default |
|-------|-------------|---------|
| Goal Amount | Fundraising target for the event | $100,000 |
| Initial Ticket Sales | Revenue already collected from ticket sales | $25,000 |
| Initial Sponsorships | Revenue already collected from sponsorships | $15,000 |
| Initial Pre-Pledges | Revenue already collected from pre-pledges | $10,000 |

**Business Rule:** These amounts are static configuration values. They are NOT affected by any transactions within the app. They represent money already collected before the event.

### Pricing Configuration (Admin-Configurable)

| Setting | Description | Default |
|---------|-------------|---------|
| Raffle Price Per Ticket | Cost of a single raffle ticket | $10.00 |
| 50/50 Price Per Ticket | Cost of a single 50/50 ticket | $25.00 |
| 50/50 Bundle Quantity | Number of tickets in a bundle | 5 |
| 50/50 Bundle Price | Discounted price for a bundle | $100.00 |

---

## 3. Guest & Attendance Management

### Guest Data Model

Each guest belongs to a **Party** (family/group). Parties belong to an **Event**.

| Field | Description |
|-------|-------------|
| First Name, Last Name | Required |
| Email, Phone | Optional |
| Party | Required - the family/group the guest belongs to |
| Checked In | Boolean toggle |
| Check-In Time | Auto-set when checked in |
| Checked In By | Records which user performed check-in |
| Walk-In | Flag for guests not on original list |
| Plus-One | Flag for guests added as someone's +1 |
| Ticket Type | `paid`, `sponsored`, or `free` |
| Sponsor Party | Which sponsor's pool this ticket came from (if sponsored) |
| Raffle Quantity | Running total of raffle tickets purchased |
| 50/50 Quantity | Running total of 50/50 tickets purchased |

### Check-In Rules

- Toggle check-in on/off with a single tap
- Checking in records the timestamp and the user who performed it
- Checking out clears the timestamp and user
- Optimistic UI update (instant visual feedback)
- Real-time update to all connected devices

### Adding Guests

- **Quick Add**: Create a new guest for an existing party or create a new party
- **Walk-In**: Guest not on original list, flagged as `isWalkIn`
- **Plus-One**: Guest added as companion, flagged as `isPlusOne`
- **CSV Import**: Bulk add from CSV file (Admin only)

### Search & Filter

- Real-time search by first name, last name, email, or party name
- Filter by check-in status: All / Checked In / Not Checked In
- Debounced search (300ms delay to prevent excessive queries)

---

## 4. Sponsorship & Ticket Management

### Sponsorship Tiers

| Tier | Amount | Included Tickets | Ad |
|------|-------:|:----------------:|:---|
| **Builders** | $1,800 | 10 | Full-page |
| **Framers** | $1,200 | 6 | Full-page |
| **Foundation** | $540 | 2 | Full-page |
| **Bar** | $500 | 0 | None |
| **Entertainment** | $500 | 0 | None |
| **Security** | $360 | 0 | None |

### Ticket Types

| Type | Description | Revenue Impact |
|------|-------------|:-------------:|
| **Paid** | Standard ticket purchased directly | Counted in Initial Ticket Sales |
| **Sponsored** | Ticket from a sponsor's pool | $0 - No revenue impact |
| **Free** | Complimentary ticket (no sponsor pool needed) | $0 - No revenue impact |

### Ticket Pool Business Rules

1. **Pool Allocation**: When a party is assigned a sponsorship tier, their ticket pool is automatically set based on the tier (e.g., Builders = 10 tickets).

2. **Assignment**: A sponsored ticket can be assigned to any guest from the sponsor's pool. The system validates that the sponsor has remaining tickets before allowing assignment.

3. **Reassignment**: A sponsored ticket can be moved from one sponsor's pool to another. The system validates the new sponsor has capacity.

4. **Return to Pool**: A sponsored ticket can be returned to the originating sponsor's pool, making it available for reassignment.

5. **Free Tickets**: An admin or volunteer can mark any guest as a "free ticket" even if no sponsored tickets are available. This does not draw from any pool.

6. **Revenue Rule**: Sponsored and free tickets are always $0 and **never** affect the total revenue raised. Sponsorship revenue is tracked under "Initial Sponsorships" as a static pre-loaded amount.

7. **Pool Visibility**: Admin settings displays:
   - Total sponsored tickets across all sponsors
   - Number of assigned sponsored tickets
   - Number of remaining (unassigned) sponsored tickets
   - Number of free (non-pool) tickets

8. **Important**: Sponsors should NOT fill out "number of tickets" in their registration. Their included tickets come from the sponsorship tier automatically.

---

## 5. Raffle Ticket Sales

### Rules

- Each raffle ticket has a fixed price (default $10.00, admin-configurable)
- Tickets are sold to individual guests
- Each sale records: guest, quantity, price per ticket, total amount, sold by, timestamp
- Guest's `raffleQuantity` is incremented with each sale
- Multiple sales can be recorded for the same guest
- Revenue is added to "Raffle Revenue" in dashboard totals

### Sale Flow

1. Open guest's action menu > "Sell Raffle Tickets"
2. Use +/- buttons to set quantity
3. Total auto-calculates (quantity x price per ticket)
4. Click "Record Sale"
5. Guest's raffle count updates immediately
6. Dashboard totals refresh

---

## 6. 50/50 Ticket Sales

### Pricing Structure

- **Per ticket**: $25.00 (admin-configurable)
- **Bundle**: 5 tickets for $100.00 (both quantity and price admin-configurable)
- Bundle pricing is automatically applied:
  - 1 ticket = $25
  - 3 tickets = $75 (3 x $25)
  - 5 tickets = $100 (1 bundle)
  - 7 tickets = $150 (1 bundle + 2 x $25)
  - 10 tickets = $200 (2 bundles)

### Sale Flow

1. Open guest's action menu > "Sell 50/50 Tickets"
2. Use +/- buttons or quick-select buttons (1x, 5-pack, 10-pack)
3. Bundle discount applied automatically when quantity reaches bundle threshold
4. Bundle savings shown in green text
5. Total auto-calculates with bundle pricing
6. Click "Record Sale"

### Business Rules

- Each sale records the effective per-ticket price (total / quantity)
- Guest's `fiftyFiftyQuantity` is incremented with each sale
- Revenue is added to "50/50 Revenue" in dashboard totals
- Pricing can be changed mid-event by admin; existing sales are not retroactively affected

---

## 7. Impact Board & Pledges

### Categories

| Category | Description |
|----------|-------------|
| **Shabbat** | Weekly Shabbat programming (Dinners, Kiddush, etc.) |
| **Holidays** | Holiday observances (High Holidays, Sukkot, Passover, etc.) |
| **Education** | Educational programs (Scholar-In-Residence, School Subsidy, etc.) |
| **Operating** | Operational expenses (Rent, Security, Electricity, etc.) |
| **Wishlist** | Desired items (Torah Maintenance, Office Technology, etc.) |

### Seed Items (31 total)

Pre-loaded from seed data. Each has a default pledge amount but custom amounts can be entered.

### Pledge Rules

- A pledge links a **guest** to an **impact board item** with a specific **amount**
- Default amount comes from the item, but can be overridden to any custom amount
- Each pledge is tagged as either:
  - `pre_pledged` - Committed before the event
  - `gala_night` - Committed during the event
- Each pledge is tagged as `isPreImported` (true/false) for export differentiation
- Multiple guests can pledge to the same item
- A guest can have multiple pledges to different items
- Custom impact board items can be created during the event

### Pledge Tracking

- Each impact board item shows: total pledged amount, number of pledges, progress vs default amount
- Items can be filtered by category
- "No Pledges" filter shows items that need attention
- Funded items (pledges >= default amount) shown with green indicator

---

## 8. Auction Management

### Data Model

| Field | Description |
|-------|-------------|
| Title | Name of auction item |
| Description | Detail about the item |
| Estimated Value | Fair market value (optional) |
| Winning Party | The party that won the item |
| Final Bid Amount | Actual winning bid |
| Sold At | Timestamp of when winner was assigned |
| Sold By | User who recorded the sale |
| Is Pre-Imported | Whether this was pre-configured or added at event |

### Rules

- Auction items are pre-loaded from seed data (7 items)
- New items can be added during the event
- Winner assignment records: winning party, final bid amount, timestamp, user
- Winner can be cleared and reassigned if needed
- Auction revenue is the sum of all `finalBidAmount` values
- Revenue counted in "Auction Revenue" in dashboard totals

---

## 9. Dashboard & Analytics

### Real-Time Metrics

| Metric | Calculation |
|--------|-------------|
| **Attendance** | Guests checked in / Total guests |
| **Goal Progress** | Total Raised / Goal Amount (as percentage + thermometer) |
| **Total Raised** | Sum of all revenue sources below |

### Revenue Breakdown

| Source | Type | Description |
|--------|------|-------------|
| Initial Ticket Sales | Pre-loaded | Set in event config |
| Initial Sponsorships | Pre-loaded | Set in event config |
| Initial Pre-Pledges | Pre-loaded | Set in event config |
| Gala Night Donations | Live | Pledges marked as `gala_night` |
| Pre-Pledged Donations | Live | Pledges marked as `pre_pledged` |
| Raffle Revenue | Live | Sum of all raffle sale amounts |
| 50/50 Revenue | Live | Sum of all 50/50 sale amounts |
| Auction Revenue | Live | Sum of all winning auction bid amounts |

**Total Raised** = Sum of all 8 sources above.

### Sponsored Ticket Metrics (Admin)

| Metric | Description |
|--------|-------------|
| Total Sponsored | Sum of all sponsor ticket pools |
| Assigned | Tickets currently assigned to guests |
| Remaining | Total - Assigned |
| Free Tickets | Guests marked as free (outside of pools) |

### Auto-Refresh

- Dashboard stats poll every 10 seconds
- Guest list polls every 15 seconds
- Data refreshes on window focus
- Optimistic updates provide instant feedback for user actions

---

## 10. Data Import (CSV)

### Access

Admin only. Available on Reports page.

### Required CSV Columns

| Column | Required | Description |
|--------|:--------:|-------------|
| `partyName` | Yes | Name of the guest's party/family group |
| `firstName` | Yes | Guest's first name |
| `lastName` | Yes | Guest's last name |
| `email` | No | Guest's email address |
| `phone` | No | Guest's phone number |
| `primaryContact` | No | Whether this is the primary contact for the party |

### Import Rules

- Parties are auto-created if they don't exist (matched by name, case-insensitive)
- If a party already exists, new guests are added to it
- Duplicate party names merge guests into the same party
- File size limit: 10MB
- Missing required fields generate error for that row but don't stop the import
- Import report shows: success count, error count, specific error messages

### Business Rule (Pre-Imported Data)

All data from the initial CSV import is considered **pre-imported** - it represents information already in ShulCloud. Any transactions recorded through the web app after import are considered **new gala-night transactions** and must be separately identifiable in exports.

---

## 11. Data Export (CSV / ShulCloud)

### Export Structure

The CSV export contains three sections designed for ShulCloud reconciliation:

#### Section 1: Guest Summary

Complete guest-level data with pre-imported and new columns side-by-side.

| Column Group | Columns |
|-------------|---------|
| Identity | Party Name, Sponsorship Tier, First/Last Name, Email, Phone |
| Status | Ticket Type, Checked In, Check-in Time, Walk-in, Plus One |
| Pre-Import (already in ShulCloud) | Raffle Tickets, Raffle $, 50/50 Tickets, 50/50 $, Pledges $ |
| **NEW** (add to ShulCloud) | Raffle Tickets, Raffle $, 50/50 Tickets, 50/50 $, Pledges $, Pledge Details |
| Totals | Total Raffle, Total 50/50, Total Pledges |

#### Section 2: New Gala-Night Charges

Flattened, one-row-per-charge format for easy ShulCloud data entry:

| Column | Description |
|--------|-------------|
| Party Name | Family group |
| First Name | Guest first name |
| Last Name | Guest last name |
| Charge Type | "Raffle Tickets", "50/50 Tickets", or "Pledge: [Item Name]" |
| Quantity | Number of tickets or 1 for pledges |
| Amount | Dollar amount to charge |

**Only guests with new (non-pre-imported) charges appear in this section.**

#### Section 3: Auction Results

| Column | Description |
|--------|-------------|
| Auction Item | Item title |
| Description | Item description |
| Estimated Value | Fair market value |
| Winning Party | Winner's party name |
| Final Bid | Winning bid amount |
| Pre-Imported | Whether auction was pre-configured |
| Sold At | Timestamp |

---

## 12. Pre-Imported vs Gala-Night Transactions

### The Core Distinction

| Classification | Meaning | In ShulCloud? |
|---------------|---------|:-------------:|
| **Pre-Imported** | Existed before the event (came via CSV or pre-setup) | Already entered |
| **Gala-Night** | Created during the event through the web app | **Needs to be added** |

### How It Works

Every transaction (pledge, raffle sale, 50/50 sale, auction result) has an `isPreImported` boolean flag:

- `isPreImported = true`: This data was part of the initial import or pre-configured. It is already in ShulCloud and should **not** be double-entered.
- `isPreImported = false` (default): This is a new gala-night transaction. Staff need to add it to ShulCloud after the event.

### Export Behavior

- The **Guest Summary** section shows both pre-imported and new amounts in separate columns so staff can verify totals match
- The **New Gala-Night Charges** section contains ONLY non-pre-imported transactions, formatted as individual line items for easy ShulCloud entry

---

## 13. Offline-First & Sync

### Architecture

- All data cached locally in IndexedDB (via Dexie.js)
- Operations queued when offline
- Automatic sync when connection restores
- Visual indicator shows online/offline status

### Sync Rules

- Failed sync operations retry up to 3 times
- Permanently failed operations are logged for manual review
- Background sync runs every 30 seconds when online
- Coming back online triggers an immediate sync

---

## 14. Security & Audit

### Security Measures

| Protection | Implementation |
|-----------|----------------|
| Password hashing | bcrypt with 12 salt rounds |
| Session management | JWT tokens, 8-hour expiry |
| Route protection | NextAuth middleware on all dashboard routes |
| Role enforcement | Server-side RBAC on every tRPC procedure |
| Rate limiting | 100 requests/minute per IP on tRPC endpoints |
| Input validation | Zod schemas on all inputs |
| SQL injection | Prevented via Drizzle ORM parameterized queries |
| XSS | Prevented via React auto-escaping |
| Security headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy |

### Audit Logging

- Every mutation (create, update, delete) is logged to the audit table
- Logged fields: user ID, action name, entity type, timestamp
- Viewable by admins in Settings > Audit Log tab
- Useful for: troubleshooting, accountability, post-event review
