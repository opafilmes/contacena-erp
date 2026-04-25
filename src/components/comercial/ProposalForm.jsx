import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatBRL } from "@/utils/format";
import NewClientDialog from "./NewClientDialog";
import ReactQuill from "react-quill";

const DESCRIPTION_SUGGESTIONS = [
  "Pré-produção", "Roteiro", "Diária de Gravação", "Direção de Fotografia",
  "Drone", "Edição de Vídeo", "Color Grading", "Sound Design", "Motion Graphics", "Locução"
];

const PAYMENT_PROJETO = ["Boleto", "Pix", "Transferência", "Dinheiro", "Parcelado"];
const PAYMENT_MENSAL = ["Boleto", "Pix", "Transferência", "Dinheiro"];
const INSTALLMENTS = [2,3,4,5,6,7,8,9,10,11,12];

const EMPTY_PROPOSAL = {
  client_id: "", type: "Projeto", status: "Elaboração",
  issue_date: new Date().toISOString().slice(0, 10),
  validity_date: "", observations: "",
  discount_value: 0, discount_type: "fixed",
  payment_method: "", installments: 2, contract_due_day: 1, contract_duration: 12,
};
const EMPTY_ITEM = { description: "", details: "", quantity: 1, unit_price: 0, total_price: 0 };

async function getNextProposalNumber(tenantId) {
  const existing = await base44.entities.Proposal.filter({ tenant_id: tenantId }, "-created_date", 1);
  if (!existing.length) return "#1001";
  const last = existing[0].number || "#1000";
  
  /* Pega apenas os números da última proposta, ignorando se era PROP- ou # */
  const num = parseInt(last.replace(/[^0-9]/g, ""), 10) || 1000;
  return `#${num + 1}`;
}

function calcDiscount(subtotal, discountValue, discountType) {
  if (!discountValue) return 0;
  if (discountType === "percent") return parseFloat(((subtotal * discountValue) / 100).toFixed(2));
  return parseFloat((discountValue || 0).toFixed(2));
}

