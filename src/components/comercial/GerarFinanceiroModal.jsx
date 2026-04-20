import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatBRL } from "@/utils/format";

export default function GerarFinanceiroModal({ proposal, items, client, tenantId, onClose, onDone }) {
  const total = items.reduce((a, i) => a + (i.valor_total || 0), 0) || proposal.valor_total || 0;
  const isRecorrente = proposal.tipo_proposta === "Recorrente";

  const [parcelas, setParcelas] = useState(isRecorrente ? (proposal.vigencia_meses || 1) : 1);
  const [vencimento, setVencimento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [saving, setSaving] = useState(false);

  // Recorrente: cada parcela = valor total (mensalidade fixa)
  // Projeto: divide o total pelas parcelas
  const valorParcela = isRecorrente ? total : (parcelas > 0 ? total / parcelas : total);

  const handleLancar = async () => {
    if (!vencimento) {
      toast.error("Informe o primeiro vencimento.");
      return;
    }
    setSaving(true);
    const promises = [];
    for (let i = 0; i < parcelas; i++) {
      const d = new Date(vencimento + "T12:00:00");
      d.setMonth(d.getMonth() + i);
      promises.push(
        base44.entities.AccountReceivable.create({
          descricao: `${client?.nome_fantasia || proposal.titulo || "Proposta"} – Parcela ${i + 1}/${parcelas}`,
          client_id: proposal.client_id || undefined,
          valor: valorParcela,
          data_vencimento: d.toISOString().split("T")[0],
          status: "Pendente",
          inquilino_id: tenantId,
        })
      );
    }
    await Promise.all(promises);

    // Marca financeiro_gerado = true na proposta
    await base44.entities.Proposal.update(proposal.id, { financeiro_gerado: true });

    toast.success(`${parcelas} conta(s) a receber lançada(s) no Financeiro!`);
    setSaving(false);
    onDone();
    onClose();
  };

  const parcelaOptions = isRecorrente
    ? Array.from({ length: 36 }, (_, i) => i + 1)
    : [1, 2, 3, 4, 6, 12];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-lg">💰 Gerar Financeiro</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRecorrente ? "Proposta Recorrente — valor fixo por mês" : "Proposta de Projeto — valor dividido"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner do valor */}
        <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-accent/10 border border-accent/20">
          <span className="text-sm font-semibold text-accent">
            {isRecorrente ? "Valor Mensal" : "Valor Total"}
          </span>
          <span className="text-xl font-heading font-bold text-accent">{formatBRL(total)}</span>
        </div>

        {/* Número de parcelas/meses */}
        <div className="space-y-1.5">
          <Label>{isRecorrente ? "Quantidade de Meses" : "Número de Parcelas"}</Label>
          <Select value={String(parcelas)} onValueChange={v => setParcelas(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {parcelaOptions.map(n => (
                <SelectItem key={n} value={String(n)}>
                  {isRecorrente
                    ? `${n} mês${n > 1 ? "es" : ""} — ${formatBRL(total)}/mês`
                    : `${n}x de ${formatBRL(total / n)}`
                  }
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Primeiro vencimento */}
        <div className="space-y-1.5">
          <Label>Data do Primeiro Vencimento</Label>
          <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
        </div>

        {/* Preview */}
        <div className="text-xs text-muted-foreground bg-secondary/30 rounded-lg p-3 space-y-1">
          <p>Serão criadas <strong className="text-foreground">{parcelas}</strong> conta(s) a receber</p>
          <p>Valor de cada: <strong className="text-foreground">{formatBRL(valorParcela)}</strong></p>
          <p>Primeiro vencimento: <strong className="text-foreground">
            {vencimento ? format(new Date(vencimento + "T12:00:00"), "dd/MM/yyyy") : "—"}
          </strong></p>
          {parcelas > 1 && (
            <p className="text-muted-foreground/70">Vencimentos mensais consecutivos</p>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleLancar} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            {saving ? "Lançando..." : "Lançar no Financeiro"}
          </Button>
        </div>
      </div>
    </div>
  );
}