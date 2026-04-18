import React from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";

const ROLE_COLORS = {
  Admin: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Financeiro: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  Producao: "bg-sky-500/15 text-sky-300 border-sky-500/30",
};

const PERMS_COLS = [
  { key: "perm_comercial", label: "Comercial" },
  { key: "perm_financeiro", label: "Financeiro" },
  { key: "perm_studio_atividades", label: "Atividades" },
  { key: "perm_studio_inventario", label: "Inventário" },
];

function PermBadge({ active }) {
  return active
    ? <CheckCircle2 className="w-4 h-4 text-green-400" />
    : <XCircle className="w-4 h-4 text-muted-foreground/40" />;
}

export default function EquipeTable({ rows, currentUserId, isPro, onEdit, onDelete }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        Nenhum usuário cadastrado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">Membro</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">Perfil</th>
            {PERMS_COLS.map(p => (
              <th key={p.key} className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
                {p.label}
              </th>
            ))}
            <th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i} className="group hover:bg-white/[0.03] border-t border-border/30 transition-colors">
              <td className="px-4 py-3.5">
                <p className="font-medium text-foreground/90">{row.nome}</p>
                <p className="text-xs text-muted-foreground">{row.email}</p>
                {row.id === currentUserId && (
                  <span className="text-[10px] text-violet-400 font-semibold">Você</span>
                )}
              </td>
              <td className="px-4 py-3.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[row.role] || ""}`}>
                  {row.role}
                </span>
              </td>
              {PERMS_COLS.map(p => (
                <td key={p.key} className="px-3 py-3.5 text-center">
                  <div className="flex justify-center">
                    <PermBadge active={row[p.key] !== false} />
                  </div>
                </td>
              ))}
              <td className="px-4 py-3.5">
                {isPro && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary/50 text-muted-foreground transition-all">
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
                        disabled={row.id === currentUserId}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}