import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth } from "date-fns";
import BackButton from "@/components/shared/BackButton";
import DataTable from "@/components/shared/DataTable";
import StatusPill from "@/components/financeiro/StatusPill";
import AccountReceivableDrawer from "@/components/financeiro/AccountReceivableDrawer";
import AccountPayableDrawer from "@/components/financeiro/AccountPayableDrawer";
import BankAccountDrawer from "@/components/financeiro/BankAccountDrawer";
import CategoryDrawer from "@/components/financeiro/CategoryDrawer";
import ExtratoConsolidado from "@/components/financeiro/ExtratoConsolidado";
import FinancialFilters from "@/components/financeiro/FinancialFilters";
import OFXImport from "@/components/financeiro/OFXImport";
import CentralDeConciliacao from "@/components/financeiro/CentralDeConciliacao";
import RelatoriosFinanceiros from "@/components/financeiro/RelatoriosFinanceiros";
import { formatBRL } from "@/utils/format";
import { ArrowUpCircle, ArrowDownCircle, Wallet } from "lucide-react";

const now = new Date();
const MONTH_FILTERS = {
  dateFrom: format(startOfMonth(now), "yyyy-MM-dd"),
  dateTo: format(endOfMonth(now), "yyyy-MM-dd"),
  tipo: "", accountId: "", categoryId: "", status: ""
};

function SummaryCard({ label, value, icon: Icon, colorClass }) {
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-border/30 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
        <p className="font-heading font-bold text-lg text-foreground">{formatBRL(value)}</p>
      </div>
    </div>
  );
}

