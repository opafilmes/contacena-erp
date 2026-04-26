import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Clapperboard, Calendar, Package, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_KANBAN_COLOR = {
  "Pré-produção": "border-zinc-500/50 text-zinc-400",
  "Captação": "border-sky-500/50 text-sky-400",
  "Edição": "border-violet-500/50 text-violet-400",
  "Finalizado": "border-emerald-500/50 text-emerald-400",
};

export default function DashboardStudio() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [eq, bk, jb] = await Promise.all([
      base44.entities.Equipment.filter({ tenant_id: tenantId }),
      base44.entities.EquipmentBooking.filter({ inquilino_id: tenantId }),
      base44.entities.Job.filter({ tenant_id: tenantId }),
    ]);
    setEquipment(eq);
    setBookings(bk);
    setJobs(jb);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  // Equipment status counts
  const now = new Date();
  const emUso = bookings.filter(b => new Date(b.data_inicio) <= now && new Date(b.data_fim) >= now).length;
  const manutencao = equipment.filter(e => e.status_manutencao).length;
  const disponiveis = Math.max(0, equipment.length - manutencao - emUso);

  const pieData = [
    { name: "Disponível", value: disponiveis, color: "#22c55e" },
    { name: "Em Uso", value: emUso, color: "#f59e0b" },
    { name: "Manutenção", value: manutencao, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Next 3 active jobs (not finalized)
  const activeJobs = jobs
    .filter(j => j.status_kanban !== "Finalizado")
    .slice(0, 3);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">Carregando dashboard...</div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Dashboard Studio</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Visão operacional das produções</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Equipamentos</p>
          </div>
          <p className="text-2xl font-bold font-heading text-emerald-400">{equipment.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{disponiveis} disponíveis agora</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clapperboard className="w-4 h-4 text-sky-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Jobs Ativos</p>
          </div>
          <p className="text-2xl font-bold font-heading text-sky-400">{activeJobs.length}</p>
          <p className="text-xs text-zinc-500 mt-1">de {jobs.length} total</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Em Uso Agora</p>
          </div>
          <p className="text-2xl font-bold font-heading text-amber-400">{emUso}</p>
          <p className="text-xs text-zinc-500 mt-1">{manutencao} em manutenção</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Equipment Pie Chart */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
          <p className="text-sm font-semibold text-zinc-300 mb-4">Status dos Equipamentos</p>
          {pieData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-zinc-600 text-sm">Nenhum equipamento cadastrado.</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#a1a1aa", fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Upcoming Jobs */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-300">Próximas Produções</p>
            <Link to="/app/producao" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Ver todos →</Link>
          </div>
          {activeJobs.length === 0 ? (
            <div className="h-[160px] flex items-center justify-center text-zinc-600 text-sm">Nenhum job ativo.</div>
          ) : (
            <div className="space-y-3">
              {activeJobs.map(job => (
                <div key={job.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Clapperboard className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 font-medium truncate">{job.titulo}</p>
                    <p className={`text-xs border-l-2 pl-1.5 mt-0.5 ${STATUS_KANBAN_COLOR[job.status_kanban] || "text-zinc-500 border-zinc-600"}`}>
                      {job.status_kanban}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}