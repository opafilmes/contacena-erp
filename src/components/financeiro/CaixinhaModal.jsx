import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

export default function CaixinhaModal({ open, onClose, tenantId }) {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({ valor: 0, descricao: "", job_id: "" });
  const [displayValor, setDisplayValor] = useState("");
  const [comprovante, setComprovante] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && tenantId) {
      base44.entities.Job.filter({ tenant_id: tenantId }).then(setJobs);
      setForm({ valor: 0, descricao: "", job_id: "" });
      setDisplayValor("");
      setComprovante(null);
    }
  }, [open, tenantId]);

  const handleValorChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = Number(raw) / 100;
    setDisplayValor(formatBRL(num));
    setForm(f => ({ ...f, valor: num }));
  };

  const handleSave = async () => {
    if (!form.descricao.trim() || !form.valor) {
      toast.error("Preencha descrição e valor.");
      return;
    }
    setSaving(true);

    let comprovante_url = "";
    if (comprovante) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: comprovante });
      comprovante_url = file_url;
    }

    const today = new Date().toISOString().split("T")[0];
    await base44.entities.AccountPayable.create({
      descricao: form.descricao,
      valor: form.valor,
      status: "Pago",
      data_vencimento: today,
      job_id: form.job_id || undefined,
      inquilino_id: tenantId,
    });

    toast.success("Caixinha lançada e registrada em Contas a Pagar!");
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-popover/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl max-w-md w-full rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg flex items-center gap-2">
            🪙 Lançamento de Caixinha
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Valor *</Label>
            <Input value={displayValor} onChange={handleValorChange} placeholder="R$ 0,00" />
          </div>
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: Lanche do set, transporte..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Job Vinculado</Label>
            <Select value={form.job_id} onValueChange={v => setForm({ ...form, job_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecionar job..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {jobs.map(j => <SelectItem key={j.id} value={j.id}>{j.titulo}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Comprovante (imagem)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={e => setComprovante(e.target.files?.[0] || null)}
              className="text-sm cursor-pointer"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? "Salvando..." : "Lançar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}