export default function Financeiro() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState(MONTH_FILTERS);

  const [receivableDrawer, setReceivableDrawer] = useState({ open: false, record: null });
  const [payableDrawer, setPayableDrawer] = useState({ open: false, record: null });

  const load = useCallback(async (entity, setter, key = "inquilino_id") => {
    if (!tenantId) return;
    const data = await base44.entities[entity].filter({ [key]: tenantId });
    setter(data);
  }, [tenantId]);

  const loadAll = useCallback(() => {
    load("AccountReceivable", setReceivables);
    load("AccountPayable", setPayables);
    load("BankAccount", setBankAccounts);
    load("FinancialCategory", setCategories);
    load("Client", setClients, "tenant_id");
    load("Supplier", setSuppliers, "tenant_id");
    load("Job", setJobs, "tenant_id");
  }, [load]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Reactive dashboard calculations based on active filters
  const applyCommonFilters = (list) => {
    let r = list;
    if (filters.dateFrom) r = r.filter(e => e.data_vencimento && e.data_vencimento >= filters.dateFrom);
    if (filters.dateTo)   r = r.filter(e => e.data_vencimento && e.data_vencimento <= filters.dateTo);
    if (filters.categoryId) r = r.filter(e => e.category_id === filters.categoryId);
    if (filters.status) r = r.filter(e => e.status === filters.status);
    if (filters.accountId) r = r.filter(e => e.bank_account_id === filters.accountId);
    return r;
  };

  const filteredReceivables = useMemo(() => {
    if (filters.tipo === "Despesa") return [];
    return applyCommonFilters(receivables);
  }, [receivables, filters]);

  const filteredPayables = useMemo(() => {
    if (filters.tipo === "Receita") return [];
    return applyCommonFilters(payables);
  }, [payables, filters]);

  const totalReceber = useMemo(() =>
    filteredReceivables.filter(r => r.status !== "Recebido").reduce((s, r) => s + (r.valor || 0), 0),
    [filteredReceivables]);

  const totalPagar = useMemo(() =>
    filteredPayables.filter(p => p.status !== "Pago").reduce((s, p) => s + (p.valor || 0), 0),
    [filteredPayables]);

  const saldo = totalReceber - totalPagar;

  // Lookup helpers
  const getCategoryName = (id) => categories.find(c => c.id === id)?.nome || "—";
  const getClientName = (id) => clients.find(c => c.id === id)?.nome_fantasia || "—";
  const getSupplierName = (id) => suppliers.find(s => s.id === id)?.nome || "—";
  const getJobName = (id) => jobs.find(j => j.id === id)?.titulo || "—";

  const receivableCols = [
    { key: "descricao", label: "Descrição", sortable: true },
    { key: "client_id", label: "Cliente", render: row => getClientName(row.client_id), sortable: true, sortValue: row => getClientName(row.client_id) },
    { key: "job_id", label: "Job", render: row => getJobName(row.job_id) },
    { key: "valor", label: "Valor", sortable: true, render: row => <span className="text-green-400 font-medium">{formatBRL(row.valor)}</span> },
    { key: "data_vencimento", label: "Vencimento", sortable: true, render: row => row.data_vencimento ? format(new Date(row.data_vencimento), "dd/MM/yyyy") : "—" },
    { key: "status", label: "Status", sortable: true, render: row => <StatusPill status={row.status} /> },
  ];

  const payableCols = [
    { key: "descricao", label: "Descrição", sortable: true },
    { key: "supplier_id", label: "Fornecedor", render: row => getSupplierName(row.supplier_id), sortable: true, sortValue: row => getSupplierName(row.supplier_id) },
    { key: "category_id", label: "Categoria", render: row => getCategoryName(row.category_id), sortable: true, sortValue: row => getCategoryName(row.category_id) },
    { key: "valor", label: "Valor", sortable: true, render: row => <span className="text-red-400 font-medium">{formatBRL(row.valor)}</span> },
    { key: "data_vencimento", label: "Vencimento", sortable: true, render: row => row.data_vencimento ? format(new Date(row.data_vencimento), "dd/MM/yyyy") : "—" },
    { key: "status", label: "Status", sortable: true, render: row => <StatusPill status={row.status} /> },
  ];



  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton />
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">💰 Financeiro</h1>
          <OFXImport
            tenantId={tenantId}
            bankAccounts={bankAccounts}
            onImported={loadAll}
          />
        </div>

        {/* Reactive Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <SummaryCard label="A Receber" value={totalReceber} icon={ArrowUpCircle} colorClass="bg-green-500/15 text-green-400" />
          <SummaryCard label="A Pagar" value={totalPagar} icon={ArrowDownCircle} colorClass="bg-red-500/15 text-red-400" />
          <SummaryCard label="Saldo Projetado" value={saldo} icon={Wallet} colorClass={saldo >= 0 ? "bg-violet-500/15 text-violet-400" : "bg-amber-500/15 text-amber-400"} />
        </div>

        <Tabs defaultValue="relatorios">
          <TabsList className="mb-4 bg-muted/50 border border-border/50 flex-wrap h-auto gap-1">
            <TabsTrigger value="relatorios">📊 Relatórios</TabsTrigger>
            <TabsTrigger value="extrato">Extrato</TabsTrigger>
            <TabsTrigger value="receber">A Receber</TabsTrigger>
            <TabsTrigger value="pagar">A Pagar</TabsTrigger>
            <TabsTrigger value="conciliacao" className="data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-300">
              ⚡ Central de Conciliação
              {receivables.filter(r => r.status === "Aguardando Conciliação").length + payables.filter(p => p.status === "Aguardando Conciliação").length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 text-[10px] font-bold">
                  {receivables.filter(r => r.status === "Aguardando Conciliação").length + payables.filter(p => p.status === "Aguardando Conciliação").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* FILTROS — abaixo do menu, acima do conteúdo */}
          <FinancialFilters
            filters={filters}
            setFilters={setFilters}
            bankAccounts={bankAccounts}
            categories={categories}
          />

          {/* EXTRATO CONSOLIDADO */}
          <TabsContent value="extrato">
            <ExtratoConsolidado
              receivables={receivables}
              payables={payables}
              filters={filters}
              onConciliar={(entry) => {
                if (entry._kind === "receber") setReceivableDrawer({ open: true, record: entry });
                else setPayableDrawer({ open: true, record: entry });
              }}
            />
          </TabsContent>

          {/* A RECEBER */}
          <TabsContent value="receber">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{filteredReceivables.length} lançamento(s)</p>
              <Button size="sm" onClick={() => setReceivableDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Nova Receita
              </Button>
            </div>
            <DataTable
              columns={receivableCols}
              rows={filteredReceivables}
              searchValue={filters.search}
              onEdit={row => setReceivableDrawer({ open: true, record: row })}
              onDelete={async row => { await base44.entities.AccountReceivable.delete(row.id); load("AccountReceivable", setReceivables); }}
              emptyMessage="Nenhuma conta a receber."
            />
          </TabsContent>

          {/* A PAGAR */}
          <TabsContent value="pagar">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{filteredPayables.length} lançamento(s)</p>
              <Button size="sm" onClick={() => setPayableDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Nova Despesa
              </Button>
            </div>
            <DataTable
              columns={payableCols}
              rows={filteredPayables}
              searchValue={filters.search}
              onEdit={row => setPayableDrawer({ open: true, record: row })}
              onDelete={async row => { await base44.entities.AccountPayable.delete(row.id); load("AccountPayable", setPayables); }}
              emptyMessage="Nenhuma conta a pagar."
            />
          </TabsContent>

          {/* RELATÓRIOS */}
          <TabsContent value="relatorios">
            <RelatoriosFinanceiros
              receivables={receivables}
              payables={payables}
              categories={categories}
              clients={clients}
            />
          </TabsContent>

          {/* CENTRAL DE CONCILIAÇÃO */}
          <TabsContent value="conciliacao">
            <CentralDeConciliacao
              staging={[
                ...receivables.filter(r => r.status === "Aguardando Conciliação").map(r => ({ ...r, type: "receber" })),
                ...payables.filter(p => p.status === "Aguardando Conciliação").map(p => ({ ...p, type: "pagar" })),
              ]}
              receivables={receivables}
              payables={payables}
              tenantId={tenantId}
              onRefresh={loadAll}
              categories={categories}
              clients={clients}
              suppliers={suppliers}
              jobs={jobs}
              bankAccounts={bankAccounts}
            />
          </TabsContent>

        </Tabs>
      </motion.div>

      <AccountReceivableDrawer
        open={receivableDrawer.open}
        onClose={() => setReceivableDrawer({ open: false, record: null })}
        record={receivableDrawer.record}
        tenantId={tenantId}
        categories={categories}
        clients={clients}
        jobs={jobs}
        bankAccounts={bankAccounts}
        onSaved={() => { load("AccountReceivable", setReceivables); load("Client", setClients, "tenant_id"); load("FinancialCategory", setCategories); }}
      />
      <AccountPayableDrawer
        open={payableDrawer.open}
        onClose={() => setPayableDrawer({ open: false, record: null })}
        record={payableDrawer.record}
        tenantId={tenantId}
        categories={categories}
        suppliers={suppliers}
        bankAccounts={bankAccounts}
        onSaved={() => { load("AccountPayable", setPayables); load("Supplier", setSuppliers, "tenant_id"); load("FinancialCategory", setCategories); }}
      />

    </div>
  );
}