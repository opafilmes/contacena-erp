import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

const STATUSES = ["Pendente", "Pago", "Atrasado"];
const EMPTY = { descricao: "", category_id: "", supplier_id: "", valor: "", data_vencimento: "", status: "Pendente" };

export default function AccountPayableDrawer({ open, onClose, record, tenantId, categories, suppliers, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [displayValor, setDisplayValor] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const r = record || EMPTY;
      setForm({ ...EMPTY, ...r });
      setDisplayValor(r.valor ? formatBRL(r.valor) : "");
    }
  }, [open, record]);

  const handleValorChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = Number(raw) / 100;
    setDisplayValor(formatBRL(num));
    setForm(f => ({ ...f, valor: num }));
  };

  const handleSave = async () => {
    if (!form.descricao.trim()) { toast.error("Descrição é obrigatória."); return; }
    setSaving(true);
    const payload = { ...form, inquilino_id: tenantId };
    if (record?.id) {
      await base44.entities.AccountPayable.update(record.id, payload);
      toast.success("Lançamento atualizado!");
    } else {
      await base44.entities.AccountPayable.create(payload);
      toast.success("Lançamento criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const payableCategories = categories.filter(c => c.tipo === "Despesa");

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar" : "Nova"} Conta a Pagar</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Ex: Aluguel câmera RED" />
          </div>
          <div className="space-y-1.5">
            <Label>Valor *</Label>
            <Input value={displayValor} onChange={handleValorChange} placeholder="R$ 0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Data de Vencimento</Label>
            <Input type="date" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {payableCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Fornecedor</Label>
            <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar fornecedor..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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