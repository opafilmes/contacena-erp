import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";

const EMPTY_PROPOSAL = {
  client_id: "", type: "Avulsa", status: "Elaboração",
  issue_date: new Date().toISOString().slice(0, 10),
  validity_date: "", observations: "",
};

const EMPTY_ITEM = { description: "", details: "", quantity: 1, unit_price: 0, total_price: 0 };

async function getNextProposalNumber(tenantId) {
  const existing = await base44.entities.Proposal.filter({ tenant_id: tenantId }, "-created_date", 1);
  if (!existing.length) return "PROP-1001";
  const last = existing[0].number || "PROP-1000";
  const num = parseInt(last.replace("PROP-", ""), 10) || 1000;
  return `PROP-${num + 1}`;
}

export default function ProposalForm({ open, onClose, proposal, tenantId, clients: initialClients, tenant, onSaved }) {
  const [form, setForm] = useState(EMPTY_PROPOSAL);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [clients, setClients] = useState(initialClients || []);
  const [saving, setSaving] = useState(false);
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClientName, setNewClientName] = useState("");

  useEffect(() => { setClients(initialClients || []); }, [initialClients]);

  useEffect(() => {
    if (!open) return;
    if (proposal) {
      setForm({
        client_id: proposal.client_id || "",
        type: proposal.type || "Avulsa",
        status: proposal.status || "Elaboração",
        issue_date: proposal.issue_date || new Date().toISOString().slice(0, 10),
        validity_date: proposal.validity_date || "",
        observations: proposal.observations || "",
      });
      base44.entities.ProposalItem.filter({ proposal_id: proposal.id }).then(its => {
        setItems(its.length ? its : [{ ...EMPTY_ITEM }]);
      });
    } else {
      setForm(EMPTY_PROPOSAL);
      setItems([{ ...EMPTY_ITEM }]);
    }
    setNewClientMode(false);
    setNewClientName("");
  }, [open, proposal]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateItem = (idx, key, rawVal) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[idx], [key]: rawVal };
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      item.total_price = parseFloat((qty * price).toFixed(2));
      next[idx] = item;
      return next;
    });
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const totalValue = items.reduce((s, i) => s + (parseFloat(i.total_price) || 0), 0);

  const handleAddClient = async () => {
    if (!newClientName.trim()) { toast.error("Nome obrigatório"); return; }
    const created = await base44.entities.Client.create({ nome_fantasia: newClientName.trim(), tenant_id: tenantId });
    const updated = [...clients, created];
    setClients(updated);
    setField("client_id", created.id);
    setNewClientMode(false);
    setNewClientName("");
    toast.success("Cliente adicionado!");
  };

  const handleSave = async () => {
    if (!form.client_id) { toast.error("Selecione um cliente."); return; }
    setSaving(true);

    let proposalId = proposal?.id;
    const payload = { ...form, total_value: totalValue, tenant_id: tenantId };

    if (proposal) {
      await base44.entities.Proposal.update(proposal.id, payload);
    } else {
      payload.number = await getNextProposalNumber(tenantId);
      const created = await base44.entities.Proposal.create(payload);
      proposalId = created.id;
    }

    // Save items
    if (proposal) {
      const old = await base44.entities.ProposalItem.filter({ proposal_id: proposalId });
      await Promise.all(old.map(o => base44.entities.ProposalItem.delete(o.id)));
    }
    await Promise.all(
      items.filter(i => i.description.trim()).map(i =>
        base44.entities.ProposalItem.create({ ...i, proposal_id: proposalId, tenant_id: tenantId })
      )
    );

    toast.success(proposal ? "Proposta atualizada!" : "Proposta criada!");
    setSaving(false);
    onSaved(clients);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            {proposal ? `Editar ${proposal.number || "Proposta"}` : "Nova Proposta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Cliente */}
          <section>
            <Label className="text-zinc-400 text-xs uppercase tracking-wider mb-3 block">Cliente</Label>
            {!newClientMode ? (
              <div className="flex gap-2">
                <Select value={form.client_id} onValueChange={v => setField("client_id", v)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 flex-1">
                    <SelectValue placeholder="Selecionar cliente..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={() => setNewClientMode(true)} className="border-zinc-700 text-zinc-400 hover:text-zinc-200 gap-1.5 shrink-0">
                  <UserPlus className="w-3.5 h-3.5" /> Novo Cliente
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  placeholder="Nome do cliente..."
                  className="bg-zinc-900 border-zinc-700 flex-1"
                  onKeyDown={e => e.key === "Enter" && handleAddClient()}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddClient} className="bg-violet-600 hover:bg-violet-700">Adicionar</Button>
                <Button size="sm" variant="ghost" onClick={() => setNewClientMode(false)}><X className="w-4 h-4" /></Button>
              </div>
            )}
          </section>

          {/* Dados da Proposta */}
          <section>
            <Label className="text-zinc-400 text-xs uppercase tracking-wider mb-3 block">Dados da Proposta</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Tipo</Label>
                <Select value={form.type} onValueChange={v => setField("type", v)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="Avulsa">Avulsa</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Status</Label>
                <Select value={form.status} onValueChange={v => setField("status", v)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {["Elaboração", "Enviada", "Aprovada", "Recusada"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Data de Emissão</Label>
                <Input type="date" value={form.issue_date} onChange={e => setField("issue_date", e.target.value)} className="bg-zinc-900 border-zinc-700" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-300 text-sm">Validade</Label>
                <Input type="date" value={form.validity_date} onChange={e => setField("validity_date", e.target.value)} className="bg-zinc-900 border-zinc-700" />
              </div>
            </div>
          </section>

          {/* Itens */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Itens da Proposta</Label>
              <Button variant="ghost" size="sm" onClick={addItem} className="text-violet-400 hover:text-violet-300 gap-1.5 h-7">
                <Plus className="w-3.5 h-3.5" /> Adicionar Item
              </Button>
            </div>
            <div className="rounded-lg border border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-zinc-800">
                    <th className="text-left px-3 py-2 text-zinc-500 font-medium text-xs">Descrição</th>
                    <th className="text-left px-3 py-2 text-zinc-500 font-medium text-xs w-28">Detalhes</th>
                    <th className="text-right px-3 py-2 text-zinc-500 font-medium text-xs w-16">Qtd</th>
                    <th className="text-right px-3 py-2 text-zinc-500 font-medium text-xs w-28">Valor Unit.</th>
                    <th className="text-right px-3 py-2 text-zinc-500 font-medium text-xs w-28">Total</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-1 py-1">
                        <Input value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} placeholder="Descrição" className="bg-transparent border-0 focus-visible:ring-0 px-2 text-sm h-8" />
                      </td>
                      <td className="px-1 py-1">
                        <Input value={item.details} onChange={e => updateItem(idx, "details", e.target.value)} placeholder="Detalhe" className="bg-transparent border-0 focus-visible:ring-0 px-2 text-sm h-8" />
                      </td>
                      <td className="px-1 py-1">
                        <Input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)} className="bg-transparent border-0 focus-visible:ring-0 px-2 text-sm h-8 text-right" />
                      </td>
                      <td className="px-1 py-1">
                        <Input type="number" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", e.target.value)} className="bg-transparent border-0 focus-visible:ring-0 px-2 text-sm h-8 text-right" />
                      </td>
                      <td className="px-3 py-1 text-right text-zinc-300 font-medium">{formatBRL(item.total_price)}</td>
                      <td className="px-1 py-1">
                        {items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-3 pr-4">
              <div className="text-right">
                <p className="text-xs text-zinc-500">Valor Total</p>
                <p className="text-xl font-bold text-violet-400 font-heading">{formatBRL(totalValue)}</p>
              </div>
            </div>
          </section>

          {/* Observações */}
          <section>
            <Label className="text-zinc-300 text-sm mb-1.5 block">Observações</Label>
            <textarea
              value={form.observations}
              onChange={e => setField("observations", e.target.value)}
              rows={3}
              placeholder="Condições de pagamento, prazo de entrega..."
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
            />
          </section>
        </div>

        <DialogFooter className="pt-2 border-t border-zinc-800">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400 hover:text-zinc-200">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? "Salvando..." : "Salvar Proposta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}