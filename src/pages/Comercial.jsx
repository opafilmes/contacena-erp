import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, FileText, Handshake, TrendingUp, Clock, CheckCircle2,
  XCircle, Eye, Pencil, ArrowUpDown, Search
} from "lucide-react";
import ProposalModal from "@/components/comercial/ProposalModal";
import ProposalManagement from "@/components/comercial/ProposalManagement";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import BackButton from "@/components/shared/BackButton";
import ContractDrawer from "@/components/comercial/ContractDrawer";
import { formatBRL } from "@/utils/format";

const PROPOSAL_STATUS = {
  Pendente: { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", label: "Pendente" },
  Aprovada: { cls: "bg-green-500/15 text-green-400 border-green-500/30", label: "Aprovada" },
  Recusada: { cls: "bg-red-500/15 text-red-400 border-red-500/30", label: "Recusada" },
};

const CONTRACT_STATUS = {
  "Em Elaboração": { cls: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  Ativo:           { cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  Finalizado:      { cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  Cancelado:       { cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

function StatusChip({ status, map }) {
  const s = map[status] || { cls: "bg-secondary text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {status}
    </span>
  );
}

// ── Bento Card (glassmorphism) ──────────────────────────────────────
function BentoCard({ icon: Icon, label, value, colorCls, glowCls }) {
  return (
    <div className={`relative rounded-2xl border p-5 flex items-center gap-4 overflow-hidden backdrop-blur-sm ${colorCls}`}>
      {/* Glow blur blob */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${glowCls}`} />
      <div className="p-2.5 rounded-xl bg-white/[0.07] z-10">
        <Icon className="w-5 h-5 stroke-[1.5]" />
      </div>
      <div className="z-10">
        <p className="text-2xl font-heading font-bold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Sortable column header ──────────────────────────────────────────
function SortHeader({ label, field, sortState, onSort }) {
  return (
    <th
      className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortState.field === field ? "text-accent" : "opacity-40"}`} />
      </span>
    </th>
  );
}

export default function Comercial() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [tab, setTab] = useState("propostas");
  const [proposalModal, setProposalModal] = useState({ open: false, record: null });
  const [contractDrawer, setContractDrawer] = useState({ open: false, record: null });
  const [managingProposal, setManagingProposal] = useState(null);

  // ── Filtros & Busca ──
  const [searchCliente, setSearchCliente] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterDatePreset, setFilterDatePreset] = useState("este_mes");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [sort, setSort] = useState({ field: "numero_proposta", dir: "desc" });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const loadAll = useCallback(async () => {
    if (!tenantId) return;
    const [p, c, cl] = await Promise.all([
      base44.entities.Proposal.filter({ tenant_id: tenantId }),
      base44.entities.Contract.filter({ inquilino_id: tenantId }),
      base44.entities.Client.filter({ tenant_id: tenantId }),
    ]);
    setProposals(p);
    setContracts(c);
    setClients(cl);
  }, [tenantId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const getClientName = (id) => clients.find(c => c.id === id)?.nome_fantasia || "—";

  // ── Dashboard: filter by current month ──
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const proposalsMes = proposals.filter(p => {
    const d = new Date(p.created_date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalMes  = proposalsMes.length;
  const aprovadas = proposalsMes.filter(p => p.status === "Aprovada").length;
  const pendentes = proposalsMes.filter(p => p.status === "Pendente").length;
  const conversao = totalMes > 0 ? Math.round((aprovadas / totalMes) * 100) : 0;

  // ── Contracts grouped ──
  const avulsas     = contracts.filter(c => c.tipo === "Avulso");
  const recorrentes = contracts.filter(c => c.tipo === "Recorrente");

  const handleDeleteProposal = async (row) => {
    await base44.entities.Proposal.delete(row.id);
    loadAll();
  };

  const handleDeleteContract = async (row) => {
    await base44.entities.Contract.delete(row.id);
    loadAll();
  };

  // ── Sort toggle ──
  const handleSort = (field) => {
    setSort(s => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "asc" });
  };

  // ── Compute date range from preset ──
  const effectiveDateStart = useMemo(() => {
    if (filterDatePreset === "hoje") return format(now, "yyyy-MM-dd");
    if (filterDatePreset === "este_mes") return format(monthStart, "yyyy-MM-dd");
    return filterDateStart;
  }, [filterDatePreset, filterDateStart]);

  const effectiveDateEnd = useMemo(() => {
    if (filterDatePreset === "hoje") return format(now, "yyyy-MM-dd");
    if (filterDatePreset === "este_mes") return format(monthEnd, "yyyy-MM-dd");
    return filterDateEnd;
  }, [filterDatePreset, filterDateEnd]);

  // ── Filtered & sorted proposals ──
  const filteredProposals = useMemo(() => {
    let list = [...proposals];

    if (searchCliente.trim()) {
      const q = searchCliente.toLowerCase();
      list = list.filter(p => getClientName(p.client_id).toLowerCase().includes(q));
    }
    if (filterStatus !== "todos") {
      list = list.filter(p => p.status === filterStatus);
    }
    if (effectiveDateStart) {
      list = list.filter(p => p.data_emissao >= effectiveDateStart);
    }
    if (effectiveDateEnd) {
      list = list.filter(p => p.data_emissao <= effectiveDateEnd);
    }

    list.sort((a, b) => {
      let va, vb;
      if (sort.field === "numero_proposta") { va = a.numero_proposta || 0; vb = b.numero_proposta || 0; }
      else if (sort.field === "cliente") { va = getClientName(a.client_id); vb = getClientName(b.client_id); }
      else if (sort.field === "valor_total") { va = a.valor_total || 0; vb = b.valor_total || 0; }
      else if (sort.field === "data_emissao") { va = a.data_emissao || ""; vb = b.data_emissao || ""; }
      else { va = 0; vb = 0; }
      if (va < vb) return sort.dir === "asc" ? -1 : 1;
      if (va > vb) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [proposals, searchCliente, filterStatus, effectiveDateStart, effectiveDateEnd, sort, clients]);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));
  const pagedProposals = filteredProposals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">📝 Comercial</h1>
          </div>
          <Button size="sm" onClick={() => tab === "propostas" ? setProposalModal({ open: true, record: null }) : setContractDrawer({ open: true, record: null })} className="gap-2">
            <Plus className="w-4 h-4" />
            {tab === "propostas" ? "Nova Proposta" : "Novo Contrato"}
          </Button>
        </div>

        {/* ── Bento Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <BentoCard
            icon={FileText}
            label="Total de Propostas (Mês)"
            value={totalMes}
            colorCls="bg-violet-500/[0.08] border-violet-500/20 text-violet-400"
            glowCls="bg-violet-500"
          />
          <BentoCard
            icon={CheckCircle2}
            label="Aprovadas"
            value={aprovadas}
            colorCls="bg-green-500/[0.08] border-green-500/20 text-green-400"
            glowCls="bg-green-500"
          />
          <BentoCard
            icon={Clock}
            label="Pendentes"
            value={pendentes}
            colorCls="bg-amber-500/[0.08] border-amber-500/20 text-amber-400"
            glowCls="bg-amber-500"
          />
          <BentoCard
            icon={TrendingUp}
            label="Taxa de Conversão"
            value={`${conversao}%`}
            colorCls="bg-sky-500/[0.08] border-sky-500/20 text-sky-400"
            glowCls="bg-sky-500"
          />
        </div>

        {/* ── Tabs ── */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 bg-secondary/50">
            <TabsTrigger value="propostas" className="gap-2">
              <FileText className="w-4 h-4" /> Propostas
            </TabsTrigger>
            <TabsTrigger value="contratos" className="gap-2">
              <Handshake className="w-4 h-4" /> Contratos
            </TabsTrigger>
          </TabsList>

          {/* ── ABA PROPOSTAS ── */}
          <TabsContent value="propostas">
            {/* Barra de Filtros */}
            <div className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl border border-border/30 bg-secondary/20">
              <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Buscar por cliente..."
                  value={searchCliente}
                  onChange={e => { setSearchCliente(e.target.value); setPage(1); }}
                  className="h-8 text-sm bg-transparent border-0 focus-visible:ring-0 px-0 placeholder:text-muted-foreground"
                />
              </div>
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Aprovada">Aprovada</SelectItem>
                  <SelectItem value="Recusada">Recusada</SelectItem>
                </SelectContent>
              </Select>
              {/* Filtro de Período Inteligente */}
              <Select value={filterDatePreset} onValueChange={v => { setFilterDatePreset(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos_periodos">Todos os períodos</SelectItem>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="este_mes">Este Mês</SelectItem>
                  <SelectItem value="personalizado">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {filterDatePreset === "personalizado" && (
                <div className="flex items-center gap-1.5">
                  <Input type="date" value={filterDateStart} onChange={e => { setFilterDateStart(e.target.value); setPage(1); }} className="h-8 w-36 text-xs" />
                  <span className="text-muted-foreground text-xs">→</span>
                  <Input type="date" value={filterDateEnd} onChange={e => { setFilterDateEnd(e.target.value); setPage(1); }} className="h-8 w-36 text-xs" />
                </div>
              )}
              {(searchCliente || filterStatus !== "todos" || filterDatePreset !== "este_mes") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchCliente(""); setFilterStatus("todos"); setFilterDatePreset("este_mes"); setFilterDateStart(""); setFilterDateEnd(""); setPage(1); }}
                >
                  Limpar
                </Button>
              )}
            </div>

            {proposals.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma proposta cadastrada ainda.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setProposalModal({ open: true, record: null })}>
                  <Plus className="w-4 h-4 mr-1" /> Criar primeira proposta
                </Button>
              </div>
            ) : filteredProposals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma proposta encontrada com esses filtros.</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/30">
                      <SortHeader label="Nº Proposta" field="numero_proposta" sortState={sort} onSort={handleSort} />
                      <SortHeader label="Cliente" field="cliente" sortState={sort} onSort={handleSort} />
                      <SortHeader label="Valor" field="valor_total" sortState={sort} onSort={handleSort} />
                      <SortHeader label="Emissão" field="data_emissao" sortState={sort} onSort={handleSort} />
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedProposals.map((p, idx) => (
                      <tr
                        key={p.id}
                        onClick={() => setManagingProposal(p)}
                        className={`border-b border-border/30 cursor-pointer hover:bg-secondary/40 transition-colors ${idx % 2 === 1 ? "bg-secondary/10" : ""}`}
                      >
                        <td className="px-4 py-3 font-mono font-semibold text-foreground text-xs">
                          {p.numero_proposta ? `PROP-${p.numero_proposta}` : `#${p.id?.slice(-4).toUpperCase()}`}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{getClientName(p.client_id)}</td>
                        <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatBRL(p.valor_total)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {p.data_emissao ? format(new Date(p.data_emissao + "T12:00:00"), "dd/MM/yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusChip status={p.status} map={PROPOSAL_STATUS} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1" onClick={e => { e.stopPropagation(); setProposalModal({ open: true, record: p }); }}>
                              <Pencil className="w-3 h-3" /> Editar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={e => { e.stopPropagation(); handleDeleteProposal(p); }}>
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-secondary/10">
                    <span className="text-xs text-muted-foreground">
                      Página {page} de {totalPages} · {filteredProposals.length} resultado{filteredProposals.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs px-3" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        ← Anterior
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-3" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                        Próxima →
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── ABA CONTRATOS ── */}
          <TabsContent value="contratos">
            {contracts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Handshake className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum contrato cadastrado ainda.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setContractDrawer({ open: true, record: null })}>
                  <Plus className="w-4 h-4 mr-1" /> Criar primeiro contrato
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {recorrentes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                      Recorrentes ({recorrentes.length})
                    </h3>
                    <ContractTable rows={recorrentes} clients={clients} onEdit={r => setContractDrawer({ open: true, record: r })} onDelete={handleDeleteContract} />
                  </div>
                )}
                {avulsas.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                      Avulsos ({avulsas.length})
                    </h3>
                    <ContractTable rows={avulsas} clients={clients} onEdit={r => setContractDrawer({ open: true, record: r })} onDelete={handleDeleteContract} />
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <ProposalModal
        open={proposalModal.open}
        onClose={() => setProposalModal({ open: false, record: null })}
        record={proposalModal.record}
        tenantId={tenantId}
        tenant={tenant}
        clients={clients}
        onSaved={loadAll}
      />

      {managingProposal && (
        <ProposalManagement
          proposal={managingProposal}
          clients={clients}
          tenant={tenant}
          tenantId={tenantId}
          onClose={() => setManagingProposal(null)}
          onApproved={() => { loadAll(); setManagingProposal(null); }}
          onEdit={() => {
            const rec = managingProposal;
            setManagingProposal(null);
            setProposalModal({ open: true, record: rec });
          }}
        />
      )}

      <ContractDrawer
        open={contractDrawer.open}
        onClose={() => setContractDrawer({ open: false, record: null })}
        record={contractDrawer.record}
        tenantId={tenantId}
        clients={clients}
        onSaved={loadAll}
      />
    </div>
  );
}

function ContractTable({ rows, clients, onEdit, onDelete }) {
  const getClientName = (id) => clients.find(c => c.id === id)?.nome_fantasia || "—";
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-secondary/30">
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vigência</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr
              key={r.id}
              onClick={() => onEdit(r)}
              className={`border-b border-border/30 cursor-pointer hover:bg-secondary/40 transition-colors ${idx % 2 === 1 ? "bg-secondary/10" : ""}`}
            >
              <td className="px-4 py-3 font-medium text-foreground">{r.titulo}</td>
              <td className="px-4 py-3 text-muted-foreground">{getClientName(r.client_id)}</td>
              <td className="px-4 py-3 text-foreground whitespace-nowrap">{r.valor ? formatBRL(r.valor) : "—"}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {r.data_inicio ? format(new Date(r.data_inicio), "dd/MM/yy") : "—"}
                {r.data_fim ? ` → ${format(new Date(r.data_fim), "dd/MM/yy")}` : ""}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CONTRACT_STATUS[r.status]?.cls || "bg-secondary text-muted-foreground border-border"}`}>
                  {r.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 justify-end">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={e => { e.stopPropagation(); onDelete(r); }}>
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}