import { getLocationDisplay } from "@/features/building-directory/location-display";
import { calculateRoute } from "@/features/building-directory/navigation/routing-engine";
import { getNodeByLocationId } from "@/features/building-directory/navigation/demo-graph";
import type {
  NavigationRequest,
  NavigationResponse,
} from "@/features/building-directory/navigation/types";
import type { KioskOfflineData } from "./types";

export function navigateBuildingOffline(
  request: NavigationRequest,
  data: KioskOfflineData
): NavigationResponse {
  const graph = data.navigationGraph;
  const context = data.guideContext;
  const isDemoMode = false;

  const destination = context.locations.find((l) => l.id === request.toLocationId);
  if (!destination) {
    return {
      success: false,
      isDemoMode,
      error: "Destination not found in the building directory.",
      errorReason: "missing_destination",
    };
  }

  const { name: destinationName, directions: textDirections } = getLocationDisplay(
    destination,
    request.lang ?? "en"
  );

  if (!graph) {
    return {
      success: true,
      textOnly: true,
      textDirections,
      isDemoMode,
    };
  }

  const startLocationId = request.fromLocationId ?? graph.defaultStartLocationId;
  const fromNode = getNodeByLocationId(graph, startLocationId);
  const toNode = getNodeByLocationId(graph, request.toLocationId);

  if (!toNode) {
    return {
      success: true,
      textOnly: true,
      textDirections,
      isDemoMode,
      error: "No map coordinates for this destination. Showing text directions only.",
      errorReason: "missing_map_node",
    };
  }

  if (!fromNode) {
    return {
      success: false,
      isDemoMode,
      error: "Starting location is not recognized. Please visit the Information Desk.",
      errorReason: "missing_start",
    };
  }

  const route = calculateRoute(
    graph,
    fromNode.id,
    toNode.id,
    request.toLocationId,
    destinationName,
    { accessible: request.accessible, isDemoMode }
  );

  if (!route) {
    const accessibleMsg = request.accessible
      ? "No wheelchair-accessible route is available to this destination."
      : "No walkable route could be calculated.";

    return {
      success: false,
      isDemoMode,
      textOnly: true,
      textDirections,
      error: `${accessibleMsg} Text directions are provided instead. Please visit the Information Desk for assistance.`,
      errorReason: request.accessible ? "no_accessible_route" : "no_route",
    };
  }

  return {
    success: true,
    route,
    isDemoMode,
  };
}
