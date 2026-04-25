import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";
import { formatBRL } from "@/utils/format";

export default function ProposalPrintView({ proposal, client, tenant, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proposal?.id) return;
    setLoading(true);
    base44.entities.ProposalItem.filter({ proposal_id: proposal.id }, "created_date").then(its => {
      setItems(its);
      setLoading(false);
    });
  }, [proposal?.id]);

  const issueDate = proposal?.issue_date
    ? new Date(proposal.issue_date + "T00:00:00").toLocaleDateString("pt-BR") : "—";
  const validityDate = proposal?.validity_date
    ? new Date(proposal.validity_date + "T00:00:00").toLocaleDateString("pt-BR") : "—";

  const subtotal = proposal?.subtotal_value ?? items.reduce((s, i) => s + (i.total_price || 0), 0);
  const discountAmt = proposal?.discount_value
    ? (proposal.discount_type === "percent"
      ? parseFloat(((subtotal * proposal.discount_value) / 100).toFixed(2))
      : proposal.discount_value)
    : 0;
  const totalValue = proposal?.total_value ?? Math.max(0, subtotal - discountAmt);

  const docProps = { proposal, client, tenant, items, issueDate, validityDate, subtotal, discountAmt, totalValue };

  return (
    <>
      {/* On-screen overlay — hidden on print via .no-print */}
      <div className="no-print fixed inset-0 z-50 bg-black/75 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
        <div className="relative w-full max-w-4xl mx-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-zinc-300 text-sm font-medium">Visualização — {proposal?.number}</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => window.print()} className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
                <Printer className="w-4 h-4" /> Imprimir / PDF
              </Button>
              <Button size="sm" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400 gap-1.5">
                <X className="w-4 h-4" /> Fechar
              </Button>
            </div>
          </div>
          {/* Preview card */}
          <div className="bg-white text-gray-900 rounded-xl shadow-2xl" style={{ padding: "48px 56px", minHeight: "1123px" }}>
            {loading
              ? <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
              : <PrintDocument {...docProps} />}
          </div>
        </div>
      </div>

      {/* Print-only clone — displayed ONLY when printing */}
      <div className="print-only-doc" style={{ fontFamily: "Montserrat, sans-serif", padding: "0" }}>
        {!loading && <PrintDocument {...docProps} />}
      </div>
    </>
  );
}

