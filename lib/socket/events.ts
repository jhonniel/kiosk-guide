/**
 * Socket.IO server integration placeholder.
 * When ready, install socket.io and socket.io-client, then implement:
 * - lib/socket/server.ts with custom Next.js server or separate socket server
 * - app/api/socket/route.ts for App Router handler
 */

export const SOCKET_EVENTS = {
  ANNOUNCEMENT_NEW: "announcement:new",
  ANNOUNCEMENT_UPDATE: "announcement:update",
  KIOSK_STATUS: "kiosk:status",
  SEARCH_TRENDING: "search:trending",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export interface SocketMessage<T = unknown> {
  event: SocketEvent;
  data: T;
  timestamp: string;
}

export function createSocketMessage<T>(event: SocketEvent, data: T): SocketMessage<T> {
  return {
    event,
    data,
    timestamp: new Date().toISOString(),
  };
}
