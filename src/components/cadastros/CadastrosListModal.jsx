import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import ClientDrawer from "@/components/cadastros/ClientDrawer";
import SupplierDrawer from "@/components/cadastros/SupplierDrawer";
import CategoryDrawer from "@/components/financeiro/CategoryDrawer";
import BankAccountDrawer from "@/components/financeiro/BankAccountDrawer";
import { formatBRL } from "@/utils/format";

// ── Configurações por tipo de cadastro ──────────────────────────────
const CONFIG = {
  cliente: {
    title: "Clientes",
    entity: "Client",
    filterKey: "tenant_id",
    columns: [
      { key: "nome_fantasia", label: "Nome" },
      { key: "cnpj_cpf", label: "CNPJ/CPF" },
      { key: "contato", label: "Contato" },
      { key: "cidade", label: "Cidade" },
    ],
    searchField: "nome_fantasia",
  },
  fornecedor: {
    title: "Fornecedores",
    entity: "Supplier",
    filterKey: "tenant_id",
    columns: [
      { key: "nome", label: "Nome" },
      { key: "cnpj_cpf", label: "CNPJ/CPF" },
      { key: "telefone", label: "Telefone" },
      { key: "cidade", label: "Cidade" },
    ],
    searchField: "nome",
  },
  categoria: {
    title: "Categorias Financeiras",
    entity: "FinancialCategory",
    filterKey: "inquilino_id",
    columns: [
      { key: "nome", label: "Nome" },
      { key: "tipo", label: "Tipo" },
    ],
    searchField: "nome",
  },
  conta: {
    title: "Contas Bancárias",
    entity: "BankAccount",
    filterKey: "inquilino_id",
    columns: [
      { key: "nome_conta", label: "Nome da Conta" },
      { key: "saldo_inicial", label: "Saldo Inicial", render: r => formatBRL(r.saldo_inicial) },
    ],
    searchField: "nome_conta",
  },
};

function DrawerSwitch({ type, open, onClose, record, tenantId, onSaved }) {
  if (!open) return null;
  const props = { open, onClose, record, tenantId, onSaved };
  if (type === "cliente")    return <ClientDrawer {...props} />;
  if (type === "fornecedor") return <SupplierDrawer {...props} />;
  if (type === "categoria")  return <CategoryDrawer {...props} />;
  if (type === "conta")      return <BankAccountDrawer {...props} />;
  return null;
}

export default function CadastrosListModal({ type, open, onClose, tenantId }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);

  const cfg = CONFIG[type];

  const load = useCallback(async () => {
    if (!cfg || !tenantId) return;
    setLoading(true);
    try {
      const data = await base44.entities[cfg.entity].filter({ [cfg.filterKey]: tenantId });
      setRows(data || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  }, [type, tenantId, cfg]);

  useEffect(() => {
    if (open) { setSearch(""); load(); }
  }, [open, load]);

  // --- SUPER VACINA CONTRA TELA ESCURA ---
  // Esta função limpa todos os bloqueios que o Radix/shadcn injeta no HTML
  const forceCleanup = useCallback(() => {
    setTimeout(() => {
      document.body.style.pointerEvents = "auto";
      document.body.style.overflow = "auto";
      document.body.style.paddingRight = "0px";
      document.body.removeAttribute("data-scroll-locked");
      document.body.removeAttribute("aria-hidden");
      document.documentElement.style.pointerEvents = "auto";
      
      // Remove elementos de "overlay" que possam ter ficado órfãos
      const overlays = document.querySelectorAll('[data-radix-focus-guard], [class*="fixed inset-0"]');
      overlays.forEach(el => {
        // Se a janela principal está fechada, removemos qualquer fundo escuro que sobrou
        if (!open && !drawerOpen) {
          el.remove();
        }
      });
    }, 300); // Tempo para a animação de saída terminar
  }, [open, drawerOpen]);

  // Monitora o fechamento para disparar a limpeza
  useEffect(() => {
    if (!open || !drawerOpen) {
      forceCleanup();
    }
    return () => forceCleanup();
  }, [open, drawerOpen, forceCleanup]);

  const handleDelete = async (row) => {
    if (!window.confirm("Confirmar exclusão?")) return;
    await base44.entities[cfg.entity].delete(row.id);
    load();
  };

  const filtered = rows.filter(r => {
    const val = r[cfg.searchField] || "";
    return val.toLowerCase().includes(search.toLowerCase());
  });

  if (!cfg) return null;

  return (
    <>
      <Dialog 
        open={open} 
        onOpenChange={(val) => {
          if (!val) {
            onClose();
            forceCleanup();
          }
        }}
      >
        <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-xl border-border/50 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading">{cfg.title}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Buscar ${cfg.title.toLowerCase()}...`}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => { setEditing(null); setDrawerOpen(true); }}>
              <Plus className="w-3.5 h-3.5" /> Novo
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {rows.length === 0 ? "Nenhum registro cadastrado." : "Nenhum resultado para a busca."}
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur-sm">
                    <tr className="border-b border-border/40">
                      {cfg.columns.map(col => (
                        <th key={col.key} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">
                          {col.label}
                        </th>
                      ))}
                      <th className="px-4 py-2.5 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, i) => (
                      <tr key={row.id} className={`border-b border-border/20 last:border-0 hover:bg-white/[0.03] transition-colors ${i % 2 === 1 ? "bg-secondary/10" : ""}`}>
                        {cfg.columns.map(col => (
                          <td key={col.key} className="px-4 py-3 text-foreground/85">
                            {col.render ? col.render(row) : row[col.key] ?? "—"}
                          </td>
                        ))}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => { setEditing(row); setDrawerOpen(true); }}
                              className="p-1.5 rounded-lg hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <DrawerSwitch
        type={type}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          forceCleanup();
        }}
        record={editing}
        tenantId={tenantId}
        onSaved={() => { 
          setDrawerOpen(false); 
          load(); 
          forceCleanup();
        }}
      />
    </>
  );
}