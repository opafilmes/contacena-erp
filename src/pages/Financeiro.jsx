import { useOutletContext, useSearchParams } from "react-router-dom";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, RefreshCw, BarChart3, 
  Plus, UploadCloud, Search, CheckCircle2, AlertCircle, FileText, Calendar, 
  DollarSign, ChevronRight, Download, Filter, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL } from "@/utils/format";
import { toast } from "sonner";

const NAV = [
  { id: "dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { id: "receber", label: "Contas a Receber", icon: ArrowDownToLine, color: "text-emerald-400" },
  { id: "pagar", label: "Contas a Pagar", icon: ArrowUpFromLine, color: "text-red-400" },
  { id: "conciliacao", label: "Conciliação Bancária", icon: RefreshCw, color: "text-sky-400" },
  { id: "inventario", label: "Inventário (Ativos)", icon: Package, color: "text-amber-400" },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
];

export default function Financeiro() {
  const [activeNav, setActiveNav] = useState("dashboard");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* ── SIDEBAR FINANCEIRO ── */}
      <aside className="w-56 border-r border-zinc-800 bg-zinc-950/60 flex flex-col pt-8 px-3 shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 px-3 mb-3">Financeiro</p>
        <nav className="space-y-1">
          {NAV.map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeNav === id
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${activeNav === id ? "text-violet-400" : (color || "text-zinc-500")}`} />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <div className="flex-1 px-8 py-8 overflow-auto bg-zinc-950">
        {activeNav === "dashboard" && <FinanceDashboard />}
        {activeNav === "receber" && <TransactionsList type="receber" />}
        {activeNav === "pagar" && <TransactionsList type="pagar" />}
        {activeNav === "conciliacao" && <BankReconciliation />}
        {activeNav === "inventario" && <InventoryFinanceView />}
        {activeNav === "relatorios" && <ReportsView />}
      </div>
    </div>
  );
}

/* ==========================================================================
   1. DASHBOARD
   ========================================================================== */
function FinanceDashboard() {
  const stats = [
    { label: "Saldo Atual (Contas)", value: 45230.50, color: "text-zinc-100", highlight: false },
    { label: "Receitas Previstas (Mês)", value: 128500.00, color: "text-emerald-400", highlight: true },
    { label: "Despesas Previstas (Mês)", value: 38450.00, color: "text-red-400", highlight: true },
    { label: "Saldo Projetado (Fim do Mês)", value: 135280.50, color: "text-violet-400", highlight: false },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Visão Geral Financeira</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Acompanhamento de fluxo de caixa e saldos.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300">
            <ArrowUpFromLine className="w-4 h-4 mr-2" /> Nova Despesa
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Nova Receita
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 ${s.highlight ? "bg-zinc-900/80" : ""}`}>
            <p className="text-xs text-zinc-400 mb-1.5 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold font-heading tracking-tight ${s.color}`}>{formatBRL(s.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-400" /> Próximos Vencimentos (A Pagar)
          </h3>
          <div className="space-y-3">
            {[
              { id: 1, desc: "Cachê - Diretor de Fotografia", date: "Hoje", val: 1500 },
              { id: 2, desc: "Locação de Câmera (Locadora XYZ)", date: "Amanhã", val: 3200 },
              { id: 3, desc: "Impostos Federais (Simples)", date: "Dia 20", val: 4150 },
            ].map(i => (
              <div key={i.id} className="flex justify-between items-center p-3 rounded border border-zinc-800/60 bg-zinc-900/50">
                <div>
                  <p className="text-sm text-zinc-200">{i.desc}</p>
                  <p className="text-xs text-zinc-500">{i.date}</p>
                </div>
                <p className="text-sm font-medium text-red-400">{formatBRL(i.val)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" /> Próximos Recebimentos
          </h3>
          <div className="space-y-3">
            {[
              { id: 1, desc: "Parcela 2/3 - Filme Institucional", date: "Hoje", val: 15000 },
              { id: 2, desc: "Sinal - Vídeo Clipe Artista X", date: "Dia 15", val: 8000 },
            ].map(i => (
              <div key={i.id} className="flex justify-between items-center p-3 rounded border border-zinc-800/60 bg-zinc-900/50">
                <div>
                  <p className="text-sm text-zinc-200">{i.desc}</p>
                  <p className="text-xs text-zinc-500">{i.date}</p>
                </div>
                <p className="text-sm font-medium text-emerald-400">{formatBRL(i.val)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   2. CONTAS A PAGAR / RECEBER (Listagem)
   ========================================================================== */
function TransactionsList({ type }) {
  const isReceber = type === "receber";
  const title = isReceber ? "Contas a Receber" : "Contas a Pagar";
  const color = isReceber ? "text-emerald-400" : "text-red-400";
  const btnColor = isReceber ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700";
  const Icon = isReceber ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} key={type}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">{title}</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Gestão de {isReceber ? "entradas e receitas" : "saídas e despesas"}.</p>
        </div>
        <Button className={`text-white ${btnColor}`}>
          <Plus className="w-4 h-4 mr-2" /> Novo Lançamento
        </Button>
      </div>

      <div className="flex gap-3 mb-6">
        <Input placeholder="Buscar por descrição ou cliente/fornecedor..." className="bg-zinc-900 border-zinc-800 w-80" />
        <Select>
          <SelectTrigger className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">{isReceber ? "Recebido" : "Pago"}</SelectItem>
            <SelectItem value="atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-zinc-800 text-zinc-400"><Filter className="w-4 h-4 mr-2"/> Filtros</Button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/30">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Vencimento</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Descrição</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">{isReceber ? "Cliente" : "Fornecedor"}</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Categoria</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Valor</th>
              <th className="text-center px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 text-zinc-300">10/05/2026</td>
              <td className="px-4 py-3 text-zinc-200 font-medium">Exemplo de Lançamento 01</td>
              <td className="px-4 py-3 text-zinc-400">Empresa XYZ</td>
              <td className="px-4 py-3 text-zinc-500">Projeto Audiovisual</td>
              <td className={`px-4 py-3 text-right font-medium ${color}`}>{formatBRL(5000)}</td>
              <td className="px-4 py-3 text-center">
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">Pendente</span>
              </td>
            </tr>
            <tr className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors">
              <td className="px-4 py-3 text-zinc-300">05/05/2026</td>
              <td className="px-4 py-3 text-zinc-200 font-medium">Exemplo de Lançamento 02</td>
              <td className="px-4 py-3 text-zinc-400">Freelancer ABC</td>
              <td className="px-4 py-3 text-zinc-500">Cachês</td>
              <td className={`px-4 py-3 text-right font-medium ${color}`}>{formatBRL(1200)}</td>
              <td className="px-4 py-3 text-center">
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${isReceber ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                  {isReceber ? "Recebido" : "Pago"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   3. CONCILIAÇÃO BANCÁRIA (Com Importação OFX e Sugestões)
   ========================================================================== */
function BankReconciliation() {
  const [hasFile, setHasFile] = useState(false);
  const [resolveModal, setResolveModal] = useState(null);

  const handleUpload = () => {
    toast.success("Arquivo OFX importado com sucesso! Lendo 45 transações...");
    setTimeout(() => setHasFile(true), 800);
  };

  const handleResolve = (type) => {
    toast.success(`Lançamento de ${type} gerado e conciliação concluída!`);
    setResolveModal(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Conciliação Bancária</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Cruze o extrato do banco com os lançamentos do sistema.</p>
        </div>
        {!hasFile && (
          <Button onClick={handleUpload} className="bg-sky-600 hover:bg-sky-700 text-white">
            <UploadCloud className="w-4 h-4 mr-2" /> Importar Arquivo OFX
          </Button>
        )}
      </div>

      {!hasFile ? (
        <div className="border-2 border-dashed border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-zinc-950/50 mt-10">
          <div className="w-16 h-16 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-200 mb-2">Nenhum extrato importado</h3>
          <p className="text-sm text-zinc-500 mb-6 max-w-md">Faça o upload do arquivo OFX exportado do seu banco para iniciar a conciliação automática com o ContaCenaERP.</p>
          <Button onClick={handleUpload} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Selecionar arquivo (.ofx)
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-4 rounded-lg mb-6">
            <div className="flex gap-6">
              <div>
                <p className="text-xs text-zinc-500 uppercase">Banco Itaú - Conta 1234-5</p>
                <p className="text-sm font-medium text-zinc-200 mt-0.5">Período: 01/04/2026 a 30/04/2026</p>
              </div>
              <div className="w-px h-10 bg-zinc-800" />
              <div>
                <p className="text-xs text-zinc-500 uppercase">Progresso</p>
                <p className="text-sm font-medium text-emerald-400 mt-0.5">25 de 45 conciliados (55%)</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setHasFile(false)} className="border-zinc-800 text-zinc-400 h-8">
              <RefreshCw className="w-3.5 h-3.5 mr-2" /> Trocar OFX
            </Button>
          </div>

          {/* CABEÇALHO DIVIDIDO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span> Extrato do Banco (OFX)
            </div>
            <div className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500"></span> Lançamentos no Sistema
            </div>
          </div>

          {/* LISTA DE CONCILIAÇÕES */}
          <div className="space-y-3">
            
            {/* Cenário 1: Sugestão Automática Correta */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 items-center">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-500 font-mono">10/04/2026</span>
                  <span className="text-emerald-400 font-medium">{formatBRL(15000)}</span>
                </div>
                <p className="text-sm text-zinc-300 font-medium uppercase">TED RECEBIDA - CLIENTE TESTE</p>
                <p className="text-xs text-zinc-500">DOC 987654</p>
              </div>
              <div className="pl-4 border-l border-zinc-800 relative">
                {/* Linha conectora */}
                <div className="absolute -left-[24px] top-1/2 -translate-y-1/2 w-4 h-px bg-zinc-700"></div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sugestão Automática
                      </p>
                      <p className="text-sm text-zinc-200">Parcela 1/3 - Filme Institucional</p>
                      <p className="text-xs text-zinc-500">Cliente Teste</p>
                    </div>
                    <span className="text-emerald-400 font-medium">{formatBRL(15000)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs px-3">
                      Conciliar
                    </Button>
                    <Button size="sm" variant="ghost" className="text-zinc-400 h-7 text-xs">
                      Buscar outro
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Cenário 2: Sugestão com Diferença (Abre modal de Juros/Desconto) */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 items-center">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-500 font-mono">12/04/2026</span>
                  <span className="text-red-400 font-medium">{formatBRL(-3250)}</span>
                </div>
                <p className="text-sm text-zinc-300 font-medium uppercase">PAG BOLETO - LOCADORA LENTES</p>
              </div>
              <div className="pl-4 border-l border-zinc-800 relative">
                <div className="absolute -left-[24px] top-1/2 -translate-y-1/2 w-4 h-px bg-zinc-700"></div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs text-orange-400 font-semibold mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Diferença de Valor
                      </p>
                      <p className="text-sm text-zinc-200">Locação de Equipamentos FDS</p>
                      <p className="text-xs text-zinc-500">Lançado: R$ 3.200,00</p>
                    </div>
                    <div className="text-right">
                      <span className="text-red-400 font-medium block">{formatBRL(-3200)}</span>
                      <span className="text-orange-400 text-xs font-bold block mt-0.5">Dif: {formatBRL(50)}</span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => setResolveModal({ type: 'juros', diff: 50 })} className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs px-3 w-full">
                    Resolver Diferença
                  </Button>
                </div>
              </div>
            </div>

            {/* Cenário 3: Nada Encontrado (Busca Manual) */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 items-center">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-500 font-mono">15/04/2026</span>
                  <span className="text-red-400 font-medium">{formatBRL(-85)}</span>
                </div>
                <p className="text-sm text-zinc-300 font-medium uppercase">TARIFA MANUTENCAO CONTA</p>
              </div>
              <div className="pl-4 border-l border-zinc-800 relative flex items-center justify-center h-full">
                <div className="absolute -left-[24px] top-1/2 -translate-y-1/2 w-4 h-px bg-zinc-700"></div>
                <Button variant="outline" className="border-dashed border-zinc-700 text-zinc-400 bg-zinc-950/50 w-full">
                  <Search className="w-4 h-4 mr-2" /> Buscar Lançamento (ou Criar Novo)
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE RESOLUÇÃO DE DIFERENÇA (JUROS / MULTA / DESCONTO) */}
      <Dialog open={!!resolveModal} onOpenChange={() => setResolveModal(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
          <DialogHeader>
            <DialogTitle>Resolver Diferença de Conciliação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg mb-6 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-400" />
              <div>
                <p className="text-sm text-zinc-300">O valor debitado no banco é <strong>{formatBRL(resolveModal?.diff || 0)}</strong> maior do que o lançamento registrado.</p>
              </div>
            </div>
            
            <Label className="text-zinc-400 mb-2 block">Como deseja registrar essa diferença?</Label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => handleResolve('Juros/Multa')} className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 text-left transition-colors">
                <p className="text-sm font-semibold text-zinc-200">Adicionar como Juros/Multa</p>
                <p className="text-xs text-zinc-500 mt-1">Cria uma despesa extra atrelada ao pagamento.</p>
              </button>
              <button onClick={() => handleResolve('Ajuste de Valor')} className="p-3 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-500 text-left transition-colors">
                <p className="text-sm font-semibold text-zinc-200">Ajustar Lançamento Original</p>
                <p className="text-xs text-zinc-500 mt-1">Altera o valor do cadastro original para bater.</p>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

/* ==========================================================================
   4. RELATÓRIOS (DRE / Fluxo)
   ========================================================================== */
function ReportsView() {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Relatórios Financeiros</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Análises detalhadas da saúde da sua produtora.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Card DRE */}
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-zinc-200 font-heading">Demonstrativo de Resultado (DRE)</h3>
            <Select defaultValue="2026">
              <SelectTrigger className="w-24 bg-zinc-950 border-zinc-800 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3 flex-1">
            <div className="flex justify-between text-sm py-2 border-b border-zinc-800">
              <span className="text-zinc-400">Receita Bruta (Projetos)</span>
              <span className="text-emerald-400 font-medium">{formatBRL(450000)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-zinc-800">
              <span className="text-zinc-400">(-) Impostos e Deduções</span>
              <span className="text-red-400">{formatBRL(-28500)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-zinc-800">
              <span className="text-zinc-400 pl-4">Receita Líquida</span>
              <span className="text-zinc-200 font-medium">{formatBRL(421500)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-zinc-800 mt-4">
              <span className="text-zinc-400">(-) Custos Operacionais (Equipe, Locações)</span>
              <span className="text-red-400">{formatBRL(-185000)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b border-zinc-800">
              <span className="text-zinc-400">(-) Despesas Fixas (Escritório, Software)</span>
              <span className="text-red-400">{formatBRL(-45000)}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-zinc-700">
            <span className="text-base font-bold text-zinc-200 uppercase">Lucro Líquido</span>
            <span className="text-xl font-bold font-heading text-violet-400">{formatBRL(191500)}</span>
          </div>
        </div>

        {/* Card Fluxo e Categorias */}
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Exportar Dados</h3>
            <p className="text-xs text-zinc-500 mb-4">Baixe o fluxo de caixa completo em Excel para envio à contabilidade.</p>
            <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
              <Download className="w-4 h-4 mr-2" /> Exportar Planilha (XLSX)
            </Button>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h3 className="text-sm font-semibold text-zinc-300 mb-4">Top Despesas (Ano)</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Cachês (Freelancers)</span>
                  <span className="text-zinc-300 font-medium">45%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 w-[45%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Locação de Equipamentos</span>
                  <span className="text-zinc-300 font-medium">30%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500 w-[30%]"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Impostos</span>
                  <span className="text-zinc-300 font-medium">15%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-[15%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

/* ==========================================================================
   5. INVENTÁRIO FINANCEIRO (CONTROLE PATRIMONIAL)
   ========================================================================== */
function InventoryFinanceView() {
  const [baixaModal, setBaixaModal] = useState(null);

  // Mock de dados para visualização
  const inventory = [
    { id: "EQP-001", name: "Câmera RED Komodo 6K", cat: "Câmeras", date: "15/01/2025", value: 45000, status: "Ativo" },
    { id: "EQP-002", name: "Lente Sigma 18-35mm", cat: "Lentes", date: "20/02/2025", value: 5200, status: "Ativo" },
    { id: "EQP-003", name: "Drone DJI Mavic 3", cat: "Drones", date: "10/06/2024", value: 18000, status: "Vendido" },
    { id: "EQP-004", name: "Kit Iluminação Aputure 300d", cat: "Luz", date: "05/11/2023", value: 8500, status: "Danificado" },
  ];

  const totalAtivos = inventory.filter(i => i.status === "Ativo").reduce((acc, curr) => acc + curr.value, 0);
  const totalBaixados = inventory.filter(i => i.status !== "Ativo").reduce((acc, curr) => acc + curr.value, 0);

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">Inventário e Patrimônio</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Controle de capital imobilizado, valores de compra e baixas.</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Package className="w-4 h-4 mr-2" /> Registrar Compra de Ativo
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Capital Imobilizado (Ativos)</p>
          <p className="text-3xl font-bold font-heading text-amber-400">{formatBRL(totalAtivos)}</p>
          <p className="text-xs text-zinc-400 mt-2">Valor total de compra dos equipamentos em uso.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <p className="text-xs text-zinc-500 mb-2 font-medium uppercase tracking-wider">Equipamentos Baixados</p>
          <p className="text-3xl font-bold font-heading text-zinc-300">{formatBRL(totalBaixados)}</p>
          <p className="text-xs text-zinc-400 mt-2">Equipamentos vendidos, perdidos ou danificados.</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400"><RefreshCw className="w-5 h-5" /></div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Depreciação</p>
              <p className="text-xs text-zinc-500">Cálculo contábil em breve</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Patrimônio */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/30">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Cód / Equipamento</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Categoria</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Data Compra</th>
              <th className="text-right px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Valor Compra</th>
              <th className="text-center px-4 py-3 text-zinc-500 font-medium text-xs uppercase">Status Contábil</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors group">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-200">{item.name}</p>
                  <p className="text-xs text-zinc-500 font-mono">{item.id}</p>
                </td>
                <td className="px-4 py-3 text-zinc-400">{item.cat}</td>
                <td className="px-4 py-3 text-zinc-400">{item.date}</td>
                <td className="px-4 py-3 text-right font-medium text-amber-400/90">{formatBRL(item.value)}</td>
                <td className="px-4 py-3 text-center">
                  {item.status === "Ativo" && <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Ativo</span>}
                  {item.status === "Vendido" && <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">Vendido</span>}
                  {item.status === "Danificado" && <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">Danificado (PT)</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {item.status === "Ativo" && (
                    <Button variant="ghost" size="sm" onClick={() => setBaixaModal(item)} className="h-8 text-zinc-400 hover:text-red-400 hover:bg-red-500/10">
                      Dar Baixa
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Baixa de Patrimônio */}
      <Dialog open={!!baixaModal} onOpenChange={() => setBaixaModal(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-200">
          <DialogHeader>
            <DialogTitle>Baixa de Patrimônio</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-zinc-400 mb-4">
              Você está dando baixa no equipamento <strong className="text-zinc-100">{baixaModal?.name}</strong>. Esta ação removerá o item do módulo da equipe de produção.
            </p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Motivo da Baixa</Label>
                <Select>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800">
                    <SelectItem value="venda">Vendido a terceiros</SelectItem>
                    <SelectItem value="dano">Perda Total / Danificado</SelectItem>
                    <SelectItem value="roubo">Roubo / Furto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-zinc-400">Valor de Venda / Ressarcimento (se houver)</Label>
                <Input placeholder="R$ 0,00" className="bg-zinc-900 border-zinc-800" />
              </div>
            </div>
            <div className="flex gap-3 mt-6 pt-4 border-t border-zinc-800">
              <Button variant="outline" onClick={() => setBaixaModal(null)} className="flex-1 border-zinc-700 text-zinc-300">Cancelar</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={() => { toast.success("Baixa realizada com sucesso."); setBaixaModal(null); }}>
                Confirmar Baixa
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}