import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  users,
  events,
  parties,
  guests,
  impactBoardItems,
  pledges,
  auctionItems,
  raffleSales,
  fiftyFiftySales,
  auditLog,
} from "@/lib/db/schema";

// Select types (read from DB)
export type User = InferSelectModel<typeof users>;
export type Event = InferSelectModel<typeof events>;
export type Party = InferSelectModel<typeof parties>;
export type Guest = InferSelectModel<typeof guests>;
export type ImpactBoardItem = InferSelectModel<typeof impactBoardItems>;
export type Pledge = InferSelectModel<typeof pledges>;
export type AuctionItem = InferSelectModel<typeof auctionItems>;
export type RaffleSale = InferSelectModel<typeof raffleSales>;
export type FiftyFiftySale = InferSelectModel<typeof fiftyFiftySales>;
export type AuditLogEntry = InferSelectModel<typeof auditLog>;

// Insert types (write to DB)
export type NewUser = InferInsertModel<typeof users>;
export type NewEvent = InferInsertModel<typeof events>;
export type NewParty = InferInsertModel<typeof parties>;
export type NewGuest = InferInsertModel<typeof guests>;
export type NewImpactBoardItem = InferInsertModel<typeof impactBoardItems>;
export type NewPledge = InferInsertModel<typeof pledges>;
export type NewAuctionItem = InferInsertModel<typeof auctionItems>;
export type NewRaffleSale = InferInsertModel<typeof raffleSales>;
export type NewFiftyFiftySale = InferInsertModel<typeof fiftyFiftySales>;

// Extended types with relations
export type GuestWithParty = Guest & {
  party: Party;
};

export type GuestWithDetails = Guest & {
  party: Party;
  pledges: PledgeWithItem[];
  raffleSales: RaffleSale[];
  fiftyFiftySales: FiftyFiftySale[];
};

export type PledgeWithItem = Pledge & {
  impactBoardItem: ImpactBoardItem;
};

export type PledgeWithGuest = Pledge & {
  guest: Guest;
};

export type ImpactBoardItemWithPledges = ImpactBoardItem & {
  pledges: PledgeWithGuest[];
  totalPledged: number;
  pledgeCount: number;
};

export type AuctionItemWithWinner = AuctionItem & {
  winningParty?: Party | null;
};

export type PartyWithGuests = Party & {
  guests: Guest[];
};

// Dashboard stats
export interface DashboardStats {
  totalGuests: number;
  checkedInGuests: number;
  goalAmount: number;
  initialTicketSales: number;
  initialSponsorships: number;
  initialPrePledges: number;
  galaNightDonations: number;
  prePledgedDonations: number;
  raffleRevenue: number;
  fiftyFiftyRevenue: number;
  auctionRevenue: number;
  totalRaised: number;
}

// Impact category type
export type ImpactCategory =
  | "shabbat"
  | "holidays"
  | "education"
  | "operating"
  | "wishlist";

export type DonationTypeValue = "pre_pledged" | "gala_night";
export type UserRole = "admin" | "volunteer";
