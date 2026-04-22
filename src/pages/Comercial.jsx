import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/components/shared/BackButton";
import DataTable from "@/components/shared/DataTable";
import ProposalDrawer from "@/components/comercial/ProposalDrawer";
import { formatBRL } from "@/utils/format";

const STATUS_STYLES = {
  Pendente: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Aprovada: "bg-green-500/15 text-green-400 border-green-500/30",
  Recusada: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function Comercial() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [drawer, setDrawer] = useState({ open: false, record: null });

  const loadProposals = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Proposal.filter({ tenant_id: tenantId });
    setProposals(data);
  }, [tenantId]);

  const loadClients = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Client.filter({ tenant_id: tenantId });
    setClients(data);
  }, [tenantId]);

  useEffect(() => {
    loadProposals();
    loadClients();
  }, [loadProposals, loadClients]);

  const getClientName = (clientId) => {
    const c = clients.find(c => c.id === clientId);
    return c?.nome_fantasia || "—";
  };

  const handleDelete = async (row) => {
    await base44.entities.Proposal.delete(row.id);
    loadProposals();
  };

  const cols = [
    { key: "titulo", label: "Título" },
    { key: "client_id", label: "Cliente", render: row => getClientName(row.client_id) },
    { key: "valor_total", label: "Valor Total", render: row => formatBRL(row.valor_total) },
    {
      key: "status", label: "Status", render: row => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[row.status] || ""}`}>
          {row.status}
        </span>
      )
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton />
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
            📝 Comercial
          </h1>
          <Button size="sm" onClick={() => setDrawer({ open: true, record: null })}>
            <Plus className="w-4 h-4 mr-1" /> Nova Proposta
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-muted-foreground text-sm">{proposals.length} proposta(s)</p>
        </div>

        <DataTable
          columns={cols}
          rows={proposals}
          onEdit={row => setDrawer({ open: true, record: row })}
          onDelete={handleDelete}
          emptyMessage="Nenhuma proposta cadastrada ainda."
        />
      </motion.div>

      <ProposalDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, record: null })}
        record={drawer.record}
        tenantId={tenantId}
        clients={clients}
        onSaved={loadProposals}
      />
    </div>
  );
}