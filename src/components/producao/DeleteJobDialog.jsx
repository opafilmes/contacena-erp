import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeleteJobDialog({ job, tenantId, open, onClose, onDeleted }) {
  const [cascadeFinancial, setCascadeFinancial] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!open || !job) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      if (cascadeFinancial) {
        const [receivables, payables] = await Promise.all([
          base44.entities.AccountReceivable.filter({ job_id: job.id, inquilino_id: tenantId }),
          base44.entities.AccountPayable.filter({ job_id: job.id, inquilino_id: tenantId }),
        ]);
        await Promise.all([
          ...receivables.map(r => base44.entities.AccountReceivable.delete(r.id)),
          ...payables.map(p => base44.entities.AccountPayable.delete(p.id)),
        ]);
      }
      await base44.entities.Job.delete(job.id);
      toast.success("Projeto excluído.");
      onDeleted();
      onClose();
    } catch {
      toast.error("Erro ao excluir projeto.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-popover border border-destructive/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-heading font-semibold text-foreground">Excluir Projeto</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tem certeza que deseja excluir <strong className="text-foreground">"{job.titulo}"</strong>? Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/5 border border-destructive/20 cursor-pointer hover:bg-destructive/10 transition-colors mb-5">
          <input
            type="checkbox"
            checked={cascadeFinancial}
            onChange={e => setCascadeFinancial(e.target.checked)}
            className="mt-0.5 accent-destructive"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Excluir lançamentos financeiros</p>
            <p className="text-xs text-muted-foreground">Remove também Contas a Receber e a Pagar vinculadas a este job.</p>
          </div>
        </label>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={deleting}>Cancelar</Button>
          <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="w-4 h-4 mr-1" />
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}