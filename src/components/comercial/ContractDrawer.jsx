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
  client_id: "",
  tipo: "Avulso",
  valor: "",
  data_inicio: "",
  data_fim: "",
  status: "Ativo",
};

export default function ContractDrawer({ open, onClose, record, tenantId, clients, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(record ? {
        titulo:     record.titulo     || "",
        client_id:  record.client_id  || "",
        tipo:       record.tipo       || "Avulso",
        valor:      record.valor      ?? "",
        data_inicio: record.data_inicio || "",
        data_fim:    record.data_fim    || "",
        status:     record.status     || "Ativo",
      } : BLANK);
    }
  }, [open, record]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título obrigatório."); return; }
    setSaving(true);
    const payload = {
      ...form,
      valor: form.valor !== "" ? Number(form.valor) : undefined,
      client_id:   form.client_id   || undefined,
      data_inicio: form.data_inicio || undefined,
      data_fim:    form.data_fim    || undefined,
      inquilino_id: tenantId,
    };
    if (record?.id) {
      await base44.entities.Contract.update(record.id, payload);
      toast.success("Contrato atualizado!");
    } else {
      await base44.entities.Contract.create(payload);
      toast.success("Contrato criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Contrato" : "Novo Contrato"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6 pb-6">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ex: Contrato Anual de Social Media" />
          </div>

          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={form.client_id} onValueChange={v => set("client_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
              <SelectContent>
                {(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set("tipo", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Avulso">Avulso</SelectItem>
                  <SelectItem value="Recorrente">Recorrente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={form.valor} onChange={e => set("valor", e.target.value)} placeholder="0,00" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data Início</Label>
              <Input type="date" value={form.data_inicio} onChange={e => set("data_inicio", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Data Fim</Label>
              <Input type="date" value={form.data_fim} onChange={e => set("data_fim", e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : record ? "Atualizar" : "Criar Contrato"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}