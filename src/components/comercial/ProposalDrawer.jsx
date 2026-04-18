import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

const empty = { titulo: "", client_id: "", valor_total: "", status: "Pendente" };

export default function ProposalDrawer({ open, onClose, record, tenantId, clients, onSaved }) {
  const [form, setForm] = useState(empty);
  const [valorDisplay, setValorDisplay] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({ titulo: record.titulo || "", client_id: record.client_id || "", valor_total: record.valor_total || "", status: record.status || "Pendente" });
      setValorDisplay(record.valor_total ? formatBRL(record.valor_total) : "");
    } else {
      setForm(empty);
      setValorDisplay("");
    }
  }, [record, open]);

  const handleValorChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = parseFloat(raw) / 100;
    setValorDisplay(raw ? formatBRL(num) : "");
    setForm(f => ({ ...f, valor_total: raw ? num : "" }));
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título é obrigatório."); return; }
    setSaving(true);
    const payload = { ...form, tenant_id: tenantId };
    if (record?.id) {
      await base44.entities.Proposal.update(record.id, payload);
      toast.success("Proposta atualizada!");
    } else {
      await base44.entities.Proposal.create(payload);
      toast.success("Proposta criada!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Proposta" : "Nova Proposta"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Título *</Label>
            <Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Título da proposta" />
          </div>
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar cliente..." />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor Total (R$)</Label>
            <Input value={valorDisplay} onChange={handleValorChange} placeholder="R$ 0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovada">Aprovada</SelectItem>
                <SelectItem value="Recusada">Recusada</SelectItem>
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