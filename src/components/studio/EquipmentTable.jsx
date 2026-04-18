import React from "react";
import DataTable from "@/components/shared/DataTable";

const fmt = (v) => v != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : "—";

const COLS = [
  { key: "nome_item", label: "Nome" },
  { key: "num_serie", label: "Nº Série" },
  { key: "qtd_total", label: "Qtd Total" },
  { key: "valor_compra", label: "Valor Compra", render: r => fmt(r.valor_compra) },
];

export default function EquipmentTable({ equipments, onEdit, onDelete }) {
  return (
    <DataTable
      columns={COLS}
      rows={equipments}
      onEdit={onEdit}
      onDelete={onDelete}
      emptyMessage="Nenhum equipamento cadastrado."
    />
  );
}