export const RAFFLE_PRICE = parseFloat(
  process.env.NEXT_PUBLIC_RAFFLE_PRICE || "10.00"
);
export const FIFTY_FIFTY_PRICE = parseFloat(
  process.env.NEXT_PUBLIC_FIFTY_FIFTY_PRICE || "25.00"
);
export const FIFTY_FIFTY_BUNDLE_QTY = 5;
export const FIFTY_FIFTY_BUNDLE_PRICE = 100.0;

export const IMPACT_CATEGORIES = [
  { value: "shabbat", label: "Shabbat" },
  { value: "holidays", label: "Holidays" },
  { value: "education", label: "Education" },
  { value: "operating", label: "Operating" },
  { value: "wishlist", label: "Wishlist" },
] as const;

export const DONATION_TYPES = [
  { value: "pre_pledged", label: "Pre-Pledged" },
  { value: "gala_night", label: "Gala Night" },
] as const;

export const USER_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "volunteer", label: "Volunteer" },
] as const;

export const SPONSORSHIP_TIERS = [
  { value: "builders", label: "Builders", amount: 1800, tickets: 10, adType: "Full-page ad" },
  { value: "framers", label: "Framers", amount: 1200, tickets: 6, adType: "Full-page ad" },
  { value: "foundation", label: "Foundation", amount: 540, tickets: 2, adType: "Full-page ad" },
  { value: "bar", label: "Bar", amount: 500, tickets: 0, adType: null },
  { value: "entertainment", label: "Entertainment", amount: 500, tickets: 0, adType: null },
  { value: "security", label: "Security", amount: 360, tickets: 0, adType: null },
  { value: "none", label: "None", amount: 0, tickets: 0, adType: null },
] as const;

export const TICKET_TYPES = [
  { value: "paid", label: "Paid Ticket" },
  { value: "sponsored", label: "Sponsored Ticket" },
  { value: "free", label: "Free Ticket" },
] as const;

export const SESSION_TIMEOUT_HOURS = 8;
export const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10MB
export const RATE_LIMIT_REQUESTS = 100;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
