import React from "react";

const PILL_STYLES = {
  Pago:      "border-green-500/50 text-green-400",
  Recebido:  "border-green-500/50 text-green-400",
  Pendente:  "border-yellow-500/50 text-yellow-400",
  Atrasado:  "border-red-500/50 text-red-400",
};

export default function StatusPill({ status }) {
  const style = PILL_STYLES[status] || "border-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-transparent ${style}`}>
      {status}
    </span>
  );
}