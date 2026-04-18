import React, { useState } from "react";
import { LogOut, Settings, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import CaixinhaModal from "@/components/financeiro/CaixinhaModal";

export default function TopBar({ tenant, usuario }) {
  const [caixinhaOpen, setCaixinhaOpen] = useState(false);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const initials = usuario?.nome
    ? usuario.nome
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo / Tenant */}
        <Link to="/" className="flex items-center gap-3">
          {tenant?.logo ? (
            <img
              src={tenant.logo}
              alt={tenant.nome_fantasia}
              className="h-8 w-8 rounded-lg object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-heading font-bold text-sm">
                {tenant?.nome_fantasia?.[0] || "C"}
              </span>
            </div>
          )}
          <span className="font-heading font-semibold text-foreground text-lg tracking-tight">
            {tenant?.nome_fantasia || "ConTaCena"}
          </span>
        </Link>

        {/* Caixinha Button */}
        <button
          onClick={() => setCaixinhaOpen(true)}
          className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors"
        >
          🪙 Caixinha
        </button>

        {/* Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 hover:bg-secondary/50 transition-colors">
              <Avatar className="h-9 w-9 border-2 border-primary/30">
                <AvatarImage src={usuario?.foto_perfil} />
                <AvatarFallback className="bg-primary/20 text-primary font-heading font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-popover/95 backdrop-blur-xl border-border/50"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{usuario?.nome}</p>
              <p className="text-xs text-muted-foreground">{usuario?.role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/configuracoes-empresa" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações da Empresa
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/meu-perfil" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>

    <CaixinhaModal
      open={caixinhaOpen}
      onClose={() => setCaixinhaOpen(false)}
      tenantId={tenant?.id}
    />
    </>
  );
}