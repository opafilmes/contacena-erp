import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { BookOpen, Users, Truck, Tag, Building2, ChevronDown } from "lucide-react";
import ClientDrawer from "@/components/cadastros/ClientDrawer";
import SupplierDrawer from "@/components/cadastros/SupplierDrawer";
import CategoryDrawer from "@/components/financeiro/CategoryDrawer";
import BankAccountDrawer from "@/components/financeiro/BankAccountDrawer";
import { base44 } from "@/api/base44Client";

export default function CadastrosGlobal({ tenantId }) {
  const [open, setOpen] = useState(null); // "cliente" | "fornecedor" | "categoria" | "conta"

  const handleSaved = () => setOpen(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-border/60 text-muted-foreground hover:text-foreground">
            <BookOpen className="w-3.5 h-3.5" />
            Cadastros
            <ChevronDown className="w-3 h-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-popover/95 backdrop-blur-xl border-border/50">
          <DropdownMenuItem onClick={() => setOpen("cliente")} className="cursor-pointer gap-2">
            <Users className="w-4 h-4 text-sky-400" /> Clientes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("fornecedor")} className="cursor-pointer gap-2">
            <Truck className="w-4 h-4 text-amber-400" /> Fornecedores
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen("categoria")} className="cursor-pointer gap-2">
            <Tag className="w-4 h-4 text-violet-400" /> Categorias Financeiras
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen("conta")} className="cursor-pointer gap-2">
            <Building2 className="w-4 h-4 text-green-400" /> Contas Bancárias
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ClientDrawer
        open={open === "cliente"}
        onClose={() => setOpen(null)}
        record={null}
        tenantId={tenantId}
        onSaved={handleSaved}
      />
      <SupplierDrawer
        open={open === "fornecedor"}
        onClose={() => setOpen(null)}
        record={null}
        tenantId={tenantId}
        onSaved={handleSaved}
      />
      <CategoryDrawer
        open={open === "categoria"}
        onClose={() => setOpen(null)}
        record={null}
        tenantId={tenantId}
        onSaved={handleSaved}
      />
      <BankAccountDrawer
        open={open === "conta"}
        onClose={() => setOpen(null)}
        record={null}
        tenantId={tenantId}
        onSaved={handleSaved}
      />
    </>
  );
}