import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ListTodo, Clock, CheckCircle2, AlertTriangle, Plus, Search, Filter, 
  Calendar, User, Users, ChevronRight, LayoutGrid, List as ListIcon, 
  Flag, MessageCircle, Paperclip, Send, MoreVertical, Phone, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function DashboardStudio() {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 max-w-7xl mx-auto w-full text-zinc-100">
      {activeTab === "dashboard" && <StudioDashboardView />}
      {activeTab === "projetos" && <StudioProjetosView />}
      {activeTab === "equipe" && <StudioEquipeView />}
      {activeTab === "chat" && <StudioChatView />}
      {activeTab === "relatorios" && <StudioRelatoriosView />}
    </div>
  );
}

/* ==========================================================================
   1. DASHBOARD STUDIO (Visão Geral)
   ========================================================================== */
function StudioDashboardView() {
  const stats = [
    { label: "Total de Tarefas", value: "42", icon: ListTodo, color: "text-violet-400", bg: "bg-violet-400/10", border: "border-t-violet-500" },
    { label: "Em Andamento", value: "15", icon: Clock, color: "text-sky-400", bg: "bg-sky-400/10", border: "border-t-sky-500" },
    { label: "Concluídas", value: "24", icon: CheckCircle2, color: "text-[#1abea0]", bg: "bg-[#1abea0]/10", border: "border-t-[#1abea0]" },
    { label: "Atrasadas", value: "3", icon: AlertTriangle, color: "text-[#c30147]", bg: "bg-[#c30147]/10", border: "border-t-[#c30147]" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-zinc-100 tracking-tight">Dashboard da Produção</h1>
        <p className="text-sm text-zinc-500 mt-1">Visão geral do desempenho e tarefas da equipe do estúdio.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 min-h-[300px]">
          <h3 className="text-sm font-bold text-zinc-200 mb-6">Distribuição por Projetos</h3>
          <div className="flex flex-col items-center justify-center h-[200px] text-zinc-600">
            <p className="text-sm">Gráfico será renderizado aqui</p>
          </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-zinc-200">Carga de Trabalho</h3>
            <button className="text-xs text-[#c30147] hover:text-[#a0013a]">Ver equipe</button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-3">
             <Users className="w-8 h-8 opacity-20" />
             <p className="text-sm">Sem dados suficientes.</p>
          </div>
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-zinc-200">Próximos Prazos</h3>
            <button className="text-xs text-[#c30147] hover:text-[#a0013a]">Ver quadro</button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-3">
             <Clock className="w-8 h-8 opacity-20" />
             <p className="text-sm">Nenhum prazo urgente hoje.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   2. PROJETOS E TAREFAS (O Motor da Operação)
   ========================================================================== */
function StudioProjetosView() {
  const [viewMode, setViewMode] = useState("list"); 
  
  const projects = [
    { id: 1, nome: "Campanha Inverno", cliente: "Marca X", progresso: 65, tarefas: 12 },
    { id: 2, nome: "Doc Raízes", cliente: "Canal Y", progresso: 30, tarefas: 45 },
  ];

  const tasks = [
    { id: 101, titulo: "Decupagem das cenas", projeto: "Campanha Inverno", status: "Em Andamento", prioridade: "Alta" },
    { id: 102, titulo: "Aprovação de trilha", projeto: "Doc Raízes", status: "Pendente", prioridade: "Média" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos & Tarefas</h1>
          <p className="text-zinc-500 mt-1">Gerencie a operação e entregas do estúdio em tempo real.</p>
        </div>
        <Button className="bg-[#c30147] hover:bg-[#a0013a] text-white gap-2 px-5 shadow-md">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4 px-1">Projetos Ativos</h3>
          {projects.map(p => (
            <div key={p.id} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-[#c30147]/40 transition-all cursor-pointer shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-[#c30147] uppercase">{p.cliente}</span>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </div>
              <h4 className="font-bold text-sm text-zinc-200 mb-4">{p.nome}</h4>
              <Progress value={p.progresso} className="h-1.5 bg-zinc-800" indicatorClassName="bg-[#c30147]" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-3">
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 className="font-bold text-lg">Tarefas do Projeto</h3>
              <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white">Ver todas →</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800/50">
                    <th className="px-6 py-4 font-medium">Tarefa</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {tasks.map(t => (
                    <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors group cursor-pointer">
                      <td className="px-6 py-5">
                        <p className="font-bold text-zinc-200 group-hover:text-white">{t.titulo}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{t.projeto}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Badge variant="outline" className={`${t.status === 'Em Andamento' ? 'border-sky-500/30 text-sky-400 bg-sky-500/5' : 'border-zinc-700 text-zinc-500'}`}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Flag className={`w-3 h-3 ${t.prioridade === 'Alta' ? 'text-[#c30147]' : 'text-zinc-600'}`} />
                          <span className={`text-[11px] font-bold uppercase ${t.prioridade === 'Alta' ? 'text-[#c30147]' : 'text-zinc-500'}`}>{t.prioridade}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   3. EQUIPE (Acompanhamento de Carga de Trabalho)
   ========================================================================== */
function StudioEquipeView() {
  const team = [
    { id: 1, nome: "Gabriel Rosa", role: "Diretor de Fotografia", tarefas: 4, progresso: 80 },
    { id: 2, nome: "Ana Silva", role: "Editora Sênior", tarefas: 2, progresso: 40 },
    { id: 3, nome: "Vitor Costa", role: "Produtor de Set", tarefas: 7, progresso: 100 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Equipe de Produção</h1>
        <p className="text-zinc-500 mt-1">Monitore a capacidade e o status das tarefas de cada colega.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {team.map(member => (
          <div key={member.id} className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm hover:border-[#c30147]/50 transition-colors">
            <Avatar className="w-16 h-16 border-2 border-zinc-800 mb-4">
              <AvatarFallback className="bg-zinc-800 text-lg font-bold">{member.nome[0]}</AvatarFallback>
            </Avatar>
            <h3 className="font-bold text-zinc-100 text-lg">{member.nome}</h3>
            <p className="text-xs text-zinc-500 mb-6">{member.role}</p>
            
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-400">Carga (Tarefas Ativas)</span>
                <span className={member.progresso > 80 ? "text-[#c30147]" : "text-sky-400"}>{member.tarefas}</span>
              </div>
              <Progress value={member.progresso} className="h-2 bg-zinc-800" indicatorClassName={member.progresso > 80 ? "bg-[#c30147]" : "bg-sky-500"} />
            </div>
            <Button variant="outline" className="w-full mt-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Ver Tarefas
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ==========================================================================
   4. CHAT (Estilo WhatsApp para a Produtora)
   ========================================================================== */
function StudioChatView() {
  const chats = [
    { id: 1, nome: "Equipe Geral", msg: "O roteiro foi atualizado!", time: "10:45", unread: 2 },
    { id: 2, nome: "Projeto: Doc Raízes", msg: "As lentes já chegaram?", time: "Ontem", unread: 0 },
    { id: 3, nome: "Gabriel (Edição)", msg: "Mandei o corte 2 no drive.", time: "Segunda", unread: 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="h-[calc(100vh-10rem)] bg-zinc-900/30 border border-zinc-800/80 rounded-3xl overflow-hidden flex shadow-2xl">
      
      {/* BARRA LATERAL (Contatos/Grupos) */}
      <div className="w-80 border-r border-zinc-800 bg-zinc-950/50 flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <h2 className="font-bold text-lg">Mensagens</h2>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-400 hover:text-white"><Plus className="w-5 h-5"/></Button>
        </div>
        <div className="p-3 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input placeholder="Buscar chat..." className="pl-9 bg-zinc-900 border-none h-9 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map(c => (
            <div key={c.id} className={`flex items-center gap-3 p-4 cursor-pointer border-b border-zinc-800/30 transition-colors ${c.id === 1 ? 'bg-zinc-800/40' : 'hover:bg-zinc-900'}`}>
              <Avatar className="w-12 h-12 border border-zinc-800">
                <AvatarFallback className={`${c.id === 1 ? 'bg-[#c30147]' : 'bg-zinc-800'} text-white font-bold`}>{c.nome[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="font-bold text-sm text-zinc-100 truncate">{c.nome}</h4>
                  <span className={`text-[10px] ${c.unread ? 'text-[#c30147] font-bold' : 'text-zinc-500'}`}>{c.time}</span>
                </div>
                <p className="text-xs text-zinc-400 truncate">{c.msg}</p>
              </div>
              {c.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-[#c30147] text-white flex items-center justify-center text-[10px] font-bold">
                  {c.unread}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ÁREA DA MENSAGEM */}
      <div className="flex-1 flex flex-col bg-[#0c0c0e]">
        {/* Header do Chat Ativo */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-zinc-800"><AvatarFallback className="bg-[#c30147] text-white font-bold">EG</AvatarFallback></Avatar>
            <div>
              <h3 className="font-bold text-zinc-100">Equipe Geral</h3>
              <p className="text-xs text-[#c30147]">4 online</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white"><Phone className="w-5 h-5"/></Button>
            <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white"><Video className="w-5 h-5"/></Button>
            <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white"><MoreVertical className="w-5 h-5"/></Button>
          </div>
        </div>

        {/* Corpo das Mensagens (Área de Scroll) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-center mb-6">
            <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-zinc-900 text-zinc-500">Hoje</span>
          </div>
          
          <div className="flex gap-3">
            <Avatar className="w-8 h-8"><AvatarFallback className="bg-sky-600 text-xs">V</AvatarFallback></Avatar>
            <div className="bg-zinc-800/80 p-3 rounded-2xl rounded-tl-none max-w-[70%]">
              <p className="text-sm text-zinc-200">Bom dia equipe! A locação de amanhã está confirmada.</p>
              <span className="text-[10px] text-zinc-500 mt-1 block text-right">10:30</span>
            </div>
          </div>

          <div className="flex gap-3 flex-row-reverse">
            <div className="bg-[#c30147] p-3 rounded-2xl rounded-tr-none max-w-[70%]">
              <p className="text-sm text-white">Show! O equipamento já está separado no almoxarifado.</p>
              <div className="flex justify-end items-center gap-1 mt-1">
                <span className="text-[10px] text-zinc-300">10:45</span>
                <CheckCircle2 className="w-3 h-3 text-zinc-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Input de Mensagem */}
        <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 flex items-center gap-3">
          <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white shrink-0"><Paperclip className="w-5 h-5"/></Button>
          <Input placeholder="Digite uma mensagem..." className="flex-1 bg-zinc-950 border-zinc-800 rounded-full h-12 px-5" />
          <Button size="icon" className="bg-[#c30147] hover:bg-[#a0013a] text-white rounded-full h-12 w-12 shrink-0">
            <Send className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>

    </motion.div>
  );
}

/* ==========================================================================
   5. RELATÓRIOS DO STUDIO
   ========================================================================== */
function StudioRelatoriosView() {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios de Produção</h1>
        <p className="text-zinc-500 mt-1">Métricas de horas, entregas e desempenho da equipe.</p>
      </div>
      <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center bg-zinc-900/20">
         <BarChart3 className="w-12 h-12 text-zinc-700 mb-4" />
         <h3 className="text-xl font-bold text-zinc-300">Relatórios Dinâmicos</h3>
         <p className="text-zinc-500 max-w-md mt-2">Estamos construindo as visões analíticas para sua produtora. Em breve você poderá exportar dados de produtividade aqui.</p>
      </div>
    </motion.div>
  );
}