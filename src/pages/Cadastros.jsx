import React, { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import BackButton from "@/components/shared/BackButton";
import DataTable from "@/components/shared/DataTable";
import ClientDrawer from "@/components/cadastros/ClientDrawer";
import SupplierDrawer from "@/components/cadastros/SupplierDrawer";
import CrewDrawer from "@/components/cadastros/CrewDrawer";
import { formatBRL } from "@/utils/format";

export default function Cadastros() {
  const { tenant } = useOutletContext();
  const tenantId = tenant?.id;

  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [crew, setCrew] = useState([]);

  const [clientDrawer, setClientDrawer] = useState({ open: false, record: null });
  const [supplierDrawer, setSupplierDrawer] = useState({ open: false, record: null });
  const [crewDrawer, setCrewDrawer] = useState({ open: false, record: null });

  const loadClients = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Client.filter({ tenant_id: tenantId });
    setClients(data);
  }, [tenantId]);

  const loadSuppliers = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Supplier.filter({ tenant_id: tenantId });
    setSuppliers(data);
  }, [tenantId]);

  const loadCrew = useCallback(async () => {
    if (!tenantId) return;
    const data = await base44.entities.Crew.filter({ tenant_id: tenantId });
    setCrew(data);
  }, [tenantId]);

  useEffect(() => {
    loadClients();
    loadSuppliers();
    loadCrew();
  }, [loadClients, loadSuppliers, loadCrew]);

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

  return (
    <div className="min-h-[calc(100vh-4rem)] px-6 py-10 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <BackButton />
        <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight mb-8">
          🗂️ Cadastros
        </h1>

        <Tabs defaultValue="clientes">
          <TabsList className="mb-6 bg-muted/50 border border-border/50">
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
            <TabsTrigger value="equipe">Equipe</TabsTrigger>
          </TabsList>

          {/* CLIENTES */}
          <TabsContent value="clientes">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{clients.length} registro(s)</p>
              <Button size="sm" onClick={() => setClientDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Novo Cliente
              </Button>
            </div>
            <DataTable
              columns={clientCols}
              rows={clients}
              onEdit={row => setClientDrawer({ open: true, record: row })}
              onDelete={row => handleDelete("Client", row, loadClients)}
              emptyMessage="Nenhum cliente cadastrado ainda."
            />
          </TabsContent>

          {/* FORNECEDORES */}
          <TabsContent value="fornecedores">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{suppliers.length} registro(s)</p>
              <Button size="sm" onClick={() => setSupplierDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Novo Fornecedor
              </Button>
            </div>
            <DataTable
              columns={supplierCols}
              rows={suppliers}
              onEdit={row => setSupplierDrawer({ open: true, record: row })}
              onDelete={row => handleDelete("Supplier", row, loadSuppliers)}
              emptyMessage="Nenhum fornecedor cadastrado ainda."
            />
          </TabsContent>

          {/* EQUIPE */}
          <TabsContent value="equipe">
            <div className="flex justify-between items-center mb-4">
              <p className="text-muted-foreground text-sm">{crew.length} registro(s)</p>
              <Button size="sm" onClick={() => setCrewDrawer({ open: true, record: null })}>
                <Plus className="w-4 h-4 mr-1" /> Novo Membro
              </Button>
            </div>
            <DataTable
              columns={crewCols}
              rows={crew}
              onEdit={row => setCrewDrawer({ open: true, record: row })}
              onDelete={row => handleDelete("Crew", row, loadCrew)}
              emptyMessage="Nenhum membro de equipe cadastrado ainda."
            />
          </TabsContent>
        </Tabs>
      </motion.div>

      <ClientDrawer
        open={clientDrawer.open}
        onClose={() => setClientDrawer({ open: false, record: null })}
        record={clientDrawer.record}
        tenantId={tenantId}
        onSaved={loadClients}
      />
      <SupplierDrawer
        open={supplierDrawer.open}
        onClose={() => setSupplierDrawer({ open: false, record: null })}
        record={supplierDrawer.record}
        tenantId={tenantId}
        onSaved={loadSuppliers}
      />
      <CrewDrawer
        open={crewDrawer.open}
        onClose={() => setCrewDrawer({ open: false, record: null })}
        record={crewDrawer.record}
        tenantId={tenantId}
        onSaved={loadCrew}
      />
    </div>
  );
}