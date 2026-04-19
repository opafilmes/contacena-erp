import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import ClientDrawer from "@/components/cadastros/ClientDrawer";

const QUILL_MODULES = { toolbar: [["bold", "italic", "underline"], [{ list: "bullet" }], ["link"], ["clean"]] };

// 1. Adicionado o forma_pagamento no formulário em branco
const BLANK_FORM = { titulo: "", client_id: "", tipo_proposta: "Projeto", validade: "", status: "Pendente", forma_pagamento: "A Combinar" };

// 2. Alterado expanded para TRUE por padrão
const BLANK_ITEM = () => ({ _key: Date.now() + Math.random(), titulo: "", quantidade: 1, valor_unitario: 0, descricao_detalhada: "", expanded: true });

function formatBRLInput(num) {
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ProposalDrawer({ open, onClose, record, tenantId, clients: clientsProp, onSaved }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [clientDrawerOpen, setClientDrawerOpen] = useState(false);
  const [clients, setClients] = useState(clientsProp || []);

  const isEdit = !!record?.id;

  // keep clients in sync with prop
  useEffect(() => { setClients(clientsProp || []); }, [clientsProp]);

  useEffect(() => {
    if (!open) return;
    if (record) {
      setForm({
        titulo: record.titulo || "",
        client_id: record.client_id || "",
        tipo_proposta: record.tipo_proposta || "Projeto",
        validade: record.validade || "",
        status: record.status || "Pendente",
        forma_pagamento: record.forma_pagamento || "A Combinar", // Puxa do banco se existir
      });
      // Load existing items
      loadItems(record.id);
    } else {
      setForm(BLANK_FORM);
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
      expanded: true, // 3. Itens que já vem do banco também abrem expandidos
    })));
  };

  const addItem = () => setItems(s => [...s, BLANK_ITEM()]);
  const removeItem = (key) => setItems(s => s.filter(i => i._key !== key));
  const updateItem = (key, field, value) => setItems(s => s.map(i => i._key === key ? { ...i, [field]: value } : i));
  const toggleExpand = (key) => setItems(s => s.map(i => i._key === key ? { ...i, expanded: !i.expanded } : i));

  // Auto-calculate total
  const valorTotal = items.reduce((acc, i) => acc + (Number(i.quantidade) || 0) * (Number(i.valor_unitario) || 0), 0);

  const handleClientSaved = async () => {
    const updated = await base44.entities.Client.filter({ tenant_id: tenantId });
    setClients(updated);
    if (updated.length > 0) {
      const newest = updated.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
      setForm(f => ({ ...f, client_id: newest.id }));
    }
    setClientDrawerOpen(false);
    onSaved(); 
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) { toast.error("Título é obrigatório."); return; }
    setSaving(true);

    const payload = {
      titulo: form.titulo,
      client_id: form.client_id || undefined,
      tipo_proposta: form.tipo_proposta,
      validade: form.validade || undefined,
      status: form.status,
      forma_pagamento: form.forma_pagamento || undefined, // 4. Salva a forma de pagamento no banco
      valor_total: valorTotal || undefined,
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

    // Sync items: delete old, create all current
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

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="bg-popover/95 backdrop-blur-xl border-border/50 w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-heading">{isEdit ? "Editar Proposta" : "Nova Proposta"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-5 mt-6 pb-8">
            {/* Título */}
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Produção Campanha Verão 2025" />
            </div>

            {/* Cliente + botão novo */}
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecionar cliente..." />
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

            {/* Tipo + Validade */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select value={form.tipo_proposta} onValueChange={v => setForm(f => ({ ...f, tipo_proposta: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Projeto">Projeto</SelectItem>
                    <SelectItem value="Recorrente">Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input type="date" value={form.validade} onChange={e => setForm(f => ({ ...f, validade: e.target.value }))} />
              </div>
            </div>

            {/* Status + Forma de Pagamento */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Aprovada">Aprovada</SelectItem>
                    <SelectItem value="Recusada">Recusada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* 5. Novo Campo Forma de Pagamento adicionado aqui */}
              <div className="space-y-1.5">
                <Label>Forma de Pagamento</Label>
                <Select value={form.forma_pagamento} onValueChange={v => setForm(f => ({ ...f, forma_pagamento: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pix">Pix (À vista)</SelectItem>
                    <SelectItem value="Boleto Bancário">Boleto Bancário</SelectItem>
                    <SelectItem value="Transferência Bancária">Transferência (TED/DOC)</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    <SelectItem value="A Combinar">A Combinar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── ITENS DA PROPOSTA ── */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Itens da Proposta</Label>
                <Button type="button" variant="ghost" size="sm" onClick={addItem} className="gap-1.5 text-xs h-7 text-accent hover:text-accent hover:bg-accent/10">
                  <Plus className="w-3.5 h-3.5" /> Adicionar Item
                </Button>
              </div>

              {items.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3 border border-dashed border-border/40 rounded-lg">
                  Nenhum item. Clique em "+ Adicionar Item" para começar.
                </p>
              )}

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item._key} className="rounded-xl border border-border/50 bg-secondary/20 p-3 space-y-3">
                    {/* Header row */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-semibold w-5 shrink-0">{idx + 1}.</span>
                      <Input
                        className="flex-1 h-8 text-sm"
                        placeholder="Título do item..."
                        value={item.titulo}
                        onChange={e => updateItem(item._key, "titulo", e.target.value)}
                      />
                      <Input
                        type="number"
                        className="w-16 h-8 text-sm text-center"
                        placeholder="Qtd"
                        value={item.quantidade}
                        onChange={e => updateItem(item._key, "quantidade", e.target.value)}
                        min={1}
                      />
                      <Input
                        type="number"
                        className="w-28 h-8 text-sm"
                        placeholder="Valor unit."
                        value={item.valor_unitario}
                        onChange={e => updateItem(item._key, "valor_unitario", e.target.value)}
                        step="0.01"
                      />
                      <button type="button" onClick={() => toggleExpand(item._key)} className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors" title="Mostrar/Ocultar Detalhes">
                        {item.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button type="button" onClick={() => removeItem(item._key)} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="flex justify-end pr-9">
                      <span className="text-xs text-muted-foreground">
                        Subtotal: <span className="text-foreground font-semibold">
                          {formatBRLInput((Number(item.quantidade) || 0) * (Number(item.valor_unitario) || 0))}
                        </span>
                      </span>
                    </div>

                    {/* Rich Text expandível */}
                    {item.expanded && (
                      <div className="quill-dark rounded-md overflow-hidden border border-border/40">
                        <ReactQuill
                          value={item.descricao_detalhada || ""}
                          onChange={v => updateItem(item._key, "descricao_detalhada", v)}
                          theme="snow"
                          placeholder="Descrição detalhada do item..."
                          modules={QUILL_MODULES}
                          style={{ minHeight: 80 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Total automático */}
              {items.length > 0 && (
                <div className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-accent/10 border border-accent/20">
                  <span className="text-sm font-semibold text-accent">Valor Total da Proposta</span>
                  <span className="text-xl font-heading font-bold text-accent">{formatBRLInput(valorTotal)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "Salvando..." : isEdit ? "Atualizar" : "Criar Proposta"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Client Drawer sobreposto */}
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