import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp, X, Building2 } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import ClientDrawer from "@/components/cadastros/ClientDrawer";
import { format } from "date-fns";

const QUILL_MODULES = { toolbar: [["bold", "italic", "underline"], [{ list: "bullet" }], ["link"], ["clean"]] };
const BLANK_ITEM = () => ({ _key: Date.now() + Math.random(), titulo: "", quantidade: 1, valor_unitario: 0, descricao_detalhada: "", expanded: false });

function fmt(v) {
  return Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

export default function ProposalModal({ open, onClose, record, tenantId, tenant, clients: clientsProp, onSaved }) {
  const [form, setForm] = useState({});
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [clients, setClients] = useState(clientsProp || []);

  const isEdit = !!record?.id;

  useEffect(() => { setClients(clientsProp || []); }, [clientsProp]);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        client_id: record.client_id || "",
        tipo_proposta: record.tipo_proposta || "Projeto",
        data_emissao: record.data_emissao || todayStr(),
        validade: record.validade || "",
        status: record.status || "Pendente",
        desconto_tipo: record.desconto_tipo || "%",
        desconto_valor: record.desconto_valor || 0,
        observacoes: record.observacoes || "",
        vigencia_meses: record.vigencia_meses || "",
        dia_vencimento: record.dia_vencimento || "",
        metodo_pagamento: record.metodo_pagamento || "",
      });
      loadItems(record.id);
    } else {
      setForm({
        client_id: "",
        tipo_proposta: "Projeto",
        data_emissao: todayStr(),
        validade: "",
        status: "Pendente",
        desconto_tipo: "%",
        desconto_valor: 0,
        observacoes: "",
        vigencia_meses: "",
        dia_vencimento: "",
        metodo_pagamento: "",
      });
      setItems([]);
    }
  }, [open, record]);

  const loadItems = async (proposalId) => {
    const existing = await base44.entities.ProposalItem.filter({ proposal_id: proposalId });
    setItems(existing.map(it => ({
      _key: it.id,
      _id: it.id,
      titulo: it.titulo || "",
      quantidade: it.quantidade || 1,
      valor_unitario: it.valor_unitario || 0,
      descricao_detalhada: it.descricao_detalhada || "",
      expanded: false,
    })));
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addItem = () => setItems(s => [...s, BLANK_ITEM()]);
  const removeItem = (key) => setItems(s => s.filter(i => i._key !== key));
  const updateItem = (key, field, value) => setItems(s => s.map(i => i._key === key ? { ...i, [field]: value } : i));
  const toggleExpand = (key) => setItems(s => s.map(i => i._key === key ? { ...i, expanded: !i.expanded } : i));

  const subtotal = items.reduce((acc, i) => acc + (Number(i.quantidade) || 0) * (Number(i.valor_unitario) || 0), 0);

  const descontoReais = form.desconto_tipo === "%"
    ? subtotal * (Number(form.desconto_valor) || 0) / 100
    : Number(form.desconto_valor) || 0;

  const valorTotal = Math.max(0, subtotal - descontoReais);

  const handleClientSaved = async () => {
    const updated = await base44.entities.Client.filter({ tenant_id: tenantId });
    setClients(updated);
    const newest = [...updated].sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
    if (newest) set("client_id", newest.id);
    setClientDrawerOpen(false);
    onSaved();
  };

  const handleSave = async () => {
    setSaving(true);

    // Numeração automática para novas propostas
    let numero_proposta = record?.numero_proposta;
    if (!isEdit) {
      const existing = await base44.entities.Proposal.filter({ tenant_id: tenantId });
      const maxNum = existing.reduce((max, p) => Math.max(max, p.numero_proposta || 0), 0);
      numero_proposta = maxNum > 0 ? maxNum + 1 : 1001;
    }

    const payload = {
      numero_proposta,
      client_id: form.client_id || undefined,
      tipo_proposta: form.tipo_proposta,
      data_emissao: form.data_emissao || undefined,
      validade: form.validade || undefined,
      status: form.status,
      desconto_tipo: form.desconto_tipo,
      desconto_valor: Number(form.desconto_valor) || 0,
      observacoes: form.observacoes || undefined,
      vigencia_meses: form.tipo_proposta === "Recorrente" ? Number(form.vigencia_meses) || undefined : undefined,
      dia_vencimento: form.tipo_proposta === "Recorrente" ? Number(form.dia_vencimento) || undefined : undefined,
      metodo_pagamento: form.tipo_proposta === "Recorrente" ? form.metodo_pagamento || undefined : undefined,
      valor_total: valorTotal,
      tenant_id: tenantId,
    };

    let proposalId;
    if (isEdit) {
      await base44.entities.Proposal.update(record.id, payload);
      proposalId = record.id;
      toast.success("Proposta atualizada!");
    } else {
      const created = await base44.entities.Proposal.create(payload);
      proposalId = created.id;
      toast.success("Proposta criada!");
    }

    // Sync items
    if (isEdit) {
      const oldItems = await base44.entities.ProposalItem.filter({ proposal_id: proposalId });
      await Promise.all(oldItems.map(i => base44.entities.ProposalItem.delete(i.id)));
    }
    const validItems = items.filter(i => i.titulo?.trim());
    await Promise.all(validItems.map(i =>
      base44.entities.ProposalItem.create({
        titulo: i.titulo,
        descricao_detalhada: i.descricao_detalhada || undefined,
        quantidade: Number(i.quantidade) || 1,
        valor_unitario: Number(i.valor_unitario) || 0,
        valor_total: (Number(i.quantidade) || 0) * (Number(i.valor_unitario) || 0),
        proposal_id: proposalId,
        inquilino_id: tenantId,
      })
    ));

    setSaving(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  const isRecorrente = form.tipo_proposta === "Recorrente";

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-4">
        <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-auto">

          {/* ── TOP HEADER COM BRANDING DO TENANT ── */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-border/30 bg-secondary/20 rounded-t-2xl">
            <div className="flex items-center gap-4">
              {tenant?.logo ? (
                <img src={tenant.logo} alt="logo" className="h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-accent" />
                </div>
              )}
              <div>
                <p className="font-heading font-bold text-foreground text-base">{tenant?.razao_social || tenant?.nome_fantasia || "Produtora"}</p>
                <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                  {tenant?.cnpj && <span>CNPJ: {tenant.cnpj}</span>}
                  {tenant?.cidade && tenant?.uf && <span>{tenant.cidade} – {tenant.uf}</span>}
                  {tenant?.email_corporativo && <span>{tenant.email_corporativo}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-muted-foreground font-heading">
                {isEdit ? "Editar Proposta" : "Nova Proposta"}
              </span>
              <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
            {/* ── COLUNA ESQUERDA: Dados Estruturais ── */}
            <div className="lg:col-span-1 border-r border-border/30 p-6 space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Dados da Proposta</h3>

              {/* Cliente */}
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <div className="flex gap-2">
                  <Select value={form.client_id} onValueChange={v => set("client_id", v)}>
                    <SelectTrigger className="flex-1 text-xs">
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setClientDrawerOpen(true)} title="Novo cliente">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Data Emissão + Validade */}
              <div className="space-y-1.5">
                <Label>Data de Emissão</Label>
                <Input type="date" value={form.data_emissao} onChange={e => set("data_emissao", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Validade da Proposta</Label>
                <Input type="date" value={form.validade} onChange={e => set("validade", e.target.value)} />
              </div>

              {/* Tipo */}
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo_proposta} onValueChange={v => set("tipo_proposta", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Projeto">Projeto (Avulso)</SelectItem>
                    <SelectItem value="Recorrente">Contrato Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Aprovada">Aprovada</SelectItem>
                    <SelectItem value="Recusada">Recusada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ── CAMADA 4: Campos Recorrentes ── */}
              {isRecorrente && (
                <div className="space-y-3 pt-2 border-t border-border/30">
                  <p className="text-xs font-semibold text-accent uppercase tracking-widest">Recorrência</p>

                  <div className="space-y-1.5">
                    <Label>Vigência (meses)</Label>
                    <Select value={String(form.vigencia_meses || "")} onValueChange={v => set("vigencia_meses", v)}>
                      <SelectTrigger><SelectValue placeholder="Ex: 12 meses" /></SelectTrigger>
                      <SelectContent>
                        {[1, 3, 6, 12, 18, 24].map(m => (
                          <SelectItem key={m} value={String(m)}>{m} {m === 1 ? "mês" : "meses"}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Dia de Vencimento</Label>
                    <Select value={String(form.dia_vencimento || "")} onValueChange={v => set("dia_vencimento", v)}>
                      <SelectTrigger><SelectValue placeholder="Dia do mês" /></SelectTrigger>
                      <SelectContent>
                        {[1, 5, 10, 15, 20, 25, 30].map(d => (
                          <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Método de Pagamento</Label>
                    <Select value={form.metodo_pagamento} onValueChange={v => set("metodo_pagamento", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Cartão">Cartão</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* ── COLUNA DIREITA: Itens + Desconto + Obs ── */}
            <div className="lg:col-span-2 p-6 space-y-5">
              {/* Itens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Itens da Proposta</h3>
                  <Button type="button" variant="ghost" size="sm" onClick={addItem} className="gap-1.5 text-xs h-7 text-accent hover:text-accent hover:bg-accent/10">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Item
                  </Button>
                </div>

                {/* Cabeçalho da tabela */}
                {items.length > 0 && (
                  <div className="grid grid-cols-12 gap-2 px-2 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                    <div className="col-span-5">Descrição</div>
                    <div className="col-span-2 text-center">Complemento</div>
                    <div className="col-span-1 text-center">Qtd</div>
                    <div className="col-span-2 text-right">Unit.</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                  </div>
                )}

                {items.length === 0 && (
                  <div
                    onClick={addItem}
                    className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border/40 rounded-xl cursor-pointer hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    <Plus className="w-5 h-5 mx-auto mb-2 opacity-50" />
                    Clique para adicionar o primeiro item
                  </div>
                )}

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item._key} className="rounded-xl border border-border/40 bg-secondary/20 overflow-hidden">
                      <div className="grid grid-cols-12 gap-2 p-3 items-center">
                        <div className="col-span-5 flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}.</span>
                          <Input
                            className="h-8 text-sm flex-1"
                            placeholder="Descrição do item..."
                            value={item.titulo}
                            onChange={e => updateItem(item._key, "titulo", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(item._key)}
                            className="text-xs text-muted-foreground hover:text-accent flex items-center gap-1 transition-colors"
                          >
                            {item.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{item.expanded ? "Ocultar" : "Detalhar"}</span>
                          </button>
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            className="h-8 text-sm text-center px-1"
                            value={item.quantidade}
                            onChange={e => updateItem(item._key, "quantidade", e.target.value)}
                            min={1}
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            className="h-8 text-sm text-right px-2"
                            placeholder="0,00"
                            value={item.valor_unitario}
                            onChange={e => updateItem(item._key, "valor_unitario", e.target.value)}
                            step="0.01"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold text-foreground text-right flex-1">
                            {fmt((Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0))}
                          </span>
                          <button type="button" onClick={() => removeItem(item._key)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {item.expanded && (
                        <div className="px-3 pb-3 border-t border-border/30">
                          <div className="quill-dark rounded-md overflow-hidden border border-border/40 mt-2">
                            <ReactQuill
                              value={item.descricao_detalhada || ""}
                              onChange={v => updateItem(item._key, "descricao_detalhada", v)}
                              theme="snow"
                              placeholder="Complemento técnico do item..."
                              modules={QUILL_MODULES}
                              style={{ minHeight: 80 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── DESCONTO ── */}
              {items.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Subtotal</span>
                    <span className="text-sm text-foreground font-semibold">{fmt(subtotal)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold whitespace-nowrap">Desconto</span>
                    <div className="flex rounded-lg overflow-hidden border border-border/50 shrink-0">
                      {["%", "R$"].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set("desconto_tipo", t)}
                          className={`px-3 py-1 text-xs font-semibold transition-colors ${form.desconto_tipo === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <Input
                      type="number"
                      className="h-8 w-32 text-sm"
                      placeholder={form.desconto_tipo === "%" ? "0%" : "R$ 0,00"}
                      value={form.desconto_valor || ""}
                      onChange={e => set("desconto_valor", e.target.value)}
                      min={0}
                      step="0.01"
                    />
                    {descontoReais > 0 && (
                      <span className="text-xs text-muted-foreground">= {fmt(descontoReais)}</span>
                    )}
                  </div>

                  {/* Total Final */}
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-accent/10 border border-accent/20">
                    <span className="font-semibold text-accent text-sm">Valor Total da Proposta</span>
                    <span className="text-2xl font-heading font-bold text-accent">{fmt(valorTotal)}</span>
                  </div>
                </div>
              )}

              {/* ── OBSERVAÇÕES / TERMOS ── */}
              <div className="space-y-2 pt-2 border-t border-border/30">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Observações e Termos</Label>
                <div className="quill-dark rounded-md overflow-hidden border border-border/40">
                  <ReactQuill
                    value={form.observacoes || ""}
                    onChange={v => set("observacoes", v)}
                    theme="snow"
                    placeholder="Termos, condições, instruções de pagamento..."
                    modules={QUILL_MODULES}
                    style={{ minHeight: 100 }}
                  />
                </div>
              </div>

              {/* ── AÇÕES ── */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                  {saving ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Proposta"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ClientDrawer
        open={clientDrawerOpen}
        onClose={() => setClientDrawerOpen(false)}
        record={null}
        tenantId={tenantId}
        onSaved={handleClientSaved}
      />
    </>
  );
}