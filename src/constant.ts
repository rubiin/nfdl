import os from "node:os";
import path from "node:path";

// Define the base URL for the Nerd Fonts releases
export const BASE_NERD_FONTS_URL = "https://api.github.com/repos/ryanoasis/nerd-fonts/releases/latest";
export const BASE_NERD_FONTS_DOWNLOAD_URL = "https://github.com/ryanoasis/nerd-fonts/releases/download/v3.1.1";

// Define the directory to download and extract the fonts
export const DOWNLOAD_DIR = path.join(os.homedir(), ".fonts");

// Define the user agent to use for the HTTP requests
export const chromeUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

// Define the path to the font cache file
export const FONT_CACHE_FILE = path.join(os.tmpdir(), 'font-cache.json');


// Define the cache time-to-live (TTL) in milliseconds
export const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds
