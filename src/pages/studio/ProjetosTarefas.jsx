import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Search, Filter, Calendar, User, Users, 
  MoreHorizontal, CheckCircle2, Clock, AlertCircle,
  ChevronRight, LayoutGrid, List as ListIcon, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Cores principais definidas por você
const COLORS = {
  studio: "#c30147",
};

export default function ProjetosTarefas() {
  const [viewMode, setViewMode] = useState("list"); // 'grid' ou 'list'
  
  // Mock de Dados para visualização do layout
  const projects = [
    { 
      id: 1, 
      nome: "Campanha de Inverno - Marca X", 
      cliente: "Marca X Brasil", 
      progresso: 65, 
      prazo: "15 Mai", 
      tarefas: 12, 
      concluidas: 8,
      cor: "#c30147"
    },
    { 
      id: 2, 
      nome: "Documentário Raízes", 
      cliente: "Canal Cultural", 
      progresso: 30, 
      prazo: "22 Jun", 
      tarefas: 45, 
      concluidas: 12,
      cor: "#c30147"
    },
  ];

  const tasks = [
    { 
      id: 101, 
      titulo: "Decupagem das cenas de ação", 
      projeto: "Campanha de Inverno", 
      responsavel: "Gabriel Rosa", 
      co_responsaveis: ["Ana", "Vitor"],
      prazo: "2026-04-28", 
      prioridade: "Alta", 
      status: "Em Andamento" 
    },
    { 
      id: 102, 
      titulo: "Aprovação de trilha sonora", 
      projeto: "Documentário Raízes", 
      responsavel: "Mariana Silva", 
      co_responsaveis: ["Gabriel"],
      prazo: "2026-05-02", 
      prioridade: "Média", 
      status: "Pendente" 
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto w-full min-h-screen text-zinc-100">
      
      {/* HEADER E AÇÕES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos & Tarefas</h1>
          <p className="text-zinc-500 mt-1">Gerencie a operação e entregas do estúdio em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg flex p-1">
            <button 
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <Button className="bg-[#c30147] hover:bg-[#a0013a] text-white gap-2 px-5">
            <Plus className="w-4 h-4" /> Novo Projeto
          </Button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input placeholder="Buscar tarefas ou projetos..." className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-[#c30147]/50" />
        </div>
        <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:bg-zinc-900">
          <Filter className="w-4 h-4 mr-2" /> Filtros
        </button>
        <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:bg-zinc-900">
          <Calendar className="w-4 h-4 mr-2" /> Ver Calendário
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* COLUNA ESQUERDA: LISTA DE PROJETOS (RESUMO) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 px-1">Projetos Ativos</h3>
          {projects.map(project => (
            <div 
              key={project.id} 
              className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:border-[#c30147]/40 transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-[#c30147] uppercase">{project.cliente}</span>
                <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
              </div>
              <h4 className="font-bold text-sm text-zinc-200 mb-4">{project.nome}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Progresso</span>
                  <span>{project.progresso}%</span>
                </div>
                <Progress value={project.progresso} className="h-1.5 bg-zinc-800" indicatorClassName="bg-[#c30147]" />
              </div>
            </div>
          ))}
        </div>

        {/* COLUNA DIREITA: QUADRO DE TAREFAS DETALHADO */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40">
              <h3 className="font-bold text-lg">Tarefas do Projeto</h3>
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white">Ver todas →</Button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800/50">
                    <th className="px-6 py-4 font-medium">Tarefa</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium">Responsáveis</th>
                    <th className="px-6 py-4 font-medium">Prazo</th>
                    <th className="px-6 py-4 font-medium text-right">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {tasks.map(task => (
                    <tr key={task.id} className="hover:bg-zinc-800/20 transition-colors group cursor-pointer">
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-zinc-200 group-hover:text-white transition-colors">{task.titulo}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">{task.projeto}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Badge variant="outline" className={`
                          ${task.status === 'Em Andamento' ? 'border-sky-500/30 text-sky-400 bg-sky-500/5' : 'border-zinc-700 text-zinc-500'}
                        `}>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex -space-x-2 overflow-hidden">
                          <Avatar className="inline-block h-7 w-7 border-2 border-zinc-900">
                            <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400 font-bold">GR</AvatarFallback>
                          </Avatar>
                          {task.co_responsaveis.map((co, i) => (
                            <Avatar key={i} className="inline-block h-7 w-7 border-2 border-zinc-900">
                              <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-500">{co[0]}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-xs">{new Date(task.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Flag className={`w-3 h-3 ${task.prioridade === 'Alta' ? 'text-[#c30147]' : 'text-zinc-600'}`} />
                          <span className={`text-[11px] font-bold uppercase ${task.prioridade === 'Alta' ? 'text-[#c30147]' : 'text-zinc-500'}`}>
                            {task.prioridade}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/20 text-center">
              <Button variant="ghost" className="w-full text-zinc-500 hover:text-[#c30147] gap-2 text-xs">
                <Plus className="w-3.5 h-3.5" /> Adicionar nova tarefa rápida
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
