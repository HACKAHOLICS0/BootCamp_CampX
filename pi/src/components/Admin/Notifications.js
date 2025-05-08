import React from 'react';
import {  ShoppingCart, UserPlus, AlertTriangle } from 'lucide-react';
import './AdminStyle.css';

const notifications = [
  {
    id: 1,
    icon: ShoppingCart,
    title: "New Order Received",
    message: "Order #12345 has been placed and is awaiting processing.",
    time: "2 hours ago",
    type: "order"
  },
  {
    id: 2,
    icon: UserPlus,
    title: "New User Registration",
    message: "Sarah Johnson has joined the platform.",
    time: "4 hours ago",
    type: "user"
  },
  {
    id: 3,
    icon: AlertTriangle,
    title: "System Alert",
    message: "Server load has reached 85% capacity.",
    time: "5 hours ago",
    type: "alert"
  }
];

const Notifications = () => (
  <div className="content-section">
    <h2>Notifications</h2>
    <div className="notification-list">
      {notifications.map((notification) => {
        const Icon = notification.icon;
        return (
          <div key={notification.id} className={`notification-item ${notification.type}`}>
            <div className="notification-icon">
              <Icon size={24} />
            </div>
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span className="notification-time">{notification.time}</span>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default Notifications;