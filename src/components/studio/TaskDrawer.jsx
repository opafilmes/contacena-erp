import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const BLANK = {
  titulo: "",
  descricao: "",
  data_vencimento: "",
  status: "A Fazer",
  responsavel_id: "",
  job_id: "",
};

export default function TaskDrawer({ open, onClose, task, inquilinoId, tenantId, usuarios, jobs, currentUserId, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (task) {
        setForm({
          titulo: task.titulo || "",
          descricao: task.descricao || "",
          data_vencimento: task.data_vencimento ? task.data_vencimento.slice(0, 16) : "",
          status: task.status || "A Fazer",
          responsavel_id: task.responsavel_id || "",
          job_id: task.job_id || "",
        });
      } else {
        setForm({ ...BLANK, criado_por_id: currentUserId || "" });
      }
    }
  }, [open, task, currentUserId]);

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório."); return; }
    setSaving(true);
    const payload = {
      ...form,
      inquilino_id: inquilinoId,
      criado_por_id: task ? task.criado_por_id : (currentUserId || ""),
    };
    if (!payload.responsavel_id) delete payload.responsavel_id;
    if (!payload.job_id) delete payload.job_id;
    if (!payload.data_vencimento) delete payload.data_vencimento;

    if (task?.id) {
      await base44.entities.Task.update(task.id, payload);
      toast.success("Tarefa atualizada!");
    } else {
      await base44.entities.Task.create(payload);
      toast.success("Tarefa criada!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <SheetHeader>
          <SheetTitle className="font-heading">{task ? "Editar Tarefa" : "Nova Tarefa"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              placeholder="Descreva a tarefa..."
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              placeholder="Detalhes adicionais..."
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Data de Vencimento</Label>
            <Input
              type="datetime-local"
              value={form.data_vencimento}
              onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="A Fazer">A Fazer</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select value={form.responsavel_id} onValueChange={v => setForm(f => ({ ...f, responsavel_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar membro..." /></SelectTrigger>
              <SelectContent>
                {usuarios.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Job Relacionado</Label>
            <Select value={form.job_id} onValueChange={v => setForm(f => ({ ...f, job_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar job..." /></SelectTrigger>
              <SelectContent>
                {jobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>{j.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}