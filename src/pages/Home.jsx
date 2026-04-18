import React from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import ModuleCard from "../components/hub/ModuleCard";

const ALL_MODULES = [
  {
    icon: "🗂️",
    title: "CADASTROS",
    subtitle: "Clientes, Fornecedores, Equipe",
    to: "/cadastros",
    requiredPlan: null,
  },
  {
    icon: "📝",
    title: "COMERCIAL",
    subtitle: "Propostas e Contratos",
    to: "/comercial",
    requiredPlan: null,
  },
  {
    icon: "💰",
    title: "FINANCEIRO",
    subtitle: "Receitas e Despesas",
    to: "/financeiro",
    requiredPlan: null,
  },
  {
    icon: "🚀",
    title: "PRODUÇÃO & JOBS",
    subtitle: "Ordem do dia, Inventário, Kanban",
    to: "/producao",
    requiredPlan: "Profissional",
  },
];

export default function Home() {
  const { tenant, usuario } = useOutletContext();
  const plano = tenant?.plano_assinatura || "Básico";

  const visibleModules = ALL_MODULES.filter(
    (m) => !m.requiredPlan || m.requiredPlan === plano
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero section */}
      <div className="px-6 pt-10 pb-6 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Olá, {usuario?.nome?.split(" ")[0] || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-base">
            Selecione um módulo para começar.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-primary">
              Plano {plano}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Module Grid */}
      <div className="flex-1 px-6 pb-12 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
          {visibleModules.map((mod, i) => (
            <ModuleCard
              key={mod.to}
              icon={mod.icon}
              title={`${mod.title}\n${mod.subtitle}`}
              to={mod.to}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}