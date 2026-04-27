import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Wallet, Video, Briefcase, Clapperboard, Package, 
  Archive, Settings, Users, Database, User, Shield, LogOut,
  Target, FileSignature, TrendingUp, TrendingDown, 
  RefreshCcw, BarChart3, ChevronsUpDown, Layers, ClipboardList,
  ChevronDown, ChevronRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAppMode } from "@/lib/AppModeContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SUPER_ADMIN_EMAIL = "contato@opafilmes.com";

// ── ESTRUTURA MÓDULO BUSINESS ──
const BUSINESS_NAV = [
  {
    items: [
      { label: "Dashboard Geral", to: "/app", icon: LayoutDashboard, exact: true },
    ]
  },
  {
    section: "Comercial",
    items: [
      { label: "Pipeline & Propostas", to: "/app/comercial?tab=propostas", icon: Target },
      { label: "Contratos", to: "/app/comercial?tab=contratos", icon: FileSignature },
      { label: "Clientes", to: "/app/diretorio", icon: Users },
    ]
  },
  {
    section: "Financeiro",
    items: [
      { label: "Visão Geral", to: "/app/financeiro?tab=dashboard", icon: Wallet },
      { label: "Contas a Receber", to: "/app/financeiro?tab=receber", icon: TrendingUp },
      { label: "Contas a Pagar", to: "/app/financeiro?tab=pagar", icon: TrendingDown },
      { label: "Conciliação", to: "/app/financeiro?tab=conciliacao", icon: RefreshCcw },
      { label: "Relatórios", to: "/app/financeiro?tab=relatorios", icon: BarChart3 },
    ]
  }
];

// ── ESTRUTURA MÓDULO STUDIO ──
const STUDIO_NAV = [
  {
    section: "Gestão",
    items: [
      { label: "Dashboard", to: "/app/studio", icon: LayoutDashboard, exact: true },
      { label: "Projetos", to: "/app/producao", icon: Layers },
      { label: "Relatórios", to: "/app/studio/relatorios", icon: BarChart3 },
    ]
  },
  {
    section: "Produção",
    items: [
      { label: "Ordem do Dia", to: "/app/studio/call-sheet", icon: FileSignature },
      { label: "Equipamentos", to: "/app/studio/inventario", icon: ClipboardList },
    ]
  }
];

