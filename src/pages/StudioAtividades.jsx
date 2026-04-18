import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Plus, CheckSquare, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BackButton from "@/components/shared/BackButton";
import TaskCard from "@/components/studio/TaskCard";
import TaskDrawer from "@/components/studio/TaskDrawer";
import { isAfter, isBefore, startOfDay, endOfDay } from "date-fns";

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
  const [tab, setTab] = useState("proximas");

  const loadAll = useCallback(async () => {
    if (!inquilinoId) return;
    const [t, j, u, c] = await Promise.all([
      base44.entities.Task.filter({ inquilino_id: inquilinoId }),
      base44.entities.Job.filter({ tenant_id: tenantId }),
      base44.entities.Usuarios.filter({ tenant_id: tenantId }),
      base44.entities.Client.filter({ tenant_id: tenantId }),
    ]);
    setTasks(t);
    setJobs(j);
    setUsuarios(u);
    setClients(c);
  }, [inquilinoId, tenantId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const hoje = startOfDay(new Date());
  const fimHoje = endOfDay(new Date());

  const proximas = tasks.filter(t =>
    t.status === "A Fazer" &&
    t.data_vencimento &&
    !isBefore(new Date(t.data_vencimento), hoje)
  );
  const atrasadas = tasks.filter(t =>
    t.status === "A Fazer" &&
    t.data_vencimento &&
    isBefore(new Date(t.data_vencimento), hoje)
  );
  const concluidasHoje = tasks.filter(t =>
    t.status === "Concluída" &&
    t.updated_date &&
    !isBefore(new Date(t.updated_date), hoje) &&
    !isAfter(new Date(t.updated_date), fimHoje)
  );
  const concluidas = tasks.filter(t => t.status === "Concluída");

  const handleEdit = (task) => { setEditingTask(task); setDrawerOpen(true); };
  const handleNew = () => { setEditingTask(null); setDrawerOpen(true); };

  const handleDelete = async (task) => {
    await base44.entities.Task.delete(task.id);
    loadAll();
  };

  const handleToggle = async (task) => {
    const newStatus = task.status === "A Fazer" ? "Concluída" : "A Fazer";
    await base44.entities.Task.update(task.id, { status: newStatus });
    loadAll();
  };

  const MINI_CARDS = [
    {
      label: "Projetos Ativos",
      value: jobs.length,
      icon: CheckSquare,
      color: "text-sky-400",
      bg: "bg-sky-500/10 border-sky-500/20",
    },
    {
      label: "Tarefas Pendentes",
      value: tasks.filter(t => t.status === "A Fazer").length,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Concluídas Hoje",
      value: concluidasHoje.length,
      icon: CheckCircle2,
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
  ];

  const tabData = {
    proximas: { list: proximas, empty: "Nenhuma tarefa próxima.", icon: Clock },
    atrasadas: { list: atrasadas, empty: "Nenhuma tarefa atrasada. 🎉", icon: AlertTriangle },
    concluidas: { list: concluidas, empty: "Nenhuma tarefa concluída.", icon: CheckCircle2 },
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton to="/producao" label="← Studio" />

        <div className="flex items-center justify-between mt-4 mb-8">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">🎬 Gestão de Atividades</h1>
            <p className="text-muted-foreground text-sm mt-1">Acompanhe tarefas e delegue para sua equipe</p>
          </div>
          <Button onClick={handleNew} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Nova Tarefa
          </Button>
        </div>

        {/* Mini Cards Bento */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {MINI_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.4 }}
                className={`rounded-xl border p-4 flex items-center gap-4 ${card.bg}`}
              >
                <div className={`p-2 rounded-lg bg-white/[0.05] ${card.color}`}>
                  <Icon className="w-5 h-5 stroke-[1.5]" />
                </div>
                <div>
                  <p className={`text-2xl font-heading font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs filtro */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 bg-secondary/50">
            <TabsTrigger value="proximas" className="gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Próximas
              {proximas.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  {proximas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="atrasadas" className="gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Atrasadas
              {atrasadas.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
                  {atrasadas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Concluídas
            </TabsTrigger>
          </TabsList>

          {Object.entries(tabData).map(([key, { list, empty }]) => (
            <TabsContent key={key} value={key}>
              {list.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">{empty}</div>
              ) : (
                <div className="space-y-3">
                  {list.map((task, i) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                    >
                      <TaskCard
                        task={task}
                        usuarios={usuarios}
                        jobs={jobs}
                        clients={clients}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onToggle={handleToggle}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

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
        onSaved={loadAll}
      />
    </div>
  );
}