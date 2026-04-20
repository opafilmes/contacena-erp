import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/utils/format";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import {
  ArrowUpCircle, ArrowDownCircle, Check, AlertTriangle,
  TrendingUp, TrendingDown, Trash2, Plus, Link2, Loader2, RefreshCw
} from "lucide-react";
import StatusPill from "./StatusPill";
import AccountPayableDrawer from "./AccountPayableDrawer";
import AccountReceivableDrawer from "./AccountReceivableDrawer";

// ─── Matching engine ──────────────────────────────────────────────────────────
function findMatches(staging, receivables, payables) {
  const list = staging.type === "receber"
    ? receivables.filter(r => r.status !== "Recebido" && r.status !== "Aguardando Conciliação")
    : payables.filter(p => p.status !== "Pago" && p.status !== "Aguardando Conciliação");

  const stagingDate = new Date(staging.data_vencimento || "2000-01-01");
  const stagingVal = staging.valor || 0;

  return list
    .map(r => ({
      ...r,
      _daysDiff: Math.abs(differenceInDays(new Date(r.data_vencimento || "2000-01-01"), stagingDate)),
      _valDiff: Math.abs((r.valor || 0) - stagingVal),
      _pct: stagingVal > 0 ? Math.abs((r.valor || 0) - stagingVal) / stagingVal : 1,
    }))
    .sort((a, b) => a._valDiff - b._valDiff || a._daysDiff - b._daysDiff)
    .slice(0, 20);
}

