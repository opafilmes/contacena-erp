import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

const EMPTY = { nome_conta: "", saldo_inicial: "" };

export default function BankAccountDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [displaySaldo, setDisplaySaldo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const r = record || EMPTY;
      setForm({ ...EMPTY, ...r });
      setDisplaySaldo(r.saldo_inicial ? formatBRL(r.saldo_inicial) : "");
    }
  }, [open, record]);

  const handleSaldoChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = Number(raw) / 100;
    setDisplaySaldo(formatBRL(num));
    setForm(f => ({ ...f, saldo_inicial: num }));
  };

  const handleSave = async () => {
    if (!form.nome_conta.trim()) { toast.error("Nome da conta é obrigatório."); return; }
    setSaving(true);
    const payload = { ...form, inquilino_id: tenantId };
    if (record?.id) {
      await base44.entities.BankAccount.update(record.id, payload);
      toast.success("Conta atualizada!");
    } else {
      await base44.entities.BankAccount.create(payload);
      toast.success("Conta criada!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar" : "Nova"} Conta Bancária</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Nome da Conta *</Label>
            <Input value={form.nome_conta} onChange={e => setForm({ ...form, nome_conta: e.target.value })} placeholder="Ex: Conta Corrente Bradesco" />
          </div>
          <div className="space-y-1.5">
            <Label>Saldo Inicial</Label>
            <Input value={displaySaldo} onChange={handleSaldoChange} placeholder="R$ 0,00" />
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