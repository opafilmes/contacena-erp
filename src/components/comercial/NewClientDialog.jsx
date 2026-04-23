import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  nome_fantasia: "", razao_social: "", cnpj_cpf: "",
  contato: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "", cep: ""
};

function cleanCNPJ(v) { return v.replace(/\D/g, ""); }

export default function NewClientDialog({ open, onClose, tenantId, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [cnpjInput, setCnpjInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleBuscarCNPJ = async () => {
    const cnpj = cleanCNPJ(cnpjInput);
    if (cnpj.length !== 14) { toast.error("CNPJ inválido. Digite 14 dígitos."); return; }
    setSearching(true);
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
    if (!res.ok) { toast.error("CNPJ não encontrado."); setSearching(false); return; }
    const data = await res.json();
    setForm({
      nome_fantasia: data.nome_fantasia || data.razao_social || "",
      razao_social: data.razao_social || "",
      cnpj_cpf: cnpj,
      contato: data.ddd_telefone_1 ? `(${data.ddd_telefone_1}) ${data.telefone_1}` : "",
      logradouro: data.logradouro || "",
      numero: data.numero || "",
      bairro: data.bairro || "",
      cidade: data.municipio || "",
      uf: data.uf || "",
      cep: data.cep || "",
    });
    toast.success("Dados preenchidos automaticamente!");
    setSearching(false);
  };

  const handleSave = async () => {
    if (!form.nome_fantasia.trim()) { toast.error("Nome fantasia obrigatório."); return; }
    setSaving(true);
    const created = await base44.entities.Client.create({ ...form, tenant_id: tenantId });
    toast.success("Cliente cadastrado!");
    setSaving(false);
    onCreated(created);
    setForm(EMPTY);
    setCnpjInput("");
  };

  const handleClose = () => {
    setForm(EMPTY);
    setCnpjInput("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Cadastrar Novo Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* CNPJ Lookup */}
          <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-900/50 space-y-2">
            <Label className="text-violet-400 text-xs uppercase tracking-wider">Busca por CNPJ (Brasil API)</Label>
            <div className="flex gap-2">
              <Input
                value={cnpjInput}
                onChange={e => setCnpjInput(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="bg-zinc-900 border-zinc-700"
                onKeyDown={e => e.key === "Enter" && handleBuscarCNPJ()}
              />
              <Button
                onClick={handleBuscarCNPJ}
                disabled={searching}
                className="bg-violet-600 hover:bg-violet-700 shrink-0 gap-1.5"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {searching ? "Buscando..." : "Buscar"}
              </Button>
            </div>
            <p className="text-xs text-zinc-600">Digite o CNPJ e clique em Buscar para preencher automaticamente.</p>
          </div>

          {/* Dados principais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-zinc-300 text-sm">Nome Fantasia *</Label>
              <Input value={form.nome_fantasia} onChange={e => setField("nome_fantasia", e.target.value)} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-zinc-300 text-sm">Razão Social</Label>
              <Input value={form.razao_social} onChange={e => setField("razao_social", e.target.value)} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">CNPJ/CPF</Label>
              <Input value={form.cnpj_cpf} onChange={e => setField("cnpj_cpf", e.target.value)} className="bg-zinc-900 border-zinc-700" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Contato (Tel)</Label>
              <Input value={form.contato} onChange={e => setField("contato", e.target.value)} className="bg-zinc-900 border-zinc-700" />
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-3">
            <Label className="text-zinc-400 text-xs uppercase tracking-wider">Endereço</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-zinc-300 text-sm">Logradouro</Label>
                <Input value={form.logradouro} onChange={e => setField("logradouro", e.target.value)} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Número</Label>
                <Input value={form.numero} onChange={e => setField("numero", e.target.value)} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Bairro</Label>
                <Input value={form.bairro} onChange={e => setField("bairro", e.target.value)} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Cidade</Label>
                <Input value={form.cidade} onChange={e => setField("cidade", e.target.value)} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">UF</Label>
                <Input value={form.uf} onChange={e => setField("uf", e.target.value)} maxLength={2} className="bg-zinc-900 border-zinc-700" />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-zinc-800">
          <Button variant="outline" onClick={handleClose} className="border-zinc-700 text-zinc-400">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? "Salvando..." : "Cadastrar Cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}