"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import type * as THREE from "three";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { fitOrthographicZoom, getFloorExtents } from "@/features/building-directory/navigation/building-3d";

interface ImagePlanCameraProps {
  graph: NavigationGraph;
  viewFloor: number;
}

/** Straight top-down camera so uploaded floor plans look like the 2D architectural drawing. */
export function ImagePlanCamera({ graph, viewFloor }: ImagePlanCameraProps) {
  const ref = useRef<THREE.OrthographicCamera>(null);
  const fittedRef = useRef(false);
  const { size, invalidate } = useThree();

  useLayoutEffect(() => {
    fittedRef.current = false;
  }, [graph, viewFloor, size.width, size.height]);

  useFrame(() => {
    const cam = ref.current;
    if (!cam || fittedRef.current) return;

    const { width, depth } = getFloorExtents(graph, viewFloor);
    cam.position.set(0, 100, 0);
    cam.up.set(0, 0, -1);
    cam.lookAt(0, 0, 0);

    const ok = fitOrthographicZoom(cam, width, depth, 1.04, size.width, size.height);
    if (!ok) return;

    fittedRef.current = true;
    invalidate();
  });

  return (
    <OrthographicCamera
      ref={ref}
      makeDefault
      position={[0, 100, 0]}
      near={-200}
      far={200}
    />
  );
}
