import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { format, isThisMonth } from "date-fns";
import BackButton from "@/components/shared/BackButton";
import DataTable from "@/components/shared/DataTable";
import FinancialSummaryCards from "@/components/financeiro/FinancialSummaryCards";
import StatusPill from "@/components/financeiro/StatusPill";
import AccountReceivableDrawer from "@/components/financeiro/AccountReceivableDrawer";
import AccountPayableDrawer from "@/components/financeiro/AccountPayableDrawer";
import BankAccountDrawer from "@/components/financeiro/BankAccountDrawer";
import CategoryDrawer from "@/components/financeiro/CategoryDrawer";
import { formatBRL } from "@/utils/format";
import { TrendingUp, TrendingDown } from "lucide-react";

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

  const [receivableDrawer, setReceivableDrawer] = useState({ open: false, record: null });
  const [payableDrawer, setPayableDrawer] = useState({ open: false, record: null });
  const [bankDrawer, setBankDrawer] = useState({ open: false, record: null });
  const [categoryDrawer, setCategoryDrawer] = useState({ open: false, record: null });

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

  // Dashboard calculations — filter to current month, exclude paid/received
  const totalReceber = receivables
    .filter(r => r.status !== "Recebido" && isThisMonth(new Date(r.data_vencimento || Date.now())))
    .reduce((s, r) => s + (r.valor || 0), 0);

  const totalPagar = payables
    .filter(p => p.status !== "Pago" && isThisMonth(new Date(p.data_vencimento || Date.now())))
    .reduce((s, p) => s + (p.valor || 0), 0);

  // Lookup helpers
  const getCategoryName = (id) => categories.find(c => c.id === id)?.nome || "—";
  const getClientName = (id) => clients.find(c => c.id === id)?.nome_fantasia || "—";
  const getSupplierName = (id) => suppliers.find(s => s.id === id)?.nome || "—";
  const getJobName = (id) => jobs.find(j => j.id === id)?.titulo || "—";

  // Table columns
  const receivableCols = [
    { key: "descricao", label: "Descrição" },
    { key: "client_id", label: "Cliente", render: row => getClientName(row.client_id) },
    { key: "job_id", label: "Job", render: row => getJobName(row.job_id) },
    { key: "valor", label: "Valor", render: row => <span className="text-green-400 font-medium">{formatBRL(row.valor)}</span> },
    { key: "data_vencimento", label: "Vencimento", render: row => row.data_vencimento ? format(new Date(row.data_vencimento), "dd/MM/yyyy") : "—" },
    { key: "status", label: "Status", render: row => <StatusPill status={row.status} /> },
  ];

  const payableCols = [
    { key: "descricao", label: "Descrição" },
    { key: "supplier_id", label: "Fornecedor", render: row => getSupplierName(row.supplier_id) },
    { key: "category_id", label: "Categoria", render: row => getCategoryName(row.category_id) },
    { key: "valor", label: "Valor", render: row => <span className="text-red-400 font-medium">{formatBRL(row.valor)}</span> },
    { key: "data_vencimento", label: "Vencimento", render: row => row.data_vencimento ? format(new Date(row.data_vencimento), "dd/MM/yyyy") : "—" },
    { key: "status", label: "Status", render: row => <StatusPill status={row.status} /> },
  ];

  const bankCols = [
    { key: "nome_conta", label: "Nome da Conta" },
    { key: "saldo_inicial", label: "Saldo Inicial", render: row => formatBRL(row.saldo_inicial) },
  ];

  const categoryCols = [
    { key: "nome", label: "Nome" },
    {
      key: "tipo", label: "Tipo", render: row => (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${row.tipo === "Receita" ? "text-green-400" : "text-red-400"}`}>
          {row.tipo === "Receita" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {row.tipo}
        </span>
      )
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton />
        <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight mb-8">
          💰 Financeiro
        </h1>

        <FinancialSummaryCards totalReceber={totalReceber} totalPagar={totalPagar} />

        <Tabs defaultValue="receber">
          <TabsList className="mb-6 bg-muted/50 border border-border/50 flex-wrap h-auto gap-1">
            <TabsTrigger value="receber">A Receber</TabsTrigger>
            <TabsTrigger value="pagar">A Pagar</TabsTrigger>
            <TabsTrigger value="contas">Contas Bancárias</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
          </TabsList>

          {/* A RECEBER */}
          <TabsContent value="receber">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{receivables.length} lançamento(s)</p>
              <Button size="sm" onClick={() => setReceivableDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Nova Receita
              </Button>
            </div>
            <DataTable
              columns={receivableCols}
              rows={receivables}
              onEdit={row => setReceivableDrawer({ open: true, record: row })}
              onDelete={async row => { await base44.entities.AccountReceivable.delete(row.id); load("AccountReceivable", setReceivables); }}
              emptyMessage="Nenhuma conta a receber cadastrada."
            />
          </TabsContent>

          {/* A PAGAR */}
          <TabsContent value="pagar">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{payables.length} lançamento(s)</p>
              <Button size="sm" onClick={() => setPayableDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Nova Despesa
              </Button>
            </div>
            <DataTable
              columns={payableCols}
              rows={payables}
              onEdit={row => setPayableDrawer({ open: true, record: row })}
              onDelete={async row => { await base44.entities.AccountPayable.delete(row.id); load("AccountPayable", setPayables); }}
              emptyMessage="Nenhuma conta a pagar cadastrada."
            />
          </TabsContent>

          {/* CONTAS BANCÁRIAS */}
          <TabsContent value="contas">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{bankAccounts.length} conta(s)</p>
              <Button size="sm" onClick={() => setBankDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Nova Conta
              </Button>
            </div>
            <DataTable
              columns={bankCols}
              rows={bankAccounts}
              onEdit={row => setBankDrawer({ open: true, record: row })}
              onDelete={async row => { await base44.entities.BankAccount.delete(row.id); load("BankAccount", setBankAccounts); }}
              emptyMessage="Nenhuma conta bancária cadastrada."
            />
          </TabsContent>

          {/* CATEGORIAS */}
          <TabsContent value="categorias">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{categories.length} categoria(s)</p>
              <Button size="sm" onClick={() => setCategoryDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Nova Categoria
              </Button>
            </div>
            <DataTable
              columns={categoryCols}
              rows={categories}
              onEdit={row => setCategoryDrawer({ open: true, record: row })}
              onDelete={async row => { await base44.entities.FinancialCategory.delete(row.id); load("FinancialCategory", setCategories); }}
              emptyMessage="Nenhuma categoria cadastrada."
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
        onSaved={() => load("AccountReceivable", setReceivables)}
      />
      <AccountPayableDrawer
        open={payableDrawer.open}
        onClose={() => setPayableDrawer({ open: false, record: null })}
        record={payableDrawer.record}
        tenantId={tenantId}
        categories={categories}
        suppliers={suppliers}
        onSaved={() => load("AccountPayable", setPayables)}
      />
      <BankAccountDrawer
        open={bankDrawer.open}
        onClose={() => setBankDrawer({ open: false, record: null })}
        record={bankDrawer.record}
        tenantId={tenantId}
        onSaved={() => load("BankAccount", setBankAccounts)}
      />
      <CategoryDrawer
        open={categoryDrawer.open}
        onClose={() => setCategoryDrawer({ open: false, record: null })}
        record={categoryDrawer.record}
        tenantId={tenantId}
        onSaved={() => load("FinancialCategory", setCategories)}
      />
    </div>
  );
}