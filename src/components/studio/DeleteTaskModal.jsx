import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

export default function DeleteTaskModal({ task, open, onClose, onConfirm }) {
  const [mode, setMode] = useState("only"); // "only" | "future"
  const isRecurrent = !!task?.recurrence_group_id;

  const handleConfirm = () => {
    onConfirm(task, isRecurrent ? mode : "only");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-card/95 backdrop-blur-xl border-border/50">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> Excluir Tarefa
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            {isRecurrent
              ? <>Você está excluindo uma tarefa de uma <span className="text-foreground font-medium">série recorrente</span>. Como deseja prosseguir?</>
              : "Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
            }
          </p>

          {isRecurrent && (
            <div className="space-y-2">
              {[
                { value: "only", label: "Excluir apenas esta tarefa", desc: "As demais ocorrências serão mantidas." },
                { value: "future", label: "Excluir esta e as futuras", desc: "Esta e todas as ocorrências a partir desta data serão excluídas." },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    mode === opt.value
                      ? "border-destructive/50 bg-destructive/5"
                      : "border-border/40 hover:bg-secondary/30"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${mode === opt.value ? "border-destructive" : "border-muted-foreground/40"}`}>
                      {mode === opt.value && <div className="w-2 h-2 rounded-full bg-destructive" />}
                    </div>
                  </div>
                  <input type="radio" className="sr-only" value={opt.value} checked={mode === opt.value} onChange={() => setMode(opt.value)} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant="destructive" onClick={handleConfirm} className="flex-1 gap-1.5">
            <Trash2 className="w-4 h-4" /> Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}