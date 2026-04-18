import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const STATUS_COLORS = {
  "A Fazer": "bg-amber-500/80 text-white",
  "Concluída": "bg-green-500/70 text-white",
};

export default function TaskCalendarView({ tasks, onEdit }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start: Sunday=0 ... Saturday=6
  const startPad = getDay(monthStart);
  const paddedDays = [...Array(startPad).fill(null), ...days];

  const tasksWithDate = tasks.filter(t => t.data_vencimento);

  return (
    <div className="bg-card/40 rounded-2xl border border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <h2 className="font-heading font-semibold text-foreground capitalize">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border/20">
        {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="border-r border-b border-border/10 min-h-[90px]" />;

          const dayTasks = tasksWithDate.filter(t => isSameDay(new Date(t.data_vencimento), day));
          const isToday  = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b border-border/10 min-h-[90px] p-1.5 ${isToday ? "bg-accent/5" : ""}`}
            >
              <span className={`
                inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1
                ${isToday ? "bg-accent text-white" : "text-muted-foreground"}
              `}>
                {format(day, "d")}
              </span>

              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map(task => (
                  <button
                    key={task.id}
                    onClick={() => onEdit(task)}
                    title={task.titulo}
                    className={`
                      w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate leading-tight
                      ${STATUS_COLORS[task.status] || "bg-primary/60 text-white"}
                      hover:opacity-90 transition-opacity
                    `}
                  >
                    {task.titulo}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}