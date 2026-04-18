import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function sendBrowserNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

export default function TaskComments({ taskId, inquilinoId, currentUser, responsavelId, task }) {
  const [comments, setComments] = useState([]);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    base44.entities.TaskComment.filter({ task_id: taskId })
      .then(data => {
        setComments(data.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
        setLoading(false);
      });
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleSend = async () => {
    if (!texto.trim()) return;
    setSending(true);
    await base44.entities.TaskComment.create({
      texto: texto.trim(),
      task_id: taskId,
      usuario_id: currentUser?.id || "",
      usuario_nome: currentUser?.nome || "Usuário",
      inquilino_id: inquilinoId,
    });
    // Notify responsavel if different from sender
    if (responsavelId && responsavelId !== currentUser?.id) {
      sendBrowserNotification(
        `Novo comentário em "${task?.titulo || "Tarefa"}"`,
        `${currentUser?.nome || "Alguém"}: ${texto.trim().slice(0, 80)}`
      );
    }
    setTexto("");
    const data = await base44.entities.TaskComment.filter({ task_id: taskId });
    setComments(data.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
    setSending(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Comentários</span>
        {comments.length > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-bold">{comments.length}</span>
        )}
      </div>

      {/* Messages */}
      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhum comentário ainda.</p>
        ) : (
          comments.map(c => {
            const isMe = c.usuario_id === currentUser?.id;
            return (
              <div key={c.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${isMe ? "bg-accent/30 text-foreground" : "bg-secondary/50 text-foreground"}`}>
                  {!isMe && <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">{c.usuario_nome}</p>}
                  <p className="leading-relaxed break-words">{c.texto}</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 text-right">
                    {c.created_date ? format(new Date(c.created_date), "dd/MM HH:mm", { locale: ptBR }) : ""}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <Textarea
          placeholder="Escreva um comentário..."
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="min-h-[60px] text-sm resize-none"
        />
        <Button size="icon" onClick={handleSend} disabled={sending || !texto.trim()} className="h-[60px] w-10 shrink-0">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}