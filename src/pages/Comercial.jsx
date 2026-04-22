import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FileText, Handshake, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import BackButton from "@/components/shared/BackButton";
import ProposalDrawer from "@/components/comercial/ProposalDrawer";
import ContractDrawer from "@/components/comercial/ContractDrawer";
import { formatBRL } from "@/utils/format";

const PROPOSAL_STATUS = {
  Pendente: { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",  label: "Pendente" },
  Aprovada: { cls: "bg-green-500/15 text-green-400 border-green-500/30",    label: "Aprovada" },
  Recusada: { cls: "bg-red-500/15 text-red-400 border-red-500/30",          label: "Recusada" },
};

const CONTRACT_STATUS = {
  Ativo:      { cls: "bg-green-500/15 text-green-400 border-green-500/30" },
  Finalizado: { cls: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
  Cancelado:  { cls: "bg-red-500/15 text-red-400 border-red-500/30" },
};

function StatusChip({ status, map }) {
  const s = map[status] || { cls: "bg-secondary text-muted-foreground border-border" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {status}
    </span>
  );
}

function MiniCard({ icon: Icon, label, value, colorCls }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 bg-card/60 backdrop-blur-sm ${colorCls}`}>
      <div className="p-2 rounded-lg bg-white/[0.05]">
        <Icon className="w-5 h-5 stroke-[1.5]" />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default function Comercial() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [proposals, setProposals] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [tab, setTab] = useState("propostas");
  const [proposalDrawer, setProposalDrawer] = useState({ open: false, record: null });
  const [contractDrawer, setContractDrawer] = useState({ open: false, record: null });

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
  const mesLabel   = format(now, "MMMM 'de' yyyy", { locale: ptBR });

  const proposalsMes = proposals.filter(p => {
    const d = new Date(p.created_date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalMes    = proposalsMes.length;
  const aprovadas   = proposalsMes.filter(p => p.status === "Aprovada").length;
  const pendentes   = proposalsMes.filter(p => p.status === "Pendente").length;
  const conversao   = totalMes > 0 ? Math.round((aprovadas / totalMes) * 100) : 0;

  // ── Contracts grouped by tipo ──
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

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">📝 Comercial</h1>
            <p className="text-sm text-muted-foreground mt-1">Dashboard do mês: <span className="text-foreground capitalize">{mesLabel}</span></p>
          </div>
          <Button size="sm" onClick={() => tab === "propostas" ? setProposalDrawer({ open: true, record: null }) : setContractDrawer({ open: true, record: null })} className="gap-2">
            <Plus className="w-4 h-4" />
            {tab === "propostas" ? "Nova Proposta" : "Novo Contrato"}
          </Button>
        </div>

        {/* ── Mini-Cards (mês atual) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MiniCard icon={FileText}     label="Total de Propostas (Mês)" value={totalMes}         colorCls="border-violet-500/30 text-violet-400" />
          <MiniCard icon={CheckCircle2} label="Aprovadas"                value={aprovadas}         colorCls="border-green-500/30 text-green-400" />
          <MiniCard icon={Clock}        label="Pendentes"                 value={pendentes}         colorCls="border-amber-500/30 text-amber-400" />
          <MiniCard icon={TrendingUp}   label="Taxa de Conversão"         value={`${conversao}%`}  colorCls="border-sky-500/30 text-sky-400" />
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
            {proposals.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma proposta cadastrada ainda.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={() => setProposalDrawer({ open: true, record: null })}>
                  <Plus className="w-4 h-4 mr-1" /> Criar primeira proposta
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-secondary/30">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor Total</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {proposals.map((p, idx) => (
                      <tr key={p.id} className={`border-b border-border/30 hover:bg-secondary/20 transition-colors ${idx % 2 === 1 ? "bg-secondary/10" : ""}`}>
                        <td className="px-4 py-3 font-medium text-foreground">{p.titulo}</td>
                        <td className="px-4 py-3 text-muted-foreground">{getClientName(p.client_id)}</td>
                        <td className="px-4 py-3 text-foreground">{formatBRL(p.valor_total)}</td>
                        <td className="px-4 py-3">
                          <StatusChip status={p.status} map={PROPOSAL_STATUS} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setProposalDrawer({ open: true, record: p })}>Editar</Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteProposal(p)}>
                              <XCircle className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                {/* Recorrentes */}
                {recorrentes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
                      Recorrentes ({recorrentes.length})
                    </h3>
                    <ContractTable rows={recorrentes} clients={clients} onEdit={r => setContractDrawer({ open: true, record: r })} onDelete={handleDeleteContract} />
                  </div>
                )}
                {/* Avulsos */}
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

      <ProposalDrawer
        open={proposalDrawer.open}
        onClose={() => setProposalDrawer({ open: false, record: null })}
        record={proposalDrawer.record}
        tenantId={tenantId}
        clients={clients}
        onSaved={loadAll}
      />

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
            <tr key={r.id} className={`border-b border-border/30 hover:bg-secondary/20 transition-colors ${idx % 2 === 1 ? "bg-secondary/10" : ""}`}>
              <td className="px-4 py-3 font-medium text-foreground">{r.titulo}</td>
              <td className="px-4 py-3 text-muted-foreground">{getClientName(r.client_id)}</td>
              <td className="px-4 py-3 text-foreground">{r.valor ? formatBRL(r.valor) : "—"}</td>
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
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onEdit(r)}>Editar</Button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(r)}>
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