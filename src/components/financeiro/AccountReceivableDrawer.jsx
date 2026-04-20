import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";
import { Plus, Upload, Loader2, X, Link2, ExternalLink, CheckCircle2 } from "lucide-react";
import { addDays } from "date-fns";

const STATUSES = ["Pendente", "Recebido", "Atrasado"];
const FORMA_REC = ["Pix", "Boleto", "Cartão", "Transferência", "Dinheiro", "A Combinar"];
const EMPTY = {
  descricao: "", category_id: "", client_id: "", job_id: "",
  valor: "", data_vencimento: "", status: "Pendente", forma_pagamento: "",
  bank_account_id: "", tipo_cobranca: "Unica", qtd_parcelas: 2,
  frequencia: "Mensal", anexo_url: ""
};

export default function AccountReceivableDrawer({
  open, onClose, record, tenantId,
  categories, clients, jobs, bankAccounts = [], onSaved, onSavedWithId
}) {
  const [form, setForm] = useState(EMPTY);
  const [displayValor, setDisplayValor] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Inline quick-create
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientNome, setNewClientNome] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryNome, setNewCategoryNome] = useState("");
  const [localClients, setLocalClients] = useState([]);
  const [localCategories, setLocalCategories] = useState([]);

  const anexoRef = useRef(null);

  useEffect(() => { setLocalClients(clients); }, [clients]);
  useEffect(() => { setLocalCategories(categories.filter(c => c.tipo === "Receita")); }, [categories]);

  useEffect(() => {
    if (open) {
      const r = record || EMPTY;
      setForm({ ...EMPTY, ...r, tipo_cobranca: r.tipo_cobranca || "Unica" });
      setDisplayValor(r.valor ? formatBRL(r.valor) : "");
    }
  }, [open, record]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleValorChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = Number(raw) / 100;
    setDisplayValor(formatBRL(num));
    set("valor", num);
  };

  const handleAnexoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAnexo(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("anexo_url", file_url);
    setUploadingAnexo(false);
    toast.success("Comprovante anexado!");
  };

  const handleQuickClient = async () => {
    if (!newClientNome.trim()) return;
    const c = await base44.entities.Client.create({ nome_fantasia: newClientNome.trim(), tenant_id: tenantId });
    setLocalClients(prev => [...prev, c]);
    set("client_id", c.id);
    setShowNewClient(false);
    setNewClientNome("");
    toast.success("Cliente criado!");
  };

  const handleQuickCategory = async () => {
    if (!newCategoryNome.trim()) return;
    const c = await base44.entities.FinancialCategory.create({ nome: newCategoryNome.trim(), tipo: "Receita", inquilino_id: tenantId });
    setLocalCategories(prev => [...prev, c]);
    set("category_id", c.id);
    setShowNewCategory(false);
    setNewCategoryNome("");
    toast.success("Categoria criada!");
  };

  const handleSave = async () => {
    if (!form.descricao.trim()) { toast.error("Descrição é obrigatória."); return; }
    if (!form.valor || form.valor <= 0) { toast.error("Informe o valor."); return; }
    setSaving(true);

    const basePayload = {
      descricao: form.descricao,
      category_id: form.category_id || "",
      client_id: form.client_id || "",
      job_id: form.job_id || "",
      bank_account_id: form.bank_account_id || "",
      status: form.status,
      forma_pagamento: form.forma_pagamento || "",
      anexo_url: form.anexo_url || "",
      inquilino_id: tenantId,
    };

    if (record?.id) {
      await base44.entities.AccountReceivable.update(record.id, {
        ...basePayload, valor: form.valor, data_vencimento: form.data_vencimento
      });
      toast.success("Lançamento atualizado!");
    } else if (form.tipo_cobranca === "Parcelada") {
      const qtd = Math.max(2, Math.min(60, Number(form.qtd_parcelas) || 2));
      const valorParcela = parseFloat((form.valor / qtd).toFixed(2));
      const diasIncremento = form.frequencia === "Quinzenal" ? 15 : 30;
      const baseDate = form.data_vencimento || new Date().toISOString().split("T")[0];

      const records = Array.from({ length: qtd }, (_, i) => {
        const dt = addDays(new Date(baseDate + "T12:00:00"), i * diasIncremento);
        return {
          ...basePayload,
          descricao: `${form.descricao} (${i + 1}/${qtd})`,
          valor: valorParcela,
          data_vencimento: dt.toISOString().split("T")[0],
        };
      });

      await base44.entities.AccountReceivable.bulkCreate(records);
      toast.success(`${qtd} parcelas criadas!`);
    } else {
      const created = await base44.entities.AccountReceivable.create({
        ...basePayload, valor: form.valor, data_vencimento: form.data_vencimento
      });
      toast.success("Lançamento criado!");
      setSaving(false);
      onSaved();
      if (onSavedWithId) onSavedWithId(created.id);
      onClose();
      return;
    }

    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-lg flex flex-col h-full p-0">
        <div className="px-6 pt-6 pb-4 border-b border-border/30">
          <SheetHeader>
            <SheetTitle className="font-heading">{record ? "Editar" : "Nova"} Conta a Receber</SheetTitle>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

          {/* Cliente */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Cliente</Label>
              <button onClick={() => setShowNewClient(v => !v)} className="text-xs text-accent hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Novo
              </button>
            </div>
            {showNewClient && (
              <div className="flex gap-2">
                <Input value={newClientNome} onChange={e => setNewClientNome(e.target.value)} placeholder="Nome do cliente" className="h-8 text-sm" />
                <Button size="sm" className="h-8 px-3 text-xs" onClick={handleQuickClient}>Criar</Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowNewClient(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            )}
            <Select value={form.client_id} onValueChange={v => set("client_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {localClients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Pagamento Job XYZ" />
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Categoria de Receita</Label>
              <button onClick={() => setShowNewCategory(v => !v)} className="text-xs text-accent hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Nova
              </button>
            </div>
            {showNewCategory && (
              <div className="flex gap-2">
                <Input value={newCategoryNome} onChange={e => setNewCategoryNome(e.target.value)} placeholder="Nome da categoria" className="h-8 text-sm" />
                <Button size="sm" className="h-8 px-3 text-xs" onClick={handleQuickCategory}>Criar</Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowNewCategory(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            )}
            <Select value={form.category_id} onValueChange={v => set("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {localCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label>Valor Total *</Label>
            <Input value={displayValor} onChange={handleValorChange} placeholder="R$ 0,00" />
          </div>

          {/* Tipo de cobrança */}
          <div className="space-y-1.5">
            <Label>Tipo de Cobrança</Label>
            <Select value={form.tipo_cobranca} onValueChange={v => set("tipo_cobranca", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                <SelectItem value="Unica">Única</SelectItem>
                <SelectItem value="Parcelada">Parcelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.tipo_cobranca === "Parcelada" && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
              <div className="space-y-1.5">
                <Label>Qtd. Parcelas</Label>
                <Input type="number" min={2} max={60} value={form.qtd_parcelas}
                  onChange={e => set("qtd_parcelas", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Frequência</Label>
                <Select value={form.frequencia} onValueChange={v => set("frequencia", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                    <SelectItem value="Quinzenal">Quinzenal (15d)</SelectItem>
                    <SelectItem value="Mensal">Mensal (30d)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.valor > 0 && form.qtd_parcelas >= 2 && (
                <p className="col-span-2 text-xs text-muted-foreground">
                  ≈ {formatBRL(form.valor / form.qtd_parcelas)} por parcela
                </p>
              )}
            </div>
          )}

          {/* Data vencimento */}
          <div className="space-y-1.5">
            <Label>{form.tipo_cobranca === "Parcelada" ? "Data 1ª Parcela" : "Data de Vencimento"}</Label>
            <Input type="date" value={form.data_vencimento} onChange={e => set("data_vencimento", e.target.value)} />
          </div>

          {/* Conta Financeira */}
          {bankAccounts.length > 0 && (
            <div className="space-y-1.5">
              <Label>Conta Financeira</Label>
              <Select value={form.bank_account_id} onValueChange={v => set("bank_account_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar conta..." /></SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                  {bankAccounts.map(b => <SelectItem key={b.id} value={b.id}>{b.nome_conta}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Forma de recebimento */}
          <div className="space-y-1.5">
            <Label>Forma de Recebimento</Label>
            <Select value={form.forma_pagamento} onValueChange={v => set("forma_pagamento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {FORMA_REC.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Anexo comprovante */}
          <div className="space-y-1.5">
            <Label>Comprovante / Anexo</Label>
            {form.anexo_url ? (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/30 text-xs">
                <span className="flex-1 truncate text-muted-foreground">{form.anexo_url.split("/").pop()}</span>
                <a href={form.anexo_url} target="_blank" rel="noreferrer" className="text-accent hover:underline shrink-0">Ver</a>
                <button onClick={() => set("anexo_url", "")} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full gap-2" disabled={uploadingAnexo}
                onClick={() => anexoRef.current?.click()}>
                {uploadingAnexo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploadingAnexo ? "Enviando..." : "Anexar Comprovante"}
              </Button>
            )}
            <input ref={anexoRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleAnexoUpload} />
          </div>

        </div>

        {/* Stripe Payment Link — só exibe quando editando registro existente */}
        {record?.id && (
          <div className="px-6 pb-2">
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-violet-300 uppercase tracking-widest">Cobrança via Stripe</p>
              {record.stripe_payment_link ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <p className="text-xs text-muted-foreground flex-1">Link gerado</p>
                  <a href={record.stripe_payment_link} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-violet-300 hover:underline">
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Gere um link de pagamento (Cartão, Boleto ou Pix) para enviar ao cliente.</p>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-violet-500/30 text-violet-300 hover:bg-violet-500/10 gap-2"
                disabled={generatingLink || record.status === "Recebido"}
                onClick={async () => {
                  setGeneratingLink(true);
                  const res = await base44.functions.invoke("createPaymentLink", { receivableId: record.id });
                  if (res.data?.url) {
                    toast.success("Link gerado! Abrindo...");
                    window.open(res.data.url, "_blank");
                    onSaved();
                  } else {
                    toast.error(res.data?.error || "Erro ao gerar link. Verifique se o Stripe Connect está ativo.");
                  }
                  setGeneratingLink(false);
                }}
              >
                {generatingLink
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                  : <><Link2 className="w-3.5 h-3.5" /> {record.stripe_payment_link ? "Regenerar Link" : "Gerar Link de Pagamento"}</>
                }
              </Button>
            </div>
          </div>
        )}

        {/* Footer fixo */}
        <div className="sticky bottom-0 bg-popover border-t border-border/40 px-6 py-4 z-10">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}