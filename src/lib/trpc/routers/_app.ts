import { router } from "../server";
import { authRouter } from "./auth";
import { guestsRouter } from "./guests";
import { partiesRouter } from "./parties";
import { pledgesRouter } from "./pledges";
import { impactBoardRouter } from "./impactBoard";
import { auctionRouter } from "./auction";
import { raffleRouter } from "./raffle";
import { dashboardRouter } from "./dashboard";
import { adminRouter } from "./admin";
import { sponsorshipRouter } from "./sponsorship";

export const appRouter = router({
  auth: authRouter,
  guests: guestsRouter,
  parties: partiesRouter,
  pledges: pledgesRouter,
  impactBoard: impactBoardRouter,
  auction: auctionRouter,
  raffle: raffleRouter,
  dashboard: dashboardRouter,
  admin: adminRouter,
  sponsorship: sponsorshipRouter,
});

export type AppRouter = typeof appRouter;
