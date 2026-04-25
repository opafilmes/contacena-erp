import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { 
  Plus, Eye, Printer, Pencil, Trash2, FileText, LayoutDashboard, FileCheck, 
  MoreVertical, ArrowUpDown 
} from "lucide-react";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { formatBRL } from "@/utils/format";
import ProposalForm from "@/components/comercial/ProposalForm";
import ProposalPrintView from "@/components/comercial/ProposalPrintView";

// 🔥 Alteração da cor Aprovada para um verde premium
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
  const [formOpen, setFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);
  const [printProposal, setPrintProposal] = useState(null);
  
  // Estados para a ordenação da tabela
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

  const handleDelete = async (p) => {
    if (!window.confirm(`Excluir proposta ${p.number || ""}?`)) return;
    const items = await base44.entities.ProposalItem.filter({ proposal_id: p.id });
    await Promise.all(items.map(i => base44.entities.ProposalItem.delete(i.id)));
    await base44.entities.Proposal.delete(p.id);
    setProposals(prev => prev.filter(x => x.id !== p.id));
  };

  const handleEdit = (p) => {
    setEditingProposal(p);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingProposal(null);
    setFormOpen(true);
  };

  // 🔥 Função de Ordenação
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // 🔥 Aplica a ordenação na lista de propostas
  const sortedProposals = useMemo(() => {
    let sortableProposals = [...proposals];
    if (sortConfig !== null) {
      sortableProposals.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Tratamento especial para o nome do cliente (que não está na proposta em si)
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
                        
                        {/* 🔥 Novo Dropdown Menu de Ações */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                              <span className="sr-only">Abrir menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300">
                            <DropdownMenuItem onClick={() => setPrintProposal(p)} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                              <Eye className="w-4 h-4 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setPrintProposal(p); setTimeout(() => window.print(), 400); }} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                              <Printer className="w-4 h-4 mr-2" /> Imprimir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(p)} className="cursor-pointer hover:bg-zinc-800 hover:text-white">
                              <Pencil className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(p)} className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-400 focus:text-red-400 focus:bg-red-500/10">
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
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <FileCheck className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-heading text-lg">Módulo de Contratos</p>
            <p className="text-sm mt-1">Em breve</p>
          </div>
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
    </div>
  );
}

// 🔥 Componente novo para cabeçalho clicável com setinha
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

function ComercialDashboard({ proposals, clients }) {
  const total = proposals.reduce((s, p) => s + (p.total_value || 0), 0);
  const aprovadas = proposals.filter(p => p.status === "Aprovada");
  const pendentes = proposals.filter(p => p.status === "Elaboração" || p.status === "Enviada");
  const txConversao = proposals.length ? Math.round((aprovadas.length / proposals.length) * 100) : 0;

  const stats = [
    { label: "Total de Propostas", value: proposals.length, color: "text-zinc-200" },
    { label: "Valor Total", value: formatBRL(total), color: "text-violet-400" },
    // 🔥 Cor verde atualizada no Dashboard
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