import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const empty = { nome_fantasia: "", cnpj_cpf: "", contato: "" };

export default function ClientDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? { nome_fantasia: record.nome_fantasia || "", cnpj_cpf: record.cnpj_cpf || "", contato: record.contato || "" } : empty);
  }, [record, open]);

  const handleSave = async () => {
    if (!form.nome_fantasia.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const payload = { ...form, tenant_id: tenantId };
    if (record?.id) {
      await base44.entities.Client.update(record.id, payload);
      toast.success("Cliente atualizado!");
    } else {
      await base44.entities.Client.create(payload);
      toast.success("Cliente criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Cliente" : "Novo Cliente"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Nome Fantasia *</Label>
            <Input value={form.nome_fantasia} onChange={e => setForm({ ...form, nome_fantasia: e.target.value })} placeholder="Nome do cliente ou marca" />
          </div>
          <div className="space-y-1.5">
            <Label>CNPJ / CPF</Label>
            <Input value={form.cnpj_cpf} onChange={e => setForm({ ...form, cnpj_cpf: e.target.value })} placeholder="00.000.000/0001-00" />
          </div>
          <div className="space-y-1.5">
            <Label>Contato</Label>
            <Input value={form.contato} onChange={e => setForm({ ...form, contato: e.target.value })} placeholder="email@exemplo.com ou (11) 99999-9999" />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}