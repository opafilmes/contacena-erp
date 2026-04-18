import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["#8b5cf6","#6d28d9","#4c1d95","#7c3aed","#a78bfa","#c4b5fd","#ddd6fe"];

export default function InventarioChart({ equipments, bookings }) {
  // Conta bookings por equipment_id
  const bookingCount = {};
  bookings.forEach(b => { bookingCount[b.equipment_id] = (bookingCount[b.equipment_id] || 0) + 1; });

  const data = equipments
    .filter(e => bookingCount[e.id])
    .map(e => ({ name: e.nome_item.length > 14 ? e.nome_item.slice(0, 14) + "…" : e.nome_item, bookings: bookingCount[e.id] || 0 }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 8);

  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
      <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mb-3">Equipamentos Mais Locados</p>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            cursor={{ fill: "rgba(139,92,246,0.08)" }}
            formatter={(v) => [v, "reservas"]}
          />
          <Bar dataKey="bookings" radius={[4,4,0,0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}