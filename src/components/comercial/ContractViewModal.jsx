import React from "react";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { formatBRL } from "@/utils/format";

export default function ContractViewModal({ contract, client, tenant, onClose }) {
  if (!contract) return null;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-4">
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 my-auto">
        {/* Header UI */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-border/30 bg-secondary/20 rounded-t-2xl">
          <h2 className="font-heading font-bold text-lg truncate">{contract.titulo}</h2>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={handlePrint}>
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </Button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo imprimível */}
        <div className="p-8" id="print-container">
          {/* Cabeçalho do documento — dados da empresa */}
          <div className="flex items-start gap-3 pb-4 border-b border-border/30 print:border-gray-200">
            <div>
              {tenant?.logo && (
                <img src={tenant.logo} alt="logo" style={{ maxHeight: 50, maxWidth: 140 }} className="object-contain mb-1" />
              )}
              <p className="font-bold text-sm print:text-black">{tenant?.razao_social || tenant?.nome_fantasia}</p>
              {tenant?.cnpj && <p className="text-xs text-muted-foreground print:text-gray-600">CNPJ: {tenant.cnpj}</p>}
              {tenant?.email_corporativo && <p className="text-xs text-muted-foreground print:text-gray-600">{tenant.email_corporativo}</p>}
              {tenant?.telefone && <p className="text-xs text-muted-foreground print:text-gray-600">{tenant.telefone}</p>}
            </div>
          </div>

          {/* Título do contrato — centralizado abaixo do cabeçalho */}
          <div className="text-center mt-8 mb-8">
            <h1 className="font-heading font-bold text-xl uppercase tracking-widest text-foreground print:text-black">
              {contract.titulo}
            </h1>
            {contract.data_inicio && (
              <p className="text-xs text-muted-foreground print:text-gray-500 mt-1">
                Início: {format(new Date(contract.data_inicio), "dd/MM/yyyy")}
              </p>
            )}
          </div>

          {/* Corpo do contrato */}
          {contract.corpo_contrato ? (
            <div
              className="prose prose-sm max-w-none text-foreground print:text-black [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_hr]:border-gray-200 [&_p]:text-sm [&_li]:text-sm"
              dangerouslySetInnerHTML={{ __html: contract.corpo_contrato }}
            />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum corpo de contrato cadastrado.</p>
          )}

          {/* Rodapé fixo */}
          <div className="print-footer-fixed hidden print:block">
            <p className="text-[9px] text-gray-400">Contrato gerado pelo sistema ContaCena ERP</p>
          </div>
        </div>
      </div>
    </div>
  );
}