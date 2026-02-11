import Papa from "papaparse";
import { db } from "@/lib/db";
import { parties, guests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface GuestCSVRow {
  partyName?: string;
  party_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  primaryContact?: string;
  primary_contact?: string;
}

function normalizeRow(row: GuestCSVRow) {
  return {
    partyName: row.partyName || row.party_name || "",
    firstName: row.firstName || row.first_name || "",
    lastName: row.lastName || row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    primaryContact: row.primaryContact || row.primary_contact || "",
  };
}

export async function importGuestsFromCSV(
  csvText: string,
  eventId: string
): Promise<{
  success: boolean;
  importedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let importedCount = 0;

  return new Promise((resolve) => {
    Papa.parse<GuestCSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: async (results) => {
        const partyMap = new Map<string, string>();

        // First, load existing parties for this event
        const existingParties = await db
          .select()
          .from(parties)
          .where(eq(parties.eventId, eventId));

        for (const p of existingParties) {
          partyMap.set(p.partyName.toLowerCase(), p.id);
        }

        for (const [index, rawRow] of results.data.entries()) {
          try {
            const row = normalizeRow(rawRow);

            if (!row.partyName || !row.firstName || !row.lastName) {
              errors.push(
                `Row ${index + 2}: Missing required fields (partyName, firstName, lastName)`
              );
              continue;
            }

            // Get or create party
            let partyId = partyMap.get(row.partyName.toLowerCase());
            if (!partyId) {
              const [party] = await db
                .insert(parties)
                .values({
                  eventId,
                  partyName: row.partyName,
                  primaryContactName: row.primaryContact || null,
                })
                .returning();
              partyId = party.id;
              partyMap.set(row.partyName.toLowerCase(), partyId);
            }

            // Create guest
            await db.insert(guests).values({
              partyId,
              firstName: row.firstName.trim(),
              lastName: row.lastName.trim(),
              email: row.email?.trim() || null,
              phone: row.phone?.trim() || null,
            });

            importedCount++;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : "Unknown error";
            errors.push(`Row ${index + 2}: ${message}`);
          }
        }

        resolve({
          success: errors.length === 0,
          importedCount,
          errors,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          importedCount: 0,
          errors: [error.message],
        });
      },
    });
  });
}
