// client/src/components/ConnectionBadge.jsx
import React from "react";

const LABELS = {
  connected: "Connected",
  connecting: "Connecting…",
  disconnected: "Disconnected",
  error: "Connection error",
};

export default function ConnectionBadge({ status }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge-dot" />
      {LABELS[status] || status}
    </span>
  );
}
