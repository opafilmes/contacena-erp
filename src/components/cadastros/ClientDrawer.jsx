import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Search, Loader2, Upload } from "lucide-react";

const emptyPJ = { tipo: "PJ", razao_social: "", nome_fantasia: "", cnpj_cpf: "", contato: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", cep: "", logo: "" };
const emptyPF = { tipo: "PF", nome_completo: "", cnpj_cpf: "", contato: "", logo: "" };

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
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function ClientDrawer({ open, onClose, record, tenantId, onSaved }) {
  const [tipo, setTipo] = useState("PJ");
  const [form, setForm] = useState(emptyPJ);
  const [saving, setSaving] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  // --- VACINA DE LIMPEZA ---
  const forceCleanup = useCallback(() => {
    setTimeout(() => {
      document.body.style.pointerEvents = "auto";
      document.body.style.overflow = "auto";
      document.body.removeAttribute("data-scroll-locked");
      // Se houver algum overlay de fundo preso, isso ajuda a liberar
      const guards = document.querySelectorAll('[data-radix-focus-guard]');
      guards.forEach(el => el.remove());
    }, 100);
  }, []);

  const handleClose = () => {
    forceCleanup();
    onClose();
  };
  // -------------------------

  useEffect(() => {
    if (open) {
      if (record) {
        const t = record.tipo || (record.cnpj_cpf?.replace(/\D/g, "").length <= 11 ? "PF" : "PJ");
        setTipo(t);
        setForm({ ...record, tipo: t });
      } else {
        setTipo("PJ");
        setForm(emptyPJ);
      }
    }
  }, [record, open]);

  const handleCnpjChange = async (raw) => {
    const digits = raw.replace(/\D/g, "");
    const masked = formatCNPJ(raw);
    setForm(f => ({ ...f, cnpj_cpf: masked }));

    if (digits.length === 14) {
      setLoadingCnpj(true);
      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
        if (!res.ok) throw new Error("CNPJ não encontrado");
        const d = await res.json();
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
          contato: d.email || d.ddd_telefone_1 || f.contato,
        }));
        toast.success("Dados preenchidos automaticamente!");
      } catch {
        toast.error("Não foi possível consultar o CNPJ.");
      } finally {
        setLoadingCnpj(false);
      }
    }
  };

  const handleCpfChange = (raw) => {
    setForm(f => ({ ...f, cnpj_cpf: formatCPF(raw) }));
  };

  const handleSave = async () => {
    const nome = tipo === "PJ" ? form.nome_fantasia : form.nome_completo;
    if (!nome?.trim()) { toast.error("Nome é obrigatório."); return; }
    setSaving(true);

    try {
      const payload = {
        tipo,
        cnpj_cpf: form.cnpj_cpf || "",
        contato: form.contato || "",
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
      onSaved();
      handleClose();
    } catch (err) {
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("logo", file_url);
      toast.success("Logo enviada!");
    } catch {
      toast.error("Erro no upload.");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar Cliente" : "Novo Cliente"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
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
              <div className="space-y-1.5">
                <Label>CNPJ</Label>
                <div className="relative">
                  <Input
                    value={form.cnpj_cpf}
                    onChange={e => handleCnpjChange(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="pr-9"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {loadingCnpj ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Razão Social</Label>
                <Input value={form.razao_social} onChange={e => set("razao_social", e.target.value)} placeholder="Razão Social" />
              </div>
              <div className="space-y-1.5">
                <Label>Nome Fantasia *</Label>
                <Input value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} placeholder="Nome fantasia" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label>Logradouro</Label>
                  <Input value={form.logradouro} onChange={e => set("logradouro", e.target.value)} placeholder="Rua..." />
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
                  <Input value={form.uf} onChange={e => set("uf", e.target.value)} placeholder="UF" maxLength={2} />
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
                <Input value={form.cnpj_cpf} onChange={e => handleCpfChange(e.target.value)} placeholder="000.000.000-00" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Contato</Label>
            <Input value={form.contato} onChange={e => set("contato", e.target.value)} placeholder="E-mail ou telefone" />
          </div>

          <div className="space-y-1.5">
            <Label>Logo do Cliente</Label>
            <div className="flex items-center gap-3">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="w-14 h-14 rounded-full border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer overflow-hidden"
              >
                {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} className="w-full">
                  {uploadingLogo ? "Enviando..." : "Trocar Logo"}
                </Button>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}