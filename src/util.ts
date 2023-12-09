import got from "got";
import { BASE_NERD_FONTS_URL, chromeUserAgent } from "./constant";
import type { AssetType, Fonts } from "./types";

export const client = got.extend({
  headers: {
    "User-Agent": chromeUserAgent,
  },
});

// Function to fetch the list of available fonts
export async function getAvailableFonts(): Promise<Fonts[]> {
  try {
    const { body } = await client.get<{
      assets: AssetType[]
    }>(BASE_NERD_FONTS_URL, {
      responseType: "json",
    });

    return body.assets.filter(element => !element.name.includes("tar.xz")).map((asset: AssetType) => {
      return {
        name: asset.name.replace("nerd-fonts-", "").replace(".zip", ""),
        value: asset.name.replace("nerd-fonts-", "").replace(".zip", ""),
      };
    });
  }
  catch (error) {
    if(error instanceof Error)
    console.error("Error fetching available fonts:", error.message);
    return [];
  }
}
