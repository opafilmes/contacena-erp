import React, { useMemo } from "react";
import { format } from "date-fns";
import { formatBRL } from "@/utils/format";
import StatusPill from "@/components/financeiro/StatusPill";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

export default function ExtratoConsolidado({ receivables, payables, filters }) {
  const { dateFrom, dateTo, accountId, categoryId, status: statusFilter } = filters;

  const entries = useMemo(() => {
    const r = receivables.map(r => ({ ...r, _kind: "receber" }));
    const p = payables.map(p => ({ ...p, _kind: "pagar" }));
    let all = [...r, ...p];

    if (dateFrom) all = all.filter(e => e.data_vencimento && e.data_vencimento >= dateFrom);
    if (dateTo)   all = all.filter(e => e.data_vencimento && e.data_vencimento <= dateTo);
    if (categoryId) all = all.filter(e => e.category_id === categoryId);
    if (statusFilter) all = all.filter(e => e.status === statusFilter);

    all.sort((a, b) => {
      const da = a.data_vencimento || "9999";
      const db = b.data_vencimento || "9999";
      return db.localeCompare(da);
    });

    return all;
  }, [receivables, payables, dateFrom, dateTo, accountId, categoryId, statusFilter]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhuma movimentação encontrada para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map(e => (
        <div
          key={e.id + e._kind}
          className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
        >
          {e._kind === "receber" ? (
            <ArrowUpCircle className="w-5 h-5 text-green-400 shrink-0" />
          ) : (
            <ArrowDownCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground/90 truncate">{e.descricao}</p>
            <p className="text-xs text-muted-foreground">
              {e.data_vencimento ? format(new Date(e.data_vencimento), "dd/MM/yyyy") : "Sem vencimento"}
            </p>
          </div>
          <StatusPill status={e.status} />
          <span className={`text-sm font-semibold tabular-nums ${e._kind === "receber" ? "text-green-400" : "text-red-400"}`}>
            {e._kind === "pagar" && "−"}{formatBRL(e.valor)}
          </span>
        </div>
      ))}
    </div>
  );
}