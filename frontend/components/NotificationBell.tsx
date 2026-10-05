'use client';

import { Bell, Trash2, Check } from 'lucide-react';
import { useNotifications } from '../hooks/useNotification';
import { useState } from 'react';

export function NotificationBell() {
  const { notifications, unreadCount, isConnected, markAsRead, deleteNotification } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative text-gray-500 hover:text-gray-700"
      >
        <Bell size={20} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}

        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="font-semibold text-gray-800">Notificaciones</h3>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No hay notificaciones
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notif) => (
                <div 
                  key={notif.notification_id} 
                  className={`p-4 flex justify-between items-start gap-3 ${!notif.is_read ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-gray-800">{notif.title}</h4>
                    <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                    <small className="text-xs text-gray-400 block mt-1">
                      {notif.created_at}
                    </small>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {!notif.is_read && (
                      <button
                        onClick={() => markAsRead(notif.notification_id)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteNotification(notif.notification_id)}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}