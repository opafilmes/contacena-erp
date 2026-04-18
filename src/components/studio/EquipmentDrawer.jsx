import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BLANK = { nome_item: "", num_serie: "", qtd_total: "", valor_compra: "" };

export default function EquipmentDrawer({ open, record, tenantId, onClose, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(record
        ? { nome_item: record.nome_item || "", num_serie: record.num_serie || "", qtd_total: record.qtd_total ?? "", valor_compra: record.valor_compra ?? "" }
        : BLANK
      );
    }
  }, [open, record]);

  const handleSave = async () => {
    if (!form.nome_item.trim()) { toast.error("Nome obrigatório."); return; }
    setSaving(true);
    const payload = {
      nome_item: form.nome_item,
      num_serie: form.num_serie || undefined,
      qtd_total: form.qtd_total !== "" ? Number(form.qtd_total) : undefined,
      valor_compra: form.valor_compra !== "" ? Number(form.valor_compra) : undefined,
      tenant_id: tenantId,
    };
    if (record?.id) {
      await base44.entities.Equipment.update(record.id, payload);
      toast.success("Equipamento atualizado!");
    } else {
      await base44.entities.Equipment.create(payload);
      toast.success("Equipamento cadastrado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Equipamento" : "Novo Equipamento"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <Label>Nome do Equipamento *</Label>
            <Input placeholder="Ex: Sony FX3" value={form.nome_item} onChange={e => setForm(f => ({ ...f, nome_item: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Número de Série</Label>
            <Input placeholder="SN-XXXXXXX" value={form.num_serie} onChange={e => setForm(f => ({ ...f, num_serie: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Quantidade Total</Label>
            <Input type="number" placeholder="1" value={form.qtd_total} onChange={e => setForm(f => ({ ...f, qtd_total: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Valor de Compra (R$)</Label>
            <Input type="number" placeholder="0,00" value={form.valor_compra} onChange={e => setForm(f => ({ ...f, valor_compra: e.target.value }))} />
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