import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STATUS_OPTIONS = ["Pendente", "Pago", "Recebido", "Atrasado"];
const empty = { dateFrom: "", dateTo: "", accountId: "", categoryId: "", status: "" };

export default function FinancialFilters({ filters, setFilters, bankAccounts, categories }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clear = () => setFilters(empty);
  const hasFilter = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap gap-2 items-end p-3 rounded-xl bg-white/[0.03] border border-border/30 mb-4">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Data Início</span>
        <Input type="date" value={filters.dateFrom} onChange={e => set("dateFrom", e.target.value)} className="h-8 text-xs w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Data Fim</span>
        <Input type="date" value={filters.dateTo} onChange={e => set("dateTo", e.target.value)} className="h-8 text-xs w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Categoria</span>
        <Select value={filters.categoryId} onValueChange={v => set("categoryId", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Status</span>
        <Select value={filters.status} onValueChange={v => set("status", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {hasFilter && (
        <Button size="sm" variant="ghost" onClick={clear} className="h-8 text-xs text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}