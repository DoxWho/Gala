import Papa from "papaparse";
import { db } from "@/lib/db";
import { parties, auctionItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

  // ===== SHEET 1: Guest Summary =====
  const guestRows: Record<string, unknown>[] = [];

  for (const party of guestsData) {
    for (const guest of party.guests) {
      const prePledges = guest.pledges.filter((p) => p.isPreImported);
      const galaPledges = guest.pledges.filter((p) => !p.isPreImported);
      const preRaffle = guest.raffleSales.filter((s) => s.isPreImported);
      const galaRaffle = guest.raffleSales.filter((s) => !s.isPreImported);
      const preFiftyFifty = guest.fiftyFiftySales.filter(
        (s) => s.isPreImported
      );
      const galaFiftyFifty = guest.fiftyFiftySales.filter(
        (s) => !s.isPreImported
      );

      const prePledgeTotal = prePledges.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );
      const galaPledgeTotal = galaPledges.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );
      const preRaffleTotal = preRaffle.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );
      const galaRaffleTotal = galaRaffle.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );
      const preFiftyFiftyTotal = preFiftyFifty.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );
      const galaFiftyFiftyTotal = galaFiftyFifty.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );

      const galaPledgeDetails = galaPledges
        .map(
          (p) =>
            `${p.impactBoardItem.title}: $${parseFloat(p.amount).toFixed(2)} (${p.donationType})`
        )
        .join("; ");

      guestRows.push({
        "Party Name": party.partyName,
        "Sponsorship Tier":
          party.sponsorshipTier === "none" ? "" : party.sponsorshipTier,
        "First Name": guest.firstName,
        "Last Name": guest.lastName,
        Email: guest.email || "",
        Phone: guest.phone || "",
        "Ticket Type": guest.ticketType,
        "Checked In": guest.isCheckedIn ? "Yes" : "No",
        "Check-in Time": guest.checkedInAt
          ? new Date(guest.checkedInAt).toLocaleString()
          : "",
        "Walk-in": guest.isWalkIn ? "Yes" : "No",
        "Plus One": guest.isPlusOne ? "Yes" : "No",
        // Pre-imported (already in ShulCloud)
        "Pre-Import: Raffle Tickets": preRaffle.reduce(
          (s, r) => s + r.quantity,
          0
        ),
        "Pre-Import: Raffle $": preRaffleTotal > 0 ? preRaffleTotal.toFixed(2) : "",
        "Pre-Import: 50/50 Tickets": preFiftyFifty.reduce(
          (s, r) => s + r.quantity,
          0
        ),
        "Pre-Import: 50/50 $":
          preFiftyFiftyTotal > 0 ? preFiftyFiftyTotal.toFixed(2) : "",
        "Pre-Import: Pledges $":
          prePledgeTotal > 0 ? prePledgeTotal.toFixed(2) : "",
        // NEW gala-night transactions (need to be added to ShulCloud)
        "NEW: Raffle Tickets": galaRaffle.reduce(
          (s, r) => s + r.quantity,
          0
        ),
        "NEW: Raffle $": galaRaffleTotal > 0 ? galaRaffleTotal.toFixed(2) : "",
        "NEW: 50/50 Tickets": galaFiftyFifty.reduce(
          (s, r) => s + r.quantity,
          0
        ),
        "NEW: 50/50 $":
          galaFiftyFiftyTotal > 0 ? galaFiftyFiftyTotal.toFixed(2) : "",
        "NEW: Pledges $":
          galaPledgeTotal > 0 ? galaPledgeTotal.toFixed(2) : "",
        "NEW: Pledge Details": galaPledgeDetails,
        // Grand totals
        "TOTAL Raffle Tickets": guest.raffleQuantity,
        "TOTAL 50/50 Tickets": guest.fiftyFiftyQuantity,
        "TOTAL Pledges $": (prePledgeTotal + galaPledgeTotal).toFixed(2),
      });
    }
  }

  // ===== SHEET 2: New Gala-Night Charges (for ShulCloud billing) =====
  const newChargesRows: Record<string, unknown>[] = [];

  for (const party of guestsData) {
    for (const guest of party.guests) {
      const galaRaffle = guest.raffleSales.filter((s) => !s.isPreImported);
      const galaFiftyFifty = guest.fiftyFiftySales.filter(
        (s) => !s.isPreImported
      );
      const galaPledges = guest.pledges.filter((p) => !p.isPreImported);

      const hasNewCharges =
        galaRaffle.length > 0 ||
        galaFiftyFifty.length > 0 ||
        galaPledges.length > 0;

      if (!hasNewCharges) continue;

      const galaRaffleTotal = galaRaffle.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );
      const galaFiftyFiftyTotal = galaFiftyFifty.reduce(
        (sum, s) => sum + parseFloat(s.totalAmount),
        0
      );

      // One row per charge type for easy ShulCloud entry
      if (galaRaffleTotal > 0) {
        newChargesRows.push({
          "Party Name": party.partyName,
          "First Name": guest.firstName,
          "Last Name": guest.lastName,
          "Charge Type": "Raffle Tickets",
          Quantity: galaRaffle.reduce((s, r) => s + r.quantity, 0),
          Amount: galaRaffleTotal.toFixed(2),
        });
      }
      if (galaFiftyFiftyTotal > 0) {
        newChargesRows.push({
          "Party Name": party.partyName,
          "First Name": guest.firstName,
          "Last Name": guest.lastName,
          "Charge Type": "50/50 Tickets",
          Quantity: galaFiftyFifty.reduce((s, r) => s + r.quantity, 0),
          Amount: galaFiftyFiftyTotal.toFixed(2),
        });
      }
      for (const pledge of galaPledges) {
        newChargesRows.push({
          "Party Name": party.partyName,
          "First Name": guest.firstName,
          "Last Name": guest.lastName,
          "Charge Type": `Pledge: ${pledge.impactBoardItem.title}`,
          Quantity: 1,
          Amount: parseFloat(pledge.amount).toFixed(2),
        });
      }
    }
  }

  // ===== SHEET 3: Auction Results =====
  const auctionData = await db.query.auctionItems.findMany({
    where: eq(auctionItems.eventId, eventId),
    with: {
      winningParty: true,
    },
  });

  const auctionRows = auctionData.map((item) => ({
    "Auction Item": item.title,
    Description: item.description || "",
    "Estimated Value": item.estimatedValue
      ? parseFloat(item.estimatedValue).toFixed(2)
      : "",
    "Winning Party": item.winningParty?.partyName || "Not Sold",
    "Final Bid": item.finalBidAmount
      ? parseFloat(item.finalBidAmount).toFixed(2)
      : "",
    "Pre-Imported": item.isPreImported ? "Yes" : "No",
    "Sold At": item.soldAt ? new Date(item.soldAt).toLocaleString() : "",
  }));

  // Build the complete CSV output with three sections
  const guestsCsv = Papa.unparse(guestRows);
  const newChargesCsv = Papa.unparse(newChargesRows);
  const auctionCsv = Papa.unparse(auctionRows);

  return [
    "=== GUEST SUMMARY ===",
    guestsCsv,
    "",
    "",
    "=== NEW GALA-NIGHT CHARGES (Add to ShulCloud) ===",
    newChargesCsv,
    "",
    "",
    "=== AUCTION RESULTS ===",
    auctionCsv,
  ].join("\n");
}
