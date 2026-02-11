// Socket.io server setup
// Note: In Vercel serverless, WebSocket connections require external services
// This provides the interface for real-time updates via polling fallback

export interface SocketEvent {
  type: "guest:updated" | "pledge:created" | "stats:updated" | "user:joined" | "user:left";
  eventId: string;
  payload: unknown;
  timestamp: string;
}

// In-memory event store for SSE (Server-Sent Events) fallback
const eventListeners = new Map<string, Set<(event: SocketEvent) => void>>();

export function subscribe(eventId: string, listener: (event: SocketEvent) => void) {
  if (!eventListeners.has(eventId)) {
    eventListeners.set(eventId, new Set());
  }
  eventListeners.get(eventId)!.add(listener);
  return () => {
    eventListeners.get(eventId)?.delete(listener);
    if (eventListeners.get(eventId)?.size === 0) {
      eventListeners.delete(eventId);
    }
  };
}

export function broadcast(eventId: string, event: SocketEvent) {
  const listeners = eventListeners.get(eventId);
  if (listeners) {
    listeners.forEach((listener) => listener(event));
  }
}

export function emitGuestUpdate(eventId: string, guest: unknown) {
  broadcast(eventId, {
    type: "guest:updated",
    eventId,
    payload: guest,
    timestamp: new Date().toISOString(),
  });
}

export function emitPledgeUpdate(eventId: string, pledge: unknown) {
  broadcast(eventId, {
    type: "pledge:created",
    eventId,
    payload: pledge,
    timestamp: new Date().toISOString(),
  });
}

export function emitStatsUpdate(eventId: string, stats: unknown) {
  broadcast(eventId, {
    type: "stats:updated",
    eventId,
    payload: stats,
    timestamp: new Date().toISOString(),
  });
}
