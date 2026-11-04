import { getGuideContext } from "../guide-service";
import { CAPITOL_BUILDING_LOCATIONS } from "../capitol-building";
import {
  getLocationDisplay,
  localizePlaceLabel,
  navigationErrorMessage,
} from "../location-display";
import { CAPITOL_GROUND_NAVIGATION_GRAPH } from "./capitol-ground-graph";
import { getNodeByLocationId } from "./graph-helpers";
import { calculateRoute } from "./routing-engine";
import { getResolvedSettings, getSetting } from "@/features/settings/resolve-settings";
import { pickLang, type Language } from "@/lib/i18n/translations";
import type {
  NavigationGraph,
  NavigationRequest,
  NavigationResponse,
} from "./types";

async function getOfficialNavigationGraph(): Promise<NavigationGraph | null> {
  const settings = await getResolvedSettings();
  const raw = getSetting(settings, "building_navigation_graph");
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as NavigationGraph;
    if (parsed?.nodes?.length && parsed?.floorPlans?.length) {
      const startId = getSetting(settings, "building_kiosk_location_id", "gf-kiosk");
      return { ...parsed, defaultStartLocationId: parsed.defaultStartLocationId ?? startId };
    }
  } catch {
    return null;
  }
  return null;
}

async function getNavigationGraph(): Promise<{ graph: NavigationGraph | null; isDemoMode: boolean }> {
  const official = await getOfficialNavigationGraph();
  if (official) return { graph: official, isDemoMode: false };
  return { graph: CAPITOL_GROUND_NAVIGATION_GRAPH, isDemoMode: false };
}

export async function navigateBuilding(
  request: NavigationRequest
): Promise<NavigationResponse> {
  const { graph, isDemoMode } = await getNavigationGraph();
  const context = await getGuideContext();
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

export async function getNavigationGraphForClient(): Promise<{
  graph: NavigationGraph | null;
  isDemoMode: boolean;
  hasRouting: boolean;
}> {
  const { graph, isDemoMode } = await getNavigationGraph();
  return {
    graph,
    isDemoMode,
    hasRouting: graph !== null,
  };
}

export function getLocationName(locationId: string, lang: Language = "en"): string {
  const loc = CAPITOL_BUILDING_LOCATIONS.find((l) => l.id === locationId);
  if (!loc) return locationId;
  return getLocationDisplay(loc, lang).name;
}
