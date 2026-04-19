import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_STYLE = {
  Pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Aprovada: "bg-green-500/15 text-green-400 border-green-500/30",
  Recusada: "bg-red-500/15 text-red-400 border-red-500/30",
};

function formatBRL(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProposalView({ proposal, clients, tenant, onClose, onApproved }) {
  const [items, setItems] = useState([]);
  const [approving, setApproving] = useState(false);

  const client = clients?.find(c => c.id === proposal?.client_id);

  useEffect(() => {
    if (proposal?.id) {
      base44.entities.ProposalItem.filter({ proposal_id: proposal.id }).then(setItems);
    }
  }, [proposal?.id]);

  const handleApprove = async () => {
    if (!window.confirm("Aprovar esta proposta? Isso criará automaticamente um Contrato e um Projeto no Studio.")) return;
    setApproving(true);
    try {
      const res = await base44.functions.invoke("approveProposal", { proposalId: proposal.id });
      if (res.data?.ok) {
        toast.success("Proposta aprovada! Contrato e Projeto criados automaticamente.");
        onApproved();
        onClose();
      } else {
        toast.error("Erro ao aprovar: " + (res.data?.error || "desconhecido"));
      }
    } catch (err) {
      toast.error("Erro ao aprovar proposta.");
    }
    setApproving(false);
  };

  if (!proposal) return null;

  const total = items.reduce((acc, i) => acc + (i.valor_total || 0), 0) || proposal.valor_total || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border/30">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="font-heading text-xl font-bold text-foreground">{proposal.titulo}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[proposal.status] || ""}`}>
                {proposal.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {client && <span>👤 {client.nome_fantasia}</span>}
              {proposal.tipo_proposta && <span>📋 {proposal.tipo_proposta}</span>}
              {proposal.validade && (
                <span>⏳ Válida até {format(new Date(proposal.validade), "dd/MM/yyyy", { locale: ptBR })}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant branding */}
        {tenant && (
          <div className="px-6 py-3 border-b border-border/20 flex items-center gap-3 bg-secondary/20">
            {tenant.logo && <img src={tenant.logo} alt="logo" className="h-8 object-contain" />}
            <div>
              <p className="text-sm font-semibold text-foreground">{tenant.nome_fantasia}</p>
              {tenant.email_corporativo && <p className="text-xs text-muted-foreground">{tenant.email_corporativo}</p>}
            </div>
          </div>
        )}

        {/* Itens */}
        <div className="p-6 space-y-3">
          {items.length > 0 ? (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Itens da Proposta</h3>
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/30 border-b border-border/30">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Item</th>
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Qtd</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Unit.</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <React.Fragment key={item.id}>
                        <tr className={`border-b border-border/20 ${idx % 2 === 1 ? "bg-secondary/10" : ""}`}>
                          <td className="px-4 py-3 font-medium text-foreground">{item.titulo}</td>
                          <td className="px-3 py-3 text-center text-muted-foreground">{item.quantidade}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{formatBRL(item.valor_unitario)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-foreground">{formatBRL(item.valor_total)}</td>
                        </tr>
                        {item.descricao_detalhada && (
                          <tr className="border-b border-border/10">
                            <td colSpan={4} className="px-6 py-2 text-xs text-muted-foreground bg-secondary/5">
                              <div dangerouslySetInnerHTML={{ __html: item.descricao_detalhada }} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum item cadastrado nesta proposta.</p>
          )}

          {/* Total */}
          <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 mt-2">
            <span className="font-semibold text-accent">Valor Total</span>
            <span className="text-2xl font-heading font-bold text-accent">{formatBRL(total)}</span>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
          {proposal.status === "Pendente" && (
            <Button
              onClick={handleApprove}
              disabled={approving}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white gap-2"
            >
              {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {approving ? "Aprovando..." : "✅ Aprovar Proposta"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}