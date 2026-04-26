import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { CheckCircle, Clock, TrendingUp, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/utils/format";
import { toast } from "sonner";

const STATUS_BADGE = {
  "Elaboração": "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
  "Enviada": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Aprovada": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Recusada": "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function DashboardGestao() {
  const { tenant, usuario } = useOutletContext();
  const tenantId = tenant?.id;

  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const [rec, pay, props, cls] = await Promise.all([
      base44.entities.AccountReceivable.filter({ inquilino_id: tenantId }),
      base44.entities.AccountPayable.filter({ inquilino_id: tenantId }),
      base44.entities.Proposal.filter({ tenant_id: tenantId }, "-created_date"),
      base44.entities.Client.filter({ tenant_id: tenantId }),
    ]);
    setReceivables(rec);
    setPayables(pay);
    setProposals(props);
    setClients(cls);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  // Build chart data: last 6 months
  const chartData = (() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = d.toLocaleString("pt-BR", { month: "short" });
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const entradas = receivables
        .filter(r => r.status === "Recebido" && r.data_vencimento?.startsWith(monthStr))
        .reduce((s, r) => s + (r.valor || 0), 0);
      const saidas = payables
        .filter(p => p.status === "Pago" && p.data_vencimento?.startsWith(monthStr))
        .reduce((s, p) => s + (p.valor || 0), 0);
      months.push({ mes: label, Entradas: entradas, Saídas: saidas });
    }
    return months;
  })();

  const totalSaldo = receivables.filter(r => r.status === "Recebido").reduce((s, r) => s + (r.valor || 0), 0)
    - payables.filter(p => p.status === "Pago").reduce((s, p) => s + (p.valor || 0), 0);

  const hoje = new Date().toISOString().slice(0, 10);
  const contasHoje = payables.filter(p => p.status === "Pendente" && p.data_vencimento === hoje);
  const pendentesTotal = payables.filter(p => p.status === "Pendente").reduce((s, p) => s + (p.valor || 0), 0);

  const openProposals = proposals.filter(p => p.status === "Enviada" || p.status === "Elaboração");
  const getClientName = (id) => clients.find(c => c.id === id)?.nome_fantasia || "—";

  const handleAprovar = async (proposal) => {
    setApprovingId(proposal.id);
    try {
      await base44.entities.Proposal.update(proposal.id, { status: "Aprovada" });
      // Auto-create AccountReceivable
      await base44.entities.AccountReceivable.create({
        descricao: `Proposta ${proposal.number} - ${getClientName(proposal.client_id)}`,
        client_id: proposal.client_id,
        valor: proposal.total_value || 0,
        status: "Pendente",
        inquilino_id: tenantId,
      });
      toast.success("Proposta aprovada e conta a receber criada!");
      load();
    } catch {
      toast.error("Erro ao aprovar proposta.");
    } finally {
      setApprovingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">Carregando dashboard...</div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Dashboard Gestão</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Visão executiva da empresa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-violet-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Saldo Realizado</p>
          </div>
          <p className={`text-2xl font-bold font-heading ${totalSaldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatBRL(totalSaldo)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">A Pagar Pendente</p>
          </div>
          <p className="text-2xl font-bold font-heading text-red-400">{formatBRL(pendentesTotal)}</p>
          {contasHoje.length > 0 && (
            <p className="text-xs text-amber-400 mt-1">{contasHoje.length} vencimento(s) hoje</p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Propostas em Aberto</p>
          </div>
          <p className="text-2xl font-bold font-heading text-sky-400">{openProposals.length}</p>
          <p className="text-xs text-zinc-500 mt-1">{formatBRL(openProposals.reduce((s, p) => s + (p.total_value || 0), 0))} em pipeline</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
        <p className="text-sm font-semibold text-zinc-300 mb-4">Entradas vs Saídas (últimos 6 meses)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="mes" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#a1a1aa" }}
              formatter={(v) => formatBRL(v)}
            />
            <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Open Proposals */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800">
          <p className="text-sm font-semibold text-zinc-300">Propostas em Aberto</p>
        </div>
        {openProposals.length === 0 ? (
          <p className="px-5 py-8 text-center text-zinc-600 text-sm">Nenhuma proposta aberta.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left px-5 py-3 text-zinc-500 text-xs uppercase">Nº</th>
                <th className="text-left px-5 py-3 text-zinc-500 text-xs uppercase">Cliente</th>
                <th className="text-left px-5 py-3 text-zinc-500 text-xs uppercase">Valor</th>
                <th className="text-left px-5 py-3 text-zinc-500 text-xs uppercase">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {openProposals.slice(0, 8).map(p => (
                <tr key={p.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-5 py-3 font-mono text-violet-400 text-xs">{p.number}</td>
                  <td className="px-5 py-3 text-zinc-200 font-medium">{getClientName(p.client_id)}</td>
                  <td className="px-5 py-3 text-zinc-300">{formatBRL(p.total_value)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      size="sm"
                      onClick={() => handleAprovar(p)}
                      disabled={approvingId === p.id}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {approvingId === p.id ? "Aprovando..." : "Aprovar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}