import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, Wallet, FileCheck, Video,
  Briefcase, Clapperboard, Package, Archive, ChevronDown, ChevronRight,
  Settings, Users, Database, User, Shield, LogOut
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppMode } from "@/lib/AppModeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const SUPER_ADMIN_EMAIL = "contato@opafilmes.com";

const BUSINESS_NAV = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/app",
    exact: true,
  },
  {
    label: "Comercial",
    icon: TrendingUp,
    children: [
      { label: "Dashboard Comercial", to: "/app/comercial?tab=dashboard" },
      { label: "Pipeline / Propostas", to: "/app/comercial?tab=propostas" },
      { label: "Contratos", to: "/app/comercial?tab=contratos" },
      { label: "Clientes", to: "/app/diretorio" },
    ],
  },
  {
    label: "Financeiro",
    icon: Wallet,
    children: [
      { label: "Visão Geral", to: "/app/financeiro?tab=dashboard" },
      { label: "Contas a Receber", to: "/app/financeiro?tab=receber" },
      { label: "Contas a Pagar", to: "/app/financeiro?tab=pagar" },
      { label: "Conciliação Bancária", to: "/app/financeiro?tab=conciliacao" },
      { label: "Inventário (Ativos)", to: "/app/financeiro?tab=inventario" },
      { label: "Relatórios", to: "/app/financeiro?tab=relatorios" },
    ],
  },
];

const STUDIO_NAV = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/app/studio",
    exact: true,
  },
  {
    label: "Produção",
    icon: Clapperboard,
    children: [
      { label: "Jobs / Kanban", to: "/app/producao" },
      { label: "Ordem do Dia", to: "/app/studio/call-sheet" },
      { label: "Atividades", to: "/app/studio/atividades" },
    ],
  },
  {
    label: "Inventário",
    icon: Package,
    children: [
      { label: "Equipamentos", to: "/app/studio/inventario" },
      { label: "Reservas", to: "/app/studio/inventario?tab=reservas" },
    ],
  },
  {
    label: "Arquivo",
    icon: Archive,
    to: "/app/studio/arquivo",
  },
];

function NavItem({ item, accent }) {
  const location = useLocation();
  
  // Função atualizada para entender submenus com ?tab=...
  const isActive = (to, exact) => {
    if (to.includes("?")) {
      return location.pathname + location.search === to;
    }
    const path = to.split("?")[0];
    return exact ? location.pathname === path : location.pathname.startsWith(path) && path !== "/app";
  };

  const [open, setOpen] = useState(() => {
    if (item.children) return item.children.some(c => isActive(c.to));
    return false;
  });

  if (item.children) {
    const anyActive = item.children.some(c => isActive(c.to));
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
            anyActive
              ? accent === "violet" ? "text-violet-300 bg-violet-500/10" : "text-emerald-300 bg-emerald-500/10"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
          }`}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
        </button>
        {open && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l border-zinc-800 pl-3">
            {item.children.map(child => (
              <Link
                key={child.to}
                to={child.to}
                className={`block px-2 py-1.5 rounded-md text-xs transition-colors ${
                  isActive(child.to)
                    ? accent === "violet" ? "text-violet-300 font-semibold" : "text-emerald-300 font-semibold"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const active = isActive(item.to, item.exact);
  return (
    <Link
      to={item.to}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? accent === "violet" ? "bg-violet-500/15 text-violet-300 border border-violet-500/25" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export default function SidebarDinamica({ tenant, usuario }) {
  const { appMode, toggleMode, isEquipe } = useAppMode();
  const isBusiness = appMode === "business";
  const accent = isBusiness ? "violet" : "emerald";
  const nav = isBusiness ? BUSINESS_NAV : STUDIO_NAV;
  const isSuperAdmin = usuario?.email === SUPER_ADMIN_EMAIL;

  const initials = usuario?.nome
    ? usuario.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-zinc-950 border-r border-zinc-800/80 flex flex-col z-40">
      {/* Logo / Tenant */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-800/80 shrink-0">
        <Link to="/app" className="flex items-center gap-3 min-w-0">
          {tenant?.logo ? (
            <img src={tenant.logo} alt={tenant.nome_fantasia} className="h-8 w-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
              <span className="text-violet-300 font-heading font-bold text-sm">{tenant?.nome_fantasia?.[0] || "C"}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-heading font-semibold text-zinc-100 text-sm truncate leading-tight">{tenant?.nome_fantasia || "ContaCena"}</p>
            <p className={`text-[10px] font-medium uppercase tracking-wider ${isBusiness ? "text-violet-400" : "text-emerald-400"}`}>
              {isBusiness ? "Modo Business" : "Modo Studio"}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-3 mb-2">
          {isBusiness ? "Gestão" : "Produção"}
        </p>
        {nav.map(item => (
          <NavItem key={item.label} item={item} accent={accent} />
        ))}

        {/* Separator */}
        <div className="pt-4 pb-2">
          <div className="border-t border-zinc-800/80" />
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-3 mt-3 mb-2">Conta</p>
        </div>

        <Link to="/app/configuracoes-empresa" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors">
          <Settings className="w-4 h-4 shrink-0" /> Configurações
        </Link>
        <Link to="/app/gestao-equipe" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors">
          <Users className="w-4 h-4 shrink-0" /> Usuários
        </Link>
        <Link to="/app/cadastros" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors">
          <Database className="w-4 h-4 shrink-0" /> Cadastros
        </Link>
        <Link to="/app/meu-perfil" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors">
          <User className="w-4 h-4 shrink-0" /> Meu Perfil
        </Link>
        {isSuperAdmin && (
          <Link to="/super-admin" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors">
            <Shield className="w-4 h-4 shrink-0" /> Super Admin
          </Link>
        )}
      </nav>

      {/* Footer: Mode Toggle + User */}
      <div className="shrink-0 border-t border-zinc-800/80 p-3 space-y-2">
        {!isEquipe && (
          <button
            onClick={toggleMode}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
              isBusiness
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
            }`}
          >
            {isBusiness
              ? <><Video className="w-4 h-4 shrink-0" /> Ir para Modo Studio</>
              : <><Briefcase className="w-4 h-4 shrink-0" /> Ir para Modo Business</>
            }
          </button>
        )}
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar className="h-8 w-8 border border-zinc-700 shrink-0">
            <AvatarImage src={usuario?.foto_perfil} />
            <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-zinc-200 font-medium truncate leading-tight">{usuario?.nome || "Usuário"}</p>
            <p className="text-[11px] text-zinc-500 truncate">{usuario?.role}</p>
          </div>
          <button onClick={() => base44.auth.logout()} className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}