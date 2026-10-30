/** Warm the Camiguin map JS chunk before the user opens /map. */
export function preloadMapChunk(): void {
  if (typeof window === "undefined") return;
  void import("@/components/kiosk/map/CamiguinTourismMap");
}

/** Wait for the map chunk and two paint frames so SVG/filters compile before interaction. */
export async function warmupMapEngine(): Promise<void> {
  await import("@/components/kiosk/map/CamiguinTourismMap");
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
