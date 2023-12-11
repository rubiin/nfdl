
import fs from "node:fs";
import process from "node:process";

import { DOWNLOAD_DIR } from "./constant";
import { IsNetworkAvailable, downloadAndExtractFonts, selectFonts } from "./util";

export async function main(){
  await IsNetworkAvailable();
  const selectedFonts = await selectFonts();

  if (selectedFonts.length === 0) {
    console.info("❌ No fonts selected. Exiting...");
  }
  else {

    // Ensure the download directory exists
    if (!fs.existsSync(DOWNLOAD_DIR))
      fs.mkdirSync(DOWNLOAD_DIR);

    await downloadAndExtractFonts(selectedFonts);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
