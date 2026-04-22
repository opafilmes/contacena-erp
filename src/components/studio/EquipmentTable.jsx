import React, { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2, Wrench, CheckCircle2, Printer } from "lucide-react";

const CATEGORIAS = ["Câmera","Lente","Iluminação","Áudio","Tripé/Suporte","Monitor","Estabilizador","Drone","Acessório","Outros"];
const fmt = (v) => v != null ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v) : "—";

export default function EquipmentTable({ equipments, onEdit, onDelete }) {
  const [filterCat, setFilterCat] = useState("all");
  const [filterMarca, setFilterMarca] = useState("");

  const marcas = [...new Set(equipments.map(e => e.marca).filter(Boolean))];

  const filtered = equipments.filter(e => {
    const catOk  = filterCat === "all" || e.categoria === filterCat;
    const marcaOk = !filterMarca || (e.marca || "").toLowerCase().includes(filterMarca.toLowerCase());
    return catOk && marcaOk;
  });

  const emManutencao = equipments.filter(e => e.status_manutencao);

  const handlePrint = () => window.print();

  if (!equipments || equipments.length === 0) {
    return <div className="text-center py-16 text-muted-foreground text-sm">Nenhum equipamento cadastrado.</div>;
  }

  return (
    <div>
      {/* Stats manutenção */}
      {emManutencao.length > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm text-amber-300">
            <strong>{emManutencao.length}</strong> equipamento{emManutencao.length > 1 ? "s" : ""} em manutenção:{" "}
            {emManutencao.map(e => e.nome_item).join(", ")}
          </span>
        </div>
      )}

      {/* Filtros + Print */}
      <div className="flex flex-wrap items-center gap-3 mb-4 no-print">
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="Categoria..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input
          className="w-40 h-8 text-xs"
          placeholder="Filtrar por marca..."
          value={filterMarca}
          onChange={e => setFilterMarca(e.target.value)}
        />
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 ml-auto h-8 text-xs">
          <Printer className="w-3.5 h-3.5" /> Gerar Relatório
        </Button>
      </div>

      {/* Tabela */}
      <div className="print-area overflow-x-auto">
        <p className="print-title hidden">Relatório de Equipamentos</p>
        <p className="print-subtitle hidden">Gerado em {new Date().toLocaleDateString("pt-BR")}</p>
        <table className="w-full text-sm">
          <thead>
            <tr>
              {["Nome","Marca","Categoria","Nº Série","Qtd","Valor Compra","Status"].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest">{h}</th>
              ))}
              <th className="w-12 no-print" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((eq, i) => (
              <tr key={eq.id || i} className="group hover:bg-white/[0.03] border-t border-border/30 transition-colors">
                <td className="px-4 py-3.5 font-medium text-foreground/90">
                  <div className="flex items-center gap-2">
                    {eq.fotos?.[0] && (
                      <img src={eq.fotos[0]} alt="" className="w-8 h-8 rounded object-cover border border-border/30" />
                    )}
                    {eq.nome_item}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{eq.marca || "—"}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{eq.categoria || "—"}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{eq.num_serie || "—"}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{eq.qtd_total ?? "—"}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{fmt(eq.valor_compra)}</td>
                <td className="px-4 py-3.5">
                  {eq.status_manutencao ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                      <Wrench className="w-3 h-3" /> Manutenção
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Ativo
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 no-print">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary/50 text-muted-foreground transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-popover/95 backdrop-blur-xl border-border/50">
                      <DropdownMenuItem onClick={() => onEdit(eq)} className="cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(eq)} className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">Nenhum equipamento encontrado com estes filtros.</div>
        )}
      </div>
    </div>
  );
}