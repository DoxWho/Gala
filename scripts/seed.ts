import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/gala";
const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql, { schema });

async function seed() {
  console.log("Seeding database...");

  // Create default admin user
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: "admin@gala.local",
      passwordHash,
      name: "System Administrator",
      role: "admin",
    })
    .returning();
  console.log("Created admin user:", adminUser.email);

  // Create default event
  const [event] = await db
    .insert(schema.events)
    .values({
      name: "Annual Gala 2026",
      eventDate: new Date("2026-03-15T18:00:00Z"),
      goalAmount: "100000.00",
      initialTicketSales: "25000.00",
      initialSponsorships: "15000.00",
      initialPrePledges: "10000.00",
      isActive: true,
    })
    .returning();
  console.log("Created event:", event.name);

  // Seed Impact Board Items
  const impactItems = [
    // Shabbat
    { category: "shabbat" as const, title: "Shabbat Dinners", defaultAmount: "500.00", sortOrder: 1 },
    { category: "shabbat" as const, title: "Babysitting", defaultAmount: "360.00", sortOrder: 2 },
    { category: "shabbat" as const, title: "Kiddush Help", defaultAmount: "360.00", sortOrder: 3 },
    { category: "shabbat" as const, title: "Kiddush", defaultAmount: "270.00", sortOrder: 4 },
    { category: "shabbat" as const, title: "Lunch and Learn", defaultAmount: "270.00", sortOrder: 5 },
    { category: "shabbat" as const, title: "Musical Shabbat", defaultAmount: "250.00", sortOrder: 6 },
    { category: "shabbat" as const, title: "Shabbat Bar", defaultAmount: "100.00", sortOrder: 7 },
    // Holidays
    { category: "holidays" as const, title: "High Holidays", defaultAmount: "1500.00", sortOrder: 1 },
    { category: "holidays" as const, title: "Sukkot", defaultAmount: "540.00", sortOrder: 2 },
    { category: "holidays" as const, title: "Simchat Torah", defaultAmount: "540.00", sortOrder: 3 },
    { category: "holidays" as const, title: "Passover", defaultAmount: "540.00", sortOrder: 4 },
    { category: "holidays" as const, title: "Shavuot", defaultAmount: "540.00", sortOrder: 5 },
    { category: "holidays" as const, title: "Chanukah", defaultAmount: "360.00", sortOrder: 6 },
    { category: "holidays" as const, title: "Purim", defaultAmount: "360.00", sortOrder: 7 },
    { category: "holidays" as const, title: "Tu Bishvat", defaultAmount: "180.00", sortOrder: 8 },
    // Education
    { category: "education" as const, title: "Scholar-In-Residence", defaultAmount: "2000.00", sortOrder: 1 },
    { category: "education" as const, title: "Religious School Subsidy", defaultAmount: "1000.00", sortOrder: 2 },
    { category: "education" as const, title: "Social Justice Initiative", defaultAmount: "500.00", sortOrder: 3 },
    { category: "education" as const, title: "Youth Group", defaultAmount: "500.00", sortOrder: 4 },
    { category: "education" as const, title: "Adult Education Series", defaultAmount: "500.00", sortOrder: 5 },
    // Operating
    { category: "operating" as const, title: "Rent", defaultAmount: "14500.00", sortOrder: 1 },
    { category: "operating" as const, title: "Security", defaultAmount: "3600.00", sortOrder: 2 },
    { category: "operating" as const, title: "Electricity", defaultAmount: "1000.00", sortOrder: 3 },
    { category: "operating" as const, title: "Kesef Accounting Services", defaultAmount: "360.00", sortOrder: 4 },
    { category: "operating" as const, title: "Phone/Internet", defaultAmount: "250.00", sortOrder: 5 },
    { category: "operating" as const, title: "Paper Goods", defaultAmount: "100.00", sortOrder: 6 },
    // Wishlist
    { category: "wishlist" as const, title: "Text Messaging Annual Communications", defaultAmount: "1000.00", sortOrder: 1 },
    { category: "wishlist" as const, title: "Office Technology", defaultAmount: "750.00", sortOrder: 2 },
    { category: "wishlist" as const, title: "Torah Maintenance", defaultAmount: "500.00", sortOrder: 3 },
    { category: "wishlist" as const, title: "Synagogue Beautification", defaultAmount: "500.00", sortOrder: 4 },
    { category: "wishlist" as const, title: "Weekday Lev Shalom Siddur (Set of 10)", defaultAmount: "350.00", sortOrder: 5 },
    { category: "wishlist" as const, title: "Babysitting for Events", defaultAmount: "250.00", sortOrder: 6 },
  ];

  for (const item of impactItems) {
    await db.insert(schema.impactBoardItems).values({
      eventId: event.id,
      ...item,
    });
  }
  console.log(`Created ${impactItems.length} impact board items`);

  // Seed Auction Items
  const auctionItemsList = [
    { title: "Disney 1 Day Park Hopper Tickets (x2)", description: "2 tickets for 1-day park hopper at Disney" },
    { title: "Professional Portrait Photography Session", description: "Professional photography session" },
    { title: "Jess Frank Golf Academy Lesson", description: "Golf lesson with Jess Frank" },
    { title: "Bronze & Marble Statue", description: "Decorative bronze and marble statue" },
    { title: "Bronze & Marble Statue (2)", description: "Decorative bronze and marble statue" },
    { title: "Unframed Art - TBD", description: "Art piece to be determined" },
    { title: "Howl at the Moon Gift Card", description: "Gift card for Howl at the Moon" },
  ];

  for (const item of auctionItemsList) {
    await db.insert(schema.auctionItems).values({
      eventId: event.id,
      ...item,
    });
  }
  console.log(`Created ${auctionItemsList.length} auction items`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