export default function SidebarDinamica({ tenant, usuario }) {
  const { appMode, toggleMode, isEquipe } = useAppMode();
  const location = useLocation();
  const isBusiness = appMode === "business";
  const accent = isBusiness ? "business" : "studio";
  const navStructure = isBusiness ? BUSINESS_NAV : STUDIO_NAV;
  const isSuperAdmin = usuario?.email === SUPER_ADMIN_EMAIL;

  const [adminOpen, setAdminOpen] = useState(false);

  const initials = usuario?.nome
    ? usuario.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  const isActive = (to, exact) => {
    if (to.includes("?")) {
      return location.pathname + location.search === to;
    }
    const path = to.split("?")[0];
    return exact ? location.pathname === path : location.pathname.startsWith(path) && path !== "/app";
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#09090B] border-r border-zinc-800/60 flex flex-col z-40">
      
      {/* ── TOPO: SELETOR DE CONTEXTO ── */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-between w-full px-4 py-4 border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors outline-none cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            {tenant?.logo ? (
              <img src={tenant.logo} alt={tenant.nome_fantasia} className="h-9 w-9 rounded-lg object-cover shrink-0 shadow-sm" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
                <span className="text-zinc-300 font-heading font-bold text-sm">{tenant?.nome_fantasia?.[0] || "C"}</span>
              </div>
            )}
            <div className="text-left min-w-0">
              <p className="font-heading font-bold text-zinc-100 text-sm truncate leading-tight">
                {tenant?.nome_fantasia || "ContaCena ERP"}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isBusiness ? "text-[#1abea0]" : "text-[#c30147]"}`}>
                {isBusiness ? "Business" : "Studio"}
              </p>
            </div>
          </div>
          {!isEquipe && <ChevronsUpDown className="w-4 h-4 text-zinc-500 shrink-0" />}
        </DropdownMenuTrigger>
        
        {!isEquipe && (
          <DropdownMenuContent align="start" className="w-56 bg-zinc-950 border-zinc-800 p-1">
            <DropdownMenuItem onClick={() => { if(!isBusiness) toggleMode(); }} className={`cursor-pointer p-2 rounded-md mb-1 ${isBusiness ? "bg-[#1abea0]/10" : "hover:bg-zinc-900"}`}>
              <Briefcase className={`w-4 h-4 mr-3 ${isBusiness ? "text-[#1abea0]" : "text-zinc-500"}`} />
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${isBusiness ? "text-[#1abea0]" : "text-zinc-300"}`}>Business</span>
                <span className="text-[10px] text-zinc-500">Gestão e Financeiro</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { if(isBusiness) toggleMode(); }} className={`cursor-pointer p-2 rounded-md ${!isBusiness ? "bg-[#c30147]/10" : "hover:bg-zinc-900"}`}>
              <Video className={`w-4 h-4 mr-3 ${!isBusiness ? "text-[#c30147]" : "text-zinc-500"}`} />
              <div className="flex flex-col">
                <span className={`text-sm font-medium ${!isBusiness ? "text-[#c30147]" : "text-zinc-300"}`}>Studio</span>
                <span className="text-[10px] text-zinc-500">Produção e Set</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      {/* ── NAVEGAÇÃO PRINCIPAL COMPACTADA ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {/* Reduzi o padding vertical e o space-y de 8 para 5 */}
        <nav className="px-3 py-4 space-y-5">
          {navStructure.map((group, idx) => (
            <div key={idx}>
              {group.section && (
                // Reduzi a margem inferior (mb) do cabeçalho da seção
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-3 mb-1.5">
                  {group.section}
                </h4>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.to, item.exact);
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      // Reduzi o padding vertical (py) dos links
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? accent === "business" ? "bg-[#1abea0]/10 text-[#1abea0]" : "bg-[#c30147]/10 text-[#c30147]"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                      }`}
                    >
                      <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? (accent === "business" ? "text-[#1abea0]" : "text-[#c30147]") : "text-zinc-500"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* ── SEÇÃO ADMINISTRAÇÃO INCORPORADA (BUSINESS) ── */}
          {isBusiness && (
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-3 mb-1.5 pt-3 border-t border-zinc-800/50">
                Sistema
              </h4>
              <div className="space-y-0.5">
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    adminOpen ? "text-zinc-200 bg-zinc-900/50" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                  }`}
                >
                  <Settings className={`w-[18px] h-[18px] shrink-0 ${adminOpen ? "text-[#1abea0]" : "text-zinc-500"}`} />
                  <span className="flex-1 text-left">Configurações</span>
                  {adminOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                </button>

                {adminOpen && (
                  <div className="ml-7 mt-1 space-y-1 border-l border-zinc-800 pl-3">
                    <Link to="/app/configuracoes-empresa" className={`block px-2 py-1.5 rounded-md text-xs transition-colors ${isActive("/app/configuracoes-empresa") ? "text-[#1abea0] font-bold" : "text-zinc-500 hover:text-zinc-300"}`}>
                      Minha Produtora
                    </Link>
                    <Link to="/app/gestao-equipe" className={`block px-2 py-1.5 rounded-md text-xs transition-colors ${isActive("/app/gestao-equipe") ? "text-[#1abea0] font-bold" : "text-zinc-500 hover:text-zinc-300"}`}>
                      Usuários
                    </Link>
                    <Link to="/app/cadastros" className={`block px-2 py-1.5 rounded-md text-xs transition-colors ${isActive("/app/cadastros") ? "text-[#1abea0] font-bold" : "text-zinc-500 hover:text-zinc-300"}`}>
                      Cadastros
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* ── RODAPÉ: USER PROFILE (CLEAN) ── */}
      <div className="shrink-0 p-3 border-t border-zinc-800/60 bg-zinc-950">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-zinc-900/80 transition-all outline-none border border-transparent hover:border-zinc-800">
            <Avatar className="h-9 w-9 border border-zinc-800 shrink-0 shadow-sm">
              <AvatarImage src={usuario?.foto_perfil} />
              <AvatarFallback className="bg-zinc-800 text-zinc-300 text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm text-zinc-200 font-bold truncate leading-tight">{usuario?.nome || "Usuário"}</p>
              <p className="text-[11px] text-zinc-500 truncate font-medium">{usuario?.role}</p>
            </div>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border-zinc-800 text-zinc-300 pb-1">
            <div className="px-3 py-2 mb-1 border-b border-zinc-800/60 text-xs text-zinc-500 truncate">{usuario?.email}</div>
            <DropdownMenuItem asChild className="cursor-pointer hover:bg-zinc-900 hover:text-white">
              <Link to="/app/meu-perfil" className="flex items-center w-full"><User className="w-4 h-4 mr-2 text-zinc-400" /> Meu Perfil</Link>
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem asChild className="cursor-pointer hover:bg-[#1abea0]/10 hover:text-[#1abea0] text-[#1abea0] mt-1">
                <Link to="/super-admin" className="flex items-center w-full"><Shield className="w-4 h-4 mr-2" /> Painel Super Admin</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator className="bg-zinc-800 my-1" />
            <DropdownMenuItem onClick={() => base44.auth.logout()} className="cursor-pointer text-red-400 hover:bg-red-500/10 hover:text-red-300 focus:text-red-300 focus:bg-red-500/10">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </aside>
  );
}