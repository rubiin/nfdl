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
import { isObject } from "helper-fns";
import { BASE_NERD_FONTS_DOWNLOAD_URL, BASE_NERD_FONTS_URL, CACHE_TTL, DOWNLOAD_DIR, FONT_CACHE_FILE, chromeUserAgent } from "./constant";
import type { AssetType, ICache } from "./types";

const pipeline = promisify(streamPipeline);

export const client = got.extend({
  headers: {
    "User-Agent": chromeUserAgent,
  },
});


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

// Function to fetch available fonts with caching
export async function getAvailableFonts(): Promise<{ name: string }[]> {
  try {
    let fontCache = await readFontCache();

    if (isObject(fontCache) && Object.keys(fontCache).length !== 0 && fontCache.data && !isCacheEntryExpired(fontCache.ttl!)) {
      console.info("Using cached available fonts");
      return fontCache.data;
    }

    const { body } = await client.get<{ assets: AssetType[] }>(BASE_NERD_FONTS_URL, {
      responseType: "json",
    });

    const availableFonts = body.assets
      .filter(element => !element.name.includes("tar.xz"))
      .map((asset: AssetType) => {
        return {
          name: asset.name.replace("nerd-fonts-", "").replace(".zip", ""),
        };
      });

    // Update the font cache with timestamp and data
    fontCache = {
      ttl: Date.now(),
      data: availableFonts,
    };
    await writeFontCache(fontCache);

    return availableFonts;
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
      const progressBar = new cliProgress.SingleBar({
        format: `Downloading and extracting ${font} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
      }, cliProgress.Presets.shades_classic);

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

// Function to read the font cache from a file
export async function readFontCache(): Promise<ICache> {
  try {
    const data = await fs.promises.readFile(FONT_CACHE_FILE, "utf8");
    return JSON.parse(data) as ICache;
  }
  catch (error) {
    return {};
  }
}

// Function to write the font cache to a file
export function writeFontCache(cache: ICache) {
  return fs.promises.writeFile(FONT_CACHE_FILE, JSON.stringify(cache), "utf8");
}

// Function to check if a cache entry has expired
export function isCacheEntryExpired(timestamp: number): boolean {
  const currentTime = Date.now();
  return currentTime - timestamp > CACHE_TTL;
}
