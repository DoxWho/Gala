import Papa from "papaparse";
import { db } from "@/lib/db";
import { guests, parties, pledges, impactBoardItems, raffleSales, fiftyFiftySales, auctionItems } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function exportEventData(eventId: string): Promise<string> {
  // Fetch all guests with their related data
  const guestsData = await db.query.parties.findMany({
    where: eq(parties.eventId, eventId),
    with: {
      guests: {
        with: {
          pledges: {
            with: {
              impactBoardItem: true,
            },
          },
          raffleSales: true,
          fiftyFiftySales: true,
        },
      },
    },
  });

  // Flatten for CSV
  const rows: Record<string, unknown>[] = [];

  for (const party of guestsData) {
    for (const guest of party.guests) {
      const totalPledges = guest.pledges.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );

      const totalRaffle = guest.raffleSales.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );

      const totalFiftyFifty = guest.fiftyFiftySales.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );

      const pledgeDetails = guest.pledges
        .map(
          (p) =>
            `${p.impactBoardItem.title}: $${parseFloat(p.amount).toFixed(2)} (${p.donationType})`
        )
        .join("; ");

      rows.push({
        "Party Name": party.partyName,
        "First Name": guest.firstName,
        "Last Name": guest.lastName,
        Email: guest.email || "",
        Phone: guest.phone || "",
        "Checked In": guest.isCheckedIn ? "Yes" : "No",
        "Check-in Time": guest.checkedInAt
          ? new Date(guest.checkedInAt).toLocaleString()
          : "",
        "Walk-in": guest.isWalkIn ? "Yes" : "No",
        "Plus One": guest.isPlusOne ? "Yes" : "No",
        "Raffle Tickets": guest.raffleQuantity,
        "Raffle Total": `$${totalRaffle.toFixed(2)}`,
        "50/50 Tickets": guest.fiftyFiftyQuantity,
        "50/50 Total": `$${totalFiftyFifty.toFixed(2)}`,
        "Total Pledges": `$${totalPledges.toFixed(2)}`,
        "Pledge Details": pledgeDetails,
      });
    }
  }

  // Also add auction results
  const auctionData = await db.query.auctionItems.findMany({
    where: eq(auctionItems.eventId, eventId),
    with: {
      winningParty: true,
    },
  });

  // Generate guests CSV
  const guestsCsv = Papa.unparse(rows);

  // Generate auction CSV
  const auctionRows = auctionData.map((item) => ({
    "Auction Item": item.title,
    Description: item.description || "",
    "Estimated Value": item.estimatedValue
      ? `$${parseFloat(item.estimatedValue).toFixed(2)}`
      : "",
    "Winning Party": item.winningParty?.partyName || "Not Sold",
    "Final Bid": item.finalBidAmount
      ? `$${parseFloat(item.finalBidAmount).toFixed(2)}`
      : "",
    "Sold At": item.soldAt
      ? new Date(item.soldAt).toLocaleString()
      : "",
  }));

  const auctionCsv = Papa.unparse(auctionRows);

  return `GUEST DATA\n${guestsCsv}\n\n\nAUCTION DATA\n${auctionCsv}`;
}
