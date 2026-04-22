import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, List, CalendarDays, Building2, Sun, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/shared/BackButton";
import TaskDrawer from "@/components/studio/TaskDrawer";
import TaskListView from "@/components/studio/TaskListView";
import TaskCalendarView from "@/components/studio/TaskCalendarView";
import TaskActivityChart from "@/components/studio/TaskActivityChart";

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
  const [selectedClient, setSelectedClient] = useState("todos");
  const [view, setView] = useState("lista"); // "lista" | "calendario"
  const [calView, setCalView] = useState("semana"); // "dia" | "semana" | "mes"

  const loadAll = useCallback(async () => {
    if (!inquilinoId) return;
    const [t, j, u, c] = await Promise.all([
    base44.entities.Task.filter({ inquilino_id: inquilinoId }),
    base44.entities.Job.filter({ inquilino_id: inquilinoId }),
    base44.entities.Usuarios.filter({ tenant_id: tenantId }),
    base44.entities.Client.filter({ tenant_id: tenantId })]
    );
    setTasks(t);
    setJobs(j);
    setUsuarios(u);
    setClients(c);
  }, [inquilinoId, tenantId]);

  useEffect(() => {loadAll();}, [loadAll]);

  // Clientes que têm ao menos 1 tarefa
  const clientsWithTasks = clients.filter((c) =>
  tasks.some((t) => t.client_id === c.id)
  );

  // Tarefas filtradas pelo cliente selecionado
  const filteredTasks = selectedClient === "todos" ?
  tasks :
  tasks.filter((t) => t.client_id === selectedClient);

  const handleEdit = (task) => {setEditingTask(task);setDrawerOpen(true);};
  const handleNew = () => {setEditingTask(null);setDrawerOpen(true);};
  const handleDelete = async (task) => {await base44.entities.Task.delete(task.id);loadAll();};
  const handleToggle = async (task) => {
    await base44.entities.Task.update(task.id, { status: task.status === "A Fazer" ? "Concluída" : "A Fazer" });
    loadAll();
  };

  const selectedClientObj = clients.find((c) => c.id === selectedClient);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="px-6 pt-8 pb-4 max-w-7xl mx-auto w-full">
        <BackButton to="/app/producao" label="← Studio" />
      </div>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-6 pb-10 gap-0">
        {/* ── Coluna Esquerda: Client Sidebar ── */}
        <aside className="w-52 shrink-0 mr-6 pt-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Clientes</p>
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedClient("todos")}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
              selectedClient === "todos" ?
              "bg-accent/20 text-accent font-semibold" :
              "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`
              }>
              
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              Todos
              <span className="ml-auto text-xs opacity-60">{tasks.length}</span>
            </button>

            {clientsWithTasks.map((c) => {
              const count = tasks.filter((t) => t.client_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  selectedClient === c.id ?
                  "bg-accent/20 text-accent font-semibold" :
                  "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`
                  }>
                  
                  {c.logo ?
                  <img src={c.logo} alt={c.nome_fantasia} className="w-5 h-5 rounded-full object-cover shrink-0 border border-border/30" /> :

                  <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  }
                  <span className="truncate">{c.nome_fantasia}</span>
                  <span className="ml-auto text-xs opacity-60">{count}</span>
                </button>);

            })}

            {clientsWithTasks.length === 0 &&
            <p className="text-xs text-muted-foreground px-3 py-2 italic">Nenhum cliente com tarefas.</p>
            }
          </nav>
        </aside>

        {/* ── Coluna Direita: Área Principal ── */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground tracking-tight">
                {selectedClient === "todos" ? "Todas as Atividades" : selectedClientObj?.nome_fantasia || "Cliente"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Lista / Calendário */}
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg border border-border/40">
                {[
                { key: "lista", icon: List, label: "Lista" },
                { key: "calendario", icon: CalendarDays, label: "Cal." }].
                map(({ key, icon: Icon, label }) =>
                <button key={key} onClick={() => setView(key)} className="text-muted-foreground px-3 py-1.5 text-xs font-medium capitalize rounded-md flex items-center gap-1.5 transition-colors hover:text-foreground">
                  
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                )}
              </div>
              {view === "calendario" &&
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg border border-border/40">
                  {[
                { key: "dia", label: "Dia" },
                { key: "semana", label: "Semana" },
                { key: "mes", label: "Mês" }].
                map(({ key, label }) =>
                <button key={key} onClick={() => setCalView(key)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${calView === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                      {label}
                    </button>
                )}
                </div>
              }
              <Button onClick={handleNew} size="sm" className="gap-1.5 text-xs h-8">
                <Plus className="w-3.5 h-3.5" /> Nova Tarefa
              </Button>
            </div>
          </div>

          {/* Chart */}
          <TaskActivityChart tasks={filteredTasks} />

          {/* Views */}
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {view === "lista" ?
            <TaskListView
              tasks={filteredTasks}
              usuarios={usuarios}
              jobs={jobs}
              clients={clients}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle} /> :


            <TaskCalendarView
              tasks={filteredTasks}
              onEdit={handleEdit}
              calView={calView} />

            }
          </motion.div>
        </main>
      </div>

      <TaskDrawer
        open={drawerOpen}
        onClose={() => {setDrawerOpen(false);setEditingTask(null);}}
        task={editingTask}
        inquilinoId={inquilinoId}
        tenantId={tenantId}
        usuarios={usuarios}
        jobs={jobs}
        clients={clients}
        currentUserId={usuario?.id}
        preselectedClientId={selectedClient !== "todos" ? selectedClient : undefined}
        onSaved={loadAll} />
      
    </div>);

}