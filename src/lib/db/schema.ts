import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRole = pgEnum("user_role", ["admin", "volunteer"]);
export const donationType = pgEnum("donation_type", [
  "pre_pledged",
  "gala_night",
]);
export const impactCategory = pgEnum("impact_category", [
  "shabbat",
  "holidays",
  "education",
  "operating",
  "wishlist",
]);

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    role: userRole("role").notNull().default("volunteer"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  })
);

// Events table
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  eventDate: timestamp("event_date").notNull(),
  goalAmount: decimal("goal_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  initialTicketSales: decimal("initial_ticket_sales", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  initialSponsorships: decimal("initial_sponsorships", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  initialPrePledges: decimal("initial_pre_pledges", {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Parties table
export const parties = pgTable(
  "parties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    partyName: varchar("party_name", { length: 255 }).notNull(),
    primaryContactName: varchar("primary_contact_name", { length: 255 }),
    primaryContactEmail: varchar("primary_contact_email", { length: 255 }),
    primaryContactPhone: varchar("primary_contact_phone", { length: 50 }),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    eventIdx: index("parties_event_idx").on(table.eventId),
  })
);

// Guests table
export const guests = pgTable(
  "guests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partyId: uuid("party_id")
      .notNull()
      .references(() => parties.id, { onDelete: "cascade" }),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }),
    phone: varchar("phone", { length: 50 }),
    isCheckedIn: boolean("is_checked_in").notNull().default(false),
    checkedInAt: timestamp("checked_in_at"),
    checkedInBy: uuid("checked_in_by").references(() => users.id),
    raffleQuantity: integer("raffle_quantity").notNull().default(0),
    fiftyFiftyQuantity: integer("fifty_fifty_quantity").notNull().default(0),
    isWalkIn: boolean("is_walk_in").notNull().default(false),
    isPlusOne: boolean("is_plus_one").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    partyIdx: index("guests_party_idx").on(table.partyId),
    nameIdx: index("guests_name_idx").on(table.firstName, table.lastName),
    checkedInIdx: index("guests_checked_in_idx").on(table.isCheckedIn),
  })
);

// Impact board items table
export const impactBoardItems = pgTable(
  "impact_board_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    category: impactCategory("category").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    defaultAmount: decimal("default_amount", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    isCustom: boolean("is_custom").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    eventCategoryIdx: index("impact_board_event_category_idx").on(
      table.eventId,
      table.category
    ),
  })
);

// Pledges table
export const pledges = pgTable(
  "pledges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    impactBoardItemId: uuid("impact_board_item_id")
      .notNull()
      .references(() => impactBoardItems.id, { onDelete: "cascade" }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    donationType: donationType("donation_type").notNull(),
    pledgedAt: timestamp("pledged_at").notNull().defaultNow(),
    pledgedBy: uuid("pledged_by")
      .notNull()
      .references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    guestIdx: index("pledges_guest_idx").on(table.guestId),
    impactItemIdx: index("pledges_impact_item_idx").on(table.impactBoardItemId),
    donationTypeIdx: index("pledges_donation_type_idx").on(table.donationType),
  })
);

// Auction items table
export const auctionItems = pgTable(
  "auction_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
    winningPartyId: uuid("winning_party_id").references(() => parties.id),
    finalBidAmount: decimal("final_bid_amount", { precision: 12, scale: 2 }),
    soldAt: timestamp("sold_at"),
    soldBy: uuid("sold_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    eventIdx: index("auction_items_event_idx").on(table.eventId),
  })
);

// Raffle sales table
export const raffleSales = pgTable(
  "raffle_sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    pricePerTicket: decimal("price_per_ticket", { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    soldAt: timestamp("sold_at").notNull().defaultNow(),
    soldBy: uuid("sold_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    guestIdx: index("raffle_sales_guest_idx").on(table.guestId),
  })
);

// 50/50 sales table
export const fiftyFiftySales = pgTable(
  "fifty_fifty_sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guests.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    pricePerTicket: decimal("price_per_ticket", { precision: 12, scale: 2 }).notNull(),
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    soldAt: timestamp("sold_at").notNull().defaultNow(),
    soldBy: uuid("sold_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    guestIdx: index("fifty_fifty_sales_guest_idx").on(table.guestId),
  })
);

// Audit log table
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),
    oldValues: text("old_values"),
    newValues: text("new_values"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("audit_log_user_idx").on(table.userId),
    entityIdx: index("audit_log_entity_idx").on(
      table.entityType,
      table.entityId
    ),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  })
);

// Sync queue table (for offline-first)
export const syncQueue = pgTable(
  "sync_queue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    operation: varchar("operation", { length: 50 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),
    payload: text("payload").notNull(),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
  },
  (table) => ({
    statusIdx: index("sync_queue_status_idx").on(table.status),
    userIdx: index("sync_queue_user_idx").on(table.userId),
  })
);

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ many }) => ({
  auditLogs: many(auditLog),
  pledges: many(pledges),
  raffleSales: many(raffleSales),
  fiftyFiftySales: many(fiftyFiftySales),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  parties: many(parties),
  impactBoardItems: many(impactBoardItems),
  auctionItems: many(auctionItems),
}));

export const partiesRelations = relations(parties, ({ one, many }) => ({
  event: one(events, {
    fields: [parties.eventId],
    references: [events.id],
  }),
  guests: many(guests),
  wonAuctionItems: many(auctionItems),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  party: one(parties, {
    fields: [guests.partyId],
    references: [parties.id],
  }),
  checkedInByUser: one(users, {
    fields: [guests.checkedInBy],
    references: [users.id],
  }),
  pledges: many(pledges),
  raffleSales: many(raffleSales),
  fiftyFiftySales: many(fiftyFiftySales),
}));

export const impactBoardItemsRelations = relations(
  impactBoardItems,
  ({ one, many }) => ({
    event: one(events, {
      fields: [impactBoardItems.eventId],
      references: [events.id],
    }),
    pledges: many(pledges),
  })
);

export const pledgesRelations = relations(pledges, ({ one }) => ({
  guest: one(guests, {
    fields: [pledges.guestId],
    references: [guests.id],
  }),
  impactBoardItem: one(impactBoardItems, {
    fields: [pledges.impactBoardItemId],
    references: [impactBoardItems.id],
  }),
  pledgedByUser: one(users, {
    fields: [pledges.pledgedBy],
    references: [users.id],
  }),
}));

export const auctionItemsRelations = relations(auctionItems, ({ one }) => ({
  event: one(events, {
    fields: [auctionItems.eventId],
    references: [events.id],
  }),
  winningParty: one(parties, {
    fields: [auctionItems.winningPartyId],
    references: [parties.id],
  }),
  soldByUser: one(users, {
    fields: [auctionItems.soldBy],
    references: [users.id],
  }),
}));

export const raffleSalesRelations = relations(raffleSales, ({ one }) => ({
  guest: one(guests, {
    fields: [raffleSales.guestId],
    references: [guests.id],
  }),
  soldByUser: one(users, {
    fields: [raffleSales.soldBy],
    references: [users.id],
  }),
}));

export const fiftyFiftySalesRelations = relations(
  fiftyFiftySales,
  ({ one }) => ({
    guest: one(guests, {
      fields: [fiftyFiftySales.guestId],
      references: [guests.id],
    }),
    soldByUser: one(users, {
      fields: [fiftyFiftySales.soldBy],
      references: [users.id],
    }),
  })
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

export const syncQueueRelations = relations(syncQueue, ({ one }) => ({
  user: one(users, {
    fields: [syncQueue.userId],
    references: [users.id],
  }),
}));
