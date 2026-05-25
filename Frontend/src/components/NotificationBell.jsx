import { useState, useEffect, useRef } from 'react';
import { HiOutlineBell } from 'react-icons/hi';
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../APIs/notification/notification';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await getUserNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Setup a basic polling or just rely on initial load for now
    const interval = setInterval(fetchNotifications, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white focus:outline-none"
      >
        <HiOutlineBell className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 border border-gray-200">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b">
            <span className="font-bold text-gray-700">Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer ${notification.isRead ? 'opacity-70' : 'bg-blue-50/30'}`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-gray-800">{notification.title}</span>
                    {!notification.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 flex-shrink-0"></span>}
                  </div>
                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">{notification.message}</p>
                  <span className="text-[10px] text-gray-400">
                    {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
