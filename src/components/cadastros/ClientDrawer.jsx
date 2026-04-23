import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Search, Loader2, Upload, Mail, Phone } from "lucide-react";

const emptyPJ = {
  tipo: "PJ", razao_social: "", nome_fantasia: "", cnpj_cpf: "",
  telefone: "", email: "", contato: "",
  logradouro: "", numero: "", bairro: "", cidade: "", uf: "", cep: "", logo: ""
};
const emptyPF = { tipo: "PF", nome_completo: "", cnpj_cpf: "", telefone: "", email: "", contato: "", logo: "" };

function formatCNPJ(v) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function formatCPF(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function formatPhone(raw) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return raw;
}

export default function ClientDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [tipo, setTipo] = useState("PJ");
  const [form, setForm] = useState(emptyPJ);
  const [saving, setSaving] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (record) {
      const t = record.tipo || (record.cnpj_cpf?.replace(/\D/g, "").length <= 11 ? "PF" : "PJ");
      setTipo(t);
      setForm({ ...record, tipo: t });
    } else {
      setTipo("PJ");
      setForm(emptyPJ);
    }
  }, [record, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCnpjChange = async (raw) => {
    const digits = raw.replace(/\D/g, "");
    setForm(f => ({ ...f, cnpj_cpf: formatCNPJ(raw) }));

    if (digits.length === 14) {
      setLoadingCnpj(true);
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) { toast.error("Não foi possível consultar o CNPJ."); setLoadingCnpj(false); return; }
      const d = await res.json();
      const rawPhone = d.ddd_telefone_1 ? `${d.ddd_telefone_1}${d.telefone_1 || ""}` : "";
      setForm(f => ({
        ...f,
        razao_social: d.razao_social || "",
        nome_fantasia: d.nome_fantasia || d.razao_social || "",
        logradouro: d.logradouro || "",
        numero: d.numero || "",
        bairro: d.bairro || "",
        cidade: d.municipio || "",
        uf: d.uf || "",
        cep: d.cep || "",
        telefone: rawPhone ? formatPhone(rawPhone) : f.telefone,
        email: d.email || f.email,
        contato: d.email || (rawPhone ? formatPhone(rawPhone) : "") || f.contato,
      }));
      toast.success("Dados preenchidos automaticamente!");
      setLoadingCnpj(false);
    }
  };

  const handleSave = async () => {
    const nome = tipo === "PJ" ? form.nome_fantasia : form.nome_completo;
    if (!nome?.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);

    const payload = {
      tipo,
      cnpj_cpf: form.cnpj_cpf || "",
      telefone: form.telefone || "",
      email: form.email || "",
      contato: form.telefone || form.email || form.contato || "",
      tenant_id: tenantId,
      logo: form.logo || "",
      ...(tipo === "PJ" ? {
        nome_fantasia: form.nome_fantasia || "",
        razao_social: form.razao_social || "",
        logradouro: form.logradouro || "",
        numero: form.numero || "",
        bairro: form.bairro || "",
        cidade: form.cidade || "",
        uf: form.uf || "",
        cep: form.cep || "",
      } : {
        nome_fantasia: form.nome_completo || "",
        razao_social: "",
      }),
    };

    if (record?.id) {
      await base44.entities.Client.update(record.id, payload);
      toast.success("Cliente atualizado!");
    } else {
      await base44.entities.Client.create(payload);
      toast.success("Cliente criado!");
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("logo", file_url);
    setUploadingLogo(false);
    toast.success("Logo enviada!");
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Cliente" : "Novo Cliente"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Toggle PF/PJ */}
          <div className="flex rounded-lg overflow-hidden border border-border/50">
            {["PJ", "PF"].map(t => (
              <button
                key={t}
                onClick={() => { setTipo(t); setForm(t === "PJ" ? emptyPJ : emptyPF); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${tipo === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {t === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
              </button>
            ))}
          </div>

          {tipo === "PJ" ? (
            <>
              {/* CNPJ com busca automática */}
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <div className="relative">
                  <Input
                    value={form.cnpj_cpf}
                    onChange={e => handleCnpjChange(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="pr-9"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400">
                    {loadingCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </div>
                </div>
                {loadingCnpj && <p className="text-xs text-muted-foreground">Consultando CNPJ...</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Razão Social</Label>
                <Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} placeholder="Razão Social da empresa" />
              </div>
              <div className="space-y-1.5">
                <Label>Nome Fantasia *</Label>
                <Input value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} placeholder="Nome fantasia ou marca" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label>Logradouro</Label>
                  <Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} placeholder="Rua, Av..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Número</Label>
                  <Input value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="Nº" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Bairro</Label>
                  <Input value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" />
                </div>
                <div className="space-y-1.5">
                  <Label>CEP</Label>
                  <Input value={form.cep} onChange={e => set("cep", e.target.value)} placeholder="00000-000" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label>Cidade</Label>
                  <Input value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
                </div>
                <div className="space-y-1.5">
                  <Label>UF</Label>
                  <Input value={form.uf} onChange={e => set("uf", e.target.value)} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Nome Completo *</Label>
                <Input value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-1.5">
                <Label>CPF</Label>
                <Input value={form.cnpj_cpf} onChange={e => set("cnpj_cpf", formatCPF(e.target.value))} placeholder="000.000.000-00" />
              </div>
            </>
          )}

          {/* Telefone e Email separados */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-zinc-400" /> Telefone
              </Label>
              <Input
                value={form.telefone}
                onChange={e => set("telefone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-zinc-400" /> E-mail
              </Label>
              <Input
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="contato@empresa.com"
                type="email"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div className="space-y-1.5">
            <Label>Logo do Cliente</Label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-14 h-14 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-accent/60 transition-colors shrink-0 overflow-hidden"
              >
                {form.logo
                  ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" />
                  : <Upload className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 space-y-1">
                <Button type="button" variant="outline" size="sm" disabled={uploadingLogo} onClick={() => logoInputRef.current?.click()} className="w-full">
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                  {uploadingLogo ? "Enviando..." : form.logo ? "Trocar Logo" : "Fazer Upload"}
                </Button>
                <p className="text-xs text-muted-foreground">PNG, JPG ou SVG</p>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
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