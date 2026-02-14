"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    socket = io(url, {
      path: "/api/socketio",
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function joinEvent(eventId: string): void {
  const s = getSocket();
  s.emit("join:event", eventId);
}

export function leaveEvent(eventId: string): void {
  const s = getSocket();
  s.emit("leave:event", eventId);
}

// Emit events for real-time updates
export function emitGuestUpdate(eventId: string, guest: unknown): void {
  const s = getSocket();
  s.emit("guest:updated", { eventId, guest });
}

export function emitPledgeUpdate(eventId: string, pledge: unknown): void {
  const s = getSocket();
  s.emit("pledge:updated", { eventId, pledge });
}

export function emitStatsUpdate(eventId: string): void {
  const s = getSocket();
  s.emit("stats:refresh", { eventId });
}
