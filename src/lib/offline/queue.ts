"use client";

import { getLocalDb, type LocalOperation } from "./db";

export async function enqueueOperation(
  type: LocalOperation["type"],
  entity: LocalOperation["entity"],
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const db = getLocalDb();
  await db.operations.add({
    type,
    entity,
    entityId,
    payload: JSON.stringify(payload),
    timestamp: new Date().toISOString(),
    retries: 0,
    status: "pending",
  });
}

export async function getPendingOperations(): Promise<LocalOperation[]> {
  const db = getLocalDb();
  return db.operations.where("status").equals("pending").sortBy("timestamp");
}

export async function markOperationComplete(id: number): Promise<void> {
  const db = getLocalDb();
  await db.operations.delete(id);
}

export async function markOperationFailed(
  id: number,
  retries: number
): Promise<void> {
  const db = getLocalDb();
  if (retries >= 3) {
    await db.operations.update(id, { status: "failed", retries });
  } else {
    await db.operations.update(id, { retries: retries + 1 });
  }
}

export async function clearCompletedOperations(): Promise<void> {
  const db = getLocalDb();
  await db.operations.where("status").equals("completed").delete();
}

export async function getPendingCount(): Promise<number> {
  const db = getLocalDb();
  return db.operations.where("status").equals("pending").count();
}
