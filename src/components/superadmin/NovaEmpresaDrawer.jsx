import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, User } from "lucide-react";

const BLANK = {
  // Empresa
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  email_corporativo: "",
  telefone: "",
  plan_tier: "Profissional",
  subscription_status: "Trial",
  // Admin user
  admin_nome: "",
  admin_email: "",
};

export default function NovaEmpresaDrawer({ open, onClose, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.nome_fantasia.trim()) { toast.error("Nome fantasia é obrigatório."); return; }
    if (!form.admin_email.trim())   { toast.error("E-mail do admin é obrigatório."); return; }

    setSaving(true);
    // 1. Create Tenant
    const tenant = await base44.entities.Tenant.create({
      nome_fantasia: form.nome_fantasia,
      razao_social: form.razao_social,
      cnpj: form.cnpj,
      email_corporativo: form.email_corporativo,
      telefone: form.telefone,
      plan_tier: form.plan_tier,
      subscription_status: form.subscription_status,
    });

    // 2. Create Usuarios record for admin
    await base44.entities.Usuarios.create({
      nome: form.admin_nome || form.admin_email,
      email: form.admin_email,
      role: "Admin",
      tenant_id: tenant.id,
      perm_comercial: true,
      perm_financeiro: true,
      perm_studio_atividades: true,
      perm_studio_inventario: true,
    });

    // 3. Invite admin user to the app
    await base44.users.inviteUser(form.admin_email, "admin");

    toast.success(`Empresa "${form.nome_fantasia}" criada! Convite enviado para ${form.admin_email}.`);
    setSaving(false);
    setForm(BLANK);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Nova Empresa (Produtora)</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6 pb-6">
          {/* Empresa */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              <p className="text-sm font-semibold text-foreground">Dados da Empresa</p>
            </div>

            <div className="space-y-1.5">
              <Label>Nome Fantasia *</Label>
              <Input value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} placeholder="Ex: Estúdio Alfa" />
            </div>
            <div className="space-y-1.5">
              <Label>Razão Social</Label>
              <Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} placeholder="Razão Social Ltda" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>CNPJ/CPF</Label>
                <Input value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-0000" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>E-mail Corporativo</Label>
              <Input type="email" value={form.email_corporativo} onChange={e => set("email_corporativo", e.target.value)} placeholder="contato@produtora.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={form.plan_tier} onValueChange={v => set("plan_tier", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Básico">Básico</SelectItem>
                    <SelectItem value="Essencial">Essencial</SelectItem>
                    <SelectItem value="Profissional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.subscription_status} onValueChange={v => set("subscription_status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trial">Trial</SelectItem>
                    <SelectItem value="Active">Ativo</SelectItem>
                    <SelectItem value="Canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Admin User */}
          <div className="space-y-4 pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" />
              <p className="text-sm font-semibold text-foreground">Usuário Admin da Empresa</p>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">Um convite será enviado para este e-mail com acesso de Admin.</p>

            <div className="space-y-1.5">
              <Label>Nome do Admin</Label>
              <Input value={form.admin_nome} onChange={e => set("admin_nome", e.target.value)} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail do Admin *</Label>
              <Input type="email" value={form.admin_email} onChange={e => set("admin_email", e.target.value)} placeholder="admin@produtora.com" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Criando..." : "Criar Empresa"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}