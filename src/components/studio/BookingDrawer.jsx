import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const BLANK = { equipment_id: "", client_id: "", job_id: "", data_inicio: "", data_fim: "", qtd_reservada: "" };

export default function BookingDrawer({ open, record, inquilinoId, equipments, jobs, clients, onClose, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState("");

  useEffect(() => {
    if (open) {
      setConflictError("");
      if (record) {
        // Try to find client from job
        const job = jobs.find(j => j.id === record.job_id);
        setForm({
          equipment_id:  record.equipment_id || "",
          client_id:     record.client_id    || "",
          job_id:        record.job_id       || "",
          data_inicio:   record.data_inicio  ? record.data_inicio.slice(0, 16) : "",
          data_fim:      record.data_fim     ? record.data_fim.slice(0, 16)    : "",
          qtd_reservada: record.qtd_reservada ?? "",
        });
      } else {
        setForm(BLANK);
      }
    }
  }, [open, record]);

  // Jobs filtered by selected client
  const clientJobs = form.client_id
    ? jobs.filter(j => j.client_id === form.client_id || !j.client_id) // show all if job has no client_id
    : jobs;

  const checkConflict = async () => {
    const { equipment_id, data_inicio, data_fim, qtd_reservada } = form;
    if (!equipment_id || !data_inicio || !data_fim || !qtd_reservada) return false;
    const eq = equipments.find(e => e.id === equipment_id);
    if (!eq) return false;
    const allBookings = await base44.entities.EquipmentBooking.filter({ inquilino_id: inquilinoId });
    const inicio = new Date(data_inicio);
    const fim    = new Date(data_fim);
    const conflicting = allBookings.filter(b => {
      if (record?.id && b.id === record.id) return false;
      if (b.equipment_id !== equipment_id) return false;
      return inicio < new Date(b.data_fim) && fim > new Date(b.data_inicio);
    });
    const totalReservado = conflicting.reduce((acc, b) => acc + (b.qtd_reservada || 0), 0);
    if (totalReservado + Number(qtd_reservada) > (eq.qtd_total || 0)) {
      return `🚨 Conflito: ${totalReservado} de ${eq.qtd_total} já reservadas neste período.`;
    }
    return false;
  };

  const handleSave = async () => {
    if (!form.equipment_id || !form.data_inicio || !form.data_fim || !form.qtd_reservada) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (new Date(form.data_fim) <= new Date(form.data_inicio)) {
      toast.error("Data de fim deve ser após a data de início.");
      return;
    }
    setSaving(true);
    setConflictError("");
    const conflict = await checkConflict();
    if (conflict) { setConflictError(conflict); setSaving(false); return; }

    const payload = {
      equipment_id: form.equipment_id,
      job_id:       form.job_id       || undefined,
      client_id:    form.client_id    || undefined,
      data_inicio:  new Date(form.data_inicio).toISOString(),
      data_fim:     new Date(form.data_fim).toISOString(),
      qtd_reservada: Number(form.qtd_reservada),
      inquilino_id: inquilinoId,
    };

    if (record?.id) {
      await base44.entities.EquipmentBooking.update(record.id, payload);
      toast.success("Reserva atualizada!");
    } else {
      await base44.entities.EquipmentBooking.create(payload);
      toast.success("Reserva criada!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Reserva" : "Nova Reserva"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <Label>Equipamento *</Label>
            <Select value={form.equipment_id} onValueChange={v => { setForm(f => ({ ...f, equipment_id: v })); setConflictError(""); }}>
              <SelectTrigger><SelectValue placeholder="Selecionar equipamento..." /></SelectTrigger>
              <SelectContent>
                {equipments.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.nome_item} (Qtd: {e.qtd_total ?? "?"})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label>Cliente</Label>
            <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v, job_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
              <SelectContent>
                {(clients || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projeto dependente do cliente */}
          <div className="space-y-1.5">
            <Label>Projeto</Label>
            <Select value={form.job_id} onValueChange={v => setForm(f => ({ ...f, job_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Selecionar projeto..." /></SelectTrigger>
              <SelectContent>
                {clientJobs.map(j => (
                  <SelectItem key={j.id} value={j.id}>{j.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data Início *</Label>
              <Input type="datetime-local" value={form.data_inicio} onChange={e => { setForm(f => ({ ...f, data_inicio: e.target.value })); setConflictError(""); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Data Fim *</Label>
              <Input type="datetime-local" value={form.data_fim} onChange={e => { setForm(f => ({ ...f, data_fim: e.target.value })); setConflictError(""); }} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Quantidade Reservada *</Label>
            <Input type="number" placeholder="1" value={form.qtd_reservada} onChange={e => { setForm(f => ({ ...f, qtd_reservada: e.target.value })); setConflictError(""); }} />
          </div>

          {conflictError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{conflictError}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Verificando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}