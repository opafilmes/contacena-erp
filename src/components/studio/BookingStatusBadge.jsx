import React from "react";

const STATUS_STYLES = {
  "Pendente":  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Em Uso":    "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Concluída": "bg-green-500/15 text-green-400 border-green-500/30",
};

export default function BookingStatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status || "—"}
    </span>
  );
}