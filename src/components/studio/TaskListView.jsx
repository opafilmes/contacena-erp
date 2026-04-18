import React, { useState } from "react";
import { isBefore, startOfDay } from "date-fns";
import { ChevronRight, ChevronDown } from "lucide-react";
import TaskCard from "@/components/studio/TaskCard";

const SECTIONS = [
  { key: "atrasadas", label: "⚠️ Atrasadas",  color: "text-red-400",   filter: (t) => t.status === "A Fazer" && t.data_vencimento && isBefore(new Date(t.data_vencimento), startOfDay(new Date())) },
  { key: "afazer",    label: "📋 A Fazer",     color: "text-amber-400", filter: (t) => t.status === "A Fazer" && (!t.data_vencimento || !isBefore(new Date(t.data_vencimento), startOfDay(new Date()))) },
  { key: "concluidas",label: "✅ Concluídas",  color: "text-green-400", filter: (t) => t.status === "Concluída" },
];

export default function TaskListView({ tasks, usuarios, jobs, clients, onEdit, onDelete, onToggle }) {
  // only master tasks
  const masterTasks = tasks.filter(t => !t.parent_task_id);
  const subtaskMap  = {};
  tasks.forEach(t => { if (t.parent_task_id) { (subtaskMap[t.parent_task_id] = subtaskMap[t.parent_task_id] || []).push(t); } });

  const [collapsed, setCollapsed] = useState({});
  const [expandedTasks, setExpandedTasks] = useState({});

  const toggleSection = (key) => setCollapsed(s => ({ ...s, [key]: !s[key] }));
  const toggleTask    = (id)  => setExpandedTasks(s => ({ ...s, [id]: !s[id] }));

  return (
    <div className="space-y-6">
      {SECTIONS.map(section => {
        const sectionTasks = masterTasks.filter(section.filter);
        const isCollapsed  = collapsed[section.key];

        return (
          <div key={section.key}>
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.key)}
              className="flex items-center gap-2 mb-2 group"
            >
              {isCollapsed
                ? <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                : <ChevronDown  className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              }
              <span className={`text-sm font-semibold ${section.color}`}>{section.label}</span>
              <span className="text-xs text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded-full">{sectionTasks.length}</span>
            </button>

            {!isCollapsed && (
              <div className="space-y-1.5 pl-1">
                {sectionTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 pl-3">Nenhuma tarefa aqui.</p>
                )}
                {sectionTasks.map(task => {
                  const subs = subtaskMap[task.id] || [];
                  const isExpanded = expandedTasks[task.id];

                  return (
                    <div key={task.id}>
                      {/* Master task row */}
                      <div className="flex items-stretch gap-1">
                        {/* Expand subtasks toggle */}
                        {subs.length > 0 ? (
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="flex items-start pt-4 px-1 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded
                              ? <ChevronDown  className="w-3.5 h-3.5" />
                              : <ChevronRight className="w-3.5 h-3.5" />
                            }
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}
                        <div className="flex-1">
                          <TaskCard
                            task={task}
                            usuarios={usuarios}
                            jobs={jobs}
                            clients={clients}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onToggle={onToggle}
                          />
                        </div>
                      </div>

                      {/* Subtarefas aninhadas */}
                      {isExpanded && subs.length > 0 && (
                        <div className="ml-9 mt-1 space-y-1.5 border-l-2 border-accent/20 pl-3">
                          {subs.map(sub => (
                            <TaskCard
                              key={sub.id}
                              task={sub}
                              usuarios={usuarios}
                              jobs={jobs}
                              clients={clients}
                              onEdit={onEdit}
                              onDelete={onDelete}
                              onToggle={onToggle}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">
          Nenhuma tarefa encontrada. Clique em "Nova Tarefa" para começar.
        </div>
      )}
    </div>
  );
}