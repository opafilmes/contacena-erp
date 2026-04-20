import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Pencil, Trash2, CheckCircle2, Search, Printer } from "lucide-react";
import BookingStatusBadge from "./BookingStatusBadge";
import BookingChecklistPrint from "./BookingChecklistPrint";

const fmtDt = v => v ? format(new Date(v), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "—";

export default function BookingListView({ bookings, equipments, clients, tenant, onEdit, onDelete, onDevolver }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterClient, setFilterClient] = useState("todos");
  const [checklistBooking, setChecklistBooking] = useState(null);

  const getEqNames = (b) => {
    const ids = b.equipment_ids?.length ? b.equipment_ids : b.equipment_id ? [b.equipment_id] : [];
    return ids.map(id => equipments.find(e => e.id === id)?.nome_item).filter(Boolean);
  };

  const getClientName = (b) => clients.find(c => c.id === b.client_id)?.nome_fantasia || "—";

  const filtered = useMemo(() => {
    return bookings
      .filter(b => {
        if (filterStatus !== "todos" && b.status !== filterStatus) return false;
        if (filterClient !== "todos" && b.client_id !== filterClient) return false;
        if (search) {
          const q = search.toLowerCase();
          const eqNames = getEqNames(b).join(" ").toLowerCase();
          const client = getClientName(b).toLowerCase();
          if (!eqNames.includes(q) && !client.includes(q) && !(b.responsavel_nome || "").toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.data_inicio) - new Date(a.data_inicio));
  }, [bookings, search, filterStatus, filterClient]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar equipamento ou cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Em Uso">Em Uso</SelectItem>
            <SelectItem value="Concluída">Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos clientes</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">Nenhuma reserva encontrada.</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Equipamentos</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Retirada</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Devolução Prevista</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id} className={`border-t border-border/50 hover:bg-secondary/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
                  <td className="px-4 py-3 font-medium">{getClientName(b)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {getEqNames(b).map(name => (
                        <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDt(b.data_inicio)}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDt(b.data_fim)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.responsavel_nome || "—"}</td>
                  <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                    {b.status !== "Concluída" && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-400 hover:text-green-300 hover:bg-green-500/10" title="Devolver" onClick={() => onDevolver(b)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10" title="Imprimir Checklist" onClick={() => setChecklistBooking(b)}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(b)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(b)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Checklist Print Dialog */}
    <Dialog open={!!checklistBooking} onOpenChange={() => setChecklistBooking(null)}>
      <DialogContent className="max-w-3xl bg-white text-black overflow-y-auto max-h-[90vh]">
        <BookingChecklistPrint
          booking={checklistBooking}
          equipments={equipments}
          clients={clients}
          tenant={tenant}
          onClose={() => setChecklistBooking(null)}
        />
      </DialogContent>
    </Dialog>
  );
}