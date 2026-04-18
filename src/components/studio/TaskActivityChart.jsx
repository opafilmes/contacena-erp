import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { isBefore, startOfDay } from "date-fns";

const COLORS = {
  "Concluídas": "#22c55e",
  "A Fazer":    "#f59e0b",
  "Atrasadas":  "#ef4444",
};

export default function TaskActivityChart({ tasks }) {
  const masterTasks = tasks.filter(t => !t.parent_task_id);
  const today = startOfDay(new Date());

  const atrasadas  = masterTasks.filter(t => t.status === "A Fazer" && t.data_vencimento && isBefore(new Date(t.data_vencimento), today)).length;
  const afazer     = masterTasks.filter(t => t.status === "A Fazer" && (!t.data_vencimento || !isBefore(new Date(t.data_vencimento), today))).length;
  const concluidas = masterTasks.filter(t => t.status === "Concluída").length;
  const total = masterTasks.length;

  const data = [
    { name: "Concluídas", value: concluidas },
    { name: "A Fazer",    value: afazer },
    { name: "Atrasadas",  value: atrasadas },
  ].filter(d => d.value > 0);

  if (total === 0) return null;

  return (
    <div className="bg-card/40 border border-border/40 rounded-2xl p-5 mb-5 flex items-center gap-6">
      {/* Pie */}
      <div className="w-28 h-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={28} outerRadius={52} dataKey="value" strokeWidth={0}>
              {data.map(entry => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "hsl(225 20% 10%)", border: "1px solid hsl(225 15% 18%)", borderRadius: 8 }}
              labelStyle={{ color: "white" }}
              itemStyle={{ color: "#aaa" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        <Stat label="Concluídas" value={concluidas} color="text-green-400" bg="bg-green-500/10" />
        <Stat label="A Fazer"    value={afazer}     color="text-amber-400" bg="bg-amber-500/10" />
        <Stat label="Atrasadas"  value={atrasadas}  color="text-red-400"   bg="bg-red-500/10"   />
      </div>
    </div>
  );
}

function Stat({ label, value, color, bg }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl p-3 ${bg}`}>
      <span className={`text-2xl font-bold font-heading ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}