import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDt = v => v ? format(new Date(v), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

export default function BookingReportPrint({ bookings, equipments, clients, tenant }) {
  const getEqNames = (b) => {
    const ids = b.equipment_ids?.length ? b.equipment_ids : b.equipment_id ? [b.equipment_id] : [];
    return ids.map(id => equipments.find(e => e.id === id)?.nome_item || "?").join(", ");
  };

  const getClientName = (b) => clients.find(c => c.id === b.client_id)?.nome_fantasia || "—";

  const sorted = [...bookings].sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));

  return (
    <div id="print-container" className="bg-white text-black p-8 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 border-b-2 border-gray-800 pb-4">
        <div>
          {tenant?.logo && <img src={tenant.logo} alt="logo" className="h-12 mb-2 object-contain" />}
          <h1 className="text-xl font-bold text-gray-900">{tenant?.nome_fantasia || "Empresa"}</h1>
          {tenant?.cnpj && <p className="text-xs text-gray-500">CNPJ: {tenant.cnpj}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-bold text-gray-900">Relatório de Reservas</h2>
          <p className="text-xs text-gray-500">Gerado em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          <p className="text-xs text-gray-500">Total: {bookings.length} reservas</p>
        </div>
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-sm mb-8">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-2 px-3 text-gray-600 text-xs uppercase tracking-wide">Cliente</th>
            <th className="text-left py-2 px-3 text-gray-600 text-xs uppercase tracking-wide">Equipamentos</th>
            <th className="text-left py-2 px-3 text-gray-600 text-xs uppercase tracking-wide">Retirada</th>
            <th className="text-left py-2 px-3 text-gray-600 text-xs uppercase tracking-wide">Dev. Prevista</th>
            <th className="text-left py-2 px-3 text-gray-600 text-xs uppercase tracking-wide">Dev. Real</th>
            <th className="text-left py-2 px-3 text-gray-600 text-xs uppercase tracking-wide">Responsável</th>
            <th className="text-left py-2 px-3 text-gray-600 text-xs uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b, i) => (
            <tr key={b.id} className={i % 2 === 0 ? "bg-gray-50" : ""}>
              <td className="py-2 px-3 font-medium text-gray-800">{getClientName(b)}</td>
              <td className="py-2 px-3 text-gray-700">{getEqNames(b)}</td>
              <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{fmtDt(b.data_inicio)}</td>
              <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{fmtDt(b.data_fim)}</td>
              <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{fmtDt(b.data_devolucao_real)}</td>
              <td className="py-2 px-3 text-gray-600">{b.responsavel_nome || "—"}</td>
              <td className="py-2 px-3">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  b.status === "Concluída" ? "bg-green-100 text-green-800" :
                  b.status === "Em Uso" ? "bg-blue-100 text-blue-800" :
                  "bg-amber-100 text-amber-800"
                }`}>{b.status || "Pendente"}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Resumo */}
      <div className="border border-gray-200 rounded p-4 mb-10 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-2">Resumo</h3>
        <div className="grid grid-cols-3 gap-4 text-sm text-gray-700">
          <div><span className="font-medium">Total de Reservas:</span> {bookings.length}</div>
          <div><span className="font-medium">Em Uso:</span> {bookings.filter(b => b.status === "Em Uso").length}</div>
          <div><span className="font-medium">Concluídas:</span> {bookings.filter(b => b.status === "Concluída").length}</div>
        </div>
      </div>

      {/* Assinatura */}
      <div className="grid grid-cols-2 gap-12 mt-16">
        {["Assinatura de Saída", "Assinatura de Entrada"].map(label => (
          <div key={label} className="text-center">
            <div className="border-b border-gray-400 mb-2 h-10" />
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xs text-gray-400 mt-1">Nome / Data</p>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div className="print-footer-fixed text-center text-xs text-gray-400 mt-12">
        {tenant?.nome_fantasia} — Relatório de Logística de Equipamentos
      </div>
    </div>
  );
}