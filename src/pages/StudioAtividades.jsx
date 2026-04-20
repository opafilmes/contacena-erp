import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, List, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
import TaskDrawer from "@/components/studio/TaskDrawer";
import TaskListView from "@/components/studio/TaskListView";
import TaskCalendarView from "@/components/studio/TaskCalendarView";
import TaskDashboard from "@/components/studio/TaskDashboard";
import ActivitySidebar from "@/components/studio/ActivitySidebar";
import ActivityFilters, { applyActivityFilters, EMPTY_FILTER } from "@/components/studio/ActivityFilters";

const DEFAULT_FILTERS = { status: EMPTY_FILTER, prioridade: EMPTY_FILTER, vencimento: EMPTY_FILTER };

export default function StudioAtividades() {
  const { tenant, usuario } = useOutletContext();
  const tenantId = tenant?.id;
  const inquilinoId = tenant?.id;

  const [tasks, setTasks] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [clients, setClients] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Sidebar selection
  const [selectedClient, setSelectedClient] = useState("todos");
  const [selectedUser, setSelectedUser] = useState(null);

  // Analytic filters
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // View
  const [view, setView] = useState("lista");
  const [calView, setCalView] = useState("semana");

  const loadAll = useCallback(async () => {
    if (!inquilinoId) return;
    const [t, j, u, c] = await Promise.all([
      base44.entities.Task.filter({ inquilino_id: inquilinoId }),
      base44.entities.Job.filter({ inquilino_id: inquilinoId }),
      base44.entities.Usuarios.filter({ tenant_id: tenantId }),
      base44.entities.Client.filter({ tenant_id: tenantId }),
    ]);
    setTasks(t);
    setJobs(j);
    setUsuarios(u);
    setClients(c);
  }, [inquilinoId, tenantId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Step 1: filter by sidebar (client OR user)
  const sidebarFiltered = tasks.filter(t => {
    if (selectedUser) {
      const ids = Array.isArray(t.responsavel_ids) ? t.responsavel_ids : (t.responsavel_id ? [t.responsavel_id] : []);
      return ids.includes(selectedUser);
    }
    if (selectedClient !== "todos") return t.client_id === selectedClient;
    return true;
  });

  // Step 2: apply analytic filters
  const filteredTasks = applyActivityFilters(sidebarFiltered, filters);

  const handleEdit = (task) => { setEditingTask(task); setDrawerOpen(true); };
  const handleNew = () => { setEditingTask(null); setDrawerOpen(true); };
  const handleDelete = async (task) => { await base44.entities.Task.delete(task.id); loadAll(); };
  const handleToggle = async (task) => {
    await base44.entities.Task.update(task.id, { status: task.status === "A Fazer" ? "Concluída" : "A Fazer" });
    loadAll();
  };

  // Header label
  const headerTitle = () => {
    if (selectedUser) {
      const u = usuarios.find(u => u.id === selectedUser);
      return u?.nome || "Colaborador";
    }
    if (selectedClient !== "todos") {
      return clients.find(c => c.id === selectedClient)?.nome_fantasia || "Cliente";
    }
    return "Todas as Atividades";
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 pt-8 pb-4 max-w-7xl mx-auto w-full">
        <BackButton to="/producao" label="← Studio" />
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 pb-10 gap-0">
        {/* Sidebar */}
        <ActivitySidebar
          clients={clients}
          usuarios={usuarios}
          tasks={tasks}
          selectedClient={selectedClient}
          selectedUser={selectedUser}
          onSelectClient={setSelectedClient}
          onSelectUser={setSelectedUser}
        />

        {/* Main area */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground tracking-tight">
                {headerTitle()}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg border border-border/40">
                {[
                  { key: "lista", icon: List, label: "Lista" },
                  { key: "calendario", icon: CalendarDays, label: "Cal." },
                ].map(({ key, icon: Icon, label }) => (
                  <button key={key} onClick={() => setView(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors ${view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                ))}
              </div>

              {view === "calendario" && (
                <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg border border-border/40">
                  {[{ key: "dia", label: "Dia" }, { key: "semana", label: "Semana" }, { key: "mes", label: "Mês" }].map(({ key, label }) => (
                    <button key={key} onClick={() => setCalView(key)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${calView === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}

              <Button onClick={handleNew} size="sm" className="gap-1.5 text-xs h-8">
                <Plus className="w-3.5 h-3.5" /> Nova Tarefa
              </Button>
            </div>
          </div>

          {/* Analytic filters bar */}
          <ActivityFilters filters={filters} onChange={setFilters} />

          {/* Dashboard */}
          <TaskDashboard tasks={filteredTasks} usuarios={usuarios} />

          {/* Views */}
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {view === "lista" ? (
              <TaskListView
                tasks={filteredTasks}
                usuarios={usuarios}
                jobs={jobs}
                clients={clients}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            ) : (
              <TaskCalendarView
                tasks={filteredTasks}
                onEdit={handleEdit}
                calView={calView}
              />
            )}
          </motion.div>
        </main>
      </div>

      <TaskDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingTask(null); }}
        task={editingTask}
        inquilinoId={inquilinoId}
        tenantId={tenantId}
        usuarios={usuarios}
        jobs={jobs}
        clients={clients}
        currentUserId={usuario?.id}
        preselectedClientId={selectedClient !== "todos" ? selectedClient : undefined}
        onSaved={loadAll}
      />
    </div>
  );
}