import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const empty = { nome: "", categoria: "", telefone: "" };

export default function SupplierDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(record ? { nome: record.nome || "", categoria: record.categoria || "", telefone: record.telefone || "" } : empty);
  }, [record, open]);

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const payload = { ...form, tenant_id: tenantId };
    if (record?.id) {
      await base44.entities.Supplier.update(record.id, payload);
      toast.success("Fornecedor atualizado!");
    } else {
      await base44.entities.Supplier.create(payload);
      toast.success("Fornecedor criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Fornecedor" : "Novo Fornecedor"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome do fornecedor" />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} placeholder="ex: Equipamento, Locação, Serviço" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
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