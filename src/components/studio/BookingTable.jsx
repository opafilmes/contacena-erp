import React from "react";
import DataTable from "@/components/shared/DataTable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fmtDt = (v) => v ? format(new Date(v), "dd/MM/yy HH:mm", { locale: ptBR }) : "—";

export default function BookingTable({ bookings, equipments, jobs, onEdit, onDelete }) {
  const cols = [
    { key: "equipment_id", label: "Equipamento", render: r => equipments.find(e => e.id === r.equipment_id)?.nome_item || "—" },
    { key: "job_id", label: "Job", render: r => jobs.find(j => j.id === r.job_id)?.titulo || "—" },
    { key: "data_inicio", label: "Início", render: r => fmtDt(r.data_inicio) },
    { key: "data_fim", label: "Fim", render: r => fmtDt(r.data_fim) },
    { key: "qtd_reservada", label: "Qtd" },
  ];

  return (
    <DataTable
      columns={cols}
      rows={bookings}
      onEdit={onEdit}
      onDelete={onDelete}
      emptyMessage="Nenhuma reserva encontrada."
    />
  );
}