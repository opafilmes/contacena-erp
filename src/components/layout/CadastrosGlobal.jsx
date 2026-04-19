import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { BookOpen, Users, Truck, Tag, Building2, ChevronDown } from "lucide-react";
import CadastrosListModal from "@/components/cadastros/CadastrosListModal";

export default function CadastrosGlobal({ tenantId }) {
  const [openModal, setOpenModal] = useState(null); // "cliente" | "fornecedor" | "categoria" | "conta"

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
          <DropdownMenuItem onClick={() => setOpenModal("cliente")} className="cursor-pointer gap-2">
            <Users className="w-4 h-4 text-sky-400" /> Clientes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("fornecedor")} className="cursor-pointer gap-2">
            <Truck className="w-4 h-4 text-amber-400" /> Fornecedores
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenModal("categoria")} className="cursor-pointer gap-2">
            <Tag className="w-4 h-4 text-violet-400" /> Categorias Financeiras
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenModal("conta")} className="cursor-pointer gap-2">
            <Building2 className="w-4 h-4 text-green-400" /> Contas Bancárias
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CadastrosListModal
        type={openModal}
        open={!!openModal}
        onClose={() => setOpenModal(null)}
        tenantId={tenantId}
      />
    </>
  );
}