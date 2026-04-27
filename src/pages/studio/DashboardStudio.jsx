/* ==========================================================================
   2. PROJETOS E TAREFAS (Com Modais e Chat Contextual)
   ========================================================================== */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, CheckSquare, Paperclip, Send, AlignLeft, X } from "lucide-react";

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
              
              {/* Simulador de Rich Text */}
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
            
            {/* Mensagens do Chat */}
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

            {/* Input do Chat */}
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