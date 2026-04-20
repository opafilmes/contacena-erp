import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/utils/format";
import { format, eachDayOfInterval, parseISO, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer, Download, TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";

const TODAY = format(new Date(), "yyyy-MM-dd");
const MONTH_START = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

function exportCSV(filename, headers, rows) {
  const lines = [headers.join(";"), ...rows.map(r => r.join(";"))];
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename + ".csv"; a.click();
  URL.revokeObjectURL(url);
}

function DateFilters({ from, to, setFrom, setTo }) {
  return (
    <div className="flex flex-wrap items-end gap-3 mb-4 print:hidden">
      <div className="space-y-1">
        <Label className="text-xs">De</Label>
        <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8 text-sm w-40" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Até</Label>
        <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8 text-sm w-40" />
      </div>
    </div>
  );
}

function ActionButtons({ onExport, onPrint }) {
  return (
    <div className="flex gap-2 print:hidden">
      <Button size="sm" variant="outline" onClick={onExport} className="gap-1.5 text-xs">
        <Download className="w-3.5 h-3.5" /> Exportar CSV
      </Button>
      <Button size="sm" variant="outline" onClick={onPrint} className="gap-1.5 text-xs">
        <Printer className="w-3.5 h-3.5" /> Imprimir / PDF
      </Button>
    </div>
  );
}

// ── DRE Gerencial ──
function DREReport({ receivables, payables, categories }) {
  const [from, setFrom] = useState(MONTH_START);
  const [to, setTo] = useState(TODAY);

  const recInPeriod = receivables.filter(r => r.data_vencimento >= from && r.data_vencimento <= to);
  const payInPeriod = payables.filter(p => p.data_vencimento >= from && p.data_vencimento <= to);

  const totalReceitas = recInPeriod.filter(r => r.status === "Recebido").reduce((s, r) => s + (r.valor || 0), 0);
  const totalDespesas = payInPeriod.filter(p => p.status === "Pago").reduce((s, p) => s + (p.valor || 0), 0);
  const resultado = totalReceitas - totalDespesas;

  const recByCategory = recInPeriod.reduce((acc, r) => {
    const cat = categories.find(c => c.id === r.category_id)?.nome || "Sem categoria";
    acc[cat] = (acc[cat] || 0) + (r.valor || 0); return acc;
  }, {});
  const payByCategory = payInPeriod.reduce((acc, p) => {
    const cat = categories.find(c => c.id === p.category_id)?.nome || "Sem categoria";
    acc[cat] = (acc[cat] || 0) + (p.valor || 0); return acc;
  }, {});

  const handleExport = () => {
    exportCSV("DRE_Gerencial", ["Tipo", "Categoria", "Valor (R$)"], [
      ...Object.entries(recByCategory).map(([k, v]) => ["Receita", k, v.toFixed(2)]),
      ...Object.entries(payByCategory).map(([k, v]) => ["Despesa", k, v.toFixed(2)]),
      ["RESULTADO", "", resultado.toFixed(2)],
    ]);
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <ActionButtons onExport={handleExport} onPrint={() => window.print()} />
      </div>

      <div id="print-container">
        <h2 className="font-heading text-lg font-bold mb-4 text-foreground print:text-black">DRE Gerencial</h2>
        <p className="text-xs text-muted-foreground mb-4 print:text-gray-500">Período: {from} a {to}</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Receitas", value: totalReceitas, color: "text-green-400" },
            { label: "Total Despesas", value: totalDespesas, color: "text-red-400" },
            { label: "Resultado", value: resultado, color: resultado >= 0 ? "text-green-400" : "text-red-400" },
          ].map(c => (
            <div key={c.label} className="rounded-xl border border-border/40 bg-card/50 p-4 print:bg-white print:border-gray-200">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-xl font-bold font-heading ${c.color} print:text-black`}>{formatBRL(c.value)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-foreground mb-2 print:text-black">Receitas por Categoria</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/30"><th className="text-left py-1.5 text-xs text-muted-foreground">Categoria</th><th className="text-right py-1.5 text-xs text-muted-foreground">Valor</th></tr></thead>
              <tbody>{Object.entries(recByCategory).map(([k, v]) => (
                <tr key={k} className="border-b border-border/20"><td className="py-1.5 text-foreground print:text-black">{k}</td><td className="text-right text-green-400 font-medium print:text-green-700">{formatBRL(v)}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground mb-2 print:text-black">Despesas por Categoria</p>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/30"><th className="text-left py-1.5 text-xs text-muted-foreground">Categoria</th><th className="text-right py-1.5 text-xs text-muted-foreground">Valor</th></tr></thead>
              <tbody>{Object.entries(payByCategory).map(([k, v]) => (
                <tr key={k} className="border-b border-border/20"><td className="py-1.5 text-foreground print:text-black">{k}</td><td className="text-right text-red-400 font-medium print:text-red-700">{formatBRL(v)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fluxo de Caixa ──
function FluxoCaixaReport({ receivables, payables }) {
  const [from, setFrom] = useState(MONTH_START);
  const [to, setTo] = useState(TODAY);

  const days = useMemo(() => {
    if (!from || !to || from > to) return [];
    return eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });
  }, [from, to]);

  const chartData = useMemo(() => days.map(day => {
    const d = format(day, "yyyy-MM-dd");
    const rec = receivables.filter(r => r.data_vencimento === d).reduce((s, r) => s + (r.valor || 0), 0);
    const pay = payables.filter(p => p.data_vencimento === d).reduce((s, p) => s + (p.valor || 0), 0);
    const recReal = receivables.filter(r => r.data_vencimento === d && r.status === "Recebido").reduce((s, r) => s + (r.valor || 0), 0);
    const payReal = payables.filter(p => p.data_vencimento === d && p.status === "Pago").reduce((s, p) => s + (p.valor || 0), 0);
    return { dia: format(day, "dd/MM"), previsto: rec - pay, realizado: recReal - payReal };
  }), [days, receivables, payables]);

  const handleExport = () => {
    exportCSV("Fluxo_de_Caixa", ["Data", "Previsto (R$)", "Realizado (R$)"],
      chartData.map(r => [r.dia, r.previsto.toFixed(2), r.realizado.toFixed(2)])
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <ActionButtons onExport={handleExport} onPrint={() => window.print()} />
      </div>
      <div id="print-container">
        <h2 className="font-heading text-lg font-bold mb-4 text-foreground print:text-black">Fluxo de Caixa</h2>
        <p className="text-xs text-muted-foreground mb-4 print:text-gray-500">Período: {from} a {to} · Previsto vs. Realizado</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2231" />
            <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatBRL(v)} contentStyle={{ background: "#1a1d2e", border: "1px solid #2a2d3e" }} />
            <Bar dataKey="previsto" name="Previsto" fill="#6366f1" radius={[4,4,0,0]} />
            <Bar dataKey="realizado" name="Realizado" fill="#22c55e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Inadimplência ──
function InadimplenciaReport({ receivables, clients }) {
  const [from, setFrom] = useState("2020-01-01");
  const [to, setTo] = useState(TODAY);

  const inadimplentes = receivables.filter(r =>
    r.status !== "Recebido" && r.data_vencimento && r.data_vencimento < TODAY &&
    r.data_vencimento >= from && r.data_vencimento <= to
  );

  const total = inadimplentes.reduce((s, r) => s + (r.valor || 0), 0);

  const handleExport = () => {
    exportCSV("Inadimplencia", ["Descrição", "Cliente", "Vencimento", "Valor (R$)", "Status"],
      inadimplentes.map(r => [
        r.descricao,
        clients.find(c => c.id === r.client_id)?.nome_fantasia || "—",
        r.data_vencimento,
        (r.valor || 0).toFixed(2),
        r.status
      ])
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <ActionButtons onExport={handleExport} onPrint={() => window.print()} />
      </div>
      <div id="print-container">
        <h2 className="font-heading text-lg font-bold mb-2 text-foreground print:text-black">Inadimplência</h2>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 print:hidden" />
          <span className="text-sm text-muted-foreground">{inadimplentes.length} lançamento(s) em atraso · Total: <strong className="text-amber-400">{formatBRL(total)}</strong></span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/30 bg-secondary/20 print:bg-gray-100">
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Descrição</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Cliente</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Vencimento</th>
              <th className="text-right px-3 py-2 text-xs text-muted-foreground">Valor</th>
              <th className="text-left px-3 py-2 text-xs text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {inadimplentes.map(r => (
              <tr key={r.id} className="border-b border-border/20 hover:bg-white/[0.02]">
                <td className="px-3 py-2 text-foreground print:text-black">{r.descricao}</td>
                <td className="px-3 py-2 text-muted-foreground">{clients.find(c => c.id === r.client_id)?.nome_fantasia || "—"}</td>
                <td className="px-3 py-2 text-red-400 font-medium print:text-red-700">{r.data_vencimento ? format(parseISO(r.data_vencimento), "dd/MM/yyyy") : "—"}</td>
                <td className="px-3 py-2 text-right font-medium text-foreground print:text-black">{formatBRL(r.valor)}</td>
                <td className="px-3 py-2 text-amber-400 print:text-amber-700">{r.status}</td>
              </tr>
            ))}
            {inadimplentes.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">Nenhum lançamento em atraso no período.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Despesas por Categoria ──
function DespesasCategoriaReport({ payables, categories }) {
  const [from, setFrom] = useState(MONTH_START);
  const [to, setTo] = useState(TODAY);

  const filtered = payables.filter(p => p.data_vencimento >= from && p.data_vencimento <= to);

  const byCategory = filtered.reduce((acc, p) => {
    const cat = categories.find(c => c.id === p.category_id)?.nome || "Sem categoria";
    acc[cat] = (acc[cat] || 0) + (p.valor || 0); return acc;
  }, {});

  const chartData = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((s, c) => s + c.value, 0);
  const COLORS = ["#6366f1","#f59e0b","#ec4899","#10b981","#3b82f6","#ef4444","#8b5cf6","#14b8a6"];

  const handleExport = () => {
    exportCSV("Despesas_por_Categoria", ["Categoria", "Valor (R$)", "% Total"],
      chartData.map(r => [r.name, r.value.toFixed(2), total > 0 ? ((r.value/total)*100).toFixed(1) + "%" : "0%"])
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <DateFilters from={from} to={to} setFrom={setFrom} setTo={setTo} />
        <ActionButtons onExport={handleExport} onPrint={() => window.print()} />
      </div>
      <div id="print-container">
        <h2 className="font-heading text-lg font-bold mb-4 text-foreground print:text-black">Despesas por Categoria</h2>
        <p className="text-xs text-muted-foreground mb-4 print:text-gray-500">Período: {from} a {to}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${(percent*100).toFixed(0)}%`}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={v => formatBRL(v)} contentStyle={{ background: "#1a1d2e", border: "1px solid #2a2d3e" }} />
            </PieChart>
          </ResponsiveContainer>
          <table className="w-full text-sm self-start">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-1.5 text-xs text-muted-foreground">Categoria</th>
                <th className="text-right py-1.5 text-xs text-muted-foreground">Valor</th>
                <th className="text-right py-1.5 text-xs text-muted-foreground">%</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((r, i) => (
                <tr key={r.name} className="border-b border-border/20">
                  <td className="py-1.5 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-foreground print:text-black">{r.name}</span>
                  </td>
                  <td className="text-right font-medium text-foreground print:text-black">{formatBRL(r.value)}</td>
                  <td className="text-right text-muted-foreground">{total > 0 ? ((r.value/total)*100).toFixed(1) + "%" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const REPORTS = [
  { id: "dre",        label: "DRE Gerencial",          icon: TrendingUp,     desc: "Receitas x Despesas do período" },
  { id: "fluxo",      label: "Fluxo de Caixa",          icon: BarChart3,      desc: "Previsto vs. Realizado diário" },
  { id: "inadimpl",   label: "Inadimplência",            icon: AlertTriangle,  desc: "Contas a receber em atraso" },
  { id: "categorias", label: "Despesas por Categoria",   icon: TrendingDown,   desc: "Visão analítica de gastos" },
];

export default function RelatoriosFinanceiros({ receivables, payables, categories, clients }) {
  const [active, setActive] = useState("dre");

  return (
    <div className="space-y-6">
      {/* Report selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {REPORTS.map(r => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setActive(r.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                active === r.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border/40 bg-card/30 text-muted-foreground hover:bg-card/60"
              }`}
            >
              <Icon className="w-4 h-4 mb-2" />
              <p className="text-sm font-medium">{r.label}</p>
              <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Active report */}
      <div className="bg-card/40 border border-border/40 rounded-2xl p-5">
        {active === "dre"        && <DREReport receivables={receivables} payables={payables} categories={categories} />}
        {active === "fluxo"      && <FluxoCaixaReport receivables={receivables} payables={payables} />}
        {active === "inadimpl"   && <InadimplenciaReport receivables={receivables} clients={clients} />}
        {active === "categorias" && <DespesasCategoriaReport payables={payables} categories={categories} />}
      </div>
    </div>
  );
}