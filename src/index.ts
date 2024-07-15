import fs from "node:fs";
import process from "node:process";
import os from "node:os";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import packageJson from "../package.json";
import {
  IsNetworkAvailable,
  downloadAndExtractFonts,
  executeCommand,
  getDownloadDirectory,
  selectFonts,
} from "./util";
import type { Options } from "./types";

process.stdin.on("keypress", (_char, key: { ctrl: boolean; name: string }) => {
  if (key.ctrl && key.name === "c")
    process.exit(0);
});

const allArguments = yargs(hideBin(process.argv))
  .usage("Usage: $0 [options]")
  .help("help")
  .alias("help", "h")
  .version("version", packageJson.version)
  .alias("version", "v")
  .options({
    dir: {
      description: "<dirname> dir to download font to",
      requiresArg: true,
      required: false,
      alias: "d",
    },
    otf: {
      description: "Prefer OTF font files",
      requiresArg: false,
      required: false,
      boolean: true,
    },
    ttf: {
      description: "Prefer TTF font files",
      requiresArg: false,
      required: false,
      boolean: true,
    },
    extract: {
      description: "Automatically extract downloaded fonts",
      requiresArg: false,
      required: false,
      boolean: true,
    },
  }).argv as Options;

export async function download(allArguments: Options) {
  await IsNetworkAvailable();
  const selectedFonts = await selectFonts();

  // Set download directory
  const downloadDirectory = getDownloadDirectory(allArguments);

  // Ensure the download directory exists
  if (!fs.existsSync(downloadDirectory))
    fs.mkdirSync(downloadDirectory);

  await downloadAndExtractFonts(selectedFonts, allArguments);

  // Update font cache and rebuild font cache on Linux and macOS systems
  if (os.platform() !== "win32" || os.platform() !== "android")
    executeCommand("fc-cache -f -v");
}

async function main() {
  return download(allArguments);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
