import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

const empty = {
  nome: "", razao_social: "", cnpj_cpf: "", categoria: "", telefone: "",
  email: "", contato: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", cep: ""
};

function formatCNPJ(v) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
            .replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3")
            .replace(/(\d{3})(\d{0,3})/, "$1.$2");
  }
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
          .replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4")
          .replace(/(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3")
          .replace(/(\d{2})(\d{0,3})/, "$1.$2");
}

export default function SupplierDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [loadingCNPJ, setLoadingCNPJ] = useState(false);

  useEffect(() => {
    setForm(record ? {
      nome: record.nome || "",
      razao_social: record.razao_social || "",
      cnpj_cpf: record.cnpj_cpf || "",
      categoria: record.categoria || "",
      telefone: record.telefone || "",
      email: record.email || "",
      contato: record.contato || "",
      logradouro: record.logradouro || "",
      numero: record.numero || "",
      bairro: record.bairro || "",
      cidade: record.cidade || "",
      uf: record.uf || "",
      cep: record.cep || "",
    } : empty);
  }, [record, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCNPJChange = (v) => {
    const formatted = formatCNPJ(v);
    set("cnpj_cpf", formatted);
  };

  const buscarCNPJ = async () => {
    const digits = form.cnpj_cpf.replace(/\D/g, "");
    if (digits.length !== 14) { toast.error("Digite um CNPJ válido (14 dígitos)."); return; }
    setLoadingCNPJ(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado");
      const data = await res.json();
      setForm(f => ({
        ...f,
        nome: data.nome_fantasia || data.razao_social || f.nome,
        razao_social: data.razao_social || f.razao_social,
        telefone: data.ddd_telefone_1 ? data.ddd_telefone_1.replace(/(\d{2})(\d+)/, "($1) $2") : f.telefone,
        email: data.email || f.email,
        logradouro: data.logradouro || f.logradouro,
        numero: data.numero || f.numero,
        bairro: data.bairro || f.bairro,
        cidade: data.municipio || f.cidade,
        uf: data.uf || f.uf,
        cep: data.cep ? data.cep.replace(/(\d{5})(\d{3})/, "$1-$2") : f.cep,
      }));
      toast.success("Dados preenchidos automaticamente!");
    } catch {
      toast.error("Não foi possível buscar o CNPJ. Preencha manualmente.");
    }
    setLoadingCNPJ(false);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);
    const payload = { ...form, tenant_id: tenantId };
    if (record?.id) {
      await base44.entities.Supplier.update(record.id, payload);
      toast.success("Fornecedor atualizado!");
    } else {
      await base44.entities.Supplier.create(payload);
      toast.success("Fornecedor criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Fornecedor" : "Novo Fornecedor"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6 pb-6">

          {/* CNPJ com busca automática */}
          <div className="space-y-1.5">
            <Label>CNPJ / CPF</Label>
            <div className="flex gap-2">
              <Input
                value={form.cnpj_cpf}
                onChange={e => handleCNPJChange(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                onClick={buscarCNPJ}
                disabled={loadingCNPJ}
                title="Buscar dados pelo CNPJ"
              >
                {loadingCNPJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nome / Nome Fantasia *</Label>
              <Input value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Nome do fornecedor" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Razão Social</Label>
              <Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} placeholder="Razão social" />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={e => set("categoria", e.target.value)} placeholder="ex: Equipamento, Serviço" />
            </div>
            <div className="space-y-1.5">
              <Label>Contato</Label>
              <Input value={form.contato} onChange={e => set("contato", e.target.value)} placeholder="Nome do responsável" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@fornecedor.com" />
            </div>
          </div>

          {/* Endereço */}
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Endereço</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Logradouro</Label>
                <Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} placeholder="Rua, Av..." />
              </div>
              <div className="space-y-1.5">
                <Label>Número</Label>
                <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="123" />
              </div>
              <div className="space-y-1.5">
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" />
              </div>
              <div className="space-y-1.5">
                <Label>CEP</Label>
                <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
              </div>
              <div className="space-y-1.5">
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
              </div>
              <div className="space-y-1.5">
                <Label>UF</Label>
                <Input value={form.uf} onChange={e => set("uf", e.target.value)} placeholder="SP" maxLength={2} className="uppercase" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}