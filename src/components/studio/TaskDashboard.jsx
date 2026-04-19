import React, { useMemo } from "react";
import { isBefore, isToday, startOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { AlertTriangle, Clock, CheckCircle2, ListTodo } from "lucide-react";

const STAT_CARDS = [
  { key: "afazer",    label: "A Fazer",    color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: ListTodo },
  { key: "hoje",      label: "Vencem Hoje", color: "text-sky-400",   bg: "bg-sky-500/10",   border: "border-sky-500/20",   icon: Clock },
  { key: "atrasadas", label: "Atrasadas",  color: "text-red-400",   bg: "bg-red-500/10",   border: "border-red-500/20",   icon: AlertTriangle },
  { key: "concluidas",label: "Concluídas", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2 },
];

export default function TaskDashboard({ tasks, usuarios }) {
  const masterTasks = tasks.filter(t => !t.parent_task_id);
  const today = startOfDay(new Date());

  const stats = useMemo(() => {
    const atrasadas  = masterTasks.filter(t => t.status === "A Fazer" && t.data_vencimento && isBefore(new Date(t.data_vencimento), today));
    const hojeList   = masterTasks.filter(t => t.status === "A Fazer" && t.data_vencimento && isToday(new Date(t.data_vencimento)));
    const afazer     = masterTasks.filter(t => t.status === "A Fazer" && (!t.data_vencimento || !isBefore(new Date(t.data_vencimento), today)));
    const concluidas = masterTasks.filter(t => t.status === "Concluída");
    return { afazer: afazer.length, hoje: hojeList.length, atrasadas: atrasadas.length, concluidas: concluidas.length, atrasadasList: atrasadas, hojeList };
  }, [masterTasks]);

  // Productivity by user
  const produtividade = useMemo(() => {
    return usuarios.map(u => {
      const mine = masterTasks.filter(t => {
        const ids = Array.isArray(t.responsavel_ids) ? t.responsavel_ids : (t.responsavel_id ? [t.responsavel_id] : []);
        return ids.includes(u.id);
      });
      return {
        nome: u.nome?.split(" ")[0] || u.email,
        total: mine.length,
        concluidas: mine.filter(t => t.status === "Concluída").length,
      };
    }).filter(u => u.total > 0).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [masterTasks, usuarios]);

  if (masterTasks.length === 0) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ key, label, color, bg, border, icon: Icon }) => (
          <div key={key} className={`rounded-xl border p-4 flex items-center gap-3 ${bg} ${border}`}>
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className={`text-2xl font-bold font-heading ${color}`}>{stats[key]}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produtividade por colaborador */}
        {produtividade.length > 0 && (
          <div className="bg-card/40 border border-border/40 rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Tarefas por Colaborador</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={produtividade} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(225 20% 10%)", border: "1px solid hsl(225 15% 18%)", borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: "white" }}
                />
                <Bar dataKey="total" name="Total" radius={[4, 4, 0, 0]} fill="hsl(250 60% 55%)" />
                <Bar dataKey="concluidas" name="Concluídas" radius={[4, 4, 0, 0]} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Atrasadas + Vencem hoje */}
        <div className="space-y-3">
          {stats.atrasadasList.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Atrasadas ({stats.atrasadasList.length})
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {stats.atrasadasList.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between text-xs py-0.5">
                    <span className="text-foreground/80 truncate flex-1 mr-2">{t.titulo}</span>
                    <span className="text-red-400 shrink-0">{format(new Date(t.data_vencimento), "dd/MM", { locale: ptBR })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.hojeList.length > 0 && (
            <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-4">
              <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Vencem Hoje ({stats.hojeList.length})
              </p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {stats.hojeList.slice(0, 5).map(t => (
                  <p key={t.id} className="text-xs text-foreground/80 truncate py-0.5">{t.titulo}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}