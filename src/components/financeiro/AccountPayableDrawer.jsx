import React, { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";
import { Plus, Upload, Loader2, X } from "lucide-react";
import { addDays } from "date-fns";

const STATUSES = ["Pendente", "Pago", "Atrasado"];
const FORMA_PAG = ["Pix", "Boleto", "Cartão", "Transferência", "Dinheiro", "A Combinar"];
const EMPTY = {
  descricao: "", category_id: "", supplier_id: "", valor: "",
  data_vencimento: "", status: "Pendente", forma_pagamento: "",
  bank_account_id: "", tipo_cobranca: "Unica", qtd_parcelas: 2,
  frequencia: "Mensal", anexo_url: ""
};

export default function AccountPayableDrawer({
  open, onClose, record, tenantId,
  categories, suppliers, bankAccounts = [], onSaved, onSavedWithId
}) {
  const [form, setForm] = useState(EMPTY);
  const [displayValor, setDisplayValor] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);

  // Inline quick-create states
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierNome, setNewSupplierNome] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryNome, setNewCategoryNome] = useState("");
  const [localSuppliers, setLocalSuppliers] = useState([]);
  const [localCategories, setLocalCategories] = useState([]);

  const anexoRef = useRef(null);

  useEffect(() => {
    setLocalSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    setLocalCategories(categories.filter(c => c.tipo === "Despesa"));
  }, [categories]);

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

  const handleQuickSupplier = async () => {
    if (!newSupplierNome.trim()) return;
    const s = await base44.entities.Supplier.create({ nome: newSupplierNome.trim(), tenant_id: tenantId });
    setLocalSuppliers(prev => [...prev, s]);
    set("supplier_id", s.id);
    setShowNewSupplier(false);
    setNewSupplierNome("");
    toast.success("Fornecedor criado!");
  };

  const handleQuickCategory = async () => {
    if (!newCategoryNome.trim()) return;
    const c = await base44.entities.FinancialCategory.create({ nome: newCategoryNome.trim(), tipo: "Despesa", inquilino_id: tenantId });
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
      supplier_id: form.supplier_id || "",
      bank_account_id: form.bank_account_id || "",
      status: form.status,
      forma_pagamento: form.forma_pagamento || "",
      anexo_url: form.anexo_url || "",
      inquilino_id: tenantId,
    };

    if (record?.id) {
      // Edit: simple update
      await base44.entities.AccountPayable.update(record.id, {
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

      await base44.entities.AccountPayable.bulkCreate(records);
      toast.success(`${qtd} parcelas criadas!`);
    } else {
      const created = await base44.entities.AccountPayable.create({
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
      <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">{record ? "Editar" : "Nova"} Conta a Pagar</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">

          {/* Fornecedor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Fornecedor</Label>
              <button onClick={() => setShowNewSupplier(v => !v)} className="text-xs text-accent hover:underline flex items-center gap-0.5">
                <Plus className="w-3 h-3" /> Novo
              </button>
            </div>
            {showNewSupplier && (
              <div className="flex gap-2">
                <Input value={newSupplierNome} onChange={e => setNewSupplierNome(e.target.value)} placeholder="Nome do fornecedor" className="h-8 text-sm" />
                <Button size="sm" className="h-8 px-3 text-xs" onClick={handleQuickSupplier}>Criar</Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowNewSupplier(false)}><X className="w-3.5 h-3.5" /></Button>
              </div>
            )}
            <Select value={form.supplier_id} onValueChange={v => set("supplier_id", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar fornecedor..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {localSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label>Descrição *</Label>
            <Input value={form.descricao} onChange={e => set("descricao", e.target.value)} placeholder="Ex: Aluguel câmera RED" />
          </div>

          {/* Categoria */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Categoria de Despesa</Label>
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

          {/* Forma de pagamento */}
          <div className="space-y-1.5">
            <Label>Forma de Pagamento</Label>
            <Select value={form.forma_pagamento} onValueChange={v => set("forma_pagamento", v)}>
              <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
              <SelectContent className="bg-popover/95 backdrop-blur-xl border-border/50">
                {FORMA_PAG.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
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

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}