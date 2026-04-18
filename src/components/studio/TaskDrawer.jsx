import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GitBranch } from "lucide-react";

const BLANK_FORM = {
  titulo: "",
  descricao: "",
  data_vencimento: "",
  status: "A Fazer",
  responsavel_id: "",
  job_id: "",
  client_id: "",
};

const BLANK_SUBTASK = {
  titulo: "",
  descricao: "",
  data_vencimento: "",
  responsavel_id: "",
};

export default function TaskDrawer({ open, onClose, task, inquilinoId, tenantId, usuarios, jobs, clients, currentUserId, onSaved }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [subtasks, setSubtasks] = useState([]);
  const [saving, setSaving] = useState(false);

  const isEditMode = !!task?.id;
  // Only show subtask section for master tasks (no parent)
  const isMasterTask = !task?.parent_task_id;

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
          client_id: task.client_id || "",
        });
      } else {
        setForm({ ...BLANK_FORM });
      }
      setSubtasks([]);
    }
  }, [open, task]);

  const addSubtask = () => setSubtasks(s => [...s, { ...BLANK_SUBTASK, _key: Date.now() }]);

  const updateSubtask = (index, field, value) => {
    setSubtasks(s => s.map((sub, i) => i === index ? { ...sub, [field]: value } : sub));
  };

  const removeSubtask = (index) => setSubtasks(s => s.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório."); return; }
    setSaving(true);

    const masterPayload = {
      titulo: form.titulo,
      descricao: form.descricao || undefined,
      data_vencimento: form.data_vencimento || undefined,
      status: form.status,
      responsavel_id: form.responsavel_id || undefined,
      job_id: form.job_id || undefined,
      client_id: form.client_id || undefined,
      inquilino_id: inquilinoId,
      criado_por_id: task ? task.criado_por_id : (currentUserId || undefined),
    };

    let masterId;
    if (isEditMode) {
      await base44.entities.Task.update(task.id, masterPayload);
      masterId = task.id;
      toast.success("Tarefa atualizada!");
    } else {
      const created = await base44.entities.Task.create(masterPayload);
      masterId = created.id;
    }

    // Camada 3: Criar subtarefas em lote
    if (subtasks.length > 0 && masterId) {
      const validSubtasks = subtasks.filter(s => s.titulo?.trim());
      await Promise.all(validSubtasks.map(sub =>
        base44.entities.Task.create({
          titulo: sub.titulo,
          descricao: sub.descricao || undefined,
          data_vencimento: sub.data_vencimento || undefined,
          responsavel_id: sub.responsavel_id || undefined,
          status: "A Fazer",
          parent_task_id: masterId,
          job_id: masterPayload.job_id,
          client_id: masterPayload.client_id,
          inquilino_id: inquilinoId,
          criado_por_id: currentUserId || undefined,
        })
      ));
      if (!isEditMode) toast.success(`Tarefa criada com ${validSubtasks.length} subtarefa(s)!`);
    } else if (!isEditMode && subtasks.length === 0) {
      toast.success("Tarefa criada!");
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card/95 backdrop-blur-xl border-border/50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{isEditMode ? "Editar Tarefa" : "Nova Tarefa Mestre"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6 pb-6">
          {/* Título */}
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input
              placeholder="Descreva a tarefa..."
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              placeholder="Detalhes adicionais..."
              value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
            />
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
              <SelectContent>
                {(clients || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projeto (Job) */}
          <div className="space-y-1.5">
            <Label>Projeto</Label>
            <Select value={form.job_id} onValueChange={v => setForm(f => ({ ...f, job_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar projeto..." /></SelectTrigger>
              <SelectContent>
                {jobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>{j.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data Vencimento */}
          <div className="space-y-1.5">
            <Label>Data de Vencimento</Label>
            <Input
              type="datetime-local"
              value={form.data_vencimento}
              onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))}
            />
          </div>

          {/* Status */}
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

          {/* Responsável */}
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

          {/* === SEÇÃO DE SUBTAREFAS (apenas em tarefas mestre) === */}
          {isMasterTask && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-semibold">Subtarefas</Label>
                  {subtasks.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold">
                      {subtasks.length}
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSubtask}
                  className="gap-1.5 text-xs h-7 text-accent hover:text-accent hover:bg-accent/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Nova Subtarefa
                </Button>
              </div>

              {subtasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2 border border-dashed border-border/40 rounded-lg">
                  Nenhuma subtarefa. Clique em "+ Nova Subtarefa" para adicionar.
                </p>
              )}

              <div className="space-y-3">
                {subtasks.map((sub, i) => (
                  <div key={sub._key ?? i} className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-3">
                    {/* Header subtarefa */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
                        ↳ Subtarefa {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSubtask(i)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Título */}
                    <div className="space-y-1">
                      <Label className="text-xs">Título *</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="Título da subtarefa..."
                        value={sub.titulo}
                        onChange={e => updateSubtask(i, "titulo", e.target.value)}
                      />
                    </div>
                    {/* Descrição */}
                    <div className="space-y-1">
                      <Label className="text-xs">Descrição</Label>
                      <Input
                        className="h-8 text-sm"
                        placeholder="Opcional..."
                        value={sub.descricao}
                        onChange={e => updateSubtask(i, "descricao", e.target.value)}
                      />
                    </div>
                    {/* Data + Responsável */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Vencimento</Label>
                        <Input
                          type="datetime-local"
                          className="h-8 text-xs"
                          value={sub.data_vencimento}
                          onChange={e => updateSubtask(i, "data_vencimento", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Responsável</Label>
                        <Select
                          value={sub.responsavel_id}
                          onValueChange={v => updateSubtask(i, "responsavel_id", v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Equipe..." />
                          </SelectTrigger>
                          <SelectContent>
                            {usuarios.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : isEditMode ? "Atualizar" : "Criar Tarefa"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}