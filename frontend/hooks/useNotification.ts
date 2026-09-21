// hooks/useNotifications.ts
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

const API_BASE = process.env.API_BASE || 'http://localhost:8000/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/notifications/`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        
        const results = data.results || data;
        
        setNotifications(results);
        
        const unread = results.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('❌ Error cargando notificaciones:', error);
    }
  }, []);
  const connect = useCallback(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://localhost:8000/ws/notifications/`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'connection_established') {
          return;
        }

        if (data.type === 'new_notification') {
          setNotifications((prev) => [data, ...prev]);
          setUnreadCount((prev) => prev + 1);

          if (Notification.permission === 'granted') {
            new Notification(data.title, {
              body: data.message,
              icon: '/logo.png',
            });
          }
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);

        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ is_read: true }),
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.notification_id === notificationId
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        console.error('❌ Error al marcar como leída:', response.status);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const response = await fetch(
        `${API_BASE}/notifications/${notificationId}/`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok || response.status === 204) {
        setNotifications((prev) =>
          prev.filter((notif) => notif.notification_id !== notificationId)
        );
      } else {
        console.error('❌ Error al eliminar:', response.status);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }, []);

  const ping = useCallback(() => {
    sendMessage({ type: 'ping' });
  }, [sendMessage]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    loadNotifications();
    connect();

    return () => disconnect();
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
    markAsRead,
    deleteNotification,
    sendMessage,
    connect,
    disconnect,
  };
}