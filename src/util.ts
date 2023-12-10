import process from "node:process";
import path from "node:path";
import { pipeline as streamPipeline } from "node:stream";
import { promisify } from "node:util";
import fs from "node:fs";
import got from "got";
import isOnline from "is-online";
import enquirer from "enquirer";
import unzipper from "unzipper";
import cliProgress from "cli-progress";
import { BASE_NERD_FONTS_DOWNLOAD_URL, BASE_NERD_FONTS_URL, DOWNLOAD_DIR, chromeUserAgent } from "./constant";
import type { AssetType } from "./types";


const pipeline = promisify(streamPipeline);

export const client = got.extend({
  headers: {
    "User-Agent": chromeUserAgent,
  },
});

/**
 * The function converts a given number of bytes into a human-readable string representation with
 * appropriate units (Bytes, KB, MB).
 * @param {number} bytes - The `bytes` parameter in the `bytesToSize` function represents the number of
 * bytes that you want to convert to a human-readable size.
 * @returns a string representation of the given number of bytes in a human-readable format. The format
 * includes the size in kilobytes (KB) or megabytes (MB) depending on the magnitude of the input.
 */
export function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB"];
  if (bytes === 0)
    return "0 Byte";
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / 1024 ** index)} ${sizes[index]}`;
}

/**
 * The function checks if there is an internet connection available and logs an error message if not.
 */
export async function IsNetworkAvailable() {
  const isNetworkAvailable = await isOnline();
  if (!isNetworkAvailable) {
    console.error("❌ No internet connection detected");
    process.exit(1);
  }
}

/**
 * The function `getAvailableFonts` fetches a list of available fonts from a specified URL and returns
 * an array of font names.
 * @returns The function `getAvailableFonts` returns an array of objects. Each object in the array
 * represents an available font and has a `name` property.
 */
export async function getAvailableFonts() {
  try {
    const { body } = await client.get<{
      assets: AssetType[]
    }>(BASE_NERD_FONTS_URL, {
      responseType: "json",
    });

    return body.assets.filter(element => !element.name.includes("tar.xz")).map((asset: AssetType) => {
      return {
        name: asset.name.replace("nerd-fonts-", "").replace(".zip", ""),
      };
    });
  }
  catch (error) {
    if (error instanceof Error)
      console.error("❌ Error fetching available fonts:", error.message);
    return [];
  }
}

/**
 * The `selectFonts` function allows the user to select fonts from a list of available fonts.
 * @returns The function `selectFonts` returns an array of strings representing the selected fonts to
 * download and extract.
 */
export async function selectFonts() {
  const availableFonts = await getAvailableFonts();
  const options = availableFonts.map(font => ({
    name: font.name,
  }));

  const response = await enquirer.prompt<{ fonts: string[] }>({
    type: "autocomplete",
    name: "fonts",
    message: "Select the fonts to download and extract",
    choices: options,
    sort: true,
    multiple: true,
    // @ts-expect-error - The `limit` property is not defined in the typings
    limit: 10,
  });
  return response.fonts;
}

/**
 * The function `downloadAndExtractFonts` downloads and extracts a list of selected fonts from a
 * specified URL, displaying a progress bar during the download process.
 * @param {string[]} selectedFonts - An array of font names that have been selected for download and
 * extraction.
 */
export async function downloadAndExtractFonts(selectedFonts: string[]) {
  for (const font of selectedFonts) {
    const fontFile = `${font}.zip`;
    const downloadUrl = `${BASE_NERD_FONTS_DOWNLOAD_URL}/${fontFile}`;
    const downloadPath = path.join(DOWNLOAD_DIR, fontFile);

    try {
      const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

      // Start the progress bar with an initial value of 0
      progressBar.start(100, 0);

      // Download font with progress tracking
      const response = client.stream(downloadUrl)
        .on("downloadProgress", (progress: { percent: number }) => {
          // You can handle progress updates here if needed
          const adjustedPercent = Math.min(100, Math.max(0, progress.percent * 100)); // Adjust to fit within 0-100
          progressBar.update(adjustedPercent);
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
      if (error instanceof Error)
        console.error(`❌ Failed to download and extract font '${font}':`, error.message);
    }
  }

  console.info(`✅ Fonts successfully downloaded and extracted to ${DOWNLOAD_DIR}`);
  process.exit(0);
}
