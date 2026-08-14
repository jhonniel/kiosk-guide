import { readFile } from "fs/promises";
import path from "path";
import {
  KIOSK_OFFLINE_DATA_VERSION,
  type CitizensCharterOfflineBundle,
} from "@/features/offline/types";
import type { CharterEditionView } from "./types";

/** Read the static kiosk charter snapshot shipped in /public (fast server-side boot). */
export async function getBundledCharterEdition(): Promise<CharterEditionView | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "kiosk-citizens-charter.json");
    const raw = JSON.parse(await readFile(filePath, "utf8")) as CitizensCharterOfflineBundle;
    if (raw.version !== KIOSK_OFFLINE_DATA_VERSION || !raw.citizensCharter) {
      return null;
    }
    return raw.citizensCharter;
  } catch {
    return null;
  }
}
