import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import BackButton from "@/components/shared/BackButton";
import KanbanBoard from "@/components/producao/KanbanBoard";
import JobFormDrawer from "@/components/producao/JobFormDrawer";
import JobDetailDrawer from "@/components/producao/JobDetailDrawer";

export default function Producao() {
  const { tenant } = useOutletContext();
  const navigate = useNavigate();
  const tenantId = tenant?.id;
  const plano = tenant?.plano_assinatura || "Básico";

  const [jobs, setJobs] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [formDrawer, setFormDrawer] = useState({ open: false, initialStatus: "Pré-produção" });
  const [detailDrawer, setDetailDrawer] = useState({ open: false, job: null });

  // Plan gate
  useEffect(() => {
    if (tenant && plano !== "Profissional") {
      navigate("/");
    }
  }, [tenant, plano, navigate]);

  const loadJobs = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Job.filter({ tenant_id: tenantId });
    setJobs(data);
  }, [tenantId]);

  const loadProposals = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Proposal.filter({ tenant_id: tenantId });
    setProposals(data);
  }, [tenantId]);

  useEffect(() => {
    if (plano === "Profissional") {
      loadJobs();
      loadProposals();
    }
  }, [loadJobs, loadProposals, plano]);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    const job = jobs.find(j => j.id === draggableId);
    if (!job || job.status_kanban === newStatus) return;

    // Optimistic update
    setJobs(prev => prev.map(j => j.id === draggableId ? { ...j, status_kanban: newStatus } : j));
    await base44.entities.Job.update(draggableId, { status_kanban: newStatus });
  };

  const getProposalForJob = (job) => proposals.find(p => p.id === job?.proposal_id) || null;

  if (plano !== "Profissional") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton />
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
            🚀 Produção & Jobs
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Plano Profissional</span>
          </div>
        </div>

        <KanbanBoard
          jobs={jobs}
          onDragEnd={handleDragEnd}
          onCardClick={(job) => setDetailDrawer({ open: true, job })}
          onNewJob={(status) => setFormDrawer({ open: true, initialStatus: status })}
        />
      </motion.div>

      <JobFormDrawer
        open={formDrawer.open}
        onClose={() => setFormDrawer({ open: false, initialStatus: "Pré-produção" })}
        initialStatus={formDrawer.initialStatus}
        tenantId={tenantId}
        proposals={proposals}
        onSaved={loadJobs}
      />

      <JobDetailDrawer
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, job: null })}
        job={detailDrawer.job}
        proposal={getProposalForJob(detailDrawer.job)}
        tenantId={tenantId}
      />
    </div>
  );
}