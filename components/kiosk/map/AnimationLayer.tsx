"use client";

import { AmbientEffects } from "./AmbientEffects";

/** @deprecated Prefer AmbientEffects. */
export function AnimationLayer() {
  return <AmbientEffects nightMode={false} />;
}
