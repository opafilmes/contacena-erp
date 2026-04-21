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

const CONFIG = {
  cliente: { title: "Clientes", entity: "Client", filterKey: "tenant_id", columns: [{ key: "nome_fantasia", label: "Nome" }, { key: "cnpj_cpf", label: "CNPJ/CPF" }, { key: "contato", label: "Contato" }, { key: "cidade", label: "Cidade" }], searchField: "nome_fantasia" },
  fornecedor: { title: "Fornecedores", entity: "Supplier", filterKey: "tenant_id", columns: [{ key: "nome", label: "Nome" }, { key: "cnpj_cpf", label: "CNPJ/CPF" }, { key: "telefone", label: "Telefone" }, { key: "cidade", label: "Cidade" }], searchField: "nome" },
  categoria: { title: "Categorias Financeiras", entity: "FinancialCategory", filterKey: "inquilino_id", columns: [{ key: "nome", label: "Nome" }, { key: "tipo", label: "Tipo" }], searchField: "nome" },
  conta: { title: "Contas Bancárias", entity: "BankAccount", filterKey: "inquilino_id", columns: [{ key: "nome_conta", label: "Nome da Conta" }, { key: "saldo_inicial", label: "Saldo Inicial", render: r => formatBRL(r.saldo_inicial) }], searchField: "nome_conta" },
};

function DrawerSwitch({ type, open, onClose, record, tenantId, onSaved }) {
  if (!open) return null;
  const props = { open, onClose, record, tenantId, onSaved };
  if (type === "cliente") return <ClientDrawer {...props} />;
  if (type === "fornecedor") return <SupplierDrawer {...props} />;
  if (type === "categoria") return <CategoryDrawer {...props} />;
  if (type === "conta") return <BankAccountDrawer {...props} />;
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
    const data = await base44.entities[cfg.entity].filter({ [cfg.filterKey]: tenantId });
    setRows(data || []);
    setLoading(false);
  }, [type, tenantId, cfg]);

  useEffect(() => {
    if (open) { setSearch(""); load(); }
  }, [open, load]);

  // --- SOLUÇÃO DEFINITIVA: CLEANUP EFFECT ---
  useEffect(() => {
    // Esta função limpa o "lixo" deixado pelo Modal no Body do HTML
    const forceCleanup = () => {
      document.body.style.pointerEvents = "";
      document.body.style.overflow = "";
      document.body.removeAttribute("data-scroll-locked");
      // Remove overlays órfãos que o Radix possa ter esquecido
      const overlays = document.querySelectorAll('[data-radix-focus-guard], [class*="fixed inset-0"]');
      if (!open) {
         overlays.forEach(el => {
           if (el.getAttribute('data-aria-hidden') === 'true' || el.classList.contains('bg-black/80')) {
             el.remove();
           }
         });
      }
    };

    if (!open) {
      forceCleanup();
    }

    return () => forceCleanup(); // Limpa ao desmontar o componente
  }, [open]);

  const handleClose = (val) => {
    if (!val) onClose();
  };

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
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-xl border-border/50">
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

          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhum registro encontrado.</div>
          ) : (
            <div className="rounded-xl border border-border/40 overflow-hidden max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-secondary/30">
                  <tr className="border-b border-border/40">
                    {cfg.columns.map(col => (
                      <th key={col.key} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">{col.label}</th>
                    ))}
                    <th className="px-4 py-2.5 w-20" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={row.id} className={`border-b border-border/20 hover:bg-white/[0.03] transition-colors ${i % 2 === 1 ? "bg-secondary/10" : ""}`}>
                      {cfg.columns.map(col => (
                        <td key={col.key} className="px-4 py-3 text-foreground/85">{col.render ? col.render(row) : row[col.key] ?? "—"}</td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setEditing(row); setDrawerOpen(true); }} className="p-1.5 mr-1 rounded-lg hover:bg-secondary/60 text-muted-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(row)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DrawerSwitch
        type={type}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        record={editing}
        tenantId={tenantId}
        onSaved={() => { setDrawerOpen(false); load(); }}
      />
    </>
  );
}