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
    base44.entities.ProposalItem.filter({ proposal_id: proposal.id }).then(its => {
      setItems(its);
      setLoading(false);
    });
  }, [proposal?.id]);

  const issueDate = proposal?.issue_date
    ? new Date(proposal.issue_date + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";
  const validityDate = proposal?.validity_date
    ? new Date(proposal.validity_date + "T00:00:00").toLocaleDateString("pt-BR")
    : "—";

  return (
    <>
      {/* Overlay Controls — hidden on print */}
      <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center pt-8 pb-8 overflow-y-auto no-print">
        <div className="relative w-full max-w-4xl mx-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-3 no-print">
            <p className="text-zinc-300 text-sm font-medium">Visualização de Impressão — {proposal?.number}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
              >
                <Printer className="w-4 h-4" /> Imprimir / PDF
              </Button>
              <Button size="sm" variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400 gap-1.5">
                <X className="w-4 h-4" /> Fechar
              </Button>
            </div>
          </div>

          {/* A4 Document */}
          <div className="print-area bg-white text-gray-900 rounded-xl shadow-2xl" style={{ padding: "48px 56px", minHeight: "1123px" }}>
            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
            ) : (
              <PrintDocument proposal={proposal} client={client} tenant={tenant} items={items} issueDate={issueDate} validityDate={validityDate} />
            )}
          </div>
        </div>
      </div>

      {/* Print-only version */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-only-doc { display: block !important; }
          .no-print { display: none !important; }
        }
        .print-only-doc { display: none; }
      `}</style>
      <div className="print-only-doc" style={{ padding: "48px 56px", fontFamily: "Montserrat, sans-serif", color: "#111827", background: "#fff" }}>
        {!loading && (
          <PrintDocument proposal={proposal} client={client} tenant={tenant} items={items} issueDate={issueDate} validityDate={validityDate} />
        )}
      </div>
    </>
  );
}

function PrintDocument({ proposal, client, tenant, items, issueDate, validityDate }) {
  return (
    <div style={{ fontFamily: "Montserrat, sans-serif", color: "#111827" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "24px", borderBottom: "2px solid #e5e7eb", marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {tenant?.logo ? (
            <img src={tenant.logo} alt={tenant.nome_fantasia} style={{ height: "56px", width: "auto", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "56px", height: "56px", borderRadius: "8px", background: "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: "700", fontSize: "20px" }}>{tenant?.nome_fantasia?.[0] || "C"}</span>
            </div>
          )}
          <div>
            <p style={{ fontWeight: "700", fontSize: "18px", margin: 0 }}>{tenant?.nome_fantasia || "Produtora"}</p>
            {tenant?.cnpj && <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>CNPJ: {tenant.cnpj}</p>}
            {tenant?.email_corporativo && <p style={{ fontSize: "11px", color: "#6b7280", margin: "1px 0 0" }}>{tenant.email_corporativo}</p>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "22px", fontWeight: "800", color: "#7c3aed", margin: 0 }}>{proposal?.number || "PROP-—"}</p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "4px 0 0" }}>Emissão: {issueDate}</p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>Válida até: {validityDate}</p>
          <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>Tipo: {proposal?.type || "—"}</p>
        </div>
      </div>

      {/* Client */}
      <div style={{ marginBottom: "32px", padding: "16px 20px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
        <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 8px" }}>Cliente</p>
        <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>{client?.nome_fantasia || "—"}</p>
        {client?.razao_social && <p style={{ fontSize: "12px", color: "#4b5563", margin: "0 0 2px" }}>{client.razao_social}</p>}
        {client?.cnpj_cpf && <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 2px" }}>CNPJ/CPF: {client.cnpj_cpf}</p>}
        {client?.contato && <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>Contato: {client.contato}</p>}
      </div>

      {/* Items Table */}
      <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 12px" }}>Itens da Proposta</p>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "32px" }}>
        <thead>
          <tr style={{ background: "#f3f4f6" }}>
            {["#", "Descrição", "Detalhes", "Qtd", "Valor Unit.", "Total"].map(h => (
              <th key={h} style={{ padding: "10px 12px", textAlign: h === "#" || h === "Qtd" || h === "Valor Unit." || h === "Total" ? "center" : "left", fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em", color: "#374151", border: "1px solid #e5e7eb" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id || i} style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
              <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "11px", color: "#6b7280", border: "1px solid #e5e7eb" }}>{i + 1}</td>
              <td style={{ padding: "10px 12px", fontSize: "12px", fontWeight: "500", border: "1px solid #e5e7eb" }}>{item.description}</td>
              <td style={{ padding: "10px 12px", fontSize: "11px", color: "#6b7280", border: "1px solid #e5e7eb" }}>{item.details || "—"}</td>
              <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "12px", border: "1px solid #e5e7eb" }}>{item.quantity}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12px", border: "1px solid #e5e7eb" }}>{formatBRL(item.unit_price)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontSize: "12px", fontWeight: "600", border: "1px solid #e5e7eb" }}>{formatBRL(item.total_price)}</td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "12px", border: "1px solid #e5e7eb" }}>Nenhum item.</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: "#7c3aed" }}>
            <td colSpan={5} style={{ padding: "12px", textAlign: "right", fontWeight: "700", fontSize: "13px", color: "#ffffff", border: "1px solid #6d28d9" }}>VALOR TOTAL</td>
            <td style={{ padding: "12px", textAlign: "right", fontWeight: "800", fontSize: "16px", color: "#ffffff", border: "1px solid #6d28d9" }}>{formatBRL(proposal?.total_value)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Observations */}
      {proposal?.observations && (
        <div style={{ marginBottom: "32px", padding: "16px 20px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: "10px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", margin: "0 0 8px" }}>Observações</p>
          <p style={{ fontSize: "12px", color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>{proposal.observations}</p>
        </div>
      )}

      {/* Signature */}
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

      {/* Footer */}
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <p style={{ fontSize: "10px", color: "#d1d5db", margin: 0 }}>Proposta gerada com o ContaCenaERP®</p>
      </div>
    </div>
  );
}