import fs from "node:fs";
import process from "node:process";
import os from "node:os";

import { DOWNLOAD_DIR } from "./constant";
import { IsNetworkAvailable, downloadAndExtractFonts, executeCommand, selectFonts } from "./util";


process.stdin.on('keypress', (_char, key) => {
  if (key.ctrl && key.name === 'c') {
    process.exit(0);
  }
})

export async function main() {
  await IsNetworkAvailable();
  const selectedFonts = await selectFonts();


  // Ensure the download directory exists
  if (!fs.existsSync(DOWNLOAD_DIR))
    fs.mkdirSync(DOWNLOAD_DIR);

  await downloadAndExtractFonts(selectedFonts);

  // Update font cache and rebuild font cache on Linux and macOS systems
  if (os.platform() !== "win32" || os.platform() !== "android")
    executeCommand("fc-cache -f -v");

}

main().catch((error) => {
  console.log(error);
  process.exit(1);
});
