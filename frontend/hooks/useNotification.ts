'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { API_BASE, API_WEBSOCKET_BASE } from '@/lib/apiBase';

const NOTIFICATIONS_API = `${API_BASE}/api/notifications`;

// Fetches a short-lived WebSocket ticket through the same-origin API, so the
// socket can authenticate when the browser blocks the API's third-party cookie.
// Returns null on any failure; the socket then falls back to the cookie.
async function fetchWsTicket(): Promise<string | null> {
  try {
    const response = await fetch(`${NOTIFICATIONS_API}/ws-ticket/`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    if (
      typeof data === 'object' &&
      data !== null &&
      typeof (data as { ticket?: unknown }).ticket === 'string'
    ) {
      return (data as { ticket: string }).ticket;
    }

    return null;
  } catch {
    return null;
  }
}

type Notification = {
  notification_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type?: string;
};

type ApiNotification = {
  id_notification: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function getNotificationTitle(notification: ApiNotification): string {
  const message = notification.message.toLowerCase();

  if (notification.type === 'postulation') {
    return 'Nueva postulación';
  }

  if (message.includes('aceptada')) {
    return 'Postulación aceptada';
  }

  if (message.includes('rechazada')) {
    return 'Postulación rechazada';
  }

  return 'Notificación';
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<(() => void) | null>(null);
  const shouldReconnectRef = useRef(true);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${NOTIFICATIONS_API}/`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error(
          '❌ Error cargando notificaciones:',
          response.status
        );
        return;
      }

      const data: { results?: ApiNotification[] } | ApiNotification[] =
        await response.json();

      const results: ApiNotification[] = Array.isArray(data)
        ? data
        : data.results ?? [];

      const normalized: Notification[] = results.map((notification) => ({
        notification_id: String(notification.id_notification),
        title: getNotificationTitle(notification),
        message: notification.message,
        is_read: notification.is_read,
        created_at: notification.created_at,
        type: notification.type,
      }));

      setNotifications(normalized);
      setUnreadCount(
        normalized.filter((notification) => !notification.is_read).length
      );
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSocket = useCallback(async () => {
    const ticket = await fetchWsTicket();

    // disconnect() may have run while the ticket request was in flight.
    if (!shouldReconnectRef.current) {
      return;
    }

    const baseUrl = `${API_WEBSOCKET_BASE}/ws/notifications/`;
    const wsUrl = ticket
      ? `${baseUrl}?ticket=${encodeURIComponent(ticket)}`
      : baseUrl;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'connection_established') {
            return;
          }

          if (data.type === 'new_notification') {
            const notification: Notification = {
              notification_id: String(data.notification_id),
              title: data.title ?? 'Notificación',
              message: data.message ?? '',
              is_read: Boolean(data.is_read ?? false),
              created_at: data.created_at ?? new Date().toISOString(),
              type: data.notification_type,
            };

            setNotifications((prev) => [
              notification,
              ...prev.filter(
                (item) =>
                  item.notification_id !== notification.notification_id
              ),
            ]);

            if (!notification.is_read) {
              setUnreadCount((prev) => prev + 1);
            }

            if (
              'Notification' in window &&
              window.Notification.permission === 'granted'
            ) {
              new window.Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
              });
            }
          }

          if (data.type === 'notification_updated') {
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.notification_id ===
                String(data.notification_id)
                  ? { ...notification, is_read: Boolean(data.is_read) }
                  : notification
              )
            );
          }
        } catch (error) {
          console.error('❌ Error procesando mensaje WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);

        if (!shouldReconnectRef.current) {
          return;
        }

        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, 5000);
      };
    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
      setIsConnected(false);
    }
  }, []);

  const connect = useCallback(() => {
    shouldReconnectRef.current = true;
    void openSocket();
  }, [openSocket]);

  useEffect(() => {
    connectRef.current = connect;

    return () => {
      connectRef.current = null;
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      ws.close();
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `${NOTIFICATIONS_API}/${notificationId}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ is_read: true }),
        }
      );

      if (!response.ok) {
        console.error('❌ Error al marcar como leída:', response.status);
        return;
      }

      setNotifications((prev) => {
        const notification = prev.find(
          (item) => item.notification_id === notificationId
        );

        if (!notification || notification.is_read) {
          return prev;
        }

        return prev.map((item) =>
          item.notification_id === notificationId
            ? { ...item, is_read: true }
            : item
        );
      });

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ Error al marcar como leída:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(
        `${NOTIFICATIONS_API}/${notificationId}/`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok && response.status !== 204) {
        console.error('❌ Error al eliminar:', response.status);
        return;
      }

      setNotifications((prev) => {
        const notification = prev.find(
          (item) => item.notification_id === notificationId
        );

        if (notification && !notification.is_read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }

        return prev.filter(
          (item) => item.notification_id !== notificationId
        );
      });
    } catch (error) {
      console.error('❌ Error al eliminar:', error);
    }
  }, []);

  const ping = useCallback(() => {
    sendMessage({ type: 'ping' });
  }, [sendMessage]);

  useEffect(() => {
    if (
      'Notification' in window &&
      window.Notification.permission === 'default'
    ) {
      void window.Notification.requestPermission();
    }

    const startupTimeout = setTimeout(() => {
      void loadNotifications();
      connect();
    }, 0);

    return () => {
      clearTimeout(startupTimeout);
      disconnect();
    };
  }, [connect, disconnect, loadNotifications]);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      if (isConnected) {
        ping();
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isConnected, ping]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    loadNotifications,
    markAsRead,
    deleteNotification,
    sendMessage,
    connect,
    disconnect,
  };
}