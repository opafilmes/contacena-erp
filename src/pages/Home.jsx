import React from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Briefcase, LineChart, Video } from "lucide-react";

const MODULES = [
  {
    Icon: Video,
    title: "Studio",
    subtitle: "Ordem do dia, Inventário, Produção",
    to: "/producao",
    requiredPlan: "Profissional",
    gridClass: "col-span-2",
    minH: "min-h-[260px]",
    image: "https://images.unsplash.com/photo-1632187981988-40f3cbaeef5e?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    accent: "rgba(34,197,94,0.55)",
    iconColor: "text-green-300",
    glowColor: "group-hover:shadow-[0_0_0_1.5px_rgba(34,197,94,0.45),0_8px_60px_-12px_rgba(34,197,94,0.5)]",
  },
  {
    Icon: LineChart,
    title: "Financeiro",
    subtitle: "Receitas e Despesas",
    to: "/financeiro",
    requiredPlan: "Financeiro",
    gridClass: "col-span-1",
    minH: "min-h-[200px]",
    image: "https://images.unsplash.com/photo-1776531056208-1e1bec2642ec?q=80&w=2564&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    accent: "rgba(139,92,246,0.55)",
    iconColor: "text-violet-300",
    glowColor: "group-hover:shadow-[0_0_0_1.5px_rgba(139,92,246,0.45),0_8px_40px_-12px_rgba(139,92,246,0.5)]",
  },
  {
    Icon: Briefcase,
    title: "Comercial",
    subtitle: "Propostas e Contratos",
    to: "/comercial",
    requiredPlan: null,
    gridClass: "col-span-1",
    minH: "min-h-[200px]",
    image: "https://images.unsplash.com/photo-1635927555354-e7fa116808bd?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    accent: "rgba(14,165,233,0.55)",
    iconColor: "text-sky-300",
    glowColor: "group-hover:shadow-[0_0_0_1.5px_rgba(14,165,233,0.45),0_8px_40px_-12px_rgba(14,165,233,0.5)]",
  },
];

function BentoCard({ mod, index, locked }) {
  const { Icon } = mod;

  const inner = (
    <div
      className={`
        group relative overflow-hidden rounded-2xl h-full flex flex-col justify-between
        border border-white/[0.08] cursor-pointer
        transition-all duration-500 ease-out
        ${mod.minH}
        ${mod.glowColor}
        ${locked ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {/* Background image with zoom on hover */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
        style={{ backgroundImage: `url(${mod.image})`, filter: "brightness(0.35)" }}
      />

      {/* Deep cinematic gradient overlay — bottom to transparent */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to top, #09090B 0%, #09090Bcc 30%, transparent 70%)`,
        }}
      />

      {/* Accent color vignette on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 20%, ${mod.accent} 0%, transparent 65%)` }}
      />

      {/* Border glow rim */}
      <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-1 ring-white/10 transition-all duration-500 pointer-events-none" />

      {/* Top: Icon + Pro badge */}
      <div className="relative z-10 flex items-start justify-between p-6 pb-0">
        <div className={`p-2 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] ${mod.iconColor}`}>
          <Icon className="w-5 h-5 stroke-[1.5]" />
        </div>
        {locked && (
          <span className="text-[10px] font-semibold uppercase tracking-widest bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
            Pro
          </span>
        )}
      </div>

      {/* Bottom: Text */}
      <div className="relative z-10 p-6 pt-4">
        <p className="font-heading font-bold text-white text-lg tracking-tight leading-tight drop-shadow-md">
          {mod.title}
        </p>
        <p className="text-white/50 text-xs mt-1 leading-relaxed font-body">
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
      transition={{ duration: 0.55, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
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

  const visibleModules = MODULES.filter(mod => {
    if (isProducao && (mod.to === "/financeiro" || mod.to === "/comercial")) return false;
    if (mod.requiredPlan === "Financeiro" && !["Financeiro", "Profissional"].includes(plano)) return false;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col" style={{ background: "#09090B" }}>
      {/* Hero */}
      <div className="px-6 pt-12 pb-8 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Olá, {usuario?.nome?.split(" ")[0] || "Usuário"}
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Selecione um módulo para começar.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Plano {plano}</span>
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