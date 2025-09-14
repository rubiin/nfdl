import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import os from "node:os";
import { pipeline as streamPipeline } from "node:stream";
import { promisify } from "node:util";
import isOnline from "is-online";
import { isObject } from "helper-fns";
import got from "got";
import enquirer from "enquirer";
import cliProgress from "cli-progress";
import unzipper from "unzipper";
import { BASE_NERD_FONTS_DOWNLOAD_URL, BASE_NERD_FONTS_URL, CACHE_TTL, DOWNLOAD_DIR, FONT_CACHE_FILE, chromeUserAgent } from "./constant";
import type { AssetType, ICache, Options } from "./types";

const pipeline = promisify(streamPipeline);

export const client = got.extend({
  headers: {
    "User-Agent": chromeUserAgent,
  },
});

/**
 * The function returns the download directory based on the provided options.
 * @param {Options} allArguments - An object containing all the arguments passed to the function.
 * @returns the download directory. If the `dir` property is present in the `allArguments` object, it
 * will return the path joined with the user's home directory and the `dir` value. Otherwise, it will
 * return the `DOWNLOAD_DIR` constant.
 */
export function getDownloadDirectory(allArguments: Options) {
  return allArguments?.dir ? `${path.join(os.homedir(), allArguments.dir)}` : DOWNLOAD_DIR;
}

/**
 * The function executes a command and logs any errors or stderr output.
 * @param {string} command - The `command` parameter is a string that represents the command you want
 * to execute. It can be any valid command that can be executed in a command-line interface, such as
 * running a script, executing a program, or running a shell command.
 */
export function executeCommand(command: string) {
  return exec(command, (error, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
    if (stderr)
      console.error(`stderr: ${stderr}`);
  });
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
export async function downloadAndExtractFonts(selectedFonts: string[], allArguments: Options) {
  const downloadDirectory = getDownloadDirectory(allArguments);

  // TODO: Do this parallelly
  for (const font of selectedFonts) {
    const fontFile = `${font}.zip`;
    const downloadUrl = `${BASE_NERD_FONTS_DOWNLOAD_URL}/${fontFile}`;
    const downloadPath = path.join(downloadDirectory, fontFile);

    try {
      const progressBar = new cliProgress.SingleBar({
        format: `Downloading and extracting ${font} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
        formatValue: (value: number) => `${Math.round(value)}`,
      }, cliProgress.Presets.shades_classic);

      // Start the progress bar with an initial value of 0
      progressBar.start(100, 0);

      // Download font with progress tracking
      const response = client.stream(downloadUrl)
        .on("downloadProgress", ({ percent }: { percent: number }) => {
          // You can handle progress updates here if needed
          const adjustedPercent = Math.min(100, Math.max(0, percent * 100)); // Adjust to fit within 0-100
          progressBar.update(adjustedPercent);
        });

      // Save the downloaded font
      await pipeline(response, fs.createWriteStream(downloadPath));

      // Stop the progress bar
      progressBar.stop();

      if (allArguments?.extract) {
        // Extract font
        await pipeline(fs.createReadStream(downloadPath), unzipper.Extract({ path: downloadDirectory }));

        // Remove the downloaded zip file
        await fs.promises.unlink(downloadPath);
      }
    }
    catch (error) {
      if (error instanceof Error)
        console.error(`❌ Failed to download and extract font '${font}':`, error.message);
    }
  }

  console.info(`✅ Fonts successfully downloaded and extracted to ${downloadDirectory}`);
  process.exit(0);
}

// Function to read the font cache from a file
export async function readFontCache(): Promise<ICache> {
  try {
    const data = await fs.promises.readFile(FONT_CACHE_FILE, "utf8");
    return JSON.parse(data) as ICache;
  }
  catch (error) {
    console.info(error);
    return {};
  }
}

// Function to write the font cache to a file
export async function writeFontCache(cache: ICache) {
  return fs.promises.writeFile(FONT_CACHE_FILE, JSON.stringify(cache), "utf8");
}

// Function to check if a cache entry has expired
export function isCacheEntryExpired(timestamp: number): boolean {
  const currentTime = Date.now();
  return currentTime - timestamp > CACHE_TTL;
}
