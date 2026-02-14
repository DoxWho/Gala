import Dexie, { type Table } from "dexie";

export interface LocalGuest {
  id: string;
  partyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  isCheckedIn: boolean;
  checkedInAt?: string;
  raffleQuantity: number;
  fiftyFiftyQuantity: number;
  isWalkIn: boolean;
  isPlusOne: boolean;
  _synced: boolean;
  _localUpdatedAt: string;
}

export interface LocalParty {
  id: string;
  eventId: string;
  partyName: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  _synced: boolean;
  _localUpdatedAt: string;
}

export interface LocalPledge {
  id: string;
  guestId: string;
  impactBoardItemId: string;
  amount: number;
  donationType: "pre_pledged" | "gala_night";
  notes?: string;
  _synced: boolean;
  _localUpdatedAt: string;
}

export interface LocalImpactBoardItem {
  id: string;
  eventId: string;
  category: string;
  title: string;
  defaultAmount: number;
  description?: string;
  isCustom: boolean;
  sortOrder: number;
}

export interface LocalAuctionItem {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  estimatedValue?: number;
  winningPartyId?: string;
  finalBidAmount?: number;
  _synced: boolean;
  _localUpdatedAt: string;
}

export interface LocalOperation {
  id?: number;
  type: "create" | "update" | "delete";
  entity: "guest" | "pledge" | "auction" | "raffle" | "fiftyFifty" | "party";
  entityId: string;
  payload: string; // JSON
  timestamp: string;
  retries: number;
  status: "pending" | "processing" | "completed" | "failed";
}

class GalaDB extends Dexie {
  guests!: Table<LocalGuest>;
  parties!: Table<LocalParty>;
  pledges!: Table<LocalPledge>;
  impactBoardItems!: Table<LocalImpactBoardItem>;
  auctionItems!: Table<LocalAuctionItem>;
  operations!: Table<LocalOperation>;

  constructor() {
    super("GalaEventDB");
    this.version(1).stores({
      guests: "id, partyId, isCheckedIn, _synced",
      parties: "id, eventId",
      pledges: "id, guestId, impactBoardItemId",
      impactBoardItems: "id, eventId, category",
      auctionItems: "id, eventId",
      operations: "++id, timestamp, type, entity, status",
    });
  }
}

// Only create DB instance on the client
let localDb: GalaDB | null = null;

export function getLocalDb(): GalaDB {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!localDb) {
    localDb = new GalaDB();
  }
  return localDb;
}

export type { GalaDB };
