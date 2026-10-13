"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useNotificationsContext } from "@/context/NotificationContext";

const typeColors: Record<string, string> = {
  postulation: "bg-blue-100 text-blue-600",
  bug: "bg-red-100 text-red-600",
  info: "bg-gray-100 text-gray-500",
  success: "bg-green-100 text-green-600",
  star: "bg-orange-100 text-orange-500",
  user: "bg-purple-100 text-purple-600",
  message: "bg-green-100 text-green-600",
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, markAsRead } =
    useNotificationsContext();

  const handleMarkAllRead = async () => {
    await Promise.all(
      notifications
        .filter((notification) => !notification.is_read)
        .map((notification) => markAsRead(notification.notification_id))
    );
  };

  return (
    <div className="max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Notificaciones
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount} sin leer
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          disabled={isLoading || unreadCount === 0}
          className="flex items-center gap-1 text-xs font-medium text-brand-green hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCheck size={13} />
          Marcar todas como leídas
        </button>
      </div>

      {isLoading ? (
        <p className="py-8 text-center text-sm text-gray-500">
          Cargando notificaciones...
        </p>
      ) : notifications.length === 0 ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <Bell className="mx-auto mb-3 text-gray-400" size={28} />
          <p className="text-sm text-gray-600">
            No tenés notificaciones todavía.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ${
                !notification.is_read ? "border-l-4 border-brand-green" : ""
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  typeColors[notification.type ?? "info"] ?? typeColors.info
                }`}
              >
                <Bell size={14} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col justify-between gap-1 sm:flex-row">
                  <p className="text-sm font-semibold text-gray-800">
                    {notification.title}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatDate(notification.created_at)}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>

                {!notification.is_read && (
                  <button
                    onClick={() =>
                      markAsRead(notification.notification_id)
                    }
                    className="mt-2 text-xs font-medium text-blue-600 hover:underline"
                  >
                    Marcar como leída
                  </button>
                )}
              </div>

              {!notification.is_read && (
                <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-green" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}