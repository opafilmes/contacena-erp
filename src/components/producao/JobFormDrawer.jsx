import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const STATUSES = ["Pré-produção", "Captação", "Edição", "Finalizado"];

export default function JobFormDrawer({ open, onClose, initialStatus, tenantId, proposals, onSaved }) {
  const [form, setForm] = useState({ titulo: "", status_kanban: initialStatus || "Pré-produção", proposal_id: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ titulo: "", status_kanban: initialStatus || "Pré-produção", proposal_id: "" });
  }, [open, initialStatus]);

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título é obrigatório."); return; }
    setSaving(true);
    await base44.entities.Job.create({ ...form, tenant_id: tenantId });
    toast.success("Job criado!");
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">Novo Job</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Nome do projeto" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status_kanban} onValueChange={v => setForm({ ...form, status_kanban: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Proposta Vinculada</Label>
            <Select value={form.proposal_id} onValueChange={v => setForm({ ...form, proposal_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar proposta..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {proposals.map(p => <SelectItem key={p.id} value={p.id}>{p.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Salvando..." : "Criar Job"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}