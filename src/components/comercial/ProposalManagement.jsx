import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  X, Printer, FileCheck2, DollarSign, CreditCard,
  CheckCircle2, Loader2, Building2, Pencil, Mail, Ticket,
  Link2, Send
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { formatBRL } from "@/utils/format";
import GerarFinanceiroModal from "@/components/comercial/GerarFinanceiroModal";
import EnviarEmailModal from "@/components/comercial/EnviarEmailModal";

const STATUS_STYLE = {
  Pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Aprovada: "bg-green-500/15 text-green-400 border-green-500/30",
  Recusada: "bg-red-500/15 text-red-400 border-red-500/30",
};

// ── Management Panel Principal ─────────────────────────────────────
export default function ProposalManagement({ proposal, clients, tenant, tenantId, onClose, onApproved, onEdit }) {
  const [items, setItems] = useState([]);
  const [approving, setApproving] = useState(false);
  const [showFinanceiroModal, setShowFinanceiroModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [gerandoBoletos, setGerandoBoletos] = useState(false);
  const [gerandoStripe, setGerandoStripe] = useState(false);
  const [enviandoCarne, setEnviandoCarne] = useState(false);
  const [proposalState, setProposalState] = useState(proposal);

  const client = clients?.find(c => c.id === proposalState?.client_id);

  useEffect(() => {
    setProposalState(proposal);
  }, [proposal]);

  useEffect(() => {
    if (proposalState?.id) {
      base44.entities.ProposalItem.filter({ proposal_id: proposalState.id }).then(setItems);
    }
  }, [proposalState?.id]);

  const subtotalItems = items.reduce((a, i) => a + (i.valor_total || 0), 0);
  const descontoReais = proposalState.desconto_tipo === "%"
    ? subtotalItems * (proposalState.desconto_valor || 0) / 100
    : (proposalState.desconto_valor || 0);
  const total = proposalState.valor_total || Math.max(0, subtotalItems - descontoReais);

  const handleApprove = async () => {
    if (!window.confirm("Aprovar esta proposta? Isso criará automaticamente um Contrato e um Projeto no Studio.")) return;
    setApproving(true);
    try {
      const res = await base44.functions.invoke("approveProposal", { proposalId: proposalState.id });
      if (res.data?.ok) {
        toast.success("Proposta aprovada! Contrato e Projeto criados.");
        onApproved();
        onClose();
      } else {
        toast.error("Erro: " + (res.data?.error || "desconhecido"));
      }
    } catch {
      toast.error("Erro ao aprovar proposta.");
    }
    setApproving(false);
  };

  const handlePrint = () => window.print();

  const handleGerarBoletos = async () => {
    if (!proposalState.financeiro_gerado) return;
    setGerandoBoletos(true);
    const contas = await base44.entities.AccountReceivable.filter({ inquilino_id: tenantId });
    // Filtra as contas desta proposta pela descrição (não temos proposal_id direto no AccountReceivable)
    const contasProposta = contas.filter(c =>
      c.descricao?.includes(client?.nome_fantasia || proposalState.titulo || "")
    );
    if (contasProposta.length === 0) {
      toast.info("Nenhuma conta a receber encontrada para esta proposta.");
      setGerandoBoletos(false);
      return;
    }
    toast.promise(
      new Promise(res => setTimeout(res, 1500)),
      {
        loading: `Gerando boletos para ${contasProposta.length} parcela(s)...`,
        success: `${contasProposta.length} boleto(s) gerado(s) com sucesso!`,
        error: "Erro ao gerar boletos.",
      }
    );
    setGerandoBoletos(false);
  };

  const propNum = proposalState.numero_proposta ? `PROP-${proposalState.numero_proposta}` : `PROP-${proposalState.id?.slice(-4).toUpperCase()}`;

  if (!proposalState) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-4">
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-auto">

          {/* Cabeçalho da UI */}
          <div className="no-print flex items-center justify-between px-8 py-5 border-b border-border/30 bg-secondary/20 rounded-t-2xl">
            <div className="flex items-center gap-4">
              {tenant?.logo ? (
                <img src={tenant.logo} alt="logo" className="h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
              )}
              <div>
                <p className="font-heading font-bold text-foreground text-base">{tenant?.razao_social || tenant?.nome_fantasia}</p>
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  {tenant?.cnpj && <span>CNPJ: {tenant.cnpj}</span>}
                  {tenant?.cidade && tenant?.uf && <span>{tenant.cidade} – {tenant.uf}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* ── PAINEL DE AÇÕES (esquerda) – oculto na impressão ── */}
            <div className="no-print lg:col-span-1 border-r border-border/30 p-6 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Painel de Gestão</h3>

              <div className="flex items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_STYLE[proposalState.status] || ""}`}>
                  {proposalState.status}
                </span>
                {proposalState.financeiro_gerado && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                    💰 Fin. Gerado
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm border border-border/30 rounded-xl p-3 bg-secondary/20">
                {client && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cliente</span>
                    <span className="text-foreground font-medium truncate max-w-[140px]">{client.nome_fantasia}</span>
                  </div>
                )}
                {proposalState.numero_proposta && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nº Proposta</span>
                    <span className="text-foreground font-mono font-semibold">{propNum}</span>
                  </div>
                )}
                {proposalState.tipo_proposta && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="text-foreground">{proposalState.tipo_proposta}</span>
                  </div>
                )}
                {proposalState.data_emissao && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Emissão</span>
                    <span className="text-foreground">{format(new Date(proposalState.data_emissao + "T12:00:00"), "dd/MM/yyyy")}</span>
                  </div>
                )}
                {proposalState.validade && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Válida até</span>
                    <span className="text-foreground">{format(new Date(proposalState.validade + "T12:00:00"), "dd/MM/yyyy")}</span>
                  </div>
                )}
                {proposalState.tipo_proposta === "Recorrente" && proposalState.vigencia_meses && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vigência</span>
                    <span className="text-foreground">{proposalState.vigencia_meses} meses</span>
                  </div>
                )}
                {proposalState.tipo_proposta === "Recorrente" && proposalState.dia_vencimento && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencimento</span>
                    <span className="text-foreground">Dia {proposalState.dia_vencimento}</span>
                  </div>
                )}
                {proposalState.metodo_pagamento && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagamento</span>
                    <span className="text-foreground">{proposalState.metodo_pagamento}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Button variant="outline" className="w-full justify-start gap-2.5 text-sm" onClick={onEdit}>
                  <Pencil className="w-4 h-4" /> Editar Proposta
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2.5 text-sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4" /> 🖨️ Imprimir / PDF
                </Button>

                {/* Gerar Financeiro */}
                <Button
                  variant="outline"
                  className={`w-full justify-start gap-2.5 text-sm ${proposalState.financeiro_gerado ? "border-green-500/40 text-green-400" : ""}`}
                  onClick={() => setShowFinanceiroModal(true)}
                >
                  <DollarSign className="w-4 h-4" />
                  {proposalState.financeiro_gerado ? "✅ Financeiro Gerado" : "💰 Gerar Financeiro"}
                </Button>

                {/* Gerar Boletos — desabilitado se financeiro não foi gerado */}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2.5 text-sm"
                  onClick={handleGerarBoletos}
                  disabled={!proposalState.financeiro_gerado || gerandoBoletos}
                  title={!proposalState.financeiro_gerado ? "Gere o financeiro primeiro para habilitar os boletos" : ""}
                >
                  {gerandoBoletos ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                  🎫 Gerar Boletos
                </Button>

                {/* Enviar por E-mail */}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2.5 text-sm"
                  onClick={() => setShowEmailModal(true)}
                >
                  <Mail className="w-4 h-4" /> ✉️ Enviar por E-mail
                </Button>

                {/* Gerar Cobranças Stripe */}
                {proposalState.financeiro_gerado && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5 text-sm border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
                    disabled={gerandoStripe}
                    onClick={async () => {
                      const metodo = window.prompt("Método de pagamento: boleto, pix ou card", "boleto");
                      if (!metodo) return;
                      setGerandoStripe(true);
                      const res = await base44.functions.invoke("generateProposalCharges", {
                        proposalId: proposalState.id,
                        paymentMethod: metodo.trim().toLowerCase(),
                      });
                      if (res.data?.ok) {
                        toast.success(`${res.data.total} link(s) gerado(s)!`);
                      } else {
                        toast.error(res.data?.error || "Erro ao gerar cobranças.");
                      }
                      setGerandoStripe(false);
                    }}
                  >
                    {gerandoStripe ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                    {gerandoStripe ? "Gerando..." : "⚡ Gerar Cobranças Stripe"}
                  </Button>
                )}

                {/* Enviar Carnê */}
                {proposalState.financeiro_gerado && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2.5 text-sm"
                    disabled={enviandoCarne}
                    onClick={async () => {
                      setEnviandoCarne(true);
                      const res = await base44.functions.invoke("enviarCarne", { proposalId: proposalState.id });
                      if (res.data?.ok) {
                        toast.success(`Carnê enviado para ${res.data.enviado_para}!`);
                      } else {
                        toast.error(res.data?.error || "Erro ao enviar carnê.");
                      }
                      setEnviandoCarne(false);
                    }}
                  >
                    {enviandoCarne ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {enviandoCarne ? "Enviando..." : "📨 Enviar Carnê por E-mail"}
                  </Button>
                )}

                {proposalState.status === "Pendente" && (
                  <Button
                    className="w-full justify-start gap-2.5 text-sm bg-green-600 hover:bg-green-500 text-white mt-2"
                    onClick={handleApprove}
                    disabled={approving}
                  >
                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {approving ? "Aprovando..." : "✅ Aprovar Proposta"}
                  </Button>
                )}

                {proposalState.status === "Aprovada" && (
                  <Button variant="outline" className="w-full justify-start gap-2.5 text-sm border-green-500/40 text-green-400" onClick={() => toast.info("Contrato já gerado. Acesse a aba Contratos.")}>
                    <FileCheck2 className="w-4 h-4" /> 📄 Ver Contrato
                  </Button>
                )}
              </div>
            </div>

            {/* ── VISUALIZAÇÃO DA PROPOSTA (direita) ── */}
            <div className="lg:col-span-2 p-6 lg:p-8" id="print-container">

              {/* ══════════════════════════════════════
                  CABEÇALHO DO DOCUMENTO (V1 CLASSIC)
              ══════════════════════════════════════ */}
              <div className="flex items-start justify-between mb-6 pb-5 border-b-2 border-gray-200 print:border-gray-300">

                {/* Esquerda: Logo + dados do tenant */}
                <div className="flex items-start gap-3">
                  {tenant?.logo ? (
                    <img
                      src={tenant.logo}
                      alt="logo"
                      className="object-contain"
                      style={{ maxHeight: 60, maxWidth: 160 }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-accent/20 flex items-center justify-center">
                      <Building2 className="w-7 h-7 text-accent" />
                    </div>
                  )}
                  <div className="ml-1">
                    <p className="font-heading font-bold text-foreground text-sm print:text-black">{tenant?.razao_social || tenant?.nome_fantasia || "—"}</p>
                    {tenant?.cnpj && <p className="text-xs text-muted-foreground print:text-gray-600">CNPJ: {tenant?.cnpj}</p>}
                    {tenant?.email_corporativo && <p className="text-xs text-muted-foreground print:text-gray-600">{tenant?.email_corporativo}</p>}
                    {tenant?.telefone && <p className="text-xs text-muted-foreground print:text-gray-600">{tenant?.telefone}</p>}
                  </div>
                </div>

                {/* Direita: Título do documento */}
                <div className="text-right">
                  <h1 className="font-heading font-bold text-xl text-foreground print:text-black tracking-wider uppercase">Proposta Comercial</h1>
                  <p className="text-sm font-mono font-semibold text-accent print:text-gray-700 mt-1">{propNum}</p>
                  {proposalState.data_emissao && (
                    <p className="text-xs text-muted-foreground print:text-gray-500 mt-0.5">
                      Emitida em {format(new Date(proposalState.data_emissao + "T12:00:00"), "dd/MM/yyyy")}
                    </p>
                  )}
                </div>
              </div>

              {/* ══════════════════════════════════════
                  GRID DE INFORMAÇÕES (CLIENTE + TERMOS)
              ══════════════════════════════════════ */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Dados do Cliente */}
                <div className="rounded-xl border border-border/30 p-4 bg-secondary/10 print:border-gray-200 print:bg-gray-50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 print:text-gray-500">Dados do Cliente</p>
                  {client ? (
                    <>
                      <p className="font-semibold text-foreground print:text-black text-sm">{client.nome_fantasia}</p>
                      {client.razao_social && <p className="text-xs text-muted-foreground print:text-gray-600 mt-0.5">{client.razao_social}</p>}
                      {client.cnpj_cpf && <p className="text-xs text-muted-foreground print:text-gray-600">CNPJ/CPF: {client.cnpj_cpf}</p>}
                      {client.contato && <p className="text-xs text-muted-foreground print:text-gray-600">{client.contato}</p>}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Não definido</p>
                  )}
                </div>

                {/* Metadados (4 campos) */}
                <div className="rounded-xl border border-border/30 p-4 bg-secondary/10 print:border-gray-200 print:bg-gray-50">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 print:text-gray-500">Detalhes da Proposta</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {proposalState.data_emissao && (
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-400">Emissão</p>
                        <p className="text-xs font-medium text-foreground print:text-black">{format(new Date(proposalState.data_emissao + "T12:00:00"), "dd/MM/yyyy")}</p>
                      </div>
                    )}
                    {proposalState.validade && (
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-400">Válida até</p>
                        <p className="text-xs font-medium text-foreground print:text-black">{format(new Date(proposalState.validade + "T12:00:00"), "dd/MM/yyyy")}</p>
                      </div>
                    )}
                    {proposalState.tipo_proposta === "Recorrente" && proposalState.vigencia_meses && (
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-400">Vigência</p>
                        <p className="text-xs font-medium text-foreground print:text-black">{proposalState.vigencia_meses} meses</p>
                      </div>
                    )}
                    {proposalState.tipo_proposta === "Recorrente" && proposalState.dia_vencimento && (
                      <div>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider print:text-gray-400">Vencimento Mensal</p>
                        <p className="text-xs font-medium text-foreground print:text-black">Dia {proposalState.dia_vencimento}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════
                  TABELA DE ITENS — Clean Data Grid
              ══════════════════════════════════════ */}
              {items.length > 0 && (
                <div className="mb-2" style={{ pageBreakInside: "avoid" }}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 print:text-[#64748b]">Serviços</p>
                  <div className="rounded-xl overflow-hidden border border-border/40 print:border-[#e2e8f0]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/30 print:bg-[#f8fafc]">
                          <th className="text-left px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-[#64748b]">Descrição</th>
                          <th className="text-center px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-[#64748b] w-16">Qtd</th>
                          <th className="text-right px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-[#64748b] w-36">Valor Unit.</th>
                          <th className="text-right px-4 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider print:text-[#64748b] w-36">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, idx) => (
                          <React.Fragment key={item.id}>
                            <tr className={`border-b border-border/30 last:border-b-0 print:border-[#e2e8f0] ${idx % 2 === 1 ? "bg-secondary/[0.06]" : ""}`}>
                              <td className="px-4 py-4 font-medium text-foreground print:text-black">
                                {item.titulo}
                                {item.descricao_detalhada && item.descricao_detalhada !== "<p><br></p>" && (
                                  <div className="text-xs text-muted-foreground print:text-[#64748b] mt-1 font-normal">
                                    <div dangerouslySetInnerHTML={{ __html: item.descricao_detalhada }} />
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4 text-center text-muted-foreground print:text-[#374151]">{item.quantidade}</td>
                              <td className="px-4 py-4 text-right text-muted-foreground print:text-[#374151] whitespace-nowrap">{formatBRL(item.valor_unitario)}</td>
                              <td className="px-4 py-4 text-right font-semibold text-foreground print:text-black whitespace-nowrap">{formatBRL(item.valor_total)}</td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum item cadastrado nesta proposta.</p>
              )}

              {/* ══════════════════════════════════════
                  RESUMO FINANCEIRO — alinhado à direita
              ══════════════════════════════════════ */}
              <div className="flex flex-col items-end pt-6 mb-6">
                <div className="w-80 space-y-2">
                  {subtotalItems > 0 && proposalState.desconto_valor > 0 && (
                    <div className="flex justify-between text-sm px-1">
                      <span className="text-muted-foreground print:text-[#64748b]">Subtotal</span>
                      <span className="text-foreground print:text-[#111827] whitespace-nowrap">{formatBRL(subtotalItems)}</span>
                    </div>
                  )}
                  {proposalState.desconto_valor > 0 && (
                    <div className="flex justify-between text-sm px-1">
                      <span className="text-muted-foreground print:text-[#64748b]">
                        Desconto ({proposalState.desconto_valor}{proposalState.desconto_tipo === "%" ? "%" : " R$"})
                      </span>
                      <span className="font-bold whitespace-nowrap" style={{ color: '#16a34a' }}>−{formatBRL(descontoReais)}</span>
                    </div>
                  )}
                  {/* Separador */}
                  <div className="border-t border-border/30 print:border-[#e2e8f0] pt-3 mt-1">
                    <div className="flex justify-between items-center px-5 py-4 rounded-xl bg-accent/10 border border-accent/20 print:bg-white print:border-[#e2e8f0]">
                      <span className="font-semibold text-sm text-muted-foreground print:text-[#374151]">
                        {proposalState.tipo_proposta === "Recorrente" ? "Valor Mensal" : "Valor Total"}
                      </span>
                      <span className="text-2xl font-heading font-bold text-accent print:text-black whitespace-nowrap">
                        {formatBRL(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════
                  OBSERVAÇÕES / TERMOS
              ══════════════════════════════════════ */}
              {proposalState.observacoes && proposalState.observacoes !== "<p><br></p>" && (
                <div className="space-y-2 mb-6" style={{ pageBreakInside: "avoid" }}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest print:text-gray-500">
                    {proposalState.metodo_pagamento ? `Forma de Pagamento: ${proposalState.metodo_pagamento} · ` : ""}Observações e Termos
                  </p>
                  <div className="text-xs text-muted-foreground print:text-gray-700 bg-secondary/20 print:bg-gray-50 rounded-xl p-4 border border-border/30 print:border-gray-200">
                    <div dangerouslySetInnerHTML={{ __html: proposalState.observacoes }} />
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════
                  RODAPÉ (fixo na impressão via CSS)
              ══════════════════════════════════════ */}
              <div className="print-footer-fixed hidden print:block">
                <p className="text-[9px] text-gray-400">Proposta gerada pelo sistema ContaCena ERP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFinanceiroModal && (
        <GerarFinanceiroModal
          proposal={proposalState}
          items={items}
          client={client}
          tenantId={tenantId}
          onClose={() => setShowFinanceiroModal(false)}
          onDone={() => setProposalState(p => ({ ...p, financeiro_gerado: true }))}
        />
      )}

      {showEmailModal && (
        <EnviarEmailModal
          proposal={proposalState}
          client={client}
          tenant={tenant}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
}