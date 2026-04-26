import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, CreditCard, ExternalLink, Zap, Star, Crown, Search, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PLAN_META = {
  Básico:       { icon: Zap,   color: "text-muted-foreground", label: "Básico" },
  Essencial:    { icon: Star,  color: "text-violet-400",       label: "Essencial" },
  Profissional: { icon: Crown, color: "text-green-400",        label: "Profissional" },
};
const STATUS_LABELS = {
  Trial:    { label: "Trial",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  Active:   { label: "Ativo",      cls: "bg-green-500/10 text-green-400 border-green-500/20" },
  Past_Due: { label: "Em atraso",  cls: "bg-red-500/10 text-red-400 border-red-500/20" },
  Canceled: { label: "Cancelado",  cls: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
};
const PORTES = ["MEI","Micro Empresa","Empresa de Pequeno Porte","Lucro Presumido","Lucro Real"];

function formatCNPJ(v) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export default function ConfiguracoesEmpresa() {
  const { tenant } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome_fantasia:   tenant?.nome_fantasia   || "",
    razao_social:    tenant?.razao_social    || "",
    cnpj:            tenant?.cnpj            || "",
    logo:            tenant?.logo            || "",
    logradouro:      tenant?.logradouro      || "",
    numero:          tenant?.numero          || "",
    bairro:          tenant?.bairro          || "",
    cidade:          tenant?.cidade          || "",
    uf:              tenant?.uf              || "",
    cep:             tenant?.cep             || "",
    telefone:        tenant?.telefone        || "",
    email_corporativo: tenant?.email_corporativo || "",
    website:         tenant?.website         || "",
    porte_empresa:   tenant?.porte_empresa   || "",
    faturamento_anual: tenant?.faturamento_anual ?? "",
  });
  const [saving, setSaving]           = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCnpjChange = async (raw) => {
    const digits = raw.replace(/\D/g, "");
    const masked = formatCNPJ(raw);
    set("cnpj", masked);
    if (digits.length === 14) {
      setLoadingCnpj(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if (!res.ok) throw new Error();
        const d = await res.json();
        setForm(f => ({
          ...f,
          razao_social:  d.razao_social    || f.razao_social,
          nome_fantasia: d.nome_fantasia   || d.razao_social || f.nome_fantasia,
          logradouro:    d.logradouro      || f.logradouro,
          numero:        d.numero          || f.numero,
          bairro:        d.bairro          || f.bairro,
          cidade:        d.municipio       || f.cidade,
          uf:            d.uf              || f.uf,
          cep:           d.cep             || f.cep,
          telefone:      d.ddd_telefone_1  || f.telefone,
          email_corporativo: d.email       || f.email_corporativo,
        }));
        toast.success("Dados preenchidos automaticamente!");
      } catch {
        toast.error("CNPJ não encontrado.");
      } finally {
        setLoadingCnpj(false);
      }
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("logo", file_url);
      toast.success("Logo enviada!");
    } catch (error) {
      toast.error("Erro ao enviar logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error("Erro: Não foi possível identificar a sua empresa.");
      return;
    }
    
    setSaving(true);
    try {
      await base44.entities.Tenant.update(tenant.id, {
        ...form,
        faturamento_anual: form.faturamento_anual !== "" ? Number(form.faturamento_anual) : undefined,
      });
      
      // 1. Dispara o balão de sucesso
      toast.success("Configurações salvas com sucesso!");

      // 2. Aguarda 1.5 segundos para você ver a notificação e atualiza a página
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Ocorreu um erro ao guardar as alterações. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleManagePlan = async () => {
    if (!tenant?.stripe_customer_id) {
      toast.info("Você ainda não possui uma assinatura ativa.");
      return;
    }
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke("createPortalSession", { tenantId: tenant.id });
      if (res.data?.url) window.location.href = res.data.url;
      else toast.error("Não foi possível abrir o portal.");
    } catch { toast.error("Erro ao conectar com o portal."); }
    finally { setPortalLoading(false); }
  };

  const planTier  = tenant?.plan_tier || "Básico";
  const planMeta  = PLAN_META[planTier] || PLAN_META["Básico"];
  const PlanIcon  = planMeta.icon;
  const subStatus = tenant?.subscription_status || "Trial";
  const statusMeta = STATUS_LABELS[subStatus] || STATUS_LABELS["Trial"];
  const trialEndsAt = tenant?.trial_ends_at ? format(new Date(tenant.trial_ends_at), "dd/MM/yyyy", { locale: ptBR }) : null;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Voltar ao Hub</span>
      </button>

      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Configurações da Empresa</h1>

      {/* ── Identidade ── */}
      <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-widest">Identidade Visual</h2>

        {/* Logo upload */}
        <div className="flex items-center gap-4">
          {form.logo ? (
            <img src={form.logo} alt="logo" className="w-16 h-16 rounded-xl object-cover border border-border/40" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground border border-border/40">
              <Upload className="w-5 h-5" />
            </div>
          )}
          <div className="flex-1 space-y-1.5">
            <Label>Logo da Empresa</Label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
              <Button asChild variant="outline" size="sm" disabled={uploadingLogo}>
                <span>{uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingLogo ? "Enviando..." : "Fazer Upload"}
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground">Usada como cabeçalho em PDFs e exportações.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Nome Fantasia</Label>
            <Input value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} placeholder="Nome da sua produtora" />
          </div>
          <div className="space-y-1.5">
            <Label>Razão Social</Label>
            <Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} placeholder="Razão Social" />
          </div>
        </div>
      </div>

      {/* ── Dados Fiscais ── */}
      <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-widest">Dados Fiscais</h2>

        <div className="space-y-1.5">
          <Label>CNPJ</Label>
          <div className="relative">
            <Input value={form.cnpj} onChange={e => handleCnpjChange(e.target.value)} placeholder="00.000.000/0001-00" className="pr-9" />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              {loadingCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </div>
          </div>
          {loadingCnpj && <p className="text-xs text-muted-foreground">Consultando CNPJ automatically...</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Porte da Empresa</Label>
            <Select value={form.porte_empresa} onValueChange={v => set("porte_empresa", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent>
                {PORTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Faturamento Anual (R$)</Label>
            <Input type="number" step="0.01" value={form.faturamento_anual} onChange={e => set("faturamento_anual", e.target.value)} placeholder="0,00" />
          </div>
        </div>
      </div>

      {/* ── Endereço ── */}
      <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-widest">Endereço</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Logradouro</Label>
            <Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} placeholder="Rua, Av..." />
          </div>
          <div className="space-y-1.5">
            <Label>Número</Label>
            <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="Nº" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Bairro</Label>
            <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" />
          </div>
          <div className="space-y-1.5">
            <Label>CEP</Label>
            <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label>Cidade</Label>
            <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
          </div>
          <div className="space-y-1.5">
            <Label>UF</Label>
            <Input value={form.uf} onChange={e => set("uf", e.target.value)} placeholder="SP" maxLength={2} />
          </div>
        </div>
      </div>

      {/* ── Contato ── */}
      <div className="space-y-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-4">
        <h2 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-widest">Contato</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-1.5">
            <Label>E-mail Corporativo</Label>
            <Input type="email" value={form.email_corporativo} onChange={e => set("email_corporativo", e.target.value)} placeholder="contato@empresa.com" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Website</Label>
          <Input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://www.empresa.com.br" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full mb-6">
        <Save className="w-4 h-4 mr-2" />
        {saving ? "Salvando..." : "Salvar Alterações"}
      </Button>

      {/* ── Billing ── */}
      <div className="space-y-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
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
              {subStatus === "Trial" && trialEndsAt && <p className="text-xs text-muted-foreground">Trial expira em {trialEndsAt}</p>}
              {subStatus === "Active" && <p className="text-xs text-muted-foreground">Assinatura ativa</p>}
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusMeta.cls}`}>{statusMeta.label}</span>
        </div>
        <Button onClick={handleManagePlan} disabled={portalLoading} className="w-full bg-violet-600 hover:bg-violet-500 text-white">
          <ExternalLink className="w-4 h-4 mr-2" />
          {portalLoading ? "Abrindo portal..." : "Gerenciar Plano e Pagamentos"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">Gerencie sua assinatura, faturas e pagamentos via Stripe.</p>
      </div>
    </div>
  );
}