"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { getFloorExtents } from "@/features/building-directory/navigation/building-3d";

interface BuildingOrbitCameraFitProps {
  graph: NavigationGraph;
  viewFloor: number;
}

export function BuildingOrbitCameraFit({ graph, viewFloor }: BuildingOrbitCameraFitProps) {
  const { camera, controls, invalidate } = useThree();

  useLayoutEffect(() => {
    const { width, depth } = getFloorExtents(graph, viewFloor);
    const span = Math.max(width, depth);
    const dist = span * 1.05;

    camera.position.set(dist * 0.72, dist * 0.88, dist * 0.72);
    camera.lookAt(0, 0, 0);

    const orbit = controls as OrbitControlsImpl | null;
    if (orbit) {
      orbit.target.set(0, 0, 0);
      orbit.minDistance = span * 0.35;
      orbit.maxDistance = span * 1.35;
      orbit.enableZoom = true;
      orbit.update();
    }

    invalidate();
  }, [graph, viewFloor, camera, controls, invalidate]);

  return null;
}
