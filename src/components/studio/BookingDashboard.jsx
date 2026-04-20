import React, { useMemo } from "react";
import { isToday, isPast, isFuture } from "date-fns";
import { AlertTriangle, Calendar, Truck, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const PIE_COLORS = ["#22c55e", "#38bdf8", "#f59e0b", "#ef4444"];

export default function BookingDashboard({ bookings, equipments }) {
  const stats = useMemo(() => {
    const hoje = new Date();
    const emUso = bookings.filter(b => b.status === "Em Uso").length;
    const paraHoje = bookings.filter(b => b.status === "Pendente" && isToday(new Date(b.data_inicio))).length;
    const atrasadas = bookings.filter(b =>
      (b.status === "Em Uso" || b.status === "Pendente") && isPast(new Date(b.data_fim))
    ).length;
    return { emUso, paraHoje, atrasadas };
  }, [bookings]);

  // Ranking: Equipamentos Mais Reservados
  const rankingData = useMemo(() => {
    const counts = {};
    bookings.forEach(b => {
      const ids = b.equipment_ids?.length ? b.equipment_ids : b.equipment_id ? [b.equipment_id] : [];
      ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([id, count]) => ({ name: equipments.find(e => e.id === id)?.nome_item || "?", count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [bookings, equipments]);

  // Rosca: Status da Frota
  const statusData = useMemo(() => {
    const total = equipments.length;
    const emUsoIds = new Set(
      bookings.filter(b => b.status === "Em Uso")
        .flatMap(b => b.equipment_ids?.length ? b.equipment_ids : b.equipment_id ? [b.equipment_id] : [])
    );
    const manutencao = equipments.filter(e => e.status_manutencao).length;
    const emUso = emUsoIds.size;
    const disponivel = Math.max(0, total - emUso - manutencao);
    return [
      { name: "Disponível", value: disponivel },
      { name: "Em Uso", value: emUso },
      { name: "Manutenção", value: manutencao },
    ].filter(d => d.value > 0);
  }, [bookings, equipments]);

  const cards = [
    { label: "Em Campo Agora", value: stats.emUso, icon: Truck, color: "sky" },
    { label: "Retiradas Hoje", value: stats.paraHoje, icon: Calendar, color: "violet" },
    { label: "Devoluções Atrasadas", value: stats.atrasadas, icon: AlertTriangle, color: stats.atrasadas > 0 ? "red" : "green" },
  ];

  return (
    <div className="space-y-5 mb-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        {cards.map(c => (
          <div key={c.label} className={`rounded-xl border border-${c.color}-500/20 bg-${c.color}-500/10 p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg bg-white/[0.05] text-${c.color}-400`}>
              <c.icon className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className={`text-2xl font-heading font-bold text-${c.color}-400`}>{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {(rankingData.length > 0 || statusData.length > 0) && (
        <div className="grid grid-cols-2 gap-4">
          {/* Ranking bar */}
          {rankingData.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-sm font-medium text-foreground mb-3">Equipamentos Mais Locados</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={rankingData} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={90} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Status pie */}
          {statusData.length > 0 && (
            <div className="rounded-xl border border-border bg-card/60 p-4">
              <p className="text-sm font-medium text-foreground mb-3">Status da Frota</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {statusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}