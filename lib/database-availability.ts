import { readFile } from "fs/promises";
import net from "net";
import path from "path";
import type { KioskOfflineData } from "@/features/offline/types";

let downUntil = 0;

function databaseEndpoint(): { host: string; port: number } {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    const url = new URL(raw);
    return {
      host: url.hostname || "127.0.0.1",
      port: Number(url.port || 5432),
    };
  } catch {
    return { host: "127.0.0.1", port: 5432 };
  }
}

export function markDatabaseDown(ms = 20_000) {
  downUntil = Date.now() + ms;
}

/** True when Postgres accepts a connection. Skips the slow Prisma timeout when it does not. */
export async function isDatabaseReachable(timeoutMs = 400): Promise<boolean> {
  if (Date.now() < downUntil) return false;

  const { host, port } = databaseEndpoint();
  const reachable = await new Promise<boolean>((resolve) => {
    const socket = net.connect({ host, port });
    const finish = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });

  if (!reachable) markDatabaseDown();
  return reachable;
}

export async function readBundledKioskData(): Promise<KioskOfflineData | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "kiosk-offline-data.json");
    return JSON.parse(await readFile(filePath, "utf8")) as KioskOfflineData;
  } catch {
    return null;
  }
}
