import React from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Crown } from "lucide-react";
import { base44 } from "@/api/base44Client";

const PLANS = [
  {
    id: "Básico",
    icon: Zap,
    label: "Básico",
    price: "Gratuito",
    desc: "Para freelancers que estão começando.",
    color: "border-border/50",
    iconColor: "text-muted-foreground",
    features: ["Módulo Comercial", "Cadastro de Clientes"],
    disabled: ["Financeiro", "Studio / Produção", "Equipe & Fornecedores"],
  },
  {
    id: "Essencial",
    icon: Star,
    label: "Essencial",
    price: "R$ 49/mês",
    desc: "Para produtoras em crescimento.",
    color: "border-violet-500/40",
    iconColor: "text-violet-400",
    features: ["Módulo Comercial", "Módulo Financeiro", "Cadastro Completo (Clientes, Fornecedores, Equipe, Categorias, Contas)"],
    disabled: ["Studio / Produção (Kanban)"],
    highlight: true,
  },
  {
    id: "Profissional",
    icon: Crown,
    label: "Profissional",
    price: "R$ 99/mês",
    desc: "Para produtoras que precisam de tudo.",
    color: "border-green-500/40",
    iconColor: "text-green-400",
    features: ["Tudo do Essencial", "Studio & Produção (Kanban)", "Ordem do dia, Inventário de Equipamentos"],
    disabled: [],
  },
];

export default function EscolhaPlano({ tenant }) {
  const handleChoosePlan = async (planId) => {
    if (planId === "Básico") {
      // Activate free plan directly
      await base44.entities.Tenant.update(tenant.id, {
        plan_tier: "Básico",
        subscription_status: "Active",
      });
      window.location.reload();
    } else {
      // Redirect to Stripe checkout via backend function
      const res = await base44.functions.invoke("createCheckoutSession", { planId, tenantId: tenant.id });
      if (res.data?.url) window.location.href = res.data.url;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6" style={{ background: "#09090B" }}>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
          ⏳ Seu período de trial encerrou
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
          Escolha seu Plano
        </h1>
        <p className="text-zinc-500 mt-3 text-sm max-w-md mx-auto">
          Continue usando o ContaCena escolhendo o plano que melhor se adapta à sua produtora.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className={`relative flex flex-col rounded-2xl border bg-card/60 backdrop-blur-md p-6 ${plan.color} ${plan.highlight ? "ring-1 ring-violet-500/30" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold uppercase tracking-widest">
                  Recomendado
                </div>
              )}
              <div className={`p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] w-fit mb-4 ${plan.iconColor}`}>
                <Icon className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h2 className="font-heading font-bold text-white text-xl">{plan.label}</h2>
              <p className="text-muted-foreground text-xs mt-1 mb-4">{plan.desc}</p>
              <p className="font-heading text-2xl font-bold text-white mb-6">{plan.price}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
                {plan.disabled.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-600 line-through">
                    <Check className="w-4 h-4 text-zinc-700 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleChoosePlan(plan.id)}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  plan.highlight
                    ? "bg-violet-600 hover:bg-violet-500 text-white"
                    : plan.id === "Profissional"
                    ? "bg-green-600 hover:bg-green-500 text-white"
                    : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/50"
                }`}
              >
                {plan.id === "Básico" ? "Usar Gratuitamente" : `Assinar ${plan.label}`}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="text-zinc-600 text-xs mt-8">
        Pagamentos processados com segurança via Stripe. Cancele a qualquer momento.
      </p>
    </div>
  );
}