"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { getFloorExtents, graphHasFloorPlanImages } from "@/features/building-directory/navigation/building-3d";

interface BuildingOrbitCameraFitProps {
  graph: NavigationGraph;
  viewFloor: number;
  /** Re-fit when entering navigation (e.g. after layout change). */
  active?: boolean;
}

export function BuildingOrbitCameraFit({
  graph,
  viewFloor,
  active = true,
}: BuildingOrbitCameraFitProps) {
  const { camera, controls, invalidate, size } = useThree();

  useLayoutEffect(() => {
    if (!active) return;

    let cancelled = false;
    let attempts = 0;

    const fit = () => {
      if (cancelled) return;

      const { width, depth } = getFloorExtents(graph, viewFloor);
      const span = Math.max(width, depth);
      const imageBased = graphHasFloorPlanImages(graph);
      const dist = span * (imageBased ? 0.82 : 0.88);

      if (imageBased) {
        camera.position.set(dist * 0.72, dist * 0.88, dist * 0.72);
      } else {
        camera.position.set(dist * 0.62, dist * 0.78, dist * 0.62);
      }
      camera.near = 0.1;
      camera.far = Math.max(400, dist * 6);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      const orbit = controls as OrbitControlsImpl | null;
      if (orbit) {
        orbit.target.set(0, 0, 0);
        orbit.minDistance = span * (imageBased ? 0.35 : 0.22);
        orbit.maxDistance = span * (imageBased ? 1.85 : 2.0);
        if (imageBased) {
          const isoPolar = Math.atan(1.05);
          orbit.minPolarAngle = isoPolar;
          orbit.maxPolarAngle = isoPolar;
        } else {
          orbit.maxPolarAngle = Math.PI;
        }
        orbit.enableZoom = true;
        orbit.update();
        invalidate();
        return;
      }

      if (attempts < 12) {
        attempts += 1;
        requestAnimationFrame(fit);
      } else {
        invalidate();
      }
    };

    fit();

    return () => {
      cancelled = true;
    };
  }, [graph, viewFloor, active, camera, controls, invalidate, size.width, size.height]);

  return null;
}
