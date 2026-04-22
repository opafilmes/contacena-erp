import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Shield, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SUPER_ADMIN_EMAIL = "contato@opafilmes.com";

const BLANK_TENANT = { nome_fantasia: "", cnpj: "" };
const BLANK_USER = {
  nome: "",
  email: "",
  tenant_id: "",
  role: "Admin",
  perm_comercial: true,
  perm_financeiro: true,
  perm_studio_atividades: true,
  perm_studio_inventario: true,
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={handleCopy} className="ml-1 p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

export default function SuperAdminPage() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  // Tenants
  const [tenants, setTenants] = useState([]);
  const [tenantDialog, setTenantDialog] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [tenantForm, setTenantForm] = useState(BLANK_TENANT);

  // Users (Usuarios entity)
  const [usuarios, setUsuarios] = useState([]);
  const [userDialog, setUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(BLANK_USER);

  const [saving, setSaving] = useState(false);

  // Auth guard
  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.email !== SUPER_ADMIN_EMAIL) {
        navigate("/app", { replace: true });
      } else {
        setAuthChecked(true);
        loadAll();
      }
    });
  }, []);

  const loadAll = async () => {
    const [ts, us] = await Promise.all([
      base44.entities.Tenant.list(),
      base44.entities.Usuarios.list(),
    ]);
    setTenants(ts);
    setUsuarios(us);
  };

  // ── Tenant CRUD ──
  const openNewTenant = () => {
    setEditingTenant(null);
    setTenantForm(BLANK_TENANT);
    setTenantDialog(true);
  };

  const openEditTenant = (t) => {
    setEditingTenant(t);
    setTenantForm({ nome_fantasia: t.nome_fantasia || "", cnpj: t.cnpj || "" });
    setTenantDialog(true);
  };

  const saveTenant = async () => {
    if (!tenantForm.nome_fantasia.trim()) { toast.error("Nome obrigatório."); return; }
    setSaving(true);
    if (editingTenant) {
      const updated = await base44.entities.Tenant.update(editingTenant.id, tenantForm);
      setTenants(ts => ts.map(t => t.id === editingTenant.id ? { ...t, ...updated } : t));
      toast.success("Produtora atualizada!");
    } else {
      const created = await base44.entities.Tenant.create(tenantForm);
      setTenants(ts => [...ts, created]);
      toast.success("Produtora criada!");
    }
    setSaving(false);
    setTenantDialog(false);
  };

  const deleteTenant = async (t) => {
    if (!window.confirm(`Excluir "${t.nome_fantasia}"?`)) return;
    await base44.entities.Tenant.delete(t.id);
    setTenants(ts => ts.filter(x => x.id !== t.id));
    toast.success("Produtora excluída.");
  };

  // ── User CRUD ──
  const openNewUser = () => {
    setEditingUser(null);
    setUserForm(BLANK_USER);
    setUserDialog(true);
  };

  const openEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      nome: u.nome || "",
      email: u.email || "",
      tenant_id: u.tenant_id || "",
      role: u.role || "Admin",
      perm_comercial: u.perm_comercial !== false,
      perm_financeiro: u.perm_financeiro !== false,
      perm_studio_atividades: u.perm_studio_atividades !== false,
      perm_studio_inventario: u.perm_studio_inventario !== false,
    });
    setUserDialog(true);
  };

  const saveUser = async () => {
    if (!userForm.nome.trim() || !userForm.email.trim()) { toast.error("Nome e email obrigatórios."); return; }
    setSaving(true);
    if (editingUser) {
      const updated = await base44.entities.Usuarios.update(editingUser.id, userForm);
      setUsuarios(us => us.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      toast.success("Usuário atualizado!");
    } else {
      const created = await base44.entities.Usuarios.create(userForm);
      setUsuarios(us => [...us, created]);
      toast.success("Usuário criado!");
    }
    setSaving(false);
    setUserDialog(false);
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Excluir "${u.nome}"?`)) return;
    await base44.entities.Usuarios.delete(u.id);
    setUsuarios(us => us.filter(x => x.id !== u.id));
    toast.success("Usuário excluído.");
  };

  const getTenantName = (tid) => tenants.find(t => t.id === tid)?.nome_fantasia || "—";

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-xl px-8 py-5 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/20 border border-accent/30">
          <Shield className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="font-heading font-bold text-xl text-foreground tracking-tight">Super Admin</h1>
          <p className="text-xs text-muted-foreground">Gestão global de produtoras e usuários</p>
        </div>
      </div>

      <div className="px-8 py-6 max-w-6xl mx-auto">
        <Tabs defaultValue="tenants">
          <TabsList className="mb-6 bg-secondary/40">
            <TabsTrigger value="tenants">Produtoras ({tenants.length})</TabsTrigger>
            <TabsTrigger value="users">Usuários ({usuarios.length})</TabsTrigger>
          </TabsList>

          {/* ── TENANTS ── */}
          <TabsContent value="tenants">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading font-semibold text-lg">Produtoras Cadastradas</h2>
              <Button onClick={openNewTenant} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Nova Produtora
              </Button>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">ID</TableHead>
                    <TableHead className="text-muted-foreground">Nome Fantasia</TableHead>
                    <TableHead className="text-muted-foreground">CNPJ</TableHead>
                    <TableHead className="text-muted-foreground">Plano</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenants.map(t => (
                    <TableRow key={t.id} className="border-border/30 hover:bg-secondary/20">
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px]" title={t.id}>{t.id}</span>
                          <CopyButton value={t.id} />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{t.nome_fantasia}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{t.cnpj || "—"}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-accent/15 text-accent border border-accent/25">{t.plan_tier || "—"}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${t.subscription_status === "Active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                          {t.subscription_status || "Trial"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTenant(t)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteTenant(t)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tenants.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma produtora cadastrada.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── USERS ── */}
          <TabsContent value="users">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading font-semibold text-lg">Usuários Cadastrados</h2>
              <Button onClick={openNewUser} size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Usuário
              </Button>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Produtora</TableHead>
                    <TableHead className="text-muted-foreground">Role</TableHead>
                    <TableHead className="text-muted-foreground">Tenant ID</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuarios.map(u => (
                    <TableRow key={u.id} className="border-border/30 hover:bg-secondary/20">
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                      <TableCell className="text-sm">{getTenantName(u.tenant_id)}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">{u.role}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-muted-foreground truncate max-w-[100px]" title={u.tenant_id}>{u.tenant_id || "—"}</span>
                          {u.tenant_id && <CopyButton value={u.tenant_id} />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditUser(u)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteUser(u)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {usuarios.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum usuário cadastrado.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── DIALOG: Tenant ── */}
      <Dialog open={tenantDialog} onOpenChange={setTenantDialog}>
        <DialogContent className="bg-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingTenant ? "Editar Produtora" : "Nova Produtora"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editingTenant && (
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs">ID (somente leitura)</Label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary/30 border border-border/40">
                  <span className="font-mono text-xs text-muted-foreground flex-1 select-all">{editingTenant.id}</span>
                  <CopyButton value={editingTenant.id} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Nome da Produtora *</Label>
              <Input value={tenantForm.nome_fantasia} onChange={e => setTenantForm(f => ({ ...f, nome_fantasia: e.target.value }))} placeholder="Ex: Opa Filmes" />
            </div>
            <div className="space-y-1.5">
              <Label>CNPJ</Label>
              <Input value={tenantForm.cnpj} onChange={e => setTenantForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTenantDialog(false)}>Cancelar</Button>
            <Button onClick={saveTenant} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG: User ── */}
      <Dialog open={userDialog} onOpenChange={setUserDialog}>
        <DialogContent className="bg-card border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label>Nome *</Label>
              <Input value={userForm.nome} onChange={e => setUserForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Produtora</Label>
              <Select value={userForm.tenant_id} onValueChange={v => setUserForm(f => ({ ...f, tenant_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar produtora..." />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.nome_fantasia}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userForm.tenant_id && (
                <p className="text-xs text-muted-foreground font-mono mt-1">ID: {userForm.tenant_id}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={userForm.role} onValueChange={v => setUserForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                  <SelectItem value="Producao">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissões */}
            <div className="space-y-3 pt-1">
              <Label className="text-sm font-semibold">Acessos ao Sistema</Label>
              <div className="space-y-2 rounded-lg border border-border/40 bg-secondary/20 p-3">
                {[
                  { key: "perm_comercial", label: "Comercial" },
                  { key: "perm_financeiro", label: "Financeiro" },
                  { key: "perm_studio_atividades", label: "Studio — Atividades" },
                  { key: "perm_studio_inventario", label: "Studio — Inventário" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3">
                    <Checkbox
                      id={key}
                      checked={!!userForm[key]}
                      onCheckedChange={v => setUserForm(f => ({ ...f, [key]: v }))}
                    />
                    <label htmlFor={key} className="text-sm cursor-pointer select-none">{label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialog(false)}>Cancelar</Button>
            <Button onClick={saveUser} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}