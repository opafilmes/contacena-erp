import React from "react";
import { motion } from "framer-motion";
import { ListTodo, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

export default function DashboardStudio() {
  // Mock de dados para visualizar o layout
  const stats = [
    { label: "Total de Tarefas", value: "42", icon: ListTodo, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-t-violet-500" },
    { label: "Em Andamento", value: "15", icon: Clock, color: "text-sky-400", bg: "bg-sky-400/10", border: "border-t-sky-500" },
    { label: "Concluídas", value: "24", icon: CheckCircle2, color: "text-[#1abea0]", bg: "bg-[#1abea0]/10", border: "border-t-[#1abea0]" },
    { label: "Atrasadas", value: "3", icon: AlertTriangle, color: "text-[#c30147]", bg: "bg-[#c30147]/10", border: "border-t-[#c30147]" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full min-h-[calc(100vh-4rem)]">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-zinc-100 tracking-tight">Dashboard da Produção</h1>
          <p className="text-sm text-zinc-500 mt-1">Visão geral do desempenho e tarefas da equipe do estúdio.</p>
        </div>

        {/* Cards Superiores (Inspirados na sua imagem) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          {stats.map((s, i) => (
            <div key={i} className={`relative overflow-hidden rounded-2xl bg-zinc-900/40 border border-zinc-800/80 p-5 shadow-sm border-t-2 ${s.border}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{s.label}</p>
                  <p className="text-4xl font-heading font-bold text-zinc-100">{s.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>
                  <s.icon className="w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Blocos de Informação Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Distribuição de Tarefas */}
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 min-h-[300px]">
            <h3 className="text-sm font-bold text-zinc-200 mb-6">Distribuição por Projetos</h3>
            <div className="flex flex-col items-center justify-center h-[200px] text-zinc-600">
              <p className="text-sm">Gráfico será renderizado aqui</p>
            </div>
          </div>

          {/* Carga de Trabalho da Equipe */}
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-zinc-200">Carga de Trabalho</h3>
              <button className="text-xs text-violet-400 hover:text-violet-300">Ver equipe</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-3">
               {/* Exemplo de lista vazia inspirada na imagem */}
               <Users className="w-8 h-8 opacity-20" />
               <p className="text-sm">Nenhum membro da equipe ativo ainda.</p>
            </div>
          </div>

          {/* Próximos Prazos */}
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 min-h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-zinc-200">Próximos Prazos</h3>
              <button className="text-xs text-violet-400 hover:text-violet-300">Ver quadro</button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-3">
               <Clock className="w-8 h-8 opacity-20" />
               <p className="text-sm">Nenhum prazo próximo.</p>
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}