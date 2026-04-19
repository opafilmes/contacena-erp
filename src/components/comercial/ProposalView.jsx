import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Loader2, Printer } from "lucide-react";
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

  const handlePrint = () => {
    window.print();
  };

  if (!proposal) return null;

  const total = items.reduce((acc, i) => acc + (i.valor_total || 0), 0) || proposal.valor_total || 0;
  
  // Número da proposta para impressão (Se não houver, usa um fallback)
  const propNumber = proposal?.numero_proposta || proposal?.id?.slice(-4).toUpperCase() || "1001";
  const dataEmissao = proposal?.created_date ? new Date(proposal.created_date) : new Date();

  return (
    <>
      {/* =========================================================
          TELA: MODO APLICATIVO (Oculto na Impressão)
      ========================================================= */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 print:hidden">
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          
          {/* Header da Tela */}
          <div className="flex items-start justify-between p-6 border-b border-border/30 shrink-0">
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

          {/* Itens na Tela */}
          <div className="p-6 space-y-3 overflow-y-auto flex-1">
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

            {/* Total na Tela */}
            <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 mt-2">
              <span className="font-semibold text-accent">Valor Total</span>
              <span className="text-2xl font-heading font-bold text-accent">{formatBRL(total)}</span>
            </div>
          </div>

          {/* Footer Actions da Tela */}
          <div className="p-6 border-t border-border/30 flex gap-3 shrink-0 bg-card">
            <Button variant="outline" onClick={onClose} className="flex-1">Fechar</Button>
            
            <Button variant="secondary" onClick={handlePrint} className="flex-1 gap-2 border border-border/50 bg-secondary/50">
              <Printer className="w-4 h-4" /> Imprimir PDF
            </Button>

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


      {/* =========================================================
          IMPRESSÃO: MODO FOLHA A4 PERFEITA (Oculto na Tela)
      ========================================================= */}
      <div id="print-container" className="hidden print:flex flex-col min-h-[100vh] bg-white text-black p-8 w-full absolute top-0 left-0 z-[9999] m-0">
        
        {/* 1. Cabeçalho Dividido (Split Header) */}
        <div className="flex justify-between items-start pb-6 border-b border-gray-200 mb-8">
          <div className="flex flex-col gap-1 max-w-[50%]">
            {tenant?.logo && <img src={tenant.logo} alt="Logo" className="max-h-12 object-contain mb-2" />}
            <h2 className="text-xl font-bold text-black">{tenant?.razao_social || tenant?.nome_fantasia || "Nome da Produtora"}</h2>
            {tenant?.cnpj && <p className="text-sm text-gray-600">CNPJ: {tenant.cnpj}</p>}
            {tenant?.email_corporativo && <p className="text-sm text-gray-600">{tenant.email_corporativo}</p>}
            {tenant?.telefone && <p className="text-sm text-gray-600">{tenant.telefone}</p>}
          </div>
          <div className="text-right flex flex-col gap-1">
            <h1 className="text-2xl font-black uppercase tracking-widest text-black">PROPOSTA COMERCIAL</h1>
            <p className="text-lg font-bold text-gray-700">PROP-{propNumber}</p>
            <p className="text-sm text-gray-500">
              Emitida em: {format(dataEmissao, "dd/MM/yyyy")}
            </p>
          </div>
        </div>

        {/* 2. Corpo Flexível (Empurra o rodapé para baixo) */}
        <div className="flex-grow">
          
          {/* Dados do Cliente & Metadados */}
          <div className="mb-8 flex justify-between">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dados do Cliente</h3>
              <p className="text-base font-semibold text-black">{client?.nome_fantasia || "Cliente não informado"}</p>
              {client?.cnpj && <p className="text-sm text-gray-600">CNPJ: {client.cnpj}</p>}
            </div>
            <div className="text-right flex gap-8">
              {proposal?.forma_pagamento && (
                <div className="text-right">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Forma de Pagamento</h3>
                  <p className="text-sm text-black">{proposal.forma_pagamento}</p>
                </div>
              )}
              {proposal?.validade && (
                <div className="text-right">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Válida até</h3>
                  <p className="text-sm text-black">{format(new Date(proposal.validade), "dd/MM/yyyy")}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Serviços Clean */}
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Serviços</h3>
          <div className="rounded-xl overflow-hidden border border-gray-200 mb-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descrição</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qtd</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit.</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-gray-200 last:border-0">
                    <td className="px-5 py-4 text-black">
                      <span className="font-bold block mb-1">{item.titulo}</span>
                      {item.descricao_detalhada && (
                        <div className="text-xs text-gray-600 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: item.descricao_detalhada }} />
                      )}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600 align-top font-medium">{item.quantidade}</td>
                    <td className="px-4 py-4 text-right text-gray-600 align-top">{formatBRL(item.valor_unitario)}</td>
                    <td className="px-5 py-4 text-right font-bold text-black align-top">{formatBRL(item.valor_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 3. Totais com Desconto em Azul */}
          <div className="flex flex-col items-end pt-2 pb-8">
            
            {/* Se existir a propriedade desconto no banco, mostramos o Subtotal primeiro */}
            {proposal?.desconto > 0 && (
              <div className="flex justify-between items-center text-sm mb-2 w-48">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700 font-medium">{formatBRL(total + Number(proposal.desconto))}</span>
              </div>
            )}
            
            {/* O Desconto com a cor correta (Azul Credibilidade) */}
            {proposal?.desconto > 0 && (
              <div className="flex justify-between items-center text-sm mb-2 w-48">
                <span className="text-gray-500">Desconto</span>
                <span className="text-blue-600 font-bold">- {formatBRL(proposal.desconto)}</span>
              </div>
            )}

            {/* Valor Final Destaque */}
            <div className="flex justify-between items-center w-64 bg-slate-50 px-5 py-3 rounded-lg border border-gray-200 mt-2">
              <span className="font-bold text-gray-700 uppercase text-xs tracking-wider">Valor Total</span>
              <span className="text-xl font-black text-black">{formatBRL(total)}</span>
            </div>
          </div>

          {/* Observações */}
          {proposal?.observacoes && (
            <div className="mt-4 border-t border-gray-200 pt-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Observações e Termos</h3>
              <div className="text-sm text-gray-700 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: proposal.observacoes }} />
            </div>
          )}
        </div>

        {/* 4. Sticky Footer (Rodapé Preso no Fim) */}
        <div className="mt-auto pt-4 pb-2 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Proposta gerada pelo sistema ContaCena ERP</p>
        </div>
        
      </div>
    </>
  );
}