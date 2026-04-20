import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, Users, Crown, Zap, Star, RefreshCw, Shield, Percent, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import NovaEmpresaDrawer from "@/components/superadmin/NovaEmpresaDrawer";
import { toast } from "sonner";

const PLAN_META = {
  Básico:       { icon: Zap,   color: "text-muted-foreground", bg: "bg-muted/20 border-muted/30" },
  Essencial:    { icon: Star,  color: "text-violet-400",       bg: "bg-violet-500/10 border-violet-500/20" },
  Profissional: { icon: Crown, color: "text-amber-400",        bg: "bg-amber-500/10 border-amber-500/20" },
};

const STATUS_META = {
  Trial:    { label: "Trial",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  Active:   { label: "Ativo",      cls: "bg-green-500/10 text-green-400 border-green-500/30" },
  Past_Due: { label: "Em Atraso",  cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  Canceled: { label: "Cancelado",  cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30" },
};

export default function SuperAdmin() {
  const [tenants, setTenants] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [spreadTaxa, setSpreadTaxa] = useState("");
  const [savingSpread, setSavingSpread] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const me = await base44.auth.me();
    if (me?.role !== "admin") {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }
    setIsSuperAdmin(true);
    const [t, u] = await Promise.all([
      base44.entities.Tenant.list("-created_date"),
      base44.entities.Usuarios.list("-created_date"),
    ]);
    setTenants(t);
    setUsuarios(u);
    // spread_taxa global: lê do primeiro tenant (o do super admin) ou padrão 2%
    if (t.length > 0) setSpreadTaxa(String(t[0].spread_taxa ?? 2));
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-10">
        <Shield className="w-12 h-12 text-destructive/60" />
        <h1 className="font-heading text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground text-sm max-w-sm">Esta área é restrita ao Super Admin do sistema.</p>
      </div>
    );
  }

  const totalAtivas = tenants.filter(t => t.subscription_status === "Active").length;
  const totalTrial = tenants.filter(t => t.subscription_status === "Trial").length;

  const SUMMARY = [
    { label: "Total de Empresas", value: tenants.length, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    { label: "Empresas Ativas",   value: totalAtivas,    color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
    { label: "Em Trial",          value: totalTrial,     color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Total de Usuários", value: usuarios.length, color: "text-sky-400",   bg: "bg-sky-500/10 border-sky-500/20" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/40 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Painel Master</h1>
              <p className="text-xs text-muted-foreground">Gestão global de empresas e usuários</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar
            </Button>
            <Button size="sm" onClick={() => setDrawerOpen(true)} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Nova Empresa
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
        {/* ── Configuração Global de Spread ── */}
        <div className="bg-card/40 border border-border/40 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Percent className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground text-sm">Spread Global de Cobranças</p>
              <p className="text-xs text-muted-foreground">Taxa aplicada sobre cada cobrança gerada pelos Tenants via Stripe Connect. Receita da plataforma.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-28">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="20"
                value={spreadTaxa}
                onChange={e => setSpreadTaxa(e.target.value)}
                className="pr-8 text-right"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
            <Button
              size="sm"
              disabled={savingSpread}
              onClick={async () => {
                setSavingSpread(true);
                // Aplica spread_taxa em todos os tenants
                await Promise.all(tenants.map(t =>
                  base44.entities.Tenant.update(t.id, { spread_taxa: Number(spreadTaxa) })
                ));
                setSavingSpread(false);
                toast.success(`Spread de ${spreadTaxa}% aplicado a todos os tenants.`);
              }}
              className="gap-1.5 bg-violet-600 hover:bg-violet-500"
            >
              {savingSpread ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Salvar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {SUMMARY.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-5 ${s.bg}`}>
              <p className={`text-3xl font-bold font-heading ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tenants Table */}
        <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-heading font-semibold text-foreground text-sm">Empresas Cadastradas</h2>
            <span className="ml-auto text-xs text-muted-foreground">{tenants.length} empresa{tenants.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/20">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Plano</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Usuários</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => {
                  const plan = PLAN_META[t.plan_tier] || PLAN_META["Básico"];
                  const PlanIcon = plan.icon;
                  const status = STATUS_META[t.subscription_status] || STATUS_META["Trial"];
                  const tenantUsers = usuarios.filter(u => u.tenant_id === t.id);
                  return (
                    <tr key={t.id} className="border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {t.logo
                            ? <img src={t.logo} alt={t.nome_fantasia} className="w-8 h-8 rounded-lg object-cover border border-border/40 bg-white p-0.5" />
                            : <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border/40">
                                <span className="text-xs font-bold text-muted-foreground">{t.nome_fantasia?.[0] || "?"}</span>
                              </div>
                          }
                          <div>
                            <p className="font-medium text-foreground">{t.nome_fantasia}</p>
                            {t.cnpj && <p className="text-xs text-muted-foreground">{t.cnpj}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${plan.bg} ${plan.color}`}>
                          <PlanIcon className="w-3 h-3" />
                          {t.plan_tier || "Básico"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.cls}`}>{status.label}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-sm">{tenantUsers.length}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted-foreground">
                        {t.created_date ? format(new Date(t.created_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-sm">
                      Nenhuma empresa cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border/30 flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-heading font-semibold text-foreground text-sm">Todos os Usuários</h2>
            <span className="ml-auto text-xs text-muted-foreground">{usuarios.length} usuário{usuarios.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/20">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Perfil</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const tenant = tenants.find(t => t.id === u.tenant_id);
                  return (
                    <tr key={u.id} className="border-b border-border/20 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-foreground">{u.nome}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{tenant?.nome_fantasia || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          u.role === "Admin" ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                          : u.role === "Financeiro" ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-secondary/60 text-muted-foreground border-border/40"
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.created_date ? format(new Date(u.created_date), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground text-sm">Nenhum usuário cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <NovaEmpresaDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSaved={loadData} />
    </div>
  );
}