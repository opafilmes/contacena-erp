import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatBRL, parseBRL } from "@/utils/format";

const empty = { nome: "", funcao: "", cache_padrao: "" };

export default function CrewDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [form, setForm] = useState(empty);
  const [cacheDisplay, setCacheDisplay] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (record) {
      setForm({ nome: record.nome || "", funcao: record.funcao || "", cache_padrao: record.cache_padrao || "" });
      setCacheDisplay(record.cache_padrao ? formatBRL(record.cache_padrao) : "");
    } else {
      setForm(empty);
      setCacheDisplay("");
    }
  }, [record, open]);

  const handleCacheChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = parseFloat(raw) / 100;
    setCacheDisplay(raw ? formatBRL(num) : "");
    setForm(f => ({ ...f, cache_padrao: raw ? num : "" }));
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const payload = { ...form, tenant_id: tenantId };
    if (record?.id) {
      await base44.entities.Crew.update(record.id, payload);
      toast.success("Membro da equipe atualizado!");
    } else {
      await base44.entities.Crew.create(payload);
      toast.success("Membro da equipe criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Membro" : "Novo Membro da Equipe"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
          </div>
          <div className="space-y-1.5">
            <Label>Função</Label>
            <Input value={form.funcao} onChange={e => setForm({ ...form, funcao: e.target.value })} placeholder="ex: Diretor de Fotografia, Produtor" />
          </div>
          <div className="space-y-1.5">
            <Label>Cachê Padrão (R$)</Label>
            <Input value={cacheDisplay} onChange={handleCacheChange} placeholder="R$ 0,00" />
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