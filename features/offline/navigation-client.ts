import {
  getLocationDisplay,
  localizePlaceLabel,
  navigationErrorMessage,
} from "@/features/building-directory/location-display";
import { pickLang } from "@/lib/i18n/translations";
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
  const lang = request.lang ?? "en";

  const destination = context.locations.find((l) => l.id === request.toLocationId);
  const mappedNode = graph ? getNodeByLocationId(graph, request.toLocationId) : undefined;
  if (!destination && !mappedNode) {
    return {
      success: false,
      isDemoMode,
      error: navigationErrorMessage("missing_destination", lang),
      errorReason: "missing_destination",
    };
  }

  const display = destination
    ? getLocationDisplay(destination, lang)
    : null;
  const destinationName =
    display?.name ??
    (mappedNode ? localizePlaceLabel(mappedNode.label, lang) : undefined) ??
    pickLang(lang, "your destination", "iyong destinasyon", "imong destinasyon");
  const textDirections = display?.directions ?? [];

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
      error: navigationErrorMessage("missing_map_node", lang),
      errorReason: "missing_map_node",
    };
  }

  if (!fromNode) {
    return {
      success: false,
      isDemoMode,
      error: navigationErrorMessage("missing_start", lang),
      errorReason: "missing_start",
    };
  }

  const route = calculateRoute(
    graph,
    fromNode.id,
    toNode.id,
    request.toLocationId,
    destinationName,
    { accessible: request.accessible, isDemoMode, lang }
  );

  if (!route) {
    return {
      success: false,
      isDemoMode,
      textOnly: true,
      textDirections,
      error: navigationErrorMessage(request.accessible ? "no_accessible_route" : "no_route", lang),
      errorReason: request.accessible ? "no_accessible_route" : "no_route",
    };
  }

  return {
    success: true,
    route,
    isDemoMode,
  };
}
