import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, CreditCard, ExternalLink, Zap, Star, Crown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLAN_META = {
  Básico:        { icon: Zap,   color: "text-muted-foreground", label: "Básico" },
  Essencial:     { icon: Star,  color: "text-violet-400",       label: "Essencial" },
  Profissional:  { icon: Crown, color: "text-green-400",        label: "Profissional" },
};

const STATUS_LABELS = {
  Trial:    { label: "Trial",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Active:   { label: "Ativo",      cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  Past_Due: { label: "Em atraso",  cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  Canceled: { label: "Cancelado",  cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};

export default function ConfiguracoesEmpresa() {
  const { tenant } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome_fantasia: tenant?.nome_fantasia || "",
    cnpj: tenant?.cnpj || "",
    logo: tenant?.logo || "",
  });
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSave = async () => {
    if (!tenant?.id) return;
    setSaving(true);
    await base44.entities.Tenant.update(tenant.id, form);
    toast.success("Configurações salvas com sucesso!");
    setSaving(false);
  };

  const handleManagePlan = async () => {
    setPortalLoading(true);
    const res = await base44.functions.invoke("createPortalSession", { tenantId: tenant.id });
    if (res.data?.url) {
      window.location.href = res.data.url;
    } else {
      toast.error("Não foi possível abrir o portal de faturamento.");
      setPortalLoading(false);
    }
  };

  const planTier = tenant?.plan_tier || "Básico";
  const planMeta = PLAN_META[planTier] || PLAN_META["Básico"];
  const PlanIcon = planMeta.icon;
  const subStatus = tenant?.subscription_status || "Trial";
  const statusMeta = STATUS_LABELS[subStatus] || STATUS_LABELS["Trial"];
  const trialEndsAt = tenant?.trial_ends_at
    ? format(new Date(tenant.trial_ends_at), "dd/MM/yyyy", { locale: ptBR })
    : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Voltar ao Hub</span>
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">
        Configurações da Empresa
      </h1>

      <div className="space-y-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
        <div className="space-y-2">
          <Label>Nome Fantasia</Label>
          <Input
            value={form.nome_fantasia}
            onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
            placeholder="Nome da sua produtora"
          />
        </div>
        <div className="space-y-2">
          <Label>CNPJ</Label>
          <Input
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
            placeholder="00.000.000/0000-00"
          />
        </div>
        <div className="space-y-2">
          <Label>URL da Logo</Label>
          <Input
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Billing Section */}
      <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-heading font-semibold text-foreground text-base">Assinatura e Faturamento</h2>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl bg-white/[0.05] border border-white/[0.08] ${planMeta.color}`}>
              <PlanIcon className="w-4 h-4 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Plano {planMeta.label}</p>
              {subStatus === "Trial" && trialEndsAt && (
                <p className="text-xs text-muted-foreground">Trial expira em {trialEndsAt}</p>
              )}
              {subStatus === "Active" && (
                <p className="text-xs text-muted-foreground">Assinatura ativa</p>
              )}
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusMeta.cls}`}>
            {statusMeta.label}
          </span>
        </div>

        <Button
          onClick={handleManagePlan}
          disabled={portalLoading}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {portalLoading ? "Abrindo portal..." : "Gerenciar Plano e Pagamentos"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Gerencie sua assinatura, histórico de faturas e dados de pagamento via Stripe.
        </p>
      </div>
    </div>
  );
}