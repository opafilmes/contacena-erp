import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export default function DataTable({ columns, rows, onEdit, onDelete, emptyMessage = "Nenhum registro encontrado." }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest"
              >
                {col.label}
              </th>
            ))}
            <th className="px-4 py-2.5 w-12" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              className="group hover:bg-white/[0.03] transition-colors duration-150 rounded-lg"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3.5 text-foreground/85 first:rounded-l-lg last:rounded-r-lg">
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