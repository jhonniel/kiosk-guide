"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { getFloorExtents, graphHasFloorPlanImages } from "@/features/building-directory/navigation/building-3d";

interface BuildingOrbitCameraFitProps {
  graph: NavigationGraph;
  viewFloor: number;
}

export function BuildingOrbitCameraFit({ graph, viewFloor }: BuildingOrbitCameraFitProps) {
  const { camera, controls, invalidate } = useThree();

  useLayoutEffect(() => {
    const { width, depth } = getFloorExtents(graph, viewFloor);
    const span = Math.max(width, depth);
    const imageBased = graphHasFloorPlanImages(graph);
    const dist = span * (imageBased ? 1.0 : 1.05);

    if (imageBased) {
      camera.position.set(dist * 0.6, dist * 0.9, dist * 0.6);
    } else {
      camera.position.set(dist * 0.72, dist * 0.88, dist * 0.72);
    }
    camera.near = 0.1;
    camera.far = Math.max(400, dist * 6);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const orbit = controls as OrbitControlsImpl | null;
    if (orbit) {
      orbit.target.set(0, 0, 0);
      orbit.minDistance = span * (imageBased ? 0.35 : 0.25);
      orbit.maxDistance = span * (imageBased ? 1.8 : 2.2);
      orbit.maxPolarAngle = imageBased ? Math.PI * 0.45 : Math.PI;
      orbit.enableZoom = true;
      orbit.update();
    }

    invalidate();
  }, [graph, viewFloor, camera, controls, invalidate]);

  return null;
}
