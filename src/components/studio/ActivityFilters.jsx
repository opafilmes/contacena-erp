import React from "react";
import { isToday, isThisWeek, isThisMonth, isBefore, startOfDay } from "date-fns";
import { X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const EMPTY = "__all__";

export default function ActivityFilters({ filters, onChange }) {
  const { status, prioridade, vencimento } = filters;
  const hasFilters = status !== EMPTY || prioridade !== EMPTY || vencimento !== EMPTY;

  const set = (key, val) => onChange({ ...filters, [key]: val });

  const clear = () => onChange({ status: EMPTY, prioridade: EMPTY, vencimento: EMPTY });

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5 p-3 bg-secondary/20 border border-border/30 rounded-xl">
      <Select value={status} onValueChange={v => set("status", v)}>
        <SelectTrigger className="h-8 text-xs w-36 border-border/40 bg-card/40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Todos os status</SelectItem>
          <SelectItem value="A Fazer">A Fazer</SelectItem>
          <SelectItem value="Concluída">Concluída</SelectItem>
          <SelectItem value="Atrasada">Atrasada</SelectItem>
        </SelectContent>
      </Select>

      <Select value={prioridade} onValueChange={v => set("prioridade", v)}>
        <SelectTrigger className="h-8 text-xs w-36 border-border/40 bg-card/40">
          <SelectValue placeholder="Prioridade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Toda prioridade</SelectItem>
          <SelectItem value="Normal">Normal</SelectItem>
          <SelectItem value="Alta">Alta</SelectItem>
          <SelectItem value="Urgente">Urgente</SelectItem>
        </SelectContent>
      </Select>

      <Select value={vencimento} onValueChange={v => set("vencimento", v)}>
        <SelectTrigger className="h-8 text-xs w-40 border-border/40 bg-card/40">
          <SelectValue placeholder="Vencimento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={EMPTY}>Qualquer data</SelectItem>
          <SelectItem value="hoje">Hoje</SelectItem>
          <SelectItem value="semana">Esta Semana</SelectItem>
          <SelectItem value="mes">Este Mês</SelectItem>
          <SelectItem value="atrasadas">Atrasadas</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clear} className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground">
          <X className="w-3 h-3" /> Limpar filtros
        </Button>
      )}
    </div>
  );
}

const today = startOfDay(new Date());

export const EMPTY_FILTER = EMPTY;

export function applyActivityFilters(tasks, filters) {
  let result = [...tasks];
  const { status, prioridade, vencimento } = filters;

  if (status && status !== EMPTY) {
    if (status === "Atrasada") {
      result = result.filter(t => t.status === "A Fazer" && t.data_vencimento && isBefore(new Date(t.data_vencimento), startOfDay(new Date())));
    } else {
      result = result.filter(t => t.status === status);
    }
  }

  if (prioridade && prioridade !== EMPTY) {
    result = result.filter(t => t.prioridade === prioridade);
  }

  if (vencimento && vencimento !== EMPTY) {
    if (vencimento === "hoje") {
      result = result.filter(t => t.data_vencimento && isToday(new Date(t.data_vencimento)));
    } else if (vencimento === "semana") {
      result = result.filter(t => t.data_vencimento && isThisWeek(new Date(t.data_vencimento), { weekStartsOn: 0 }));
    } else if (vencimento === "mes") {
      result = result.filter(t => t.data_vencimento && isThisMonth(new Date(t.data_vencimento)));
    } else if (vencimento === "atrasadas") {
      result = result.filter(t => t.status === "A Fazer" && t.data_vencimento && isBefore(new Date(t.data_vencimento), startOfDay(new Date())));
    }
  }

  return result;
}