function PrintDocument({ proposal, client, tenant, items, issueDate, validityDate, subtotal, discountAmt, totalValue }) {
  const hasDiscount = discountAmt > 0;

  const tenantAddress = [tenant?.logradouro, tenant?.numero, tenant?.bairro, tenant?.cidade, tenant?.uf]
    .filter(Boolean).join(", ");

  const cellStyle = (extra = {}) => ({
    padding: "10px 12px",
    fontSize: "11px",
    border: "1px solid #d1d5db",
    color: "#111827",
    verticalAlign: "top",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    ...extra,
  });

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", color: "#111827", background: "#ffffff", width: "100%" }}>
      
      <style>{`
        /* ── Estilos do Rich Text e Tabelas ── */
        .print-rich-text p { margin: 0 0 6px 0 !important; }
        .print-rich-text p:last-child { margin: 0 !important; }
        .print-rich-text ul, .print-rich-text ol { margin: 0 0 6px 0 !important; padding-left: 18px !important; }
        .print-rich-text li { margin-bottom: 2px !important; }
        .print-table-row { page-break-inside: avoid !important; }
        
        .master-print-table { width: 100%; border-collapse: collapse; border: none; }
        .master-print-table > thead { display: table-header-group !important; }
        .master-print-table > tfoot { display: table-footer-group !important; }
        .master-print-table > tbody > tr > td, 
        .master-print-table > thead > tr > td, 
        .master-print-table > tfoot > tr > td { border: none !important; padding: 0 !important; }

        /* ── Numeração de Página via CSS Paged Media ── */
        @page {
          @bottom-right {
            content: "Página " counter(page);
            font-family: 'Montserrat', sans-serif;
            font-size: 9px;
            font-weight: 600;
            color: #6b7280;
          }
        }
      `}</style>

      <table className="master-print-table">
        
        {/* ── CABEÇALHO REPETITIVO (THEAD) ── */}
        <thead>
          <tr>
            <td>
              <div style={{ height: "15mm" }} />
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "30px" }}>
                {tenant?.logo ? (
                  <img src={tenant.logo} alt={tenant.nome_fantasia} style={{ height: "48px", width: "auto", objectFit: "contain" }} />
                ) : (
                  <div style={{ width: "48px", height: "48px", borderRadius: "8px", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "#fff", fontWeight: "700", fontSize: "20px" }}>{tenant?.nome_fantasia?.[0] || "C"}</span>
                  </div>
                )}
                <div>
                  <p style={{ fontWeight: "800", fontSize: "15px", margin: 0, color: "#111827", textTransform: "uppercase" }}>{tenant?.nome_fantasia || "Produtora"}</p>
                  {tenant?.cnpj && <p style={{ fontSize: "11px", color: "#4b5563", margin: "3px 0 0" }}>CNPJ: {tenant.cnpj}</p>}
                  {tenantAddress && <p style={{ fontSize: "11px", color: "#4b5563", margin: "2px 0 0" }}>{tenantAddress}</p>}
                  {(tenant?.email_corporativo || tenant?.telefone) && (
                    <p style={{ fontSize: "11px", color: "#4b5563", margin: "2px 0 0" }}>
                      {[tenant.email_corporativo, tenant.telefone ? `Tel: ${tenant.telefone}` : null].filter(Boolean).join(" | ")}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#111827", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  PROPOSTA COMERCIAL
                </h1>
                <div style={{ textAlign: "right" }}>
      <p style={{ fontSize: "16px", fontWeight: "800", color: "#111827", margin: 0 }}>{proposal?.number || "#—"}</p>
                </div>
              </div>

              <div style={{ width: "100%", height: "2px", backgroundColor: "#e5e7eb", marginBottom: "24px" }} />
            </td>
          </tr>
        </thead>

        {/* ── CONTEÚDO PRINCIPAL (TBODY) ── */}
        <tbody>
          <tr>
            <td>
              <div style={{ display: "flex", gap: "40px", marginBottom: "28px", padding: "14px 18px", background: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                {issueDate && (
                  <div>
                    <p style={{ fontSize: "9px", color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Data de Emissão</p>
                    <p style={{ fontSize: "12px", color: "#111827", margin: 0, fontWeight: "600" }}>{issueDate}</p>
                  </div>
                )}
                {proposal?.validity_date && (
                  <div>
                    <p style={{ fontSize: "9px", color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Válida até</p>
                    <p style={{ fontSize: "12px", color: "#111827", margin: 0, fontWeight: "600" }}>{validityDate}</p>
                  </div>
                )}
                {proposal?.type && (
                  <div>
                    <p style={{ fontSize: "9px", color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Tipo</p>
                    <p style={{ fontSize: "12px", color: "#111827", margin: 0, fontWeight: "600" }}>{proposal.type}</p>
                  </div>
                )}
                {proposal?.payment_method && (
                  <div>
                    <p style={{ fontSize: "9px", color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Forma de Pagamento</p>
                    <p style={{ fontSize: "12px", color: "#111827", margin: 0, fontWeight: "600" }}>
                      {proposal.payment_method}
                      {proposal.installments && proposal.payment_method === "Parcelado" ? ` (${proposal.installments}x)` : ""}
                    </p>
                  </div>
                )}
                {proposal?.type === "Mensal" && proposal?.contract_duration && (
                  <div>
                    <p style={{ fontSize: "9px", color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Duração</p>
                    <p style={{ fontSize: "12px", color: "#111827", margin: 0, fontWeight: "600" }}>
                      {proposal.contract_duration} {proposal.contract_duration === 1 ? 'mês' : 'meses'}
                    </p>
                  </div>
                )}
                {proposal?.type === "Mensal" && proposal?.contract_due_day && (
                  <div>
                    <p style={{ fontSize: "9px", color: "#9ca3af", margin: "0 0 4px", textTransform: "uppercase", fontWeight: "700", letterSpacing: "0.05em" }}>Vencimento</p>
                    <p style={{ fontSize: "12px", color: "#111827", margin: 0, fontWeight: "600" }}>Todo dia {proposal.contract_due_day}</p>
                  </div>
                )}
              </div>

              <div style={{ pageBreakInside: "avoid", marginBottom: "28px", padding: "14px 18px", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                <p style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 8px" }}>Cliente</p>
                <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 3px", color: "#111827" }}>{client?.nome_fantasia || "—"}</p>
                {client?.razao_social && <p style={{ fontSize: "12px", color: "#374151", margin: "0 0 2px" }}>{client.razao_social}</p>}
                {client?.cnpj_cpf && <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 2px" }}>CNPJ/CPF: {client.cnpj_cpf}</p>}
                {(client?.telefone || client?.email) && (
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 2px" }}>
                    {[client.email, client.telefone ? `Tel: ${client.telefone}` : null].filter(Boolean).join(" | ")}
                  </p>
                )}
                {!client?.telefone && !client?.email && client?.contato && (
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: "0 0 2px" }}>Contato: {client.contato}</p>
                )}
                {client?.logradouro && (
                  <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
                    {[client.logradouro, client.numero, client.bairro, client.cidade, client.uf].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

              <p style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 10px" }}>Itens da Proposta</p>
              
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "0" }}>
                <thead>
                  <tr>
                    {/* 🔥 Mudança de Detalhamento para Complemento aqui */}
                    {[["#", "center", "4%"], ["Serviço", "left", "24%"], ["Complemento", "left", "36%"], ["Qtd", "center", "6%"], ["Valor Unit.", "right", "15%"], ["Total", "right", "15%"]].map(([h, align, w]) => (
                      <th key={h} className="prop-th" style={{ padding: "9px 12px", textAlign: align, fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em", color: "#374151", border: "1px solid #d1d5db", background: "#f3f4f6", width: w }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || i} className={`print-table-row ${i % 2 !== 0 ? "prop-row-alt" : ""}`} style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                      <td style={cellStyle({ textAlign: "center", color: "#6b7280" })}>{i + 1}</td>
                      <td style={cellStyle({ fontWeight: "600" })}>{item.description}</td>
                      <td style={cellStyle({ color: "#4b5563" })}>
                        {item.details
                          ? <div className="print-rich-text" style={{ fontSize: "11px", lineHeight: "1.5" }} dangerouslySetInnerHTML={{ __html: item.details }} />
                          : <span style={{ color: "#9ca3af" }}>—</span>}
                      </td>
                      <td style={cellStyle({ textAlign: "center" })}>{item.quantity}</td>
                      
                      <td style={cellStyle({ textAlign: "right", whiteSpace: "nowrap", wordBreak: "normal" })}>{formatBRL(item.unit_price)}</td>
                      <td style={cellStyle({ textAlign: "right", fontWeight: "600", whiteSpace: "nowrap", wordBreak: "normal" })}>{formatBRL(item.total_price)}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr className="print-table-row">
                      <td colSpan={6} style={cellStyle({ textAlign: "center", color: "#9ca3af" })}>Nenhum item.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot style={{ display: "table-row-group" }}>
                  {hasDiscount && (
                    <>
                      <tr className="print-table-row">
                        <td colSpan={5} style={cellStyle({ textAlign: "right", fontWeight: "500" })}>Subtotal</td>
                        <td style={cellStyle({ textAlign: "right", whiteSpace: "nowrap", wordBreak: "normal" })}>{formatBRL(subtotal)}</td>
                      </tr>
                      <tr className="print-table-row">
                        <td colSpan={5} style={cellStyle({ textAlign: "right", color: "#0284c7" })}>
                          Desconto {proposal?.discount_type === "percent" ? `(${proposal.discount_value}%)` : ""}
                        </td>
                        <td style={cellStyle({ textAlign: "right", color: "#0284c7", whiteSpace: "nowrap", wordBreak: "normal" })}>− {formatBRL(discountAmt)}</td>
                      </tr>
                    </>
                  )}
                  <tr className="prop-total-row print-table-row">
                    <td colSpan={5} style={{ padding: "11px 12px", textAlign: "right", fontWeight: "700", fontSize: "12px", color: "#ffffff", border: "1px solid #6d28d9", background: "#7c3aed" }}>VALOR TOTAL</td>
                    <td style={{ padding: "11px 12px", textAlign: "right", fontWeight: "800", fontSize: "15px", color: "#ffffff", border: "1px solid #6d28d9", background: "#7c3aed", whiteSpace: "nowrap", wordBreak: "normal" }}>{formatBRL(totalValue)}</td>
                  </tr>
                </tfoot>
              </table>

              {proposal?.observations && (
                <div style={{ pageBreakInside: "avoid", marginTop: "24px", marginBottom: "28px", padding: "14px 18px", background: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb" }}>
                  <p style={{ fontSize: "9px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: "0 0 7px" }}>Observações</p>
                  <p style={{ fontSize: "12px", color: "#374151", margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{proposal.observations}</p>
                </div>
              )}
            </td>
          </tr>
        </tbody>

        {/* ── RODAPÉ REPETITIVO (TFOOT) ── */}
        <tfoot>
          <tr>
            <td>
              <div style={{ marginTop: "36px", textAlign: "center", paddingTop: "15px" }}>
                <p style={{ fontSize: "9px", color: "#9ca3af", margin: 0 }}>Proposta gerada com o ContaCenaERP®</p>
              </div>
              <div style={{ height: "15mm" }} />
            </td>
          </tr>
        </tfoot>

      </table>
    </div>
  );
}