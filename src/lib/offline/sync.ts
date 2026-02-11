"use client";

import { getLocalDb, type LocalOperation } from "./db";
import {
  getPendingOperations,
  markOperationComplete,
  markOperationFailed,
} from "./queue";

class SyncManager {
  private isProcessing = false;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) return;
    this.isProcessing = true;

    try {
      const operations = await getPendingOperations();

      for (const op of operations) {
        try {
          await this.executeOperation(op);
          if (op.id) {
            await markOperationComplete(op.id);
          }
        } catch (error) {
          console.error("Sync operation failed:", op, error);
          if (op.id) {
            await markOperationFailed(op.id, op.retries);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      this.notify();
    }
  }

  private async executeOperation(op: LocalOperation): Promise<void> {
    const payload = JSON.parse(op.payload);
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL || "";

    // Map operations to API calls
    const response = await fetch(`${baseUrl}/api/trpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.buildTRPCBatch(op, payload)),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }

  private buildTRPCBatch(op: LocalOperation, payload: Record<string, unknown>) {
    const routeMap: Record<string, Record<string, string>> = {
      guest: {
        create: "guests.create",
        update: "guests.update",
        delete: "guests.update",
      },
      pledge: {
        create: "pledges.create",
        update: "pledges.update",
        delete: "pledges.delete",
      },
      auction: {
        create: "auction.create",
        update: "auction.assignWinner",
      },
      raffle: {
        create: "raffle.recordRaffleSale",
      },
      fiftyFifty: {
        create: "raffle.recordFiftyFiftySale",
      },
    };

    const route = routeMap[op.entity]?.[op.type];
    if (!route) {
      throw new Error(`Unknown operation: ${op.entity}.${op.type}`);
    }

    return {
      0: {
        json: payload,
      },
    };
  }

  async syncGuestsToLocal(
    guests: Array<{
      id: string;
      partyId: string;
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
      isCheckedIn: boolean;
      checkedInAt?: Date | string | null;
      raffleQuantity: number;
      fiftyFiftyQuantity: number;
      isWalkIn: boolean;
      isPlusOne: boolean;
    }>
  ): Promise<void> {
    const db = getLocalDb();
    await db.guests.clear();
    await db.guests.bulkPut(
      guests.map((g) => ({
        id: g.id,
        partyId: g.partyId,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email || undefined,
        phone: g.phone || undefined,
        isCheckedIn: g.isCheckedIn,
        checkedInAt: g.checkedInAt?.toString(),
        raffleQuantity: g.raffleQuantity,
        fiftyFiftyQuantity: g.fiftyFiftyQuantity,
        isWalkIn: g.isWalkIn,
        isPlusOne: g.isPlusOne,
        _synced: true,
        _localUpdatedAt: new Date().toISOString(),
      }))
    );
  }

  async getLocalGuests() {
    const db = getLocalDb();
    return db.guests.toArray();
  }

  async updateLocalGuest(
    id: string,
    updates: Partial<{ isCheckedIn: boolean }>
  ): Promise<void> {
    const db = getLocalDb();
    await db.guests.update(id, {
      ...updates,
      _synced: false,
      _localUpdatedAt: new Date().toISOString(),
    });
  }
}

let syncManagerInstance: SyncManager | null = null;

export function getSyncManager(): SyncManager {
  if (!syncManagerInstance) {
    syncManagerInstance = new SyncManager();
  }
  return syncManagerInstance;
}
