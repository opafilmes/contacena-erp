import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { 
  Plus, Eye, Printer, Pencil, Trash2, FileText, LayoutDashboard, FileCheck, 
  MoreVertical, ArrowUpDown, Send, Mail, MessageCircle, AlertTriangle
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { formatBRL } from "@/utils/format";
import { toast } from "sonner";
import ProposalForm from "@/components/comercial/ProposalForm";
import ProposalPrintView from "@/components/comercial/ProposalPrintView";
import ContratosView from "@/components/comercial/ContratosView";

const STATUS_STYLES = {
  "Elaboração": "bg-zinc-700/40 text-zinc-300 border-zinc-600/40",
  "Enviada":    "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Aprovada":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Recusada":   "bg-red-500/15 text-red-400 border-red-500/30",
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "propostas", label: "Propostas", icon: FileText },
  { id: "contratos", label: "Contratos", icon: FileCheck },
];

export default function Comercial() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [activeNav, setActiveNav] = useState("propostas");
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [printProposal, setPrintProposal] = useState(null);
  const [sendProposal, setSendProposal] = useState(null);
  
  // 🔥 Novo estado para o Modal de Exclusão
  const [proposalToDelete, setProposalToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [sortConfig, setSortConfig] = useState({ key: "created_date", direction: "desc" });

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const [props, cls] = await Promise.all([
      base44.entities.Proposal.filter({ tenant_id: tenantId }, "-created_date"),
      base44.entities.Client.filter({ tenant_id: tenantId }),
    ]);
    setProposals(props);
    setClients(cls);
  }, [tenantId]);

  useEffect(() => { loadData(); }, [loadData]);

  const getClientName = useCallback((id) => clients.find(c => c.id === id)?.nome_fantasia || "—", [clients]);
  const getClient = (id) => clients.find(c => c.id === id);

  // 🔥 Nova função de confirmação de exclusão
  const confirmDelete = async () => {
    if (!proposalToDelete) return;
    setIsDeleting(true);
    try {
      const items = await base44.entities.ProposalItem.filter({ proposal_id: proposalToDelete.id });
      await Promise.all(items.map(i => base44.entities.ProposalItem.delete(i.id)));
      await base44.entities.Proposal.delete(proposalToDelete.id);
      setProposals(prev => prev.filter(x => x.id !== proposalToDelete.id));
      toast.success("Proposta excluída com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao excluir a proposta.");
    } finally {
      setIsDeleting(false);
      setProposalToDelete(null);
    }
  };

  const handleEdit = (p) => {
    setEditingProposal(p);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingProposal(null);
    setFormOpen(true);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedProposals = useMemo(() => {
    let sortableProposals = [...proposals];
    if (sortConfig !== null) {
      sortableProposals.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === "client_id") {
          aValue = getClientName(a.client_id).toLowerCase();
          bValue = getClientName(b.client_id).toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableProposals;
  }, [proposals, sortConfig, getClientName]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      <aside className="w-56 border-r border-zinc-800 bg-zinc-950/60 flex flex-col pt-8 px-3 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-3 mb-3">Comercial</p>
        <nav className="space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeNav === id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 px-8 py-8 overflow-auto">
        {activeNav === "dashboard" && <ComercialDashboard proposals={proposals} clients={clients} />}

        {activeNav === "propostas" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Propostas</h1>
                <p className="text-sm text-zinc-500 mt-0.5">{proposals.length} proposta(s) cadastrada(s)</p>
              </div>
              <Button onClick={handleNew} className="gap-2 bg-violet-600 hover:bg-violet-700 text-white">
                <Plus className="w-4 h-4" /> Nova Proposta
              </Button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <SortableHeader label="Nº" sortKey="number" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Data" sortKey="issue_date" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Cliente" sortKey="client_id" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Tipo" sortKey="type" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Valor" sortKey="total_value" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
                    <th className="px-4 py-3 w-10 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {sortedProposals.map(p => (
                    <tr
                      key={p.id}
                      onClick={() => handleEdit(p)}
                      className="border-b border-zinc-800/60 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono text-violet-400 font-semibold">{p.number || "—"}</td>
                      <td className="px-4 py-3 text-zinc-300">
                        {p.issue_date ? new Date(p.issue_date + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-200 font-medium">{getClientName(p.client_id)}</td>
                      <td className="px-4 py-3 text-zinc-400">{p.type || "—"}</td>
                      <td className="px-4 py-3 text-zinc-200">{formatBRL(p.total_value)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[p.status] || ""}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                              <span className="sr-only">Abrir menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-zinc-900 border-zinc-800 text-zinc-300">
                            <DropdownMenuItem onClick={() => setSendProposal(p)} className="cursor-pointer hover:bg-zinc-800 hover:text-white text-violet-400 focus:text-violet-300">
                              <Send className="w-4 h-4 mr-2" /> Enviar...
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setPrintProposal(p)} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                              <Eye className="w-4 h-4 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setPrintProposal(p); setTimeout(() => window.print(), 400); }} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                              <Printer className="w-4 h-4 mr-2" /> Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(p)} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            
                            {/* 🔥 Ação de exclusão agora abre o modal em vez do window.confirm */}
                            <DropdownMenuItem onClick={() => setProposalToDelete(p)} className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400 focus:text-red-400 focus:bg-red-500/10">
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                      </td>
                    </tr>
                  ))}
                  {proposals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-zinc-500">Nenhuma proposta cadastrada. Clique em "Nova Proposta" para começar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeNav === "contratos" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <ContratosView />
          </motion.div>
        )}
      </div>

      <ProposalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        proposal={editingProposal}
        tenantId={tenantId}
        tenant={tenant}
        clients={clients}
        onSaved={(newClients) => {
          if (newClients) setClients(newClients);
          loadData();
          setFormOpen(false);
        }}
      />

      {printProposal && (
        <ProposalPrintView
          proposal={printProposal}
          client={getClient(printProposal.client_id)}
          tenant={tenant}
          onClose={() => setPrintProposal(null)}
        />
      )}

      <SendProposalDialog 
        open={!!sendProposal}
        onClose={() => setSendProposal(null)}
        proposal={sendProposal}
        client={sendProposal ? getClient(sendProposal.client_id) : null}
        tenant={tenant}
        onSent={loadData}
      />

      {/* 🔥 Novo Modal de Exclusão Estilizado */}
      <Dialog open={!!proposalToDelete} onOpenChange={() => !isDeleting && setProposalToDelete(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-sm p-6 overflow-hidden">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-zinc-100">Excluir Proposta</h2>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                Tem certeza que deseja excluir a proposta <strong className="text-zinc-200">{proposalToDelete?.number}</strong>? <br/>
                Esta ação <span className="text-red-400">não poderá ser desfeita</span>.
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={() => setProposalToDelete(null)} disabled={isDeleting} className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancelar
            </Button>
            <Button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function SortableHeader({ label, sortKey, sortConfig, onSort }) {
  const isActive = sortConfig.key === sortKey;
  return (
    <th 
      onClick={() => onSort(sortKey)}
      className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-800/40 hover:text-zinc-300 transition-colors group select-none"
    >
      <div className="flex items-center gap-1.5">
        {label}
        <ArrowUpDown className={`w-3.5 h-3.5 ${isActive ? "opacity-100 text-violet-400" : "opacity-0 group-hover:opacity-50"} transition-opacity`} />
      </div>
    </th>
  );
}

function SendProposalDialog({ open, onClose, proposal, client, tenant, onSent }) {
  const [method, setMethod] = useState("email");
  const [sending, setSending] = useState(false);

  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappMsg, setWhatsappMsg] = useState("");

  useEffect(() => {
    if (open && proposal) {
      const cName = client?.nome_fantasia || "Cliente";
      const tName = tenant?.nome_fantasia || "Produtora";
      const pNum = proposal.number || "Sem Número";

      setEmailTo(client?.email || "");
      setEmailSubject(`Sua proposta audiovisual chegou! 🎬 - ${tName}`);
      setEmailBody(`Olá, ${cName}!\n\nTudo ótimo por aí?\n\nEstruturamos esta proposta com muita dedicação, focando nas melhores soluções para fazer o seu projeto acontecer com excelência.\n\nSeguem em anexo todos os detalhes, escopo e valores (Proposta ${pNum}).\n\nQualquer dúvida ou ajuste que seja necessário, estamos super à disposição para conversar!\n\nUm abraço,\nEquipe ${tName}`);

      setWhatsappPhone(client?.telefone || "");
      setWhatsappMsg(`Fala, ${cName}! Tudo bem? Aqui é da ${tName}.\n\nPassando para avisar que a sua proposta comercial ${pNum} já está na mão! 🚀\n\nQuando conseguir analisar os detalhes, me dá um toque aqui para conversarmos e darmos o próximo passo. Um abraço!`);
    }
  }, [open, proposal, client, tenant]);

  const updateStatusToSent = async () => {
    if (proposal.status !== "Aprovada" && proposal.status !== "Enviada") {
      await base44.entities.Proposal.update(proposal.id, { status: "Enviada" });
      onSent();
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo) { toast.error("Preencha o e-mail do destinatário."); return; }
    setSending(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      await updateStatusToSent();
      toast.success("E-mail enviado com sucesso!");
      onClose();
    } catch (e) {
      toast.error("Erro ao enviar e-mail.");
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsapp = async () => {
    const cleanPhone = whatsappPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) { 
      toast.error("Número de WhatsApp inválido."); 
      return; 
    }
    
    const finalPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const url = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(whatsappMsg)}`;
    
    window.open(url, "_blank");
    
    await updateStatusToSent();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-w-lg p-6">
        <h2 className="font-heading text-lg font-semibold mb-4">Enviar Proposta {proposal?.number}</h2>

        <div className="flex gap-2 p-1 bg-zinc-900 border border-zinc-800 rounded-lg mb-6">
          <button 
            onClick={() => setMethod("email")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${method === "email" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            <Mail className="w-4 h-4" /> E-mail
          </button>
          <button 
            onClick={() => setMethod("whatsapp")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${method === "whatsapp" ? "bg-[#25D366]/20 text-[#25D366] shadow-sm" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        </div>

        {method === "email" ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Para (E-mail)</Label>
              <Input value={emailTo} onChange={e => setEmailTo(e.target.value)} className="bg-zinc-900 border-zinc-700 h-9" placeholder="cliente@email.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Assunto</Label>
              <Input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="bg-zinc-900 border-zinc-700 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Mensagem</Label>
              <textarea 
                value={emailBody} 
                onChange={e => setEmailBody(e.target.value)}
                className="w-full h-32 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400">Cancelar</Button>
              <Button onClick={handleSendEmail} disabled={sending} className="bg-violet-600 hover:bg-violet-700 text-white">
                {sending ? "Enviando..." : "Enviar E-mail"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Telefone WhatsApp</Label>
              <Input value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} className="bg-zinc-900 border-zinc-700 h-9" placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1">
              <Label className="text-zinc-400 text-xs">Mensagem</Label>
              <textarea 
                value={whatsappMsg} 
                onChange={e => setWhatsappMsg(e.target.value)}
                className="w-full h-32 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none"
              />
            </div>
            <p className="text-xs text-zinc-500">Ao clicar em enviar, o WhatsApp Web será aberto em uma nova aba com a mensagem pronta.</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button variant="outline" onClick={onClose} className="border-zinc-700 text-zinc-400">Cancelar</Button>
              <Button onClick={handleSendWhatsapp} className="bg-[#25D366] hover:bg-[#1ebd5a] text-white">
                Abrir WhatsApp
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ComercialDashboard({ proposals, clients }) {
  const total = proposals.reduce((s, p) => s + (p.total_value || 0), 0);
  const aprovadas = proposals.filter(p => p.status === "Aprovada");
  const pendentes = proposals.filter(p => p.status === "Elaboração" || p.status === "Enviada");
  const txConversao = proposals.length ? Math.round((aprovadas.length / proposals.length) * 100) : 0;

  const stats = [
    { label: "Total de Propostas", value: proposals.length, color: "text-zinc-200" },
    { label: "Valor Total", value: formatBRL(total), color: "text-violet-400" },
    { label: "Aprovadas", value: aprovadas.length, color: "text-emerald-400" },
    { label: "Taxa de Conversão", value: `${txConversao}%`, color: "text-sky-400" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-6">Dashboard Comercial</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
            <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold font-heading ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
        <p className="text-sm font-semibold text-zinc-300 mb-3">Propostas Recentes</p>
        {proposals.slice(0, 5).map(p => (
          <div key={p.id} className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
            <span className="font-mono text-violet-400 text-sm">{p.number}</span>
            <span className="text-zinc-400 text-sm">{clients.find(c => c.id === p.client_id)?.nome_fantasia || "—"}</span>
            <span className="text-zinc-200 text-sm">{formatBRL(p.total_value)}</span>
          </div>
        ))}
        {proposals.length === 0 && <p className="text-zinc-600 text-sm text-center py-4">Nenhuma proposta ainda.</p>}
      </div>
    </motion.div>
  );
}