import React from "react";
import { FileText } from "lucide-react";

const STATUS_STYLES = {
  "Pré-produção": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Captação": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Edição": "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "Finalizado": "bg-green-500/15 text-green-400 border-green-500/30",
};

export default function ResumoTab({ job, proposal }) {
  return (
    <div className="space-y-6 py-2">
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Título</p>
        <p className="text-xl font-heading font-bold text-foreground">{job.titulo}</p>
      </div>

      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Status</p>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[job.status_kanban] || ""}`}>
          {job.status_kanban}
        </span>
      </div>

      {proposal ? (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Proposta Vinculada</p>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{proposal.titulo}</p>
              <p className="text-xs text-muted-foreground capitalize">{proposal.status}</p>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Proposta Vinculada</p>
          <p className="text-sm text-muted-foreground">Nenhuma proposta vinculada.</p>
        </div>
      )}
    </div>
  );
}