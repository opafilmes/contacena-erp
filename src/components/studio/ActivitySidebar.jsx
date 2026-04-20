import React, { useState } from "react";
import { Building2, Users, ChevronDown, ChevronRight } from "lucide-react";

export default function ActivitySidebar({ clients, usuarios, tasks, selectedClient, selectedUser, onSelectClient, onSelectUser }) {
  const [clientsOpen, setClientsOpen] = useState(true);
  const [teamOpen, setTeamOpen] = useState(true);

  const clientsWithTasks = clients.filter(c => tasks.some(t => t.client_id === c.id));
  const usersWithTasks = usuarios.filter(u =>
    tasks.some(t => {
      const ids = Array.isArray(t.responsavel_ids) ? t.responsavel_ids : (t.responsavel_id ? [t.responsavel_id] : []);
      return ids.includes(u.id);
    })
  );

  const navBtn = (isActive) =>
    `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
      isActive
        ? "bg-accent/20 text-accent font-semibold"
        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
    }`;

  const sectionHeader = (label, Icon, open, onToggle) => (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 mt-4 first:mt-0 hover:text-foreground transition-colors"
    >
      {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );

  return (
    <aside className="w-52 shrink-0 mr-6 pt-2">
      {/* CLIENTES */}
      {sectionHeader("Clientes", Building2, clientsOpen, () => setClientsOpen(o => !o))}
      {clientsOpen && (
        <nav className="space-y-1">
          <button
            onClick={() => { onSelectClient("todos"); onSelectUser(null); }}
            className={navBtn(selectedClient === "todos" && !selectedUser)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            Todos
            <span className="ml-auto text-xs opacity-60">{tasks.length}</span>
          </button>

          {clientsWithTasks.map(c => {
            const count = tasks.filter(t => t.client_id === c.id).length;
            return (
              <button
                key={c.id}
                onClick={() => { onSelectClient(c.id); onSelectUser(null); }}
                className={navBtn(selectedClient === c.id && !selectedUser)}
              >
                {c.logo
                  ? <img src={c.logo} alt={c.nome_fantasia} className="w-5 h-5 rounded-full object-cover shrink-0 bg-white p-0.5" />
                  : <Building2 className="w-3.5 h-3.5 shrink-0 opacity-70" />
                }
                <span className="truncate">{c.nome_fantasia}</span>
                <span className="ml-auto text-xs opacity-60">{count}</span>
              </button>
            );
          })}

          {clientsWithTasks.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-1 italic">Nenhum cliente com tarefas.</p>
          )}
        </nav>
      )}

      {/* EQUIPE */}
      {sectionHeader("Equipe", Users, teamOpen, () => setTeamOpen(o => !o))}
      {teamOpen && (
        <nav className="space-y-1">
          {usuarios.map(u => {
            const count = tasks.filter(t => {
              const ids = Array.isArray(t.responsavel_ids) ? t.responsavel_ids : (t.responsavel_id ? [t.responsavel_id] : []);
              return ids.includes(u.id);
            }).length;
            const initials = (u.nome || u.email || "?").slice(0, 2).toUpperCase();
            return (
              <button
                key={u.id}
                onClick={() => { onSelectUser(u.id); onSelectClient("todos"); }}
                className={navBtn(selectedUser === u.id)}
              >
                {u.foto_perfil
                  ? <img src={u.foto_perfil} alt={u.nome} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  : <span className="w-5 h-5 rounded-full bg-accent/30 text-accent text-[10px] font-bold flex items-center justify-center shrink-0">{initials}</span>
                }
                <span className="truncate">{u.nome?.split(" ")[0] || u.email}</span>
                <span className="ml-auto text-xs opacity-60">{count}</span>
              </button>
            );
          })}

          {usuarios.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-1 italic">Nenhum usuário.</p>
          )}
        </nav>
      )}
    </aside>
  );
}