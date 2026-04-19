import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Calendar, Building2, Tag, ArrowUpDown, X } from "lucide-react";

const STATUS_OPTIONS = ["Pendente", "Pago", "Recebido", "Atrasado"];
const TIPO_OPTIONS = ["Receita", "Despesa"];
const empty = { dateFrom: "", dateTo: "", tipo: "", accountId: "", categoryId: "", status: "", search: "" };

export default function FinancialFilters({ filters, setFilters, bankAccounts, categories }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clear = () => setFilters(empty);
  const hasFilter = Object.values(filters).some(Boolean);

  const filteredCategories = filters.tipo
    ? categories.filter(c => c.tipo === filters.tipo)
    : categories;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* Busca Global */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={filters.search || ""}
          onChange={e => set("search", e.target.value)}
          placeholder="Buscar descrição, cliente..."
          className="h-8 pl-8 text-xs bg-white/[0.04] border-border/40"
        />
      </div>

      {/* Período */}
      <div className="flex items-center gap-1 bg-white/[0.04] border border-border/40 rounded-md px-2 h-8">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={e => set("dateFrom", e.target.value)}
          className="h-7 w-28 text-xs border-0 bg-transparent focus-visible:ring-0 px-1 text-foreground"
        />
        <span className="text-muted-foreground/50 text-xs">→</span>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={e => set("dateTo", e.target.value)}
          className="h-7 w-28 text-xs border-0 bg-transparent focus-visible:ring-0 px-1 text-foreground"
        />
      </div>

      {/* Conta */}
      {bankAccounts.length > 0 && (
        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-border/40 rounded-md px-2 h-8">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <Select value={filters.accountId || "__all__"} onValueChange={v => set("accountId", v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 shadow-none p-0 w-32">
              <SelectValue placeholder="Conta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas as contas</SelectItem>
              {bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.nome_conta}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Categoria */}
      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-border/40 rounded-md px-2 h-8">
        <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Select value={filters.categoryId || "__all__"} onValueChange={v => set("categoryId", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 shadow-none p-0 w-32">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tipo */}
      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-border/40 rounded-md px-2 h-8">
        <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <Select value={filters.tipo || "__all__"} onValueChange={v => set("tipo", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 shadow-none p-0 w-24">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {TIPO_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 bg-white/[0.04] border border-border/40 rounded-md px-2 h-8">
        <Select value={filters.status || "__all__"} onValueChange={v => set("status", v === "__all__" ? "" : v)}>
          <SelectTrigger className="h-7 text-xs border-0 bg-transparent focus:ring-0 shadow-none p-0 w-28">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos status</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Limpar */}
      {hasFilter && (
        <Button size="sm" variant="ghost" onClick={clear} className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}