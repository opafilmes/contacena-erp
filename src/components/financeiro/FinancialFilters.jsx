import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STATUS_OPTIONS = ["Pendente", "Pago", "Recebido", "Atrasado"];
const TIPO_OPTIONS = ["Receita", "Despesa"];
const empty = { dateFrom: "", dateTo: "", tipo: "", accountId: "", categoryId: "", status: "" };

export default function FinancialFilters({ filters, setFilters, bankAccounts, categories }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clear = () => setFilters(empty);
  const hasFilter = Object.values(filters).some(Boolean);

  const filteredCategories = filters.tipo
    ? categories.filter(c => c.tipo === filters.tipo)
    : categories;

  return (
    <div className="flex flex-wrap gap-2 items-end p-3 rounded-xl bg-white/[0.03] border border-border/30 mb-4">
      {/* Período */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Data Início</span>
        <Input type="date" value={filters.dateFrom} onChange={e => set("dateFrom", e.target.value)} className="h-8 text-xs w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Data Fim</span>
        <Input type="date" value={filters.dateTo} onChange={e => set("dateTo", e.target.value)} className="h-8 text-xs w-36" />
      </div>

      {/* Tipo */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tipo</span>
        <Select value={filters.tipo || "__all__"} onValueChange={v => set("tipo", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {TIPO_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Conta Bancária */}
      {bankAccounts.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Conta</span>
          <Select value={filters.accountId || "__all__"} onValueChange={v => set("accountId", v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas</SelectItem>
              {bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.nome_conta}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Categoria */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Categoria</span>
        <Select value={filters.categoryId || "__all__"} onValueChange={v => set("categoryId", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-40"><SelectValue placeholder="Todas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Status</span>
        <Select value={filters.status || "__all__"} onValueChange={v => set("status", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Todos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <Button size="sm" variant="ghost" onClick={clear} className="h-8 text-xs text-muted-foreground hover:text-foreground self-end">
          <X className="w-3.5 h-3.5 mr-1" /> Limpar
        </Button>
      )}
    </div>
  );
}