// ─── Painel de matches (lado direito) ─────────────────────────────────────────
function MatchPanel({ selected, receivables, payables, tenantId, categories, clients, suppliers, jobs, bankAccounts, onDone }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const matches = useMemo(
    () => selected ? findMatches(selected, receivables, payables) : [],
    [selected, receivables, payables]
  );

  const toggle = (id) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const selectedItems = matches.filter(m => selectedIds.includes(m.id));
  const totalSel = selectedItems.reduce((s, m) => s + (m.valor || 0), 0);
  const entryAmt = selected?.valor || 0;
  const diff = entryAmt - totalSel;
  const hasDiff = Math.abs(diff) > 0.01;

  useEffect(() => { setSelectedIds([]); }, [selected?.id]);

  const handleConciliar = async () => {
    if (!selectedIds.length) { toast.error("Selecione ao menos um lançamento."); return; }
    setConfirming(true);
    try {
      const entity = selected.type === "receber" ? "AccountReceivable" : "AccountPayable";
      const paidStatus = selected.type === "receber" ? "Recebido" : "Pago";

      // Mark matched records as paid
      await Promise.all(selectedItems.map(item =>
        base44.entities[entity].update(item.id, { status: paidStatus })
      ));

      // Adjust if diff
      if (hasDiff) {
        const adjDesc = diff > 0 ? "Multas e Juros (conciliação OFX)" : "Desconto (conciliação OFX)";
        if (selected.type === "receber") {
          await base44.entities.AccountReceivable.create({
            descricao: adjDesc, valor: Math.abs(diff),
            data_vencimento: selected.data_vencimento, status: "Recebido", inquilino_id: tenantId,
          });
        } else {
          await base44.entities.AccountPayable.create({
            descricao: adjDesc, valor: Math.abs(diff),
            data_vencimento: selected.data_vencimento, status: "Pago", inquilino_id: tenantId,
          });
        }
      }

      // Mark staging entry as Conciliado → becomes visible in Extrato
      const stagingEntity = selected.type === "receber" ? "AccountReceivable" : "AccountPayable";
      await base44.entities[stagingEntity].update(selected.id, { status: paidStatus });

      toast.success("Conciliação realizada com sucesso!");
      onDone();
    } catch {
      toast.error("Erro ao conciliar.");
    }
    setConfirming(false);
  };

  // Called by drawer after saving the new record — conciliates the staging entry
  const handleNovoSaved = async (newRecordId) => {
    setDrawerOpen(false);
    if (!selected || !newRecordId) return;
    try {
      const entity = selected.type === "receber" ? "AccountReceivable" : "AccountPayable";
      const paidStatus = selected.type === "receber" ? "Recebido" : "Pago";
      // Mark the staging OFX entry as conciliated
      await base44.entities[entity].update(selected.id, { status: paidStatus });
      toast.success("Lançamento criado e conciliado!");
      onDone();
    } catch {
      toast.error("Erro ao conciliar após criação.");
    }
  };

  const handleIgnorar = async () => {
    if (!selected) return;
    try {
      const entity = selected.type === "receber" ? "AccountReceivable" : "AccountPayable";
      await base44.entities[entity].delete(selected.id);
      toast.success("Lançamento ignorado e removido.");
      onDone();
    } catch {
      toast.error("Erro ao remover lançamento.");
    }
  };

  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Link2 className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Selecione um item à esquerda para ver as sugestões</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Entry info */}
      <div className="p-4 border-b border-border/30 bg-secondary/20 space-y-2">
        <div className="flex items-center gap-2">
          {selected.type === "receber"
            ? <ArrowUpCircle className="w-5 h-5 text-green-400 shrink-0" />
            : <ArrowDownCircle className="w-5 h-5 text-red-400 shrink-0" />}
          <span className={`font-heading font-bold text-lg ${selected.type === "receber" ? "text-green-400" : "text-red-400"}`}>
            {formatBRL(entryAmt)}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">
            {selected.data_vencimento ? format(new Date(selected.data_vencimento + "T12:00:00"), "dd/MM/yyyy") : "—"}
          </span>
        </div>
        <p className="text-sm text-foreground/80 truncate">{selected.descricao}</p>

        {selectedIds.length > 0 && (
          <div className={`flex items-center justify-between text-xs px-2 py-1.5 rounded-lg ${hasDiff ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}>
            <span className="flex items-center gap-1">
              {hasDiff ? <TrendingUp className="w-3 h-3" /> : <Check className="w-3 h-3" />}
              {hasDiff ? (diff > 0 ? `Juros/Multa: ${formatBRL(diff)}` : `Desconto: ${formatBRL(Math.abs(diff))}`) : "Valores batem!"}
            </span>
            <span>Sel: {formatBRL(totalSel)}</span>
          </div>
        )}
      </div>

      {/* Match list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
          {matches.length > 0 ? `${matches.length} sugestão(ões) encontrada(s)` : "Nenhuma sugestão"}
        </p>
        {matches.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Nenhum lançamento pendente compatível.
          </div>
        ) : matches.map(m => {
          const isSel = selectedIds.includes(m.id);
          return (
            <div
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${isSel ? "bg-primary/10 border-primary/30" : "border-border/30 hover:bg-white/[0.03]"}`}
            >
              <div className={`w-4 h-4 rounded shrink-0 border flex items-center justify-center ${isSel ? "bg-primary border-primary" : "border-border"}`}>
                {isSel && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/85 truncate">{m.descricao}</p>
                <p className="text-xs text-muted-foreground">
                  {m.data_vencimento ? format(new Date(m.data_vencimento + "T12:00:00"), "dd/MM/yyyy") : "—"}
                  {m._daysDiff <= 5 && <span className="ml-1.5 text-green-400">● próximo</span>}
                  {m._pct <= 0.05 && <span className="ml-1.5 text-violet-400">● valor próximo</span>}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-semibold tabular-nums ${selected.type === "receber" ? "text-green-400" : "text-red-400"}`}>
                  {formatBRL(m.valor)}
                </p>
                <StatusPill status={m.status} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="p-3 border-t border-border/30 space-y-2">
        <Button
          className="w-full bg-violet-600 hover:bg-violet-500 gap-1.5"
          onClick={handleConciliar}
          disabled={confirming || !selectedIds.length}
        >
          {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Conciliar Selecionados
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" onClick={() => setDrawerOpen(true)} className="gap-1 text-xs">
            <Plus className="w-3 h-3" /> Criar Novo Lançamento
          </Button>
          <Button variant="outline" size="sm" onClick={handleIgnorar} className="gap-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
            <Trash2 className="w-3 h-3" /> Ignorar / Excluir
          </Button>
        </div>
      </div>

      {/* Drawers pré-preenchidos */}
      {selected?.type === "pagar" ? (
        <AccountPayableDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          record={{ descricao: selected.descricao, valor: selected.valor, data_vencimento: selected.data_vencimento }}
          tenantId={tenantId}
          categories={categories}
          suppliers={suppliers}
          bankAccounts={bankAccounts}
          onSaved={() => {}}
          onSavedWithId={handleNovoSaved}
        />
      ) : (
        <AccountReceivableDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          record={{ descricao: selected?.descricao, valor: selected?.valor, data_vencimento: selected?.data_vencimento }}
          tenantId={tenantId}
          categories={categories}
          clients={clients}
          jobs={jobs}
          bankAccounts={bankAccounts}
          onSaved={() => {}}
          onSavedWithId={handleNovoSaved}
        />
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CentralDeConciliacao({ staging, receivables, payables, tenantId, onRefresh, categories, clients, suppliers, jobs, bankAccounts }) {
  const [selectedStaging, setSelectedStaging] = useState(null);

  const pendingStaging = staging.filter(s => s.status === "Aguardando Conciliação");

  const handleDone = () => {
    setSelectedStaging(null);
    onRefresh();
  };

  if (pendingStaging.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Check className="w-12 h-12 mb-4 text-green-400 opacity-60" />
        <p className="text-base font-medium text-foreground">Nenhum lançamento aguardando conciliação</p>
        <p className="text-sm mt-1">Todos os lançamentos OFX importados já foram conciliados.</p>
        <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4" /> Atualizar
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/40 overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: 480, maxHeight: 680 }}>
      {/* LEFT: staging list */}
      <div className="lg:w-[45%] shrink-0 border-b lg:border-b-0 lg:border-r border-border/40 flex flex-col overflow-hidden">
        <div className="px-4 py-3 bg-secondary/20 border-b border-border/30 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">A Conciliar</p>
            <p className="text-xs text-muted-foreground mt-0.5">{pendingStaging.length} lançamento(s) importado(s)</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onRefresh}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {pendingStaging.map(s => {
            const isSel = selectedStaging?.id === s.id;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedStaging(s)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer border transition-colors ${isSel ? "bg-violet-500/10 border-violet-500/30" : "border-border/30 hover:bg-white/[0.03]"}`}
              >
                {s.type === "receber"
                  ? <ArrowUpCircle className="w-4 h-4 text-green-400 shrink-0" />
                  : <ArrowDownCircle className="w-4 h-4 text-red-400 shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate text-foreground/85">{s.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.data_vencimento ? format(new Date(s.data_vencimento + "T12:00:00"), "dd/MM/yyyy") : "—"}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums shrink-0 ${s.type === "receber" ? "text-green-400" : "text-red-400"}`}>
                  {formatBRL(s.valor)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: matches */}
      <MatchPanel
        selected={selectedStaging}
        receivables={receivables}
        payables={payables}
        tenantId={tenantId}
        categories={categories}
        clients={clients}
        suppliers={suppliers}
        jobs={jobs}
        bankAccounts={bankAccounts}
        onDone={handleDone}
      />
    </div>
  );
}