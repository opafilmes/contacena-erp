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
    // Sort ascending (oldest first = insertion order)
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
      {/* Print CSS */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-only-doc { display: block !important; }
          .no-print { display: none !important; }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #111827 !important;
            background: #fff !important;
          }
          .print-purple-header {
            color: #ffffff !important;
            background: #7c3aed !important;
          }
          .print-gray-header {
            background: #f3f4f6 !important;
            color: #374151 !important;
          }
          .print-gray-row {
            background: #f9fafb !important;
          }
          .print-discount-row {
            color: #0284c7 !important;
          }
          .print-rich-text * { color: #374151 !important; background: transparent !important; }
          .print-rich-text ul { list-style: disc; padding-left: 20px; }
          .print-rich-text ol { list-style: decimal; padding-left: 20px; }
          .print-rich-text strong { font-weight: 700; }
          .print-rich-text em { font-style: italic; }

          @page {
            size: A4 portrait;
            margin: 18mm 15mm;
          }
        }
        .print-only-doc { display: none; }
        .print-rich-text ul { list-style: disc; padding-left: 20px; }
        .print-rich-text ol { list-style: decimal; padding-left: 20px; }
        .print-rich-text strong { font-weight: 700; }
        .print-rich-text em { font-style: italic; }
      `}</style>

      {/* On-screen overlay */}
      <div className="fixed inset-0 z-50 bg-black/75 flex items-start justify-center pt-8 pb-8 overflow-y-auto no-print">
        <div className="relative w-full max-w-4xl mx-4">
          <div className="flex items-center justify-between mb-3 no-print">
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
          <div className="print-area bg-white text-gray-900 rounded-xl shadow-2xl" style={{ padding: "48px 56px", minHeight: "1123px" }}>
            {loading
              ? <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
              : <PrintDocument {...docProps} />}
          </div>
        </div>
      </div>

      {/* Print-only clone */}
      <div className="print-only-doc" style={{ padding: "48px 56px", fontFamily: "Montserrat, sans-serif", color: "#111827", background: "#fff" }}>
        {!loading && <PrintDocument {...docProps} />}
      </div>
    </>
  );
}

function PrintDocument({ proposal, client, tenant, items, issueDate, validityDate, subtotal, discountAmt, totalValue }) {
  const hasDiscount = discountAmt > 0;

  const tenantAddress = [tenant?.logradouro, tenant?.numero, tenant?.bairro, tenant?.cidade, tenant?.uf]
    .filter(Boolean).join(", ");

  return (
    <div style={{ fontFamily: "Montserrat, sans-serif", color: "#111827", background: "#fff" }}>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "24px", borderBottom: "2px solid #e5e7eb", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {tenant?.logo ? (
            <img src={tenant.logo} alt={tenant.nome_fantasia} style={{ height: "60px", width: "auto", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "60px", height: "60px", borderRadius: "8px", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: "700", fontSize: "22px" }}>{tenant?.nome_fantasia?.[0] || "C"}</span>
            </div>
          )}
          <div>
            <p style={{ fontWeight: "700", fontSize: "18px", margin: 0, color: "#111827" }}>{tenant?.nome_fantasia || "Produtora"}</p>
            {tenant?.cnpj && <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>CNPJ: {tenant.cnpj}</p>}
            {tenantAddress && <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>{tenantAddress}</p>}
            {tenant?.telefone && <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>Tel: {tenant.telefone}</p>}
            {tenant?.email_corporativo && <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>{tenant.email_corporativo}</p>}
            {tenant?.website && <p style={{ fontSize: "11px", color: "#7c3aed", margin: "2px 0 0" }}>{tenant.website}</p>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "24px", fontWeight: "800", color: "#7c3aed", margin: 0 }}>{proposal?.number || "PROP-—"}</p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 0" }}>Emissão: {issueDate}</p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>Válida até: {validityDate}</p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>Tipo: {proposal?.type || "—"}</p>
          {proposal?.payment_method && (
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>
              Pagamento: {proposal.payment_method}
              {proposal.installments && proposal.payment_method === "Parcelado" ? ` (${proposal.installments}x)` : ""}
            </p>
          )}
          {proposal?.type === "Mensal" && proposal?.contract_due_day && (
            <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>Vencimento: dia {proposal.contract_due_day}</p>
          )}
        </div>
      </div>

      {/* ── Client ── */}
      <div style={{ marginBottom: "32px", padding: "16px 20px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
        <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 8px" }}>Cliente</p>
        <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 4px", color: "#111827" }}>{client?.nome_fantasia || "—"}</p>
        {client?.razao_social && <p style={{ fontSize: "12px", color: "#4b5563", margin: "0 0 2px" }}>{client.razao_social}</p>}
        {client?.cnpj_cpf && <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 2px" }}>CNPJ/CPF: {client.cnpj_cpf}</p>}
        {client?.telefone && <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 2px" }}>Tel: {client.telefone}</p>}
        {client?.email && <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 2px" }}>E-mail: {client.email}</p>}
        {/* fallback to legacy contato */}
        {!client?.telefone && !client?.email && client?.contato && (
          <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 2px" }}>Contato: {client.contato}</p>
        )}
        {client?.logradouro && (
          <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
            {[client.logradouro, client.numero, client.bairro, client.cidade, client.uf].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      {/* ── Items Table ── */}
      <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 12px" }}>Itens da Proposta</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "8px" }}>
        <thead>
          <tr className="print-gray-header" style={{ background: "#f3f4f6" }}>
            {["#", "Serviço", "Detalhamento", "Qtd", "Valor Unit.", "Total"].map(h => (
              <th key={h} style={{ padding: "10px 12px", textAlign: ["#", "Qtd", "Valor Unit.", "Total"].includes(h) ? "center" : "left", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", color: "#374151", border: "1px solid #e5e7eb" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id || i} className={i % 2 !== 0 ? "print-gray-row" : ""} style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
              <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", color: "#6b7280", border: "1px solid #e5e7eb", verticalAlign: "top" }}>{i + 1}</td>
              <td style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "600", color: "#111827", border: "1px solid #e5e7eb", verticalAlign: "top" }}>{item.description}</td>
              <td style={{ padding: "10px 12px", fontSize: "11px", color: "#4b5563", border: "1px solid #e5e7eb", verticalAlign: "top" }}>
                {item.details
                  ? <div className="print-rich-text" dangerouslySetInnerHTML={{ __html: item.details }} />
                  : <span style={{ color: "#9ca3af" }}>—</span>}
              </td>
              <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "12px", color: "#111827", border: "1px solid #e5e7eb", verticalAlign: "top" }}>{item.quantity}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12px", color: "#111827", border: "1px solid #e5e7eb", verticalAlign: "top" }}>{formatBRL(item.unit_price)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#111827", border: "1px solid #e5e7eb", verticalAlign: "top" }}>{formatBRL(item.total_price)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "12px", border: "1px solid #e5e7eb" }}>Nenhum item.</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          {hasDiscount && (
            <>
              <tr>
                <td colSpan={5} style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", color: "#374151", border: "1px solid #e5e7eb" }}>Subtotal</td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", color: "#374151", border: "1px solid #e5e7eb" }}>{formatBRL(subtotal)}</td>
              </tr>
              <tr className="print-discount-row">
                <td colSpan={5} style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", color: "#0284c7", border: "1px solid #e5e7eb" }}>
                  Desconto {proposal?.discount_type === "percent" ? `(${proposal.discount_value}%)` : ""}
                </td>
                <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", color: "#0284c7", border: "1px solid #e5e7eb" }}>− {formatBRL(discountAmt)}</td>
              </tr>
            </>
          )}
          <tr className="print-purple-header" style={{ background: "#7c3aed" }}>
            <td colSpan={5} style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700", fontSize: "13px", color: "#ffffff", border: "1px solid #6d28d9" }}>VALOR TOTAL</td>
            <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "800", fontSize: "16px", color: "#ffffff", border: "1px solid #6d28d9" }}>{formatBRL(totalValue)}</td>
          </tr>
        </tfoot>
      </table>

      {/* ── Observations ── */}
      {proposal?.observations && (
        <div style={{ marginBottom: "32px", padding: "16px 20px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 8px" }}>Observações</p>
          <p style={{ fontSize: "12px", color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>{proposal.observations}</p>
        </div>
      )}

      {/* ── Signatures ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: "64px", marginTop: "56px", paddingTop: "32px", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "200px", borderBottom: "1px solid #374151", marginBottom: "6px" }} />
          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>{tenant?.nome_fantasia || "Contratante"}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "200px", borderBottom: "1px solid #374151", marginBottom: "6px" }} />
          <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>{client?.nome_fantasia || "Contratado"}</p>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <p style={{ fontSize: "10px", color: "#d1d5db", margin: 0 }}>Proposta gerada com o ContaCenaERP®</p>
      </div>
    </div>
  );
}