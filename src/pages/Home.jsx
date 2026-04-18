import React from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MODULES = [
  {
    icon: "🚀",
    title: "PRODUÇÃO & JOBS",
    subtitle: "Ordem do dia, Inventário, Kanban",
    to: "/producao",
    requiredPlan: "Profissional",
    gridClass: "col-span-2 md:col-span-2",
    minH: "min-h-[200px]",
    accentColor: "from-green-500/20 via-transparent to-transparent",
    iconColor: "text-green-400",
    glowColor: "group-hover:shadow-[0_8px_60px_-12px_rgba(34,197,94,0.35)]",
    borderGlow: "group-hover:border-green-500/30",
  },
  {
    icon: "💰",
    title: "FINANCEIRO",
    subtitle: "Receitas e Despesas",
    to: "/financeiro",
    requiredPlan: null,
    gridClass: "col-span-1",
    minH: "min-h-[160px]",
    accentColor: "from-violet-500/15 via-transparent to-transparent",
    iconColor: "text-violet-400",
    glowColor: "group-hover:shadow-[0_8px_40px_-12px_rgba(139,92,246,0.3)]",
    borderGlow: "group-hover:border-violet-500/30",
  },
  {
    icon: "📝",
    title: "COMERCIAL",
    subtitle: "Propostas e Contratos",
    to: "/comercial",
    requiredPlan: null,
    gridClass: "col-span-1",
    minH: "min-h-[160px]",
    accentColor: "from-sky-500/15 via-transparent to-transparent",
    iconColor: "text-sky-400",
    glowColor: "group-hover:shadow-[0_8px_40px_-12px_rgba(14,165,233,0.3)]",
    borderGlow: "group-hover:border-sky-500/30",
  },
  {
    icon: "🗂️",
    title: "CADASTROS",
    subtitle: "Clientes, Fornecedores, Equipe",
    to: "/cadastros",
    requiredPlan: null,
    gridClass: "col-span-1",
    minH: "min-h-[160px]",
    accentColor: "from-amber-500/15 via-transparent to-transparent",
    iconColor: "text-amber-400",
    glowColor: "group-hover:shadow-[0_8px_40px_-12px_rgba(245,158,11,0.3)]",
    borderGlow: "group-hover:border-amber-500/30",
  },
];

function BentoCard({ mod, index, locked }) {
  const inner = (
    <div
      className={`
        group relative overflow-hidden rounded-2xl h-full flex flex-col justify-between p-6
        bg-white/[0.04] backdrop-blur-[12px]
        border border-white/[0.07]
        transition-all duration-500 cursor-pointer
        ${mod.minH}
        ${mod.glowColor}
        ${mod.borderGlow}
        ${locked ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Gradient accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${mod.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

      {/* Top ambient orb */}
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.02] blur-3xl group-hover:bg-white/[0.04] transition-all duration-700 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between">
        <span className={`text-3xl transition-transform duration-500 group-hover:scale-110 ${mod.iconColor}`}>
          {mod.icon}
        </span>
        {locked && (
          <span className="text-[10px] font-semibold uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
            Pro
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="font-heading font-bold text-foreground text-lg tracking-tight leading-tight">
          {mod.title}
        </p>
        <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
          {mod.subtitle}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      className={mod.gridClass}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      {locked ? inner : <Link to={mod.to} className="block h-full">{inner}</Link>}
    </motion.div>
  );
}

export default function Home() {
  const { tenant, usuario } = useOutletContext();
  const plano = tenant?.plano_assinatura || "Básico";
  const role = usuario?.role || "Admin";
  const isProducao = role === "Producao";

  // Filter modules based on role
  const visibleModules = MODULES.filter(mod => {
    if (isProducao && (mod.to === "/financeiro" || mod.to === "/comercial")) return false;
    return true;
  });

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex flex-col"
      style={{ background: "#09090B" }}
    >
      {/* Hero */}
      <div className="px-6 pt-12 pb-8 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Olá, {usuario?.nome?.split(" ")[0] || "Usuário"} 👋
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Selecione um módulo para começar.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">
              Plano {plano}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid */}
      <div className="flex-1 px-6 pb-14 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-2 gap-4">
          {visibleModules.map((mod, i) => {
            const locked = mod.requiredPlan && mod.requiredPlan !== plano;
            return <BentoCard key={mod.to} mod={mod} index={i} locked={locked} />;
          })}
        </div>
      </div>
    </div>
  );
}