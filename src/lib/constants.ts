export const RAFFLE_PRICE = parseFloat(
  process.env.NEXT_PUBLIC_RAFFLE_PRICE || "10.00"
);
export const FIFTY_FIFTY_PRICE = parseFloat(
  process.env.NEXT_PUBLIC_FIFTY_FIFTY_PRICE || "10.00"
);

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

export const SESSION_TIMEOUT_HOURS = 8;
export const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10MB
export const RATE_LIMIT_REQUESTS = 100;
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
