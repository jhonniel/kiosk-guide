/** Window event fired when the idle screen (countdown or attract video) takes over or hands back the kiosk. */
export const KIOSK_IDLE_ATTRACT_EVENT = "kiosk:idle-attract";

export type KioskIdleAttractDetail = { active: boolean };

export function announceIdleAttract(active: boolean) {
  window.dispatchEvent(
    new CustomEvent<KioskIdleAttractDetail>(KIOSK_IDLE_ATTRACT_EVENT, { detail: { active } })
  );
}
