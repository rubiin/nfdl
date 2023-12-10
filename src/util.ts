import process from "node:process";
import got from "got";
import isOnline from "is-online";
import * as enquirer from "enquirer";
import { BASE_NERD_FONTS_URL, chromeUserAgent } from "./constant";
import type { AssetType } from "./types";

export const client = got.extend({
  headers: {
    "User-Agent": chromeUserAgent,
  },
});

export function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB"];
  if (bytes === 0)
    return "0 Byte";
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / 1024 ** index)} ${sizes[index]}`;
}

export async function IsNetworkAvailable() {
  const isNetworkAvailable = await isOnline();
  if (!isNetworkAvailable) {
    console.error("❌ No internet connection detected");
    process.exit(1);
  }
}

// Function to fetch the list of available fonts
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
      console.error("Error fetching available fonts:", error.message);
    return [];
  }
}
