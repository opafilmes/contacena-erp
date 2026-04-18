import React, { useState } from "react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,
  addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks,
  addDays, subDays, eachHourOfInterval, startOfDay, endOfDay, isSameMonth
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  "A Fazer":   "bg-amber-500/80 text-white",
  "Concluída": "bg-green-500/70 text-white",
};
const PRIO_DOT = {
  "Urgente": "bg-red-400",
  "Alta":    "bg-orange-400",
  "Normal":  "bg-muted-foreground/30",
};

const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/* ─── Month view ─── */
function MonthView({ reference, tasks, onEdit }) {
  const monthStart = startOfMonth(reference);
  const monthEnd   = endOfMonth(reference);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const pad        = getDay(monthStart);
  const padded     = [...Array(pad).fill(null), ...days];

  return (
    <>
      <div className="grid grid-cols-7 border-b border-border/20">
        {DAYS_PT.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {padded.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="border-r border-b border-border/10 min-h-[90px]" />;
          const dayTasks = tasks.filter(t => t.data_vencimento && isSameDay(new Date(t.data_vencimento), day));
          const isToday  = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`border-r border-b border-border/10 min-h-[90px] p-1.5 ${isToday ? "bg-accent/5" : ""}`}>
              <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${isToday ? "bg-accent text-white" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </span>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button key={task.id} onClick={() => onEdit(task)} title={task.titulo}
                    className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate leading-tight flex items-center gap-1 ${STATUS_COLORS[task.status] || "bg-primary/60 text-white"} hover:opacity-90`}>
                    {task.prioridade && task.prioridade !== "Normal" && (
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIO_DOT[task.prioridade]}`} />
                    )}
                    {task.titulo}
                  </button>
                ))}
                {dayTasks.length > 3 && <p className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} mais</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── Week view ─── */
function WeekView({ reference, tasks, onEdit }) {
  const weekStart = startOfWeek(reference, { locale: ptBR });
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const tasksWithDate = tasks.filter(t => t.data_vencimento);

  return (
    <div className="overflow-x-auto">
      {/* Header row */}
      <div className="grid grid-cols-8 border-b border-border/20">
        <div className="py-2 px-2 text-xs text-muted-foreground/40 text-center">Hora</div>
        {weekDays.map(day => {
          const isToday = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`py-2 text-center ${isToday ? "bg-accent/10" : ""}`}>
              <p className="text-xs text-muted-foreground/60 uppercase">{format(day,"EEE",{locale:ptBR})}</p>
              <p className={`text-sm font-semibold ${isToday ? "text-accent" : "text-foreground"}`}>{format(day,"d")}</p>
            </div>
          );
        })}
      </div>
      {/* Time slots */}
      <div className="max-h-[520px] overflow-y-auto">
        {HOURS.map(h => (
          <div key={h} className="grid grid-cols-8 border-b border-border/10 min-h-[48px]">
            <div className="px-2 pt-1 text-[10px] text-muted-foreground/40 text-right pr-3">{String(h).padStart(2,"0")}:00</div>
            {weekDays.map(day => {
              const slotTasks = tasksWithDate.filter(t => {
                const d = new Date(t.data_vencimento);
                return isSameDay(d, day) && d.getHours() === h;
              });
              return (
                <div key={day.toISOString()} className="border-l border-border/10 p-0.5 space-y-0.5">
                  {slotTasks.map(task => (
                    <button key={task.id} onClick={() => onEdit(task)} title={task.titulo}
                      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate ${STATUS_COLORS[task.status] || "bg-primary/60 text-white"} hover:opacity-90`}>
                      {task.titulo}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Day view ─── */
function DayView({ reference, tasks, onEdit }) {
  const tasksWithDate = tasks.filter(t => t.data_vencimento && isSameDay(new Date(t.data_vencimento), reference));

  return (
    <div className="max-h-[560px] overflow-y-auto">
      {HOURS.map(h => {
        const slotTasks = tasksWithDate.filter(t => new Date(t.data_vencimento).getHours() === h);
        return (
          <div key={h} className="flex gap-3 border-b border-border/10 min-h-[52px] px-4 py-1">
            <span className="text-[11px] text-muted-foreground/50 w-12 pt-1 shrink-0 text-right">{String(h).padStart(2,"0")}:00</span>
            <div className="flex-1 space-y-1 py-0.5">
              {slotTasks.map(task => (
                <button key={task.id} onClick={() => onEdit(task)}
                  className={`w-full text-left px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-2 ${STATUS_COLORS[task.status] || "bg-primary/60 text-white"} hover:opacity-90`}>
                  {task.prioridade && task.prioridade !== "Normal" && (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIO_DOT[task.prioridade]}`} />
                  )}
                  {task.titulo}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main export ─── */
export default function TaskCalendarView({ tasks, onEdit, calView = "semana" }) {
  const [reference, setReference] = useState(new Date());

  const navigate = (dir) => {
    if (calView === "mes")    setReference(r => dir > 0 ? addMonths(r, 1)  : subMonths(r, 1));
    if (calView === "semana") setReference(r => dir > 0 ? addWeeks(r, 1)   : subWeeks(r, 1));
    if (calView === "dia")    setReference(r => dir > 0 ? addDays(r, 1)    : subDays(r, 1));
  };

  const headerLabel = () => {
    if (calView === "mes")    return format(reference, "MMMM yyyy", { locale: ptBR });
    if (calView === "semana") {
      const ws = startOfWeek(reference, { locale: ptBR });
      const we = endOfWeek(reference, { locale: ptBR });
      return `${format(ws,"d MMM",{locale:ptBR})} – ${format(we,"d MMM yyyy",{locale:ptBR})}`;
    }
    return format(reference, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
  };

  return (
    <div className="bg-card/40 rounded-2xl border border-border/40 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h2 className="font-heading font-semibold text-foreground capitalize text-sm">{headerLabel()}</h2>
        <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {calView === "mes"    && <MonthView reference={reference} tasks={tasks} onEdit={onEdit} />}
      {calView === "semana" && <WeekView  reference={reference} tasks={tasks} onEdit={onEdit} />}
      {calView === "dia"    && <DayView   reference={reference} tasks={tasks} onEdit={onEdit} />}
    </div>
  );
}