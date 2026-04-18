import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Plus, Users, Lock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import EquipeDrawer from "@/components/equipe/EquipeDrawer";
import EquipeTable from "@/components/equipe/EquipeTable";

export default function GestaoEquipe() {
  const { tenant, usuario } = useOutletContext();
  const tenantId = tenant?.id;
  const isPro = tenant?.plan_tier === "Profissional";

  const [usuarios, setUsuarios] = useState([]);
  const [drawer, setDrawer] = useState({ open: false, record: null });

  const loadUsuarios = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Usuarios.filter({ tenant_id: tenantId });
    setUsuarios(data);
  }, [tenantId]);

  useEffect(() => { loadUsuarios(); }, [loadUsuarios]);

  const handleDelete = async (row) => {
    if (row.id === usuario?.id) {
      toast.error("Você não pode remover seu próprio usuário.");
      return;
    }
    await base44.entities.Usuarios.delete(row.id);
    toast.success("Usuário removido.");
    loadUsuarios();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-violet-400" />
              <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
                Gestão de Equipe
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Gerencie os membros e permissões de acesso da sua equipe.
            </p>
          </div>
          <Button
            size="sm"
            disabled={!isPro}
            onClick={() => setDrawer({ open: true, record: null })}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Convidar Membro
          </Button>
        </div>

        {!isPro && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-violet-500/30 bg-violet-500/5">
            <Lock className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            <p className="text-sm text-violet-300">
              A adição de novos membros e gestão de permissões é exclusiva do <strong>Plano Profissional</strong>.
            </p>
          </div>
        )}

        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden">
          <EquipeTable
            rows={usuarios}
            currentUserId={usuario?.id}
            isPro={isPro}
            onEdit={(row) => setDrawer({ open: true, record: row })}
            onDelete={handleDelete}
          />
        </div>
      </motion.div>

      <EquipeDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, record: null })}
        record={drawer.record}
        tenantId={tenantId}
        onSaved={loadUsuarios}
      />
    </div>
  );
}