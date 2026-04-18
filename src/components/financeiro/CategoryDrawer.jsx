import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

const EMPTY = { nome: "", tipo: "Receita" };

export default function CategoryDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(record ? { nome: record.nome, tipo: record.tipo } : EMPTY);
  }, [open, record]);

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const payload = { ...form, inquilino_id: tenantId };
    if (record?.id) {
      await base44.entities.FinancialCategory.update(record.id, payload);
      toast.success("Categoria atualizada!");
    } else {
      await base44.entities.FinancialCategory.create(payload);
      toast.success("Categoria criada!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar" : "Nova"} Categoria</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Cachê de Equipe" />
          </div>
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                <SelectItem value="Receita">Receita</SelectItem>
                <SelectItem value="Despesa">Despesa</SelectItem>
              </SelectContent>
            </Select>
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