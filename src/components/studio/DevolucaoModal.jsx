import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function DevolucaoModal({ booking, equipments, open, onClose, onSaved }) {
  const [dataDevolucao, setDataDevolucao] = useState(() => new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);

  const getNames = () => {
    const ids = booking?.equipment_ids?.length
      ? booking.equipment_ids
      : booking?.equipment_id ? [booking.equipment_id] : [];
    return ids.map(id => equipments.find(e => e.id === id)?.nome_item || id).join(", ");
  };

  const handleConfirm = async () => {
    setSaving(true);
    await base44.entities.EquipmentBooking.update(booking.id, {
      status: "Concluída",
      data_devolucao_real: new Date(dataDevolucao).toISOString(),
    });
    toast.success("Devolução registrada! Equipamentos liberados.");
    setSaving(false);
    onSaved();
    onClose();
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Confirmar Devolução
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Equipamentos: <span className="text-foreground font-medium">{getNames()}</span>
          </p>
          <div className="space-y-1.5">
            <Label>Data/Hora da Devolução Real</Label>
            <Input
              type="datetime-local"
              value={dataDevolucao}
              onChange={e => setDataDevolucao(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white">
            {saving ? "Salvando..." : "Confirmar Devolução"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}