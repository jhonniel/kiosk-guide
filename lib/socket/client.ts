"use client";

/**
 * Socket.IO client integration placeholder.
 * Install socket.io-client when ready and connect to the socket server.
 */

import { useEffect, useState } from "react";
import type { SocketMessage } from "./events";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);

  useEffect(() => {
    // Future: const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL);
    setIsConnected(false);
    return () => {
      // Future: socket.disconnect();
    };
  }, []);

  return { isConnected, lastMessage, setLastMessage };
}
