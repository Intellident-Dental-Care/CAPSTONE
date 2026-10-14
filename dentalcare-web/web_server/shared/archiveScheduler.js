import cron from "node-cron";
import { runArchiveSweep } from "../admin/archive/archiveService.js";

// Runs every night at 02:00 server time.
export const startArchiveScheduler = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("[archive] Running nightly archive sweep...");
    try {
      const result = await runArchiveSweep();
      const { accounts, bookings, procedures } = result.data || {};
      console.log(
        `[archive] Sweep complete. Dormant accounts archived: ${accounts?.archived}/${accounts?.total}. ` +
          `Old bookings archived: ${bookings?.archived}/${bookings?.total}. ` +
          `Old procedures archived: ${procedures?.archived}/${procedures?.total}.`
      );
    } catch (error) {
      console.error("[archive] Sweep failed:", error?.message || error);
    }
  });
};