export default function ProposalForm({ open, onClose, proposal, tenantId, clients: initialClients, tenant, onSaved }) {
  const [form, setForm] = useState(EMPTY_PROPOSAL);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [clients, setClients] = useState(initialClients || []);
  const [saving, setSaving] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [activeRichIdx, setActiveRichIdx] = useState(null);

  useEffect(() => { setClients(initialClients || []); }, [initialClients]);

  useEffect(() => {
    if (!open) return;
    if (proposal) {
      setForm({
        client_id: proposal.client_id || "",
        type: proposal.type || "Projeto",
        status: proposal.status || "Elaboração",
        issue_date: proposal.issue_date || new Date().toISOString().slice(0, 10),
        validity_date: proposal.validity_date || "",
        observations: proposal.observations || "",
        discount_value: proposal.discount_value || 0,
        discount_type: proposal.discount_type || "fixed",
        payment_method: proposal.payment_method || "",
        installments: proposal.installments || 2,
        contract_due_day: proposal.contract_due_day || 1,
        contract_duration: proposal.contract_duration || 12,
      });
      base44.entities.ProposalItem.filter({ proposal_id: proposal.id }, "created_date").then(its => {
        setItems(its.length ? its : [{ ...EMPTY_ITEM }]);
      });
    } else {
      setForm(EMPTY_PROPOSAL);
      setItems([{ ...EMPTY_ITEM }]);
    }
    setActiveRichIdx(null);
  }, [open, proposal]);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateItem = (idx, key, rawVal) => {
    setItems(prev => {
      const next = [...prev];
      const item = { ...next[idx], [key]: rawVal };
      if (key !== "details") {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        item.total_price = parseFloat((qty * price).toFixed(2));
      }
      next[idx] = item;
      return next;
    });
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    if (activeRichIdx === idx) setActiveRichIdx(null);
  };

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.total_price) || 0), 0);
  const discountAmt = calcDiscount(subtotal, form.discount_value, form.discount_type);
  const totalValue = Math.max(0, parseFloat((subtotal - discountAmt).toFixed(2)));

  const handleClientCreated = (created) => {
    const updated = [...clients, created];
    setClients(updated);
    setField("client_id", created.id);
    setNewClientOpen(false);
    toast.success("Cliente selecionado!");
  };

  const handleSave = async () => {
    if (!form.client_id) { toast.error("Selecione um cliente."); return; }
    setSaving(true);
    let proposalId = proposal?.id;
    const payload = {
      ...form, total_value: totalValue, subtotal_value: subtotal,
      discount_value: form.discount_value, tenant_id: tenantId
    };
    
    try {
      if (proposal) {
        await base44.entities.Proposal.update(proposal.id, payload);
      } else {
        payload.number = await getNextProposalNumber(tenantId);
        const created = await base44.entities.Proposal.create(payload);
        proposalId = created.id;
      }
      if (proposal) {
        const old = await base44.entities.ProposalItem.filter({ proposal_id: proposalId });
        await Promise.all(old.map(o => base44.entities.ProposalItem.delete(o.id)));
      }
      await Promise.all(
        items.filter(i => i.description?.trim()).map(i =>
          base44.entities.ProposalItem.create({ ...i, proposal_id: proposalId, tenant_id: tenantId })
        )
      );
      toast.success(proposal ? "Proposta atualizada!" : "Proposta criada!");
      onSaved(clients);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar a proposta.");
    } finally {
      setSaving(false);
    }
  };

  const paymentOptions = form.type === "Mensal" ? PAYMENT_MENSAL : PAYMENT_PROJETO;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        {/* AUMENTADO PARA max-w-6xl */}
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 w-full max-w-6xl h-[95vh] flex flex-col p-0 gap-0 overflow-hidden">
          
          {/* ── Fixed Header ── */}
          <div className="px-6 pt-5 pb-4 border-b border-zinc-800 shrink-0">
            <h2 className="font-heading text-lg font-semibold">
              {proposal ? `Editar ${proposal.number || "Proposta"}` : "Nova Proposta"}
            </h2>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="col-span-2 space-y-1">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Cliente</Label>
                <div className="flex gap-2">
                  <Select value={form.client_id} onValueChange={v => setField("client_id", v)}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 flex-1 h-8 text-sm">
                      <SelectValue placeholder="Selecionar cliente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={() => setNewClientOpen(true)} className="border-zinc-700 text-zinc-400 hover:text-zinc-200 gap-1 h-8 px-2 shrink-0">
                    <UserPlus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Status</Label>
                <Select value={form.status} onValueChange={v => setField("status", v)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {["Elaboração", "Enviada", "Aprovada", "Recusada"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Tipo</Label>
                <Select value={form.type} onValueChange={v => { 
                  setField("type", v); 
                  setField("payment_method", ""); 
                  if (v === "Projeto") {
                    setField("contract_duration", 12);
                    setField("contract_due_day", 1);
                  }
                }}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="Projeto">Projeto</SelectItem>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Emissão</Label>
                <Input type="date" value={form.issue_date} onChange={e => setField("issue_date", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm [color-scheme:dark]" />
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Validade</Label>
                <Input type="date" value={form.validity_date} onChange={e => setField("validity_date", e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm [color-scheme:dark]" />
              </div>

              <div className="space-y-1">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider">Pagamento</Label>
                <Select value={form.payment_method} onValueChange={v => setField("payment_method", v)}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {paymentOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {form.type === "Projeto" && form.payment_method === "Parcelado" && (
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs uppercase tracking-wider">Parcelas</Label>
                  <Select value={String(form.installments)} onValueChange={v => setField("installments", parseInt(v))}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {INSTALLMENTS.map(n => <SelectItem key={n} value={String(n)}>{n}x</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.type === "Mensal" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Duração (Meses)</Label>
                    <Select value={String(form.contract_duration || 12)} onValueChange={v => setField("contract_duration", parseInt(v))}>
                      <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                          <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'mês' : 'meses'}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-zinc-400 text-xs uppercase tracking-wider">Vencimento (Dia)</Label>
                    <Input type="number" min={1} max={31} value={form.contract_due_day}
                      onChange={e => setField("contract_due_day", parseInt(e.target.value) || 1)}
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Scrollable Items Area ── */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-zinc-400 text-xs uppercase tracking-wider">Itens da Proposta</Label>
              <Button variant="ghost" size="sm" onClick={addItem} className="text-violet-400 hover:text-violet-300 gap-1.5 h-7">
                <Plus className="w-3.5 h-3.5" /> Adicionar Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        list={`desc-suggestions-${idx}`}
                        value={item.description}
                        onChange={e => updateItem(idx, "description", e.target.value)}
                        placeholder="Serviço / Descrição..."
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                      <datalist id={`desc-suggestions-${idx}`}>
                        {DESCRIPTION_SUGGESTIONS.map(s => <option key={s} value={s} />)}
                      </datalist>
                    </div>
                    <Input type="number" value={item.quantity} onChange={e => updateItem(idx, "quantity", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 w-16 text-center h-8 text-sm" placeholder="Qtd" />
                    <Input type="number" value={item.unit_price} onChange={e => updateItem(idx, "unit_price", e.target.value)}
                      className="bg-zinc-900 border-zinc-700 text-zinc-300 w-28 text-right h-8 text-sm" placeholder="Valor Unit." />
                    <div className="w-24 text-right text-zinc-300 font-medium text-sm shrink-0">{formatBRL(item.total_price)}</div>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} className="p-1.5 rounded hover:bg-red-500/15 text-zinc-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    {activeRichIdx === idx ? (
                      <div className="quill-dark rounded-md border border-zinc-700 overflow-hidden">
                        <ReactQuill
                          theme="snow"
                          value={item.details || ""}
                          onChange={val => updateItem(idx, "details", val)}
                          modules={{ toolbar: [["bold", "italic"], [{ list: "bullet" }, { list: "ordered" }], ["clean"]] }}
                          placeholder="Detalhamento do item..."
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveRichIdx(idx)}
                        className="w-full text-left px-3 py-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 text-sm min-h-[32px]"
                      >
                        {item.details ? (
                          <span className="text-zinc-400" dangerouslySetInnerHTML={{ __html: item.details }} />
                        ) : (
                          <span className="text-zinc-600 italic">Clique para adicionar detalhes (texto rico)...</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sticky Footer Side-by-Side (LADO A LADO) ── */}
          <div className="shrink-0 border-t border-zinc-800 bg-zinc-950 px-6 py-4">
            <div className="flex gap-8">
              
              {/* Lado Esquerdo: Observações */}
              <div className="flex-1 flex flex-col">
                <Label className="text-zinc-400 text-xs uppercase tracking-wider mb-2 block">Observações</Label>
                <textarea
                  value={form.observations}
                  onChange={e => setField("observations", e.target.value)}
                  placeholder="Condições de pagamento, prazo de entrega..."
                  className="w-full flex-1 min-h-[100px] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
                />
              </div>

              {/* Lado Direito: Totais e Botões */}
              <div className="w-[360px] flex flex-col justify-between">
                
                <div className="flex flex-col gap-2 w-full">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-zinc-400 text-sm">
                    <span>Subtotal</span>
                    <span>{formatBRL(subtotal)}</span>
                  </div>

                  {/* Desconto */}
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">Desconto</span>
                    <div className="flex items-center gap-2">
                      <Select value={form.discount_type} onValueChange={v => setField("discount_type", v)}>
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 h-8 text-xs w-16 text-zinc-300">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                          <SelectItem value="fixed">R$</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number" min={0}
                        value={form.discount_value || ""}
                        onChange={e => setField("discount_value", parseFloat(e.target.value) || 0)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-300 h-8 text-sm w-24 text-right"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-end justify-between border-t border-zinc-800 pt-2 mt-1">
                    <span className="text-zinc-300 text-sm font-medium pb-1">Valor Total</span>
                    <div className="text-right">
                      {discountAmt > 0 && (
                        <div className="text-sky-400 text-xs font-medium mb-1">− {formatBRL(discountAmt)}</div>
                      )}
                      <div className="text-2xl font-bold text-violet-400 font-heading tracking-tight leading-none">{formatBRL(totalValue)}</div>
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400 hover:text-zinc-200 h-10 px-6">Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white h-10 px-6">
                    {saving ? "Salvando..." : "Salvar Proposta"}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NewClientDialog
        open={newClientOpen}
        onClose={() => setNewClientOpen(false)}
        tenantId={tenantId}
        onCreated={handleClientCreated}
      />
    </>
  );
}