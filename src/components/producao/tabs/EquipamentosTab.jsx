import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function EquipamentosTab({ job, tenantId }) {
  const [allEquipment, setAllEquipment] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [form, setForm] = useState({ equipment_id: "", qtd_utilizada: "" });
  const [saving, setSaving] = useState(false);

  const loadEquipment = useCallback(async () => {
    const data = await base44.entities.Equipment.filter({ tenant_id: tenantId });
    setAllEquipment(data);
  }, [tenantId]);

  const loadAllocations = useCallback(async () => {
    const data = await base44.entities.JobEquipment.filter({ job_id: job.id, tenant_id: tenantId });
    setAllocations(data);
  }, [job.id, tenantId]);

  useEffect(() => { loadEquipment(); loadAllocations(); }, [loadEquipment, loadAllocations]);

  const getEquipmentInfo = (id) => allEquipment.find(e => e.id === id);

  const getTotalUsed = (equipmentId) =>
    allocations.filter(a => a.equipment_id === equipmentId).reduce((s, a) => s + (a.qtd_utilizada || 0), 0);

  const isOverStock = (equipmentId, newQty) => {
    const eq = getEquipmentInfo(equipmentId);
    if (!eq) return false;
    const currentUsed = getTotalUsed(equipmentId);
    return currentUsed + Number(newQty) > eq.qtd_total;
  };

  const overStockWarning = form.equipment_id && form.qtd_utilizada
    ? isOverStock(form.equipment_id, form.qtd_utilizada)
    : false;

  const handleAdd = async () => {
    if (!form.equipment_id || !form.qtd_utilizada) { toast.error("Selecione o equipamento e a quantidade."); return; }
    setSaving(true);
    await base44.entities.JobEquipment.create({
      job_id: job.id,
      equipment_id: form.equipment_id,
      qtd_utilizada: Number(form.qtd_utilizada),
      tenant_id: tenantId,
    });
    setForm({ equipment_id: "", qtd_utilizada: "" });
    setSaving(false);
    loadAllocations();
  };

  const handleDelete = async (id) => {
    await base44.entities.JobEquipment.delete(id);
    loadAllocations();
  };

  return (
    <div className="space-y-4 py-2">
      {allocations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum equipamento alocado.</p>
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-[1fr_60px_60px_32px] gap-2 px-2 mb-1">
            {["Equipamento", "Qtd", "Total", ""].map((h, i) => (
              <p key={i} className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">{h}</p>
            ))}
          </div>
          {allocations.map((a) => {
            const eq = getEquipmentInfo(a.equipment_id);
            const over = eq && a.qtd_utilizada > eq.qtd_total;
            return (
              <div key={a.id} className={`grid grid-cols-[1fr_60px_60px_32px] gap-2 items-center px-2 py-2 rounded-lg group transition-colors ${over ? "bg-red-500/10 border border-red-500/20" : "hover:bg-white/[0.03]"}`}>
                <div className="flex items-center gap-2">
                  {over && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                  <span className="text-sm text-foreground/85 truncate">{eq?.nome_item || "—"}</span>
                </div>
                <span className={`text-sm font-medium ${over ? "text-red-400" : "text-foreground/85"}`}>{a.qtd_utilizada}</span>
                <span className="text-xs text-muted-foreground">{eq?.qtd_total ?? "?"}</span>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add form */}
      <div className="border-t border-border/30 pt-4 space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">Alocar Equipamento</p>
        <Select value={form.equipment_id} onValueChange={v => setForm({ ...form, equipment_id: v })}>
          <SelectTrigger><SelectValue placeholder="Selecionar equipamento..." /></SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
            {allEquipment.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.nome_item} (estoque: {e.qtd_total})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          value={form.qtd_utilizada}
          onChange={e => setForm({ ...form, qtd_utilizada: e.target.value })}
          placeholder="Quantidade"
          className="text-sm"
        />
        {overStockWarning && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-400 font-medium">Estoque Insuficiente! A quantidade solicitada excede o total disponível.</p>
          </div>
        )}
        <Button size="sm" onClick={handleAdd} disabled={saving} className="w-full">
          <Plus className="w-4 h-4 mr-1" /> {saving ? "Alocando..." : "Alocar"}
        </Button>
      </div>
    </div>
  );
}