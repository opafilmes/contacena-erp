import React from "react";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Pencil, Trash2, Calendar, User, Briefcase, Building2, GitBranch } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export default function TaskCard({ task, usuarios, jobs, clients, onEdit, onDelete, onToggle }) {
  const responsavel = usuarios.find(u => u.id === task.responsavel_id);
  const job = jobs.find(j => j.id === task.job_id);
  const client = (clients || []).find(c => c.id === task.client_id);
  const venc = task.data_vencimento ? new Date(task.data_vencimento) : null;
  const atrasada = venc && isBefore(venc, startOfDay(new Date())) && task.status === "A Fazer";
  const concluida = task.status === "Concluída";
  const isSubtask = !!task.parent_task_id;

  return (
    <div
      onClick={() => onEdit(task)}
      className={`
        flex items-start gap-4 rounded-xl border p-4 transition-all duration-200 cursor-pointer
        ${isSubtask ? "ml-6 border-l-2 border-l-accent/40" : ""}
        ${concluida
          ? "bg-white/[0.02] border-border/30 opacity-60"
          : atrasada
            ? "bg-red-500/[0.04] border-red-500/20 hover:border-red-500/30 hover:bg-red-500/[0.07]"
            : "bg-white/[0.03] border-border/50 hover:bg-secondary/40"
        }
      `}
    >
      {/* Toggle */}
      <button
        onClick={e => { e.stopPropagation(); onToggle(task); }}
        className={`
          mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center
          ${concluida
            ? "bg-green-500 border-green-500 text-white"
            : atrasada
              ? "border-red-400 hover:border-red-300"
              : "border-muted-foreground/40 hover:border-primary"
          }
        `}
      >
        {concluida && <Check className="w-3 h-3 stroke-[3]" />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Badge subtarefa */}
        {isSubtask && (
          <div className="flex items-center gap-1 mb-1">
            <GitBranch className="w-3 h-3 text-accent/70" />
            <span className="text-[10px] font-semibold text-accent/70 uppercase tracking-wider">Subtarefa</span>
          </div>
        )}

        <p className={`font-medium text-sm leading-snug ${concluida ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {task.titulo}
        </p>
        {task.descricao && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.descricao}</p>
        )}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {venc && (
            <span className={`flex items-center gap-1 text-xs ${atrasada ? "text-red-400" : "text-muted-foreground"}`}>
              <Calendar className="w-3 h-3" />
              {format(venc, "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {atrasada && " · Atrasada"}
            </span>
          )}
          {responsavel && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              {responsavel.nome}
            </span>
          )}
          {client && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              {client.nome_fantasia}
            </span>
          )}
          {job && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Briefcase className="w-3 h-3" />
              {job.titulo}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-secondary/50 text-muted-foreground transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-popover/95 backdrop-blur-xl border-border/50">
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(task); }} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={e => { e.stopPropagation(); onDelete(task); }}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}