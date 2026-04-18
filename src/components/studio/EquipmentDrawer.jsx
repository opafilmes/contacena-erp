import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { X, ImagePlus } from "lucide-react";

const CATEGORIAS = ["Câmera","Lente","Iluminação","Áudio","Tripé/Suporte","Monitor","Estabilizador","Drone","Acessório","Outros"];
const BLANK = { nome_item: "", num_serie: "", qtd_total: "", valor_compra: "", marca: "", categoria: "", status_manutencao: false, fotos: [] };

export default function EquipmentDrawer({ open, record, tenantId, onClose, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [newFoto, setNewFoto] = useState("");

  useEffect(() => {
    if (open) {
      setForm(record ? {
        nome_item:        record.nome_item        || "",
        num_serie:        record.num_serie        || "",
        qtd_total:        record.qtd_total        ?? "",
        valor_compra:     record.valor_compra     ?? "",
        marca:            record.marca            || "",
        categoria:        record.categoria        || "",
        status_manutencao: record.status_manutencao ?? false,
        fotos:            record.fotos            || [],
      } : BLANK);
      setNewFoto("");
    }
  }, [open, record]);

  const addFoto = () => {
    if (!newFoto.trim()) return;
    setForm(f => ({ ...f, fotos: [...(f.fotos || []), newFoto.trim()] }));
    setNewFoto("");
  };
  const removeFoto = (i) => setForm(f => ({ ...f, fotos: f.fotos.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.nome_item.trim()) { toast.error("Nome obrigatório."); return; }
    setSaving(true);
    const payload = {
      nome_item:         form.nome_item,
      num_serie:         form.num_serie    || undefined,
      qtd_total:         form.qtd_total    !== "" ? Number(form.qtd_total)    : undefined,
      valor_compra:      form.valor_compra !== "" ? Number(form.valor_compra) : undefined,
      marca:             form.marca        || undefined,
      categoria:         form.categoria    || undefined,
      status_manutencao: form.status_manutencao,
      fotos:             form.fotos.length > 0 ? form.fotos : undefined,
      tenant_id:         tenantId,
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
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Equipamento" : "Novo Equipamento"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6 pb-6">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input placeholder="Ex: Sony FX3" value={form.nome_item} onChange={e => setForm(f => ({ ...f, nome_item: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input placeholder="Sony, Sigma..." value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm(f => ({ ...f, categoria: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Número de Série</Label>
            <Input placeholder="SN-XXXXXXX" value={form.num_serie} onChange={e => setForm(f => ({ ...f, num_serie: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Quantidade Total</Label>
              <Input type="number" placeholder="1" value={form.qtd_total} onChange={e => setForm(f => ({ ...f, qtd_total: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Valor de Compra (R$)</Label>
              <Input type="number" placeholder="0,00" value={form.valor_compra} onChange={e => setForm(f => ({ ...f, valor_compra: e.target.value }))} />
            </div>
          </div>

          {/* Status Manutenção */}
          <div className="flex items-center justify-between rounded-xl border border-border/40 bg-secondary/20 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Em Manutenção</p>
              <p className="text-xs text-muted-foreground">Equipamento indisponível para reserva</p>
            </div>
            <Switch
              checked={form.status_manutencao}
              onCheckedChange={v => setForm(f => ({ ...f, status_manutencao: v }))}
            />
          </div>

          {/* Fotos */}
          <div className="space-y-2">
            <Label>Fotos (URLs)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={newFoto}
                onChange={e => setNewFoto(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addFoto()}
              />
              <Button type="button" variant="outline" size="icon" onClick={addFoto}>
                <ImagePlus className="w-4 h-4" />
              </Button>
            </div>
            {form.fotos && form.fotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.fotos.map((url, i) => (
                  <div key={i} className="relative group w-16 h-16">
                    <img src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-border/40" />
                    <button
                      onClick={() => removeFoto(i)}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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