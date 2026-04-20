import React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDt = v => v ? format(new Date(v), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

export default function BookingChecklistPrint({ booking, equipments, clients, tenant, onClose }) {
  if (!booking) return null;

  const ids = booking.equipment_ids?.length ? booking.equipment_ids : booking.equipment_id ? [booking.equipment_id] : [];
  const eqItems = ids.map(id => equipments.find(e => e.id === id)).filter(Boolean);
  const client = clients.find(c => c.id === booking.client_id);

  const handlePrint = () => window.print();

  return (
    <>
      {/* Botão visível apenas na tela */}
      <div className="no-print flex justify-end gap-2 mb-4">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">
          Fechar
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-700 flex items-center gap-1.5"
        >
          🖨️ Imprimir Checklist
        </button>
      </div>

      {/* Conteúdo do checklist */}
      <div id="print-container" className="bg-white text-black font-sans text-sm p-0">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b-2 border-gray-800 pb-4 mb-6">
          <div>
            {tenant?.logo && <img src={tenant.logo} alt="logo" className="h-10 mb-1 object-contain" />}
            <h1 className="text-base font-bold text-gray-900">{tenant?.nome_fantasia || "Empresa"}</h1>
            {tenant?.cnpj && <p className="text-xs text-gray-500">CNPJ: {tenant.cnpj}</p>}
            {tenant?.telefone && <p className="text-xs text-gray-500">Tel: {tenant.telefone}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Checklist de Equipamentos</h2>
            <p className="text-xs text-gray-500">Emitido em {format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
          </div>
        </div>

        {/* Dados da Reserva */}
        <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 rounded border border-gray-200 p-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Cliente</p>
            <p className="font-semibold text-gray-900">{client?.nome_fantasia || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Responsável</p>
            <p className="font-semibold text-gray-900">{booking.responsavel_nome || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Retirada</p>
            <p className="font-semibold text-gray-900">{fmtDt(booking.data_inicio)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Devolução Prevista</p>
            <p className="font-semibold text-gray-900">{fmtDt(booking.data_fim)}</p>
          </div>
        </div>

        {/* Checklist de itens */}
        <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Itens para Conferência</h3>
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 px-2 text-xs uppercase text-gray-500 w-8">Saída</th>
              <th className="text-left py-2 px-2 text-xs uppercase text-gray-500 w-8">Entrada</th>
              <th className="text-left py-2 px-2 text-xs uppercase text-gray-500">Equipamento</th>
              <th className="text-left py-2 px-2 text-xs uppercase text-gray-500">Categoria</th>
              <th className="text-left py-2 px-2 text-xs uppercase text-gray-500">Nº Série</th>
              <th className="text-left py-2 px-2 text-xs uppercase text-gray-500">Obs.</th>
            </tr>
          </thead>
          <tbody>
            {eqItems.map((eq, i) => (
              <tr key={eq.id} className={`border-b border-gray-200 ${i % 2 === 0 ? "" : "bg-gray-50"}`}>
                <td className="py-3 px-2">
                  <div className="w-5 h-5 border-2 border-gray-500 rounded-sm" />
                </td>
                <td className="py-3 px-2">
                  <div className="w-5 h-5 border-2 border-gray-500 rounded-sm" />
                </td>
                <td className="py-3 px-2 font-medium text-gray-800">{eq.nome_item}</td>
                <td className="py-3 px-2 text-gray-600">{eq.categoria || "—"}</td>
                <td className="py-3 px-2 text-gray-600 font-mono text-xs">{eq.num_serie || "—"}</td>
                <td className="py-3 px-2 min-w-[100px]">
                  <div className="border-b border-gray-300 h-5" />
                </td>
              </tr>
            ))}
            {eqItems.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-center text-gray-400 text-xs">Nenhum equipamento vinculado.</td></tr>
            )}
          </tbody>
        </table>

        {/* Assinaturas */}
        <div className="grid grid-cols-2 gap-16 mt-12">
          {["Assinatura de Saída (Retirada)", "Assinatura de Entrada (Devolução)"].map(label => (
            <div key={label}>
              <div className="border-b-2 border-gray-700 mb-2 h-12" />
              <p className="text-xs text-gray-600 font-medium">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">Nome: _________________________ &nbsp; Data: ___/___/______</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}