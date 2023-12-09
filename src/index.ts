import path from "node:path";
import fs from "node:fs";
import process from "node:process";
import { pipeline as streamPipeline } from "node:stream";
import { promisify } from "node:util";
import enquirer from "enquirer";
import unzipper from "unzipper";
import got from "got";
import cliProgress from "cli-progress";
import { BASE_NERD_FONTS_DOWNLOAD_URL, DOWNLOAD_DIR } from "./constant";
import { client, getAvailableFonts } from "./util";

const pipeline = promisify(streamPipeline);

// Function to show the menu
async function selectFonts(): Promise<string[]> {
  const availableFonts = await getAvailableFonts();
  const options = availableFonts.map(font => ({
    name: font.name,
    value: font.value,
  }));

  const response = await enquirer.prompt<{ fonts: string[] }>({
    type: "autocomplete",
    name: "fonts",
    message: "Select the fonts to download and extract",
    choices: options,
    multiple: true,
    // @ts-expect-error - The `limit` property is not defined in the typings
    limit: 10,
  });
  return response.fonts;
}

// Function to download and extract selected fonts
async function downloadAndExtractFonts(selectedFonts: string[]): Promise<void> {
  for (const font of selectedFonts) {
    const fontFile = `${font}.zip`;
    const downloadUrl = `${BASE_NERD_FONTS_DOWNLOAD_URL}/${fontFile}`;
    const downloadPath = path.join(DOWNLOAD_DIR, fontFile);

    try {
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
      progressBar.start(100, 0);
      // Download font with progress tracking
      const response = client.stream(downloadUrl)
        .on("downloadProgress", (progress: { percent: number }) => {
          // You can handle progress updates here if needed
          const truncatedPercent = Math.floor(progress.percent * 100);
          progressBar.update(truncatedPercent);
        });

      // Save the downloaded font
      await pipeline(response, fs.createWriteStream(downloadPath));

      // Stop the progress bar
      progressBar.stop();

      // Extract font
      await pipeline(fs.createReadStream(downloadPath), unzipper.Extract({ path: DOWNLOAD_DIR }));

      // Remove the downloaded zip file
      await fs.promises.unlink(downloadPath);
    }
    catch (error) {
      if(error instanceof Error)
      console.error(`❌ Failed to download and extract font '${font}':`, error.message);
    }
  }

  console.info(`✅ Fonts successfully downloaded and extracted to ${DOWNLOAD_DIR}`);
}

// Main function
export async function main(): Promise<void> {
  const selectedFonts = await selectFonts();

  if (selectedFonts.length === 0) {
    console.info("No fonts selected. Exiting...");
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
