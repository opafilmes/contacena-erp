import React from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckSquare, Package } from "lucide-react";

const HUBS = [
  {
    icon: CheckSquare,
    title: "Gestão de Atividades",
    subtitle: "Tarefas, prazos, delegação e acompanhamento de equipe",
    to: "/studio/atividades",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=1974&auto=format&fit=crop",
    accent: "rgba(34,197,94,0.55)",
    iconColor: "text-green-300",
    glow: "group-hover:shadow-[0_0_0_1.5px_rgba(34,197,94,0.45),0_8px_60px_-12px_rgba(34,197,94,0.5)]",
    emoji: "🎬",
  },
  {
    icon: Package,
    title: "Inventário de Equipamentos",
    subtitle: "Controle de ativos, reservas e detecção de conflitos",
    to: "/studio/inventario",
    image: "https://images.unsplash.com/photo-1604978880209-8e21f7b69e50?q=80&w=1974&auto=format&fit=crop",
    accent: "rgba(139,92,246,0.55)",
    iconColor: "text-violet-300",
    glow: "group-hover:shadow-[0_0_0_1.5px_rgba(139,92,246,0.45),0_8px_60px_-12px_rgba(139,92,246,0.5)]",
    emoji: "🎥",
  },
];

function HubCard({ hub, index }) {
  const { icon: Icon } = hub;
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={hub.to} className="block">
        <div
          className={`
            group relative overflow-hidden rounded-2xl min-h-[260px] flex flex-col justify-between
            border border-white/[0.08] cursor-pointer
            transition-all duration-500 ease-out
            ${hub.glow}
          `}
        >
          {/* BG */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out scale-100 group-hover:scale-105"
            style={{ backgroundImage: `url(${hub.image})`, filter: "brightness(0.3)" }}
          />
          {/* Gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(to top, #09090B 0%, #09090Bcc 35%, transparent 70%)" }}
          />
          {/* Accent vignette */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 80% 20%, ${hub.accent} 0%, transparent 65%)` }}
          />
          {/* Ring */}
          <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-1 ring-white/10 transition-all duration-500 pointer-events-none" />

          {/* Top icon */}
          <div className="relative z-10 p-8 pb-0">
            <div className={`inline-flex p-3 rounded-xl bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] ${hub.iconColor}`}>
              <Icon className="w-6 h-6 stroke-[1.5]" />
            </div>
          </div>

          {/* Bottom text */}
          <div className="relative z-10 p-8 pt-4">
            <p className="text-2xl mb-1">{hub.emoji}</p>
            <p className="font-heading font-bold text-white text-xl tracking-tight leading-tight drop-shadow-md">
              {hub.title}
            </p>
            <p className="text-white/50 text-sm mt-1.5 leading-relaxed font-body">
              {hub.subtitle}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const PERM_MAP = {
  "/studio/atividades": "perm_studio_atividades",
  "/studio/inventario": "perm_studio_inventario",
};

export default function Studio() {
  const { usuario } = useOutletContext();

  const visibleHubs = HUBS.filter(hub => {
    const permKey = PERM_MAP[hub.to];
    if (!permKey) return true;
    return usuario?.[permKey] !== false;
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col" style={{ background: "#09090B" }}>
      <div className="px-6 pt-12 pb-8 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-white tracking-tight">
            Studio
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">Selecione um submódulo para operar.</p>
        </motion.div>
      </div>

      <div className="flex-1 px-6 pb-14 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {visibleHubs.map((hub, i) => (
            <HubCard key={hub.to} hub={hub} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}