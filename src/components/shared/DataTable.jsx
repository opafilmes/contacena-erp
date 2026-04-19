import React, { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

function SortHeader({ col, sort, onSort }) {
  const active = sort.field === col.key;
  if (!col.sortable) {
    return (
      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
        {col.label}
      </th>
    );
  }
  return (
    <th
      className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(col.key)}
    >
      <span className="flex items-center gap-1">
        {col.label}
        {active ? (
          sort.dir === "asc" ? <ChevronUp className="w-3 h-3 text-accent" /> : <ChevronDown className="w-3 h-3 text-accent" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );
}

export default function DataTable({ columns, rows, onEdit, onDelete, emptyMessage = "Nenhum registro encontrado.", searchValue = "" }) {
  const [sort, setSort] = useState({ field: null, dir: "asc" });

  const handleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
  };

  const sortedRows = useMemo(() => {
    if (!sort.field) return rows;
    return [...rows].sort((a, b) => {
      const col = columns.find(c => c.key === sort.field);
      let va = col?.sortValue ? col.sortValue(a) : a[sort.field];
      let vb = col?.sortValue ? col.sortValue(b) : b[sort.field];
      va = va ?? "";
      vb = vb ?? "";
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sort, columns]);

  const filteredRows = useMemo(() => {
    if (!searchValue?.trim()) return sortedRows;
    const q = searchValue.toLowerCase();
    return sortedRows.filter(row =>
      columns.some(col => {
        const val = row[col.key];
        return typeof val === "string" && val.toLowerCase().includes(q);
      })
    );
  }, [sortedRows, searchValue, columns]);

  if (!filteredRows || filteredRows.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {rows?.length === 0 ? emptyMessage : "Nenhum resultado para a busca."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/40 bg-secondary/20">
            {columns.map((col) => (
              <SortHeader key={col.key} col={col} sort={sort} onSort={handleSort} />
            ))}
            <th className="px-4 py-2.5 w-12" />
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((row, i) => (
            <tr
              key={row.id || i}
              className="group hover:bg-white/[0.03] transition-colors duration-150 border-b border-border/20 last:border-0"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-foreground/85">
                  {col.render ? col.render(row) : row[col.key] ?? "—"}
                </td>
              ))}
              <td className="px-4 py-3.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-popover/95 backdrop-blur-xl border-border/50">
                    <DropdownMenuItem onClick={() => onEdit(row)} className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(row)}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}