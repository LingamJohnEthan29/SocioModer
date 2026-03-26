// client/src/components/Sidebar.jsx
import React from "react";

export default function Sidebar({ users, currentUsername }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Online</span>
        <span className="sidebar-count">{users.length}</span>
      </div>
      <ul className="user-list">
        {users.map((u) => (
          <li key={u} className="user-item">
            <span className="user-dot" />
            <span className="user-name">
              {u}
              {u === currentUsername && (
                <span className="user-you"> (you)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
