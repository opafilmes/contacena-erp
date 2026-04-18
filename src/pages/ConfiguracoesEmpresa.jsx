import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracoesEmpresa() {
  const { tenant } = useOutletContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome_fantasia: tenant?.nome_fantasia || "",
    cnpj: tenant?.cnpj || "",
    logo: tenant?.logo || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!tenant?.id) return;
    setSaving(true);
    await base44.entities.Tenant.update(tenant.id, form);
    toast.success("Configurações salvas com sucesso!");
    setSaving(false);
  };

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
        <div className="pt-2">
          <div className="text-sm text-muted-foreground mb-1">Plano Atual</div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <span className="text-sm font-medium text-primary">
              {tenant?.plano_assinatura || "Básico"}
            </span>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </div>
  );
}