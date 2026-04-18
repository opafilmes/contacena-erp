import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";
import { motion } from "framer-motion";
import DataTable from "@/components/shared/DataTable";
import ClientDrawer from "@/components/cadastros/ClientDrawer";
import SupplierDrawer from "@/components/cadastros/SupplierDrawer";
import CrewDrawer from "@/components/cadastros/CrewDrawer";
import CategoryDrawer from "@/components/financeiro/CategoryDrawer";
import BankAccountDrawer from "@/components/financeiro/BankAccountDrawer";
import { formatBRL } from "@/utils/format";

const PLANOS_AVANCADOS = ["Financeiro", "Profissional"];

function LockedTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
      <Lock className="w-8 h-8 opacity-40" />
      <p className="text-sm">A aba <strong>{label}</strong> está disponível nos planos Financeiro e Profissional.</p>
    </div>
  );
}

export default function Diretorio() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;
  const plano = tenant?.plano_assinatura || "Básico";
  const isAvancado = PLANOS_AVANCADOS.includes(plano);

  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [crew, setCrew] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);

  const [clientDrawer, setClientDrawer] = useState({ open: false, record: null });
  const [supplierDrawer, setSupplierDrawer] = useState({ open: false, record: null });
  const [crewDrawer, setCrewDrawer] = useState({ open: false, record: null });
  const [categoryDrawer, setCategoryDrawer] = useState({ open: false, record: null });
  const [bankDrawer, setBankDrawer] = useState({ open: false, record: null });

  const loadClients = useCallback(async () => {
    if (!tenantId) return;
    setClients(await base44.entities.Client.filter({ tenant_id: tenantId }));
  }, [tenantId]);

  const loadSuppliers = useCallback(async () => {
    if (!tenantId || !isAvancado) return;
    setSuppliers(await base44.entities.Supplier.filter({ tenant_id: tenantId }));
  }, [tenantId, isAvancado]);

  const loadCrew = useCallback(async () => {
    if (!tenantId || !isAvancado) return;
    setCrew(await base44.entities.Crew.filter({ tenant_id: tenantId }));
  }, [tenantId, isAvancado]);

  const loadCategories = useCallback(async () => {
    if (!tenantId || !isAvancado) return;
    setCategories(await base44.entities.FinancialCategory.filter({ inquilino_id: tenantId }));
  }, [tenantId, isAvancado]);

  const loadBankAccounts = useCallback(async () => {
    if (!tenantId || !isAvancado) return;
    setBankAccounts(await base44.entities.BankAccount.filter({ inquilino_id: tenantId }));
  }, [tenantId, isAvancado]);

  useEffect(() => {
    loadClients();
    loadSuppliers();
    loadCrew();
    loadCategories();
    loadBankAccounts();
  }, [loadClients, loadSuppliers, loadCrew, loadCategories, loadBankAccounts]);

  const handleDelete = async (entity, row, reload) => {
    await base44.entities[entity].delete(row.id);
    reload();
  };

  const clientCols = [
    { key: "nome_fantasia", label: "Nome / Marca" },
    { key: "cnpj_cpf", label: "CNPJ / CPF" },
    { key: "contato", label: "Contato" },
  ];
  const supplierCols = [
    { key: "nome", label: "Nome" },
    { key: "categoria", label: "Categoria" },
    { key: "telefone", label: "Telefone" },
  ];
  const crewCols = [
    { key: "nome", label: "Nome" },
    { key: "funcao", label: "Função" },
    { key: "cache_padrao", label: "Cachê Padrão", render: row => formatBRL(row.cache_padrao) },
  ];
  const categoryCols = [
    { key: "nome", label: "Nome" },
    { key: "tipo", label: "Tipo" },
  ];
  const bankCols = [
    { key: "nome_conta", label: "Conta" },
    { key: "saldo_inicial", label: "Saldo Inicial", render: row => formatBRL(row.saldo_inicial) },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight mb-2">
          Diretório
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Gerencie clientes, equipe, fornecedores e configurações financeiras.
        </p>

        <Tabs defaultValue="clientes">
          <TabsList className="mb-6 bg-muted/50 border border-border/50">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="fornecedores">
              Fornecedores {!isAvancado && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </TabsTrigger>
            <TabsTrigger value="equipe">
              Equipe {!isAvancado && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </TabsTrigger>
            <TabsTrigger value="categorias">
              Categorias {!isAvancado && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </TabsTrigger>
            <TabsTrigger value="contas">
              Contas Bancárias {!isAvancado && <Lock className="w-3 h-3 ml-1 opacity-50" />}
            </TabsTrigger>
          </TabsList>

          {/* CLIENTES */}
          <TabsContent value="clientes">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{clients.length} registro(s)</p>
              <Button size="sm" onClick={() => setClientDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Novo Cliente
              </Button>
            </div>
            <DataTable columns={clientCols} rows={clients}
              onEdit={row => setClientDrawer({ open: true, record: row })}
              onDelete={row => handleDelete("Client", row, loadClients)}
              emptyMessage="Nenhum cliente cadastrado ainda." />
          </TabsContent>

          {/* FORNECEDORES */}
          <TabsContent value="fornecedores">
            {!isAvancado ? <LockedTab label="Fornecedores" /> : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground text-sm">{suppliers.length} registro(s)</p>
                  <Button size="sm" onClick={() => setSupplierDrawer({ open: true, record: null })}>
                    <Plus className="w-4 h-4 mr-1" /> Novo Fornecedor
                  </Button>
                </div>
                <DataTable columns={supplierCols} rows={suppliers}
                  onEdit={row => setSupplierDrawer({ open: true, record: row })}
                  onDelete={row => handleDelete("Supplier", row, loadSuppliers)}
                  emptyMessage="Nenhum fornecedor cadastrado ainda." />
              </>
            )}
          </TabsContent>

          {/* EQUIPE */}
          <TabsContent value="equipe">
            {!isAvancado ? <LockedTab label="Equipe" /> : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground text-sm">{crew.length} registro(s)</p>
                  <Button size="sm" onClick={() => setCrewDrawer({ open: true, record: null })}>
                    <Plus className="w-4 h-4 mr-1" /> Novo Membro
                  </Button>
                </div>
                <DataTable columns={crewCols} rows={crew}
                  onEdit={row => setCrewDrawer({ open: true, record: row })}
                  onDelete={row => handleDelete("Crew", row, loadCrew)}
                  emptyMessage="Nenhum membro de equipe cadastrado ainda." />
              </>
            )}
          </TabsContent>

          {/* CATEGORIAS */}
          <TabsContent value="categorias">
            {!isAvancado ? <LockedTab label="Categorias" /> : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground text-sm">{categories.length} registro(s)</p>
                  <Button size="sm" onClick={() => setCategoryDrawer({ open: true, record: null })}>
                    <Plus className="w-4 h-4 mr-1" /> Nova Categoria
                  </Button>
                </div>
                <DataTable columns={categoryCols} rows={categories}
                  onEdit={row => setCategoryDrawer({ open: true, record: row })}
                  onDelete={row => handleDelete("FinancialCategory", row, loadCategories)}
                  emptyMessage="Nenhuma categoria cadastrada ainda." />
              </>
            )}
          </TabsContent>

          {/* CONTAS BANCÁRIAS */}
          <TabsContent value="contas">
            {!isAvancado ? <LockedTab label="Contas Bancárias" /> : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-muted-foreground text-sm">{bankAccounts.length} registro(s)</p>
                  <Button size="sm" onClick={() => setBankDrawer({ open: true, record: null })}>
                    <Plus className="w-4 h-4 mr-1" /> Nova Conta
                  </Button>
                </div>
                <DataTable columns={bankCols} rows={bankAccounts}
                  onEdit={row => setBankDrawer({ open: true, record: row })}
                  onDelete={row => handleDelete("BankAccount", row, loadBankAccounts)}
                  emptyMessage="Nenhuma conta bancária cadastrada ainda." />
              </>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <ClientDrawer open={clientDrawer.open} onClose={() => setClientDrawer({ open: false, record: null })}
        record={clientDrawer.record} tenantId={tenantId} onSaved={loadClients} />
      <SupplierDrawer open={supplierDrawer.open} onClose={() => setSupplierDrawer({ open: false, record: null })}
        record={supplierDrawer.record} tenantId={tenantId} onSaved={loadSuppliers} />
      <CrewDrawer open={crewDrawer.open} onClose={() => setCrewDrawer({ open: false, record: null })}
        record={crewDrawer.record} tenantId={tenantId} onSaved={loadCrew} />
      <CategoryDrawer open={categoryDrawer.open} onClose={() => setCategoryDrawer({ open: false, record: null })}
        record={categoryDrawer.record} tenantId={tenantId} onSaved={loadCategories} />
      <BankAccountDrawer open={bankDrawer.open} onClose={() => setBankDrawer({ open: false, record: null })}
        record={bankDrawer.record} tenantId={tenantId} onSaved={loadBankAccounts} />
    </div>
  );
}