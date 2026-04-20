import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Pencil, Users, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ROLES = ["Admin", "Financeiro", "Producao"];

function UserRow({ user, onSave }) {
  const [role, setRole] = useState(user.role || "Admin");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Usuarios.update(user.id, { role });
    toast.success("Perfil atualizado!");
    setSaving(false);
    onSave();
  };

  return (
    <tr className="border-b border-border/20 last:border-0">
      <td className="px-4 py-3">
        <p className="font-medium text-sm text-foreground">{user.nome}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </td>
      <td className="px-4 py-3 w-40">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3 w-16 text-right">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-accent hover:text-accent"
          disabled={saving || role === user.role}
          onClick={handleSave}
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        </Button>
      </td>
    </tr>
  );
}

export default function GerenciarEquipeModal({ tenant, onClose, onRefresh }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("Admin");
  const [adding, setAdding] = useState(false);

  const loadUsuarios = async () => {
    setLoading(true);
    const list = await base44.entities.Usuarios.filter({ tenant_id: tenant.id });
    setUsuarios(list);
    setLoading(false);
  };

  useEffect(() => { loadUsuarios(); }, [tenant.id]);

  const handleAdd = async () => {
    if (!newEmail.trim()) { toast.error("E-mail é obrigatório."); return; }
    setAdding(true);
    await base44.entities.Usuarios.create({
      nome: newNome || newEmail,
      email: newEmail,
      role: newRole,
      tenant_id: tenant.id,
      perm_comercial: true, perm_financeiro: true,
      perm_studio_atividades: true, perm_studio_inventario: true,
    });
    await base44.users.inviteUser(newEmail, newRole === "Admin" ? "admin" : "user");
    toast.success(`Usuário convidado: ${newEmail}`);
    setNewNome(""); setNewEmail(""); setNewRole("Admin");
    setShowAdd(false);
    setAdding(false);
    loadUsuarios();
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-violet-400" />
            <div>
              <p className="font-heading font-semibold text-foreground text-sm">Equipe da Empresa</p>
              <p className="text-xs text-muted-foreground">{tenant.nome_fantasia}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/20">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Usuário</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Perfil</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <UserRow key={u.id} user={u} onSave={loadUsuarios} />
                ))}
                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      Nenhum usuário cadastrado nesta empresa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Adicionar Usuário */}
          {showAdd && (
            <div className="px-4 py-4 border-t border-border/30 bg-secondary/10 space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-widest">Novo Usuário</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Nome completo" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Perfil</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">E-mail *</Label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="usuario@empresa.com" className="h-8 text-sm" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAdd(false)}>Cancelar</Button>
                <Button size="sm" className="flex-1" onClick={handleAdd} disabled={adding}>
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  {adding ? "Convidando..." : "Convidar Usuário"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showAdd && (
          <div className="px-4 py-3 border-t border-border/30">
            <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="w-3.5 h-3.5" /> Adicionar Usuário
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}