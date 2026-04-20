import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ArrowUpCircle, ArrowDownCircle, Check, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { formatBRL } from "@/utils/format";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

export default function ConciliacaoModal({ entry, receivables, payables, tenantId, onClose, onDone }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirming, setConfirming] = useState(false);

  // Filtra as sugestões pelo tipo e por valor/data próximos
  const suggestions = useMemo(() => {
    const list = entry.type === "receber" ? receivables : payables;
    const entryDate = new Date(entry.date);
    return list
      .filter(r => r.status !== "Pago" && r.status !== "Recebido")
      .map(r => ({
        ...r,
        _scoreDays: Math.abs(differenceInDays(new Date(r.data_vencimento || entry.date), entryDate)),
        _scoreDiff: Math.abs((r.valor || 0) - Math.abs(entry.amount)),
      }))
      .sort((a, b) => a._scoreDiff - b._scoreDiff || a._scoreDays - b._scoreDays)
      .slice(0, 20);
  }, [entry, receivables, payables]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectedItems = suggestions.filter(s => selectedIds.includes(s.id));
  const totalSelected = selectedItems.reduce((sum, s) => sum + (s.valor || 0), 0);
  const entryAmount = Math.abs(entry.amount);
  const diff = entryAmount - totalSelected;
  const hasDiff = Math.abs(diff) > 0.01;

  const handleConfirm = async () => {
    if (selectedIds.length === 0) { toast.error("Selecione ao menos um lançamento para conciliar."); return; }
    setConfirming(true);

    try {
      const entity = entry.type === "receber" ? "AccountReceivable" : "AccountPayable";
      const paidStatus = entry.type === "receber" ? "Recebido" : "Pago";

      for (const item of selectedItems) {
        await base44.entities[entity].update(item.id, {
          status: paidStatus,
          valor: item.valor,
        });
      }

      // Se houver diferença, registra como ajuste
      if (hasDiff) {
        const adjDesc = diff > 0 ? "Multas e Juros (conciliação OFX)" : "Desconto (conciliação OFX)";
        const adjType = diff > 0 ? "Receita" : "Despesa";
        if (entry.type === "receber") {
          await base44.entities.AccountReceivable.create({
            descricao: adjDesc,
            valor: Math.abs(diff),
            data_vencimento: entry.date,
            status: "Recebido",
            inquilino_id: tenantId,
          });
        } else {
          await base44.entities.AccountPayable.create({
            descricao: adjDesc,
            valor: Math.abs(diff),
            data_vencimento: entry.date,
            status: "Pago",
            inquilino_id: tenantId,
          });
        }
      }

      toast.success("Conciliação realizada com sucesso!");
      onDone();
    } catch {
      toast.error("Erro ao conciliar lançamentos.");
    }
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-popover border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50">
          <div>
            <p className="font-heading font-semibold text-foreground text-lg">Janela de Conciliação</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vincule o lançamento do extrato aos registros do sistema</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

          {/* LADO ESQUERDO: Dados do extrato */}
          <div className="lg:w-64 shrink-0 p-5 border-b lg:border-b-0 lg:border-r border-border/40 bg-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Extrato Bancário</p>
            <div className="flex items-center gap-2 mb-4">
              {entry.type === "receber"
                ? <ArrowUpCircle className="w-8 h-8 text-green-400 shrink-0" />
                : <ArrowDownCircle className="w-8 h-8 text-red-400 shrink-0" />
              }
              <span className={`text-2xl font-heading font-bold ${entry.type === "receber" ? "text-green-400" : "text-red-400"}`}>
                {formatBRL(entryAmount)}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Descrição</p>
                <p className="text-foreground font-medium break-words">{entry.memo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-foreground">{entry.date}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-foreground capitalize">{entry.type === "receber" ? "Crédito" : "Débito"}</p>
              </div>
            </div>

            {/* Resumo da seleção */}
            {selectedIds.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border/30 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Resumo</p>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Selecionado(s)</span>
                  <span className="text-foreground">{formatBRL(totalSelected)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Extrato</span>
                  <span className="text-foreground">{formatBRL(entryAmount)}</span>
                </div>
                {hasDiff && (
                  <div className={`flex justify-between text-xs font-semibold rounded-lg px-2 py-1 ${diff > 0 ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400"}`}>
                    <span className="flex items-center gap-1">
                      {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {diff > 0 ? "Juros/Multa" : "Desconto"}
                    </span>
                    <span>{formatBRL(Math.abs(diff))}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* LADO DIREITO: Sugestões */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border/30 bg-secondary/10">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {entry.type === "receber" ? "Contas a Receber" : "Contas a Pagar"} — Selecione para conciliar
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Você pode selecionar múltiplos lançamentos</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {suggestions.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma sugestão encontrada.</p>
                  <p className="text-xs mt-1">Todos os lançamentos já foram pagos/recebidos.</p>
                </div>
              ) : (
                suggestions.map(s => {
                  const isSelected = selectedIds.includes(s.id);
                  const daysDiff = s._scoreDays;
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors border ${isSelected ? "bg-primary/10 border-primary/30" : "bg-white/[0.02] border-border/30 hover:bg-white/[0.04]"}`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground/90 truncate">{s.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          Venc: {s.data_vencimento ? format(new Date(s.data_vencimento + "T12:00:00"), "dd/MM/yyyy") : "—"}
                          {daysDiff <= 5 && <span className="ml-2 text-green-400">● próximo</span>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold tabular-nums ${entry.type === "receber" ? "text-green-400" : "text-red-400"}`}>
                          {formatBRL(s.valor)}
                        </p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          s.status === "Atrasado" ? "bg-red-500/15 text-red-400" : "bg-yellow-500/15 text-yellow-400"
                        }`}>{s.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {selectedIds.length > 0 ? (
              <span>{selectedIds.length} lançamento(s) selecionado(s) · Total: {formatBRL(totalSelected)}{hasDiff ? ` · ${diff > 0 ? "Multa/Juros" : "Desconto"}: ${formatBRL(Math.abs(diff))} será registrado` : " ✓ Valores batem"}</span>
            ) : "Selecione lançamentos à direita para conciliar"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" onClick={handleConfirm} disabled={confirming || selectedIds.length === 0} className="bg-violet-600 hover:bg-violet-500">
              {confirming ? "Conciliando..." : "Confirmar Conciliação"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}