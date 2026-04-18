import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function addMinutesToTime(timeStr, minutes) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + Number(minutes || 0);
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export default function CallSheetTab({ job, tenantId }) {
  const [scenes, setScenes] = useState([]);
  const [form, setForm] = useState({ cena_descricao: "", duracao_minutos: "", hora_inicio: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await base44.entities.ShootingPlan.filter({ job_id: job.id, tenant_id: tenantId });
    data.sort((a, b) => (a.hora_inicio || "").localeCompare(b.hora_inicio || ""));
    setScenes(data);
  }, [job.id, tenantId]);

  useEffect(() => { load(); }, [load]);

  // Auto-fill hora_inicio based on last scene's hora_fim
  useEffect(() => {
    if (scenes.length > 0) {
      const last = scenes[scenes.length - 1];
      setForm(f => ({ ...f, hora_inicio: last.hora_fim || "" }));
    } else {
      setForm(f => ({ ...f, hora_inicio: f.hora_inicio || "08:00" }));
    }
  }, [scenes]);

  const horaFimPreview = form.hora_inicio && form.duracao_minutos
    ? addMinutesToTime(form.hora_inicio, form.duracao_minutos)
    : "";

  const handleAdd = async () => {
    if (!form.cena_descricao.trim()) { toast.error("Descrição é obrigatória."); return; }
    setSaving(true);
    const hora_fim = addMinutesToTime(form.hora_inicio, form.duracao_minutos);
    await base44.entities.ShootingPlan.create({
      cena_descricao: form.cena_descricao,
      duracao_minutos: Number(form.duracao_minutos) || 0,
      hora_inicio: form.hora_inicio,
      hora_fim,
      job_id: job.id,
      tenant_id: tenantId,
    });
    setForm({ cena_descricao: "", duracao_minutos: "", hora_inicio: hora_fim });
    setSaving(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.ShootingPlan.delete(id);
    load();
  };

  return (
    <div className="space-y-4 py-2">
      {scenes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhuma cena adicionada ainda.</p>
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[60px_1fr_60px_60px_32px] gap-2 px-2 mb-1">
            {["Início", "Cena", "Dur.", "Fim", ""].map((h, i) => (
              <p key={i} className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">{h}</p>
            ))}
          </div>
          {scenes.map((s) => (
            <div key={s.id} className="grid grid-cols-[60px_1fr_60px_60px_32px] gap-2 items-center px-2 py-2 rounded-lg hover:bg-white/[0.03] transition-colors group">
              <span className="text-xs font-mono text-sky-400">{s.hora_inicio || "—"}</span>
              <span className="text-sm text-foreground/85 truncate">{s.cena_descricao}</span>
              <span className="text-xs text-muted-foreground">{s.duracao_minutos}min</span>
              <span className="text-xs font-mono text-green-400">{s.hora_fim || "—"}</span>
              <button
                onClick={() => handleDelete(s.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <div className="border-t border-border/30 pt-4 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Nova Cena</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Hora Início</p>
            <Input
              type="time"
              value={form.hora_inicio}
              onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
              className="text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Duração (min)</p>
            <Input
              type="number"
              value={form.duracao_minutos}
              onChange={e => setForm({ ...form, duracao_minutos: e.target.value })}
              placeholder="30"
              className="text-sm"
            />
          </div>
        </div>
        {horaFimPreview && (
          <p className="text-xs text-green-400">Hora Fim calculada: <strong>{horaFimPreview}</strong></p>
        )}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Descrição da Cena</p>
          <Input
            value={form.cena_descricao}
            onChange={e => setForm({ ...form, cena_descricao: e.target.value })}
            placeholder="Ex: Abertura, entrevista principal..."
            className="text-sm"
          />
        </div>
        <Button size="sm" onClick={handleAdd} disabled={saving} className="w-full">
          <Plus className="w-4 h-4 mr-1" /> {saving ? "Adicionando..." : "Adicionar Cena"}
        </Button>
      </div>
    </div>
  );
}