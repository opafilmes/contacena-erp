import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BLANK = {
  equipment_ids: [],
  client_id: "",
  job_id: "",
  data_inicio: "",
  data_fim: "",
  qtd_reservada: "1",
  responsavel_nome: "",
  status: "Pendente",
};

export default function BookingDrawer({ open, record, inquilinoId, equipments, jobs, clients, onClose, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState("");

  useEffect(() => {
    if (open) {
      setConflictError("");
      if (record) {
        const ids = record.equipment_ids?.length
          ? record.equipment_ids
          : record.equipment_id ? [record.equipment_id] : [];
        setForm({
          equipment_ids: ids,
          client_id: record.client_id || "",
          job_id: record.job_id || "",
          data_inicio: record.data_inicio ? record.data_inicio.slice(0, 16) : "",
          data_fim: record.data_fim ? record.data_fim.slice(0, 16) : "",
          qtd_reservada: record.qtd_reservada ?? "1",
          responsavel_nome: record.responsavel_nome || "",
          status: record.status || "Pendente",
        });
      } else {
        // prefill responsavel with logged user
        base44.auth.me().then(u => {
          setForm(f => ({ ...f, responsavel_nome: u?.full_name || u?.email || "" }));
        }).catch(() => {});
        setForm(BLANK);
      }
    }
  }, [open, record]);

  const clientJobs = form.client_id
    ? jobs.filter(j => !j.client_id || j.client_id === form.client_id)
    : jobs;

  const toggleEquipment = (id) => {
    setConflictError("");
    setForm(f => {
      const exists = f.equipment_ids.includes(id);
      return { ...f, equipment_ids: exists ? f.equipment_ids.filter(x => x !== id) : [...f.equipment_ids, id] };
    });
  };

  const checkConflicts = async () => {
    const { equipment_ids, data_inicio, data_fim, qtd_reservada } = form;
    if (!equipment_ids.length || !data_inicio || !data_fim) return false;
    const allBookings = await base44.entities.EquipmentBooking.filter({ inquilino_id: inquilinoId });
    const inicio = new Date(data_inicio);
    const fim = new Date(data_fim);
    for (const eqId of equipment_ids) {
      const eq = equipments.find(e => e.id === eqId);
      if (!eq) continue;
      const conflicting = allBookings.filter(b => {
        if (record?.id && b.id === record.id) return false;
        const bIds = b.equipment_ids?.length ? b.equipment_ids : b.equipment_id ? [b.equipment_id] : [];
        if (!bIds.includes(eqId)) return false;
        if (b.status === "Concluída") return false;
        return inicio < new Date(b.data_fim) && fim > new Date(b.data_inicio);
      });
      const totalReservado = conflicting.reduce((acc, b) => acc + (b.qtd_reservada || 0), 0);
      if (totalReservado + Number(qtd_reservada) > (eq.qtd_total || 0)) {
        return `🚨 Conflito em "${eq.nome_item}": ${totalReservado} de ${eq.qtd_total} já reservadas neste período.`;
      }
    }
    return false;
  };

  const handleSave = async () => {
    if (!form.equipment_ids.length || !form.data_inicio || !form.data_fim || !form.qtd_reservada) {
      toast.error("Selecione ao menos 1 equipamento e preencha as datas.");
      return;
    }
    if (new Date(form.data_fim) <= new Date(form.data_inicio)) {
      toast.error("Data de devolução deve ser após a retirada.");
      return;
    }
    setSaving(true);
    setConflictError("");
    const conflict = await checkConflicts();
    if (conflict) { setConflictError(conflict); setSaving(false); return; }

    const payload = {
      equipment_ids: form.equipment_ids,
      equipment_id: form.equipment_ids[0] || undefined,
      job_id: form.job_id || undefined,
      client_id: form.client_id || undefined,
      data_inicio: new Date(form.data_inicio).toISOString(),
      data_fim: new Date(form.data_fim).toISOString(),
      qtd_reservada: Number(form.qtd_reservada),
      responsavel_nome: form.responsavel_nome,
      status: form.status || "Pendente",
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
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Reserva" : "Nova Reserva"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6">
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

          {/* Equipamentos multi-select */}
          <div className="space-y-1.5">
            <Label>Equipamentos *</Label>
            <div className="rounded-md border border-input p-2 min-h-[2.5rem] flex flex-wrap gap-1.5">
              {form.equipment_ids.map(id => {
                const eq = equipments.find(e => e.id === id);
                return eq ? (
                  <Badge key={id} variant="secondary" className="gap-1 text-xs">
                    {eq.nome_item}
                    <button onClick={() => toggleEquipment(id)} className="ml-0.5 opacity-60 hover:opacity-100">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
              {form.equipment_ids.length === 0 && (
                <span className="text-muted-foreground text-sm px-1">Clique abaixo para adicionar...</span>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto rounded-md border border-input bg-popover">
              {equipments.map(e => {
                const selected = form.equipment_ids.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => toggleEquipment(e.id)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-accent/40 transition-colors ${selected ? "bg-accent/20 text-accent-foreground" : ""}`}
                  >
                    <span>{e.nome_item}</span>
                    <span className="text-xs text-muted-foreground">Qtd: {e.qtd_total ?? "?"}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Retirada *</Label>
              <Input type="datetime-local" value={form.data_inicio} onChange={e => { setForm(f => ({ ...f, data_inicio: e.target.value })); setConflictError(""); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Devolução Prevista *</Label>
              <Input type="datetime-local" value={form.data_fim} onChange={e => { setForm(f => ({ ...f, data_fim: e.target.value })); setConflictError(""); }} />
            </div>
          </div>

          {/* Qtd */}
          <div className="space-y-1.5">
            <Label>Quantidade *</Label>
            <Input type="number" min="1" placeholder="1" value={form.qtd_reservada} onChange={e => { setForm(f => ({ ...f, qtd_reservada: e.target.value })); setConflictError(""); }} />
          </div>

          {/* Responsável (readonly) */}
          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Input
              value={form.responsavel_nome}
              readOnly
              disabled
              className="opacity-70 cursor-not-allowed"
              placeholder="Carregando..."
            />
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