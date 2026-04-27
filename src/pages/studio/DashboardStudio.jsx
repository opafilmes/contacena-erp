import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ListTodo, Clock, CheckCircle2, AlertTriangle, Plus, Search, Filter, 
  Calendar, User, Users, ChevronRight, LayoutGrid, List as ListIcon, 
  Flag, MessageCircle, Paperclip, Send, MoreVertical, Phone, Video,
  MessageSquare, CheckSquare, AlignLeft, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ── COMPONENTE PRINCIPAL (O MAESTRO DAS ABAS) ──
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
   2. PROJETOS E TAREFAS (Com Modais e Chat Contextual)
   ========================================================================== */
function StudioProjetosView() {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [chatInput, setChatInput] = useState("");

  // Mocks de Dados
  const clients = ["Marca X Brasil", "Canal Cultural", "Agência Y", "Cliente Exemplo"];
  
  const projects = [
    { id: 1, nome: "Campanha Inverno", cliente: "Marca X Brasil", progresso: 65 },
    { id: 2, nome: "Doc Raízes", cliente: "Canal Cultural", progresso: 30 },
  ];

  const tasks = [
    { 
      id: 101, 
      titulo: "Decupagem das cenas", 
      projeto: "Campanha Inverno", 
      status: "Em Andamento", 
      prioridade: "Alta",
      descricao: "Decupar as cenas gravadas no dia 10. Separar takes de ação e takes de produto.",
      subtarefas: [
        { id: 1, titulo: "Sincronizar áudio e vídeo", responsavel: "Vitor", done: true },
        { id: 2, titulo: "Selecionar melhores takes (Ação)", responsavel: "Ana", done: false },
        { id: 3, titulo: "Exportar proxy para o diretor", responsavel: "Ana", done: false },
      ],
      chat: [
        { id: 1, user: "Vitor", text: "Áudio sincronizado. Subi na pasta 01_BRUTO.", time: "09:30" },
        { id: 2, user: "Ana", text: "Maravilha, já vou começar a separar os takes.", time: "09:45" },
      ]
    },
    { 
      id: 102, 
      titulo: "Aprovação de trilha", 
      projeto: "Doc Raízes", 
      status: "Pendente", 
      prioridade: "Média",
      descricao: "Aguardando cliente aprovar a trilha sonora original.",
      subtarefas: [],
      chat: []
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projetos & Tarefas</h1>
          <p className="text-zinc-500 mt-1">Gerencie a operação, subtarefas e comunicação da equipe.</p>
        </div>
        <Button onClick={() => setIsNewProjectOpen(true)} className="bg-[#c30147] hover:bg-[#a0013a] text-white gap-2 px-5 shadow-md">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LISTA DE PROJETOS */}
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

        {/* LISTA DE TAREFAS */}
        <div className="lg:col-span-3">
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h3 className="font-bold text-lg text-zinc-100">Quadro de Tarefas</h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <Input placeholder="Buscar tarefas..." className="pl-9 bg-zinc-950 border-zinc-800 h-9 text-sm" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800/50 bg-zinc-950/30">
                    <th className="px-6 py-4 font-medium">Tarefa</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {tasks.map(t => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTask(t)}
                      className="hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-5">
                        <p className="font-bold text-zinc-200 group-hover:text-white transition-colors">{t.titulo}</p>
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

      {/* MODAL: NOVO PROJETO */}
      <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
        <DialogContent className="bg-[#09090B] border-zinc-800 text-zinc-100 max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Nome do Projeto</Label>
              <Input placeholder="Ex: Videoclipe Artista X" className="bg-zinc-900 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Cliente Vinculado</Label>
              <Select>
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300">
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                  {clients.map((c, i) => <SelectItem key={i} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Data de Início</Label>
                <Input type="date" className="bg-zinc-900 border-zinc-800 text-zinc-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Prazo Final</Label>
                <Input type="date" className="bg-zinc-900 border-zinc-800 text-zinc-300" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Briefing / Escopo (Rich Text futuro)</Label>
              <textarea className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-sm text-zinc-300 resize-none focus:outline-none focus:border-[#c30147]" placeholder="Detalhes do projeto..."></textarea>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <Button variant="ghost" onClick={() => setIsNewProjectOpen(false)} className="text-zinc-400">Cancelar</Button>
            <Button className="bg-[#c30147] hover:bg-[#a0013a] text-white">Salvar Projeto</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: DETALHES DA TAREFA (Subtarefas + Chat) */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="bg-[#09090B] border-zinc-800 text-zinc-100 max-w-4xl p-0 overflow-hidden flex flex-col md:flex-row h-[600px]">
          
          {/* LADO ESQUERDO: INFOS E SUBTAREFAS */}
          <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-zinc-800 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-[#c30147]/20 text-[#c30147] border-[#c30147]/30 hover:bg-[#c30147]/20">{selectedTask?.projeto}</Badge>
                <Badge variant="outline" className="border-zinc-700 text-zinc-400">{selectedTask?.status}</Badge>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedTask?.titulo}</h2>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mt-4">
                <div className="flex gap-2 mb-2 pb-2 border-b border-zinc-800 text-zinc-500">
                  <AlignLeft className="w-4 h-4 cursor-pointer hover:text-white" />
                  <Paperclip className="w-4 h-4 cursor-pointer hover:text-white" />
                </div>
                <p className="text-sm text-zinc-300">{selectedTask?.descricao}</p>
              </div>
            </div>

            {/* SUBTAREFAS */}
            <div>
              <h3 className="font-bold flex items-center gap-2 mb-4 text-sm text-zinc-200">
                <CheckSquare className="w-4 h-4 text-[#c30147]" /> Subtarefas
              </h3>
              <div className="space-y-2">
                {selectedTask?.subtarefas?.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${sub.done ? 'bg-[#c30147] border-[#c30147]' : 'border-zinc-600'}`}>
                        {sub.done && <CheckSquare className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${sub.done ? 'line-through text-zinc-600' : 'text-zinc-300'}`}>{sub.titulo}</span>
                    </div>
                    <Avatar className="w-6 h-6 border border-zinc-700">
                      <AvatarFallback className="bg-zinc-800 text-[10px] text-zinc-400">{sub.responsavel[0]}</AvatarFallback>
                    </Avatar>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-zinc-500 hover:text-[#c30147] text-xs h-8 mt-2">
                  + Adicionar Subtarefa
                </Button>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: CHAT DA TAREFA */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#0c0c0e]">
            <div className="p-4 border-b border-zinc-800 flex items-center gap-2 bg-[#09090B]">
              <MessageSquare className="w-4 h-4 text-[#c30147]" />
              <h3 className="font-bold text-sm">Chat da Tarefa</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedTask?.chat?.length > 0 ? (
                selectedTask.chat.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.user === 'Eu' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${msg.user === 'Eu' ? 'bg-[#c30147] text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                      <p className="text-[10px] font-bold opacity-70 mb-1">{msg.user}</p>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 mt-1">{msg.time}</span>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                  <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                  <p className="text-xs">Nenhum comentário ainda.</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#09090B] border-t border-zinc-800">
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl focus-within:border-zinc-600">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-white shrink-0"><Paperclip className="w-4 h-4"/></Button>
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Escreva um comentário..." 
                  className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm text-zinc-200"
                />
                <Button size="icon" className="h-8 w-8 bg-[#c30147] hover:bg-[#a0013a] text-white rounded-lg shrink-0">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
          
          <button onClick={() => setSelectedTask(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </DialogContent>
      </Dialog>
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
   4. CHAT (Com Sistema Real-time Simulado e Auto-scroll)
   ========================================================================== */
function StudioChatView() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "Vitor Costa", text: "Bom dia equipe! A locação de amanhã está confirmada.", time: "10:30", me: false },
    { id: 2, sender: "Eu", text: "Show! O equipamento já está separado.", time: "10:45", me: true },
  ]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTyping(true);
      
      setTimeout(() => {
        const novaMensagemExterna = {
          id: Date.now(),
          sender: "Ana Silva",
          text: "Pessoal, acabei de subir o roteiro finalizado no drive!",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          me: false
        };
        
        setMessages(prev => [...prev, novaMensagemExterna]);
        setIsTyping(false);
        sendBrowserNotification("Nova mensagem de Ana Silva", { body: novaMensagemExterna.text });
        
      }, 2000); 
    }, 45000); 

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      sender: "Eu",
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      me: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");
  };

  return (
    <div className="fixed inset-0 top-16 left-64 flex bg-[#0c0c0e] z-0">
      
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-[#09090B]">
        <div className="p-4 h-16 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="font-bold text-xl text-zinc-100">Mensagens</h2>
          <Button size="icon" variant="ghost" className="text-zinc-400"><Plus className="w-5 h-5"/></Button>
        </div>
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input placeholder="Buscar conversas..." className="pl-10 bg-zinc-900/50 border-zinc-800 h-10 text-sm" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 p-4 bg-[#c30147]/10 border-l-4 border-[#c30147] cursor-pointer">
            <Avatar className="h-12 w-12 border border-zinc-800">
              <AvatarFallback className="bg-[#c30147] text-white font-bold">EG</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-zinc-100 truncate text-sm">Equipe Geral</h4>
                <span className="text-[10px] text-zinc-500">Agora</span>
              </div>
              <p className="text-xs text-zinc-400 truncate">
                {isTyping ? <span className="text-[#c30147] font-medium animate-pulse">Ana está digitando...</span> : "Última mensagem enviada"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-[#09090B]/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10"><AvatarFallback className="bg-[#c30147] font-bold">EG</AvatarFallback></Avatar>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#09090B] rounded-full"></div>
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm">Equipe Geral</h3>
              <p className="text-[10px] text-emerald-500 font-medium">8 membros online</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button onClick={() => alert('Iniciando Chamada de Voz...')} size="icon" variant="ghost" className="text-zinc-400 hover:text-white"><Phone className="w-5 h-5"/></Button>
            <Button onClick={() => alert('Iniciando Vídeo Chamada...')} size="icon" variant="ghost" className="text-zinc-400 hover:text-white"><Video className="w-5 h-5"/></Button>
            <Button size="icon" variant="ghost" className="text-zinc-400 hover:text-white"><MoreVertical className="w-5 h-5"/></Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0c0c0e]">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.me ? 'flex-row-reverse' : ''}`}>
              {!msg.me && <Avatar className="h-8 w-8 mt-auto"><AvatarFallback className="text-[10px] bg-zinc-800 font-bold">{msg.sender[0]}</AvatarFallback></Avatar>}
              <div className={`max-w-[60%] p-3 rounded-2xl shadow-lg ${msg.me ? 'bg-[#c30147] text-white rounded-tr-none' : 'bg-zinc-800 text-zinc-200 rounded-tl-none'}`}>
                {!msg.me && <p className="text-[10px] font-bold mb-1 opacity-70">{msg.sender}</p>}
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <span className={`text-[9px] block mt-1 text-right opacity-60`}>{msg.time}</span>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-auto"><AvatarFallback className="text-[10px] bg-zinc-800 font-bold">A</AvatarFallback></Avatar>
              <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none shadow-lg flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-[#09090B] border-t border-zinc-800 z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-3 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800 transition-colors focus-within:border-zinc-600">
            <Button size="icon" variant="ghost" className="text-zinc-500 hover:text-white shrink-0"><Paperclip className="w-5 h-5"/></Button>
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escreva sua mensagem..." 
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 shrink-0">
              <Button 
                onMouseDown={() => setIsRecording(true)}
                onMouseUp={() => { setIsRecording(false); alert('Áudio enviado!'); }}
                onMouseLeave={() => setIsRecording(false)}
                size="icon" 
                variant="ghost" 
                className={`transition-colors ${isRecording ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-zinc-500 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
              </Button>
              <Button onClick={handleSendMessage} size="icon" className="bg-[#c30147] hover:bg-[#a0013a] text-white rounded-xl h-10 w-10">
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function sendBrowserNotification(title, options) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, options);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, options);
      }
    });
  }
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