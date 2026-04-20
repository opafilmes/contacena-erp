import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_COLOR = {
  "Pendente": "bg-amber-500/80 text-white",
  "Em Uso":   "bg-sky-500/80 text-white",
  "Concluída":"bg-green-600/80 text-white",
};

export default function BookingCalendarView({ bookings, equipments, clients, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const startWeekday = startOfMonth(currentMonth).getDay();

  const getBookingsForDay = (day) =>
    bookings.filter(b => {
      const s = new Date(b.data_inicio);
      const e = new Date(b.data_fim);
      return day >= new Date(s.toDateString()) && day <= new Date(e.toDateString());
    });

  const getEqNames = (b) => {
    const ids = b.equipment_ids?.length ? b.equipment_ids : b.equipment_id ? [b.equipment_id] : [];
    return ids.map(id => equipments.find(e => e.id === id)?.nome_item || "?").join(", ");
  };

  const getClientName = (b) => clients.find(c => c.id === b.client_id)?.nome_fantasia || "";

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="rounded-xl border border-border bg-card/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/80">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-heading font-semibold text-base capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 bg-secondary/30">
        {weekDays.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-border/40 bg-muted/10" />
        ))}
        {days.map(day => {
          const dayBookings = getBookingsForDay(day);
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[90px] border-b border-r border-border/40 p-1.5 ${isToday ? "bg-accent/10" : ""}`}
            >
              <p className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map(b => (
                  <button
                    key={b.id}
                    onClick={() => onSelect(b)}
                    className={`w-full text-left rounded px-1.5 py-0.5 text-[10px] leading-snug truncate ${STATUS_COLOR[b.status] || "bg-muted"}`}
                  >
                    {getClientName(b) || getEqNames(b) || "Reserva"}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <p className="text-[10px] text-muted-foreground pl-1">+{dayBookings.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}