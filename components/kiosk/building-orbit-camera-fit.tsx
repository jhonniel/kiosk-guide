"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { NavigationGraph } from "@/features/building-directory/navigation/types";
import { getFloorExtents, graphHasFloorPlanImages } from "@/features/building-directory/navigation/building-3d";

interface BuildingOrbitCameraFitProps {
  graph: NavigationGraph;
  viewFloor: number;
  /** Re-fit when entering navigation (e.g. after layout change). */
  active?: boolean;
  /** Look straight down with north at the top, like the printed floor plan. */
  flatView?: boolean;
}

const FLAT_VIEW_POLAR = 0.0001;
/** Space kept between the office list and the floor. */
const RAIL_GAP_PX = 16;

/** Width of the office list that sits over the left of the map, in canvas pixels. */
function railInsetPx(canvas: HTMLCanvasElement) {
  const surface = canvas.closest("[data-kiosk-zoom-surface]");
  const rail = surface?.querySelector<HTMLElement>("[data-map-rail]");
  if (!rail) return 0;
  const canvasBox = canvas.getBoundingClientRect();
  const railBox = rail.getBoundingClientRect();
  if (railBox.width === 0) return 0;
  return Math.max(0, Math.min(railBox.right - canvasBox.left + RAIL_GAP_PX, canvasBox.width * 0.5));
}

export function BuildingOrbitCameraFit({
  graph,
  viewFloor,
  active = true,
  flatView = false,
}: BuildingOrbitCameraFitProps) {
  const { camera, controls, invalidate, size, gl } = useThree();

  useLayoutEffect(() => {
    if (!active) return;

    let cancelled = false;
    let attempts = 0;

    const fit = () => {
      if (cancelled) return;

      const { width, depth } = getFloorExtents(graph, viewFloor);
      const span = Math.max(width, depth);
      const imageBased = graphHasFloorPlanImages(graph);
      const polar = flatView ? FLAT_VIEW_POLAR : imageBased ? Math.atan(1.05) : 0.9;
      const azimuth = flatView ? 0 : Math.PI / 4;

      const viewW = Math.max(size.width, 1);
      const viewH = Math.max(size.height, 1);
      const inset = railInsetPx(gl.domElement);
      const openShare = (viewW - inset) / viewW;
      const perspective = camera instanceof PerspectiveCamera;
      const halfV = perspective ? (camera.fov * Math.PI) / 360 : Math.PI / 8;
      const aspect = viewW / viewH;

      let dist: number;
      if (flatView) {
        // Fit the plan into the area right of the office list.
        const forDepth = depth / (2 * Math.tan(halfV));
        const forWidth = width / (2 * Math.tan(halfV) * aspect * openShare);
        dist = Math.max(forDepth, forWidth) * 1.06;
      } else {
        // Far enough to show the whole floor now that the map runs to the frame edge.
        dist = span * (imageBased ? 1.05 : 0.88) / Math.max(openShare, 0.6);
      }

      // Slide the view so the floor sits centred in the open area, not under the list.
      const worldPerPx = (2 * dist * Math.tan(halfV) * aspect) / viewW;
      const shift = (inset / 2) * worldPerPx;
      const rightX = Math.cos(azimuth);
      const rightZ = -Math.sin(azimuth);
      const targetX = -rightX * shift;
      const targetZ = -rightZ * shift;

      camera.position.set(
        targetX + dist * Math.sin(polar) * Math.sin(azimuth),
        dist * Math.cos(polar),
        targetZ + dist * Math.sin(polar) * Math.cos(azimuth)
      );
      camera.near = 0.1;
      camera.far = Math.max(400, dist * 8);
      camera.lookAt(targetX, 0, targetZ);
      camera.updateProjectionMatrix();

      const orbit = controls as OrbitControlsImpl | null;
      if (orbit) {
        orbit.target.set(targetX, 0, targetZ);
        orbit.minDistance = span * (imageBased ? 0.32 : 0.34);
        orbit.maxDistance = Math.max(span * (flatView ? 2.0 : imageBased ? 1.85 : 2.0), dist * 1.2);
        if (flatView || imageBased) {
          orbit.minPolarAngle = polar;
          orbit.maxPolarAngle = polar;
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
  }, [graph, viewFloor, active, flatView, camera, controls, gl, invalidate, size.width, size.height]);

  return null;
}
