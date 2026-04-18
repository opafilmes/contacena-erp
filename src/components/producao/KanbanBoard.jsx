import React from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const COLUMNS = ["Pré-produção", "Captação", "Edição", "Finalizado"];

const COL_STYLES = {
  "Pré-produção": { dot: "bg-sky-400", border: "border-sky-500/20", label: "text-sky-400" },
  "Captação":     { dot: "bg-amber-400", border: "border-amber-500/20", label: "text-amber-400" },
  "Edição":       { dot: "bg-violet-400", border: "border-violet-500/20", label: "text-violet-400" },
  "Finalizado":   { dot: "bg-green-400", border: "border-green-500/20", label: "text-green-400" },
};

function JobCard({ job, index, onClick }) {
  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(job)}
          className={`
            group relative rounded-xl p-4 cursor-pointer select-none
            bg-white/[0.05] backdrop-blur-md border border-white/[0.08]
            transition-all duration-200
            hover:bg-white/[0.08] hover:border-white/[0.15] hover:shadow-lg
            ${snapshot.isDragging ? "shadow-2xl scale-[1.02] rotate-1 bg-white/[0.10]" : ""}
          `}
        >
          <p className="text-sm font-medium text-foreground/90 leading-snug">{job.titulo}</p>
          {job.proposal_id && (
            <p className="text-xs text-muted-foreground mt-1.5">Proposta vinculada</p>
          )}
        </div>
      )}
    </Draggable>
  );
}

export default function KanbanBoard({ jobs, onDragEnd, onCardClick, onNewJob }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status_kanban === col);
          const style = COL_STYLES[col];
          return (
            <motion.div
              key={col}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex-shrink-0 w-72"
            >
              {/* Column header */}
              <div className={`flex items-center justify-between mb-3 px-1`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className={`text-xs font-semibold uppercase tracking-widest ${style.label}`}>
                    {col}
                  </span>
                  <span className="text-xs text-muted-foreground/60 ml-1">
                    {colJobs.length}
                  </span>
                </div>
                <button
                  onClick={() => onNewJob(col)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      min-h-[200px] rounded-2xl p-3 space-y-2.5 transition-colors duration-200
                      border ${style.border}
                      ${snapshot.isDraggingOver ? "bg-white/[0.04]" : "bg-white/[0.02]"}
                    `}
                  >
                    {colJobs.map((job, i) => (
                      <JobCard key={job.id} job={job} index={i} onClick={onCardClick} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </motion.div>
          );
        })}
      </div>
    </DragDropContext>
  );
}