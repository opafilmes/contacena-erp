import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format, addDays, addMonths } from "date-fns";
import { formatBRL } from "@/utils/format";

const INTERVALOS = [
  { label: "Mensal (30 dias)", value: "mensal" },
  { label: "Quinzenal (15 dias)", value: "quinzenal" },
  { label: "Semanal (7 dias)", value: "semanal" },
];

function calcNextDate(baseDate, index, intervalo) {
  if (intervalo === "mensal")    return addMonths(baseDate, index);
  if (intervalo === "quinzenal") return addDays(baseDate, index * 15);
  if (intervalo === "semanal")   return addDays(baseDate, index * 7);
  return addMonths(baseDate, index);
}

export default function GerarFinanceiroModal({ proposal, items, client, tenantId, onClose, onDone }) {
  const total = items.reduce((a, i) => a + (i.valor_total || 0), 0) || proposal.valor_total || 0;
  const isRecorrente = proposal.tipo_proposta === "Recorrente";

  const [parcelas, setParcelas] = useState(isRecorrente ? (proposal.vigencia_meses || 1) : 1);
  const [vencimento, setVencimento] = useState(format(new Date(), "yyyy-MM-dd"));
  const [intervalo, setIntervalo] = useState("mensal");
  const [saving, setSaving] = useState(false);

  // Split matemático: centavos residuais vão para a última parcela
  const parcelasPreview = useMemo(() => {
    if (!vencimento || parcelas < 1) return [];
    const base = new Date(vencimento + "T12:00:00");
    const valorBase = Math.floor((total / parcelas) * 100) / 100;
    const somaBase = parseFloat((valorBase * parcelas).toFixed(2));
    const ajuste = parseFloat((total - somaBase).toFixed(2));

    return Array.from({ length: parcelas }, (_, i) => ({
      numero: i + 1,
      valor: i === parcelas - 1 ? parseFloat((valorBase + ajuste).toFixed(2)) : valorBase,
      data: calcNextDate(base, i, isRecorrente ? "mensal" : intervalo),
    }));
  }, [parcelas, vencimento, intervalo, total, isRecorrente]);

  const clienteNome = client?.nome_fantasia || "Cliente";
  const propNum = proposal.numero_proposta ? `#${proposal.numero_proposta}` : `#${proposal.id?.slice(-4).toUpperCase()}`;

  const handleLancar = async () => {
    if (!vencimento) { toast.error("Informe o primeiro vencimento."); return; }
    setSaving(true);

    const records = parcelasPreview.map(p => ({
      descricao: parcelas === 1
        ? `${clienteNome} – Proposta ${propNum}`
        : `${clienteNome} – Proposta ${propNum} (Parcela ${p.numero}/${parcelas})`,
      client_id: proposal.client_id || undefined,
      proposal_id: proposal.id,
      valor: p.valor,
      data_vencimento: format(p.data, "yyyy-MM-dd"),
      status: "Pendente",
      inquilino_id: tenantId,
    }));

    await base44.entities.AccountReceivable.bulkCreate(records);
    await base44.entities.Proposal.update(proposal.id, { financeiro_gerado: true });

    toast.success(`${parcelas} conta(s) lançada(s) no Financeiro!`);
    setSaving(false);
    onDone();
    onClose();
  };

  const parcelaOptions = isRecorrente
    ? Array.from({ length: 36 }, (_, i) => i + 1)
    : Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30">
          <div>
            <h3 className="font-heading font-bold text-lg">💰 Configurar Faturamento</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRecorrente ? "Proposta Recorrente — valor fixo por mês" : "Proposta Avulsa — parcelamento flexível"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Valor total (readonly) */}
          <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-accent/10 border border-accent/20">
            <span className="text-sm font-semibold text-accent">
              {isRecorrente ? "Valor Mensal" : "Valor Total da Proposta"}
            </span>
            <span className="text-xl font-heading font-bold text-accent">{formatBRL(total)}</span>
          </div>

          {/* Número de parcelas */}
          <div className="space-y-1.5">
            <Label>{isRecorrente ? "Quantidade de Meses" : "Número de Parcelas"}</Label>
            <Select value={String(parcelas)} onValueChange={v => setParcelas(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="z-[300]">
                {parcelaOptions.map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {isRecorrente
                      ? `${n} mês${n > 1 ? "es" : ""} — ${formatBRL(total)}/mês`
                      : n === 1
                        ? `À vista — ${formatBRL(total)}`
                        : `${n}x de ${formatBRL(Math.floor((total / n) * 100) / 100)}`
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Intervalo (só para avulsa com mais de 1 parcela) */}
          {!isRecorrente && parcelas > 1 && (
            <div className="space-y-1.5">
              <Label>Intervalo de Vencimento</Label>
              <Select value={intervalo} onValueChange={setIntervalo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[300]">
                  {INTERVALOS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Primeiro vencimento */}
          <div className="space-y-1.5">
            <Label>Data do {parcelas > 1 ? "1º " : ""}Vencimento</Label>
            <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
          </div>

          {/* Preview das parcelas */}
          {parcelasPreview.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Preview das Parcelas</p>
              <div className="rounded-lg border border-border/30 overflow-hidden max-h-40 overflow-y-auto">
                {parcelasPreview.map(p => (
                  <div key={p.numero} className={`flex justify-between items-center px-3 py-2 text-xs ${p.numero % 2 === 0 ? "bg-secondary/20" : ""}`}>
                    <span className="text-muted-foreground">
                      {parcelas === 1 ? "Vencimento" : `Parcela ${p.numero}/${parcelas}`}
                    </span>
                    <span className="text-foreground font-medium">{format(p.data, "dd/MM/yyyy")}</span>
                    <span className="text-green-400 font-semibold">{formatBRL(p.valor)}</span>
                  </div>
                ))}
              </div>
              {parcelas > 1 && (
                <p className="text-[11px] text-muted-foreground/70">
                  Total: {formatBRL(parcelasPreview.reduce((s, p) => s + p.valor, 0))}
                  {" "}(centavos residuais ajustados na última parcela)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/30 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button onClick={handleLancar} disabled={saving} className="flex-1 gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            {saving ? "Lançando..." : `Lançar ${parcelas}x no Financeiro`}
          </Button>
        </div>
      </div>
    </div>
  );
}