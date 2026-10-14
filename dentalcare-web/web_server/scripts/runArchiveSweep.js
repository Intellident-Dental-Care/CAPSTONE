// Run from dentalcare-web/:  node web_server/scripts/runArchiveSweep.js
import { runArchiveSweep } from "../admin/archive/archiveService.js";

const main = async () => {
  console.log("Running archive sweep...");
  const result = await runArchiveSweep();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
};

main();
