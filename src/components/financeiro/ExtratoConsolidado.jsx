import React, { useMemo, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { formatBRL } from "@/utils/format";
import StatusPill from "@/components/financeiro/StatusPill";
import { ArrowDownCircle, ArrowUpCircle, ArrowUpDown, ChevronUp, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function SortHeader({ label, field, sort, onSort }) {
  const active = sort.field === field;
  return (
    <th
      className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active ? (
          sort.dir === "asc" ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

// Find suggestions: same type, pending/overdue, value within 5%, date within 5 days
function findSuggestions(entry, receivables, payables) {
  const list = entry._kind === "receber" ? receivables : payables;
  const entryDate = new Date(entry.data_vencimento || "2000-01-01");
  const entryVal = entry.valor || 0;

  return list.filter(r => {
    if (r.status === "Pago" || r.status === "Recebido") return false;
    if (r.id === entry.id) return false;
    const valDiff = Math.abs((r.valor || 0) - entryVal) / (entryVal || 1);
    const daysDiff = Math.abs(differenceInDays(new Date(r.data_vencimento || "2000-01-01"), entryDate));
    return valDiff <= 0.05 && daysDiff <= 5;
  }).slice(0, 3);
}

export default function ExtratoConsolidado({ receivables, payables, filters, onConciliar }) {
  const { dateFrom, dateTo, accountId, categoryId, status: statusFilter, search } = filters;
  const [sort, setSort] = useState({ field: "data_vencimento", dir: "desc" });

  const handleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
  };

  const entries = useMemo(() => {
    const r = receivables.map(r => ({ ...r, _kind: "receber" }));
    const p = payables.map(p => ({ ...p, _kind: "pagar" }));
    // Exclude staging entries — only show confirmed/paid/pending records
    let all = [...r, ...p].filter(e => e.status !== "Aguardando Conciliação");

    if (dateFrom) all = all.filter(e => e.data_vencimento && e.data_vencimento >= dateFrom);
    if (dateTo)   all = all.filter(e => e.data_vencimento && e.data_vencimento <= dateTo);
    if (categoryId) all = all.filter(e => e.category_id === categoryId);
    if (statusFilter) all = all.filter(e => e.status === statusFilter);
    if (accountId) all = all.filter(e => e.bank_account_id === accountId);
    if (search?.trim()) {
      const q = search.toLowerCase();
      all = all.filter(e => e.descricao?.toLowerCase().includes(q));
    }

    all.sort((a, b) => {
      let va, vb;
      if (sort.field === "data_vencimento") { va = a.data_vencimento || ""; vb = b.data_vencimento || ""; }
      else if (sort.field === "descricao") { va = a.descricao || ""; vb = b.descricao || ""; }
      else if (sort.field === "valor") { va = a.valor || 0; vb = b.valor || 0; }
      else if (sort.field === "status") { va = a.status || ""; vb = b.status || ""; }
      else { va = ""; vb = ""; }
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });

    return all;
  }, [receivables, payables, dateFrom, dateTo, accountId, categoryId, statusFilter, search, sort]);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        Nenhuma movimentação encontrada para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-secondary/20">
            <th className="px-4 py-2.5 w-8" />
            <SortHeader label="Descrição" field="descricao" sort={sort} onSort={handleSort} />
            <SortHeader label="Data" field="data_vencimento" sort={sort} onSort={handleSort} />
            <SortHeader label="Valor" field="valor" sort={sort} onSort={handleSort} />
            <SortHeader label="Status" field="status" sort={sort} onSort={handleSort} />
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const suggestions = e.status === "Pendente" ? findSuggestions(e, receivables, payables) : [];
            const hasSuggestion = suggestions.length > 0;
            return (
              <tr key={e.id + e._kind} className="border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors group">
                <td className="px-4 py-3">
                  {e._kind === "receber"
                    ? <ArrowUpCircle className="w-4 h-4 text-green-400 shrink-0" />
                    : <ArrowDownCircle className="w-4 h-4 text-red-400 shrink-0" />
                  }
                </td>
                <td className="px-4 py-3">
                  <p className="text-foreground/90 truncate max-w-xs">{e.descricao}</p>
                  {hasSuggestion && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-violet-400 mt-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      Sugestão encontrada: {suggestions[0].descricao}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                  {e.data_vencimento ? format(new Date(e.data_vencimento + "T12:00:00"), "dd/MM/yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-semibold tabular-nums ${e._kind === "receber" ? "text-green-400" : "text-red-400"}`}>
                    {e._kind === "pagar" && "−"}{formatBRL(e.valor)}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusPill status={e.status} /></td>
                <td className="px-4 py-3">
                  {e.status === "Pendente" && onConciliar && (
                    <Button
                      size="sm"
                      variant="outline"
                      className={`h-7 px-2 text-xs gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${hasSuggestion ? "border-violet-500/40 text-violet-400 hover:bg-violet-500/10" : "border-border/40 text-muted-foreground"}`}
                      onClick={() => onConciliar(e, suggestions)}
                    >
                      Conciliar
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}