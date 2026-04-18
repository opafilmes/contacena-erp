import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Shield } from "lucide-react";

const BLANK = {
  nome: "",
  email: "",
  role: "Producao",
  perm_comercial: false,
  perm_financeiro: false,
  perm_studio_atividades: true,
  perm_studio_inventario: true,
};

const ROLE_PERMS = {
  Admin:      { perm_comercial: true,  perm_financeiro: true,  perm_studio_atividades: true,  perm_studio_inventario: true  },
  Financeiro: { perm_comercial: true,  perm_financeiro: true,  perm_studio_atividades: false, perm_studio_inventario: false },
  Producao:   { perm_comercial: false, perm_financeiro: false, perm_studio_atividades: true,  perm_studio_inventario: true  },
};

const PERMS = [
  { key: "perm_comercial",         label: "Módulo Comercial",     desc: "Acesso a propostas e contratos" },
  { key: "perm_financeiro",        label: "Módulo Financeiro",    desc: "Acesso a receitas e despesas" },
  { key: "perm_studio_atividades", label: "Studio · Atividades",  desc: "Gestão de tarefas e ordem do dia" },
  { key: "perm_studio_inventario", label: "Studio · Inventário",  desc: "Gestão de equipamentos e reservas" },
];

export default function EquipeDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const isEdit = !!record?.id;

  useEffect(() => {
    if (open) {
      if (record) {
        setForm({
          nome: record.nome || "",
          email: record.email || "",
          role: record.role || "Producao",
          perm_comercial:         record.perm_comercial         ?? true,
          perm_financeiro:        record.perm_financeiro        ?? false,
          perm_studio_atividades: record.perm_studio_atividades ?? true,
          perm_studio_inventario: record.perm_studio_inventario ?? false,
        });
      } else {
        setForm(BLANK);
      }
    }
  }, [open, record]);

  const handleRoleChange = (role) => {
    setForm(f => ({ ...f, role, ...ROLE_PERMS[role] }));
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error("Nome e e-mail são obrigatórios.");
      return;
    }
    setSaving(true);
    if (isEdit) {
      await base44.entities.Usuarios.update(record.id, {
        nome:                   form.nome,
        role:                   form.role,
        perm_comercial:         form.perm_comercial,
        perm_financeiro:        form.perm_financeiro,
        perm_studio_atividades: form.perm_studio_atividades,
        perm_studio_inventario: form.perm_studio_inventario,
      });
      toast.success("Usuário atualizado!");
    } else {
      // Create the Usuarios record first, then invite to app auth
      await base44.entities.Usuarios.create({
        nome:                   form.nome,
        email:                  form.email,
        role:                   form.role,
        tenant_id:              tenantId,
        perm_comercial:         form.perm_comercial,
        perm_financeiro:        form.perm_financeiro,
        perm_studio_atividades: form.perm_studio_atividades,
        perm_studio_inventario: form.perm_studio_inventario,
      });
      await base44.users.inviteUser(form.email, form.role === "Admin" ? "admin" : "user");
      toast.success(`Usuário criado e convite enviado para ${form.email}!`);
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md bg-card/95 backdrop-blur-xl border-border/50 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{isEdit ? "Editar Usuário" : "Novo Usuário"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-5 mt-6 pb-6">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
              <p className="text-xs text-muted-foreground">Um convite será enviado para este e-mail.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <Select value={form.role} onValueChange={handleRoleChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Producao">Produção</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">As permissões abaixo são ajustadas automaticamente pelo perfil.</p>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              <Label className="text-sm font-semibold">Permissões de Acesso</Label>
            </div>
            <div className="space-y-3 rounded-xl border border-border/40 bg-secondary/20 p-4">
              {PERMS.map(perm => (
                <div key={perm.key} className="flex items-start gap-3">
                  <Checkbox
                    id={perm.key}
                    checked={!!form[perm.key]}
                    onCheckedChange={val => setForm(f => ({ ...f, [perm.key]: !!val }))}
                    className="mt-0.5"
                  />
                  <div>
                    <label htmlFor={perm.key} className="text-sm font-medium text-foreground cursor-pointer">
                      {perm.label}
                    </label>
                    <p className="text-xs text-muted-foreground">{perm.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : isEdit ? "Salvar" : "Enviar Convite"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}