/** Window event fired when the idle screen (countdown or attract video) takes over or hands back the kiosk. */
export const KIOSK_IDLE_ATTRACT_EVENT = "kiosk:idle-attract";

/** `prompt` is the "Are you still there?" countdown; `video` is the full idle screen. */
export type KioskIdlePhase = "watching" | "prompt" | "video";

export type KioskIdleAttractDetail = { active: boolean; phase?: KioskIdlePhase };

export function announceIdleAttract(active: boolean, phase?: KioskIdlePhase) {
  window.dispatchEvent(
    new CustomEvent<KioskIdleAttractDetail>(KIOSK_IDLE_ATTRACT_EVENT, { detail: { active, phase } })
  );
}
