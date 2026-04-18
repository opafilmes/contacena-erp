import React from "react";
import { motion } from "framer-motion";
import { formatBRL } from "@/utils/format";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";

function SummaryCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden rounded-2xl p-5
        bg-white/[0.04] backdrop-blur-[12px]
        border border-white/[0.07]
        flex flex-col gap-3
      `}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.bg}`}>
        <Icon className={`w-4 h-4 ${color.text}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground/70 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-heading font-bold ${color.text}`}>{formatBRL(value)}</p>
      </div>
      {/* Ambient orb */}
      <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-20 ${color.orb}`} />
    </motion.div>
  );
}

export default function FinancialSummaryCards({ totalReceber, totalPagar }) {
  const saldo = totalReceber - totalPagar;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <SummaryCard
        icon={TrendingUp}
        label="Total a Receber (Mês)"
        value={totalReceber}
        color={{ bg: "bg-green-500/15", text: "text-green-400", orb: "bg-green-500" }}
        delay={0}
      />
      <SummaryCard
        icon={TrendingDown}
        label="Total a Pagar (Mês)"
        value={totalPagar}
        color={{ bg: "bg-red-500/15", text: "text-red-400", orb: "bg-red-500" }}
        delay={0.08}
      />
      <SummaryCard
        icon={Scale}
        label="Saldo Previsto"
        value={saldo}
        color={saldo >= 0
          ? { bg: "bg-violet-500/15", text: "text-violet-400", orb: "bg-violet-500" }
          : { bg: "bg-amber-500/15", text: "text-amber-400", orb: "bg-amber-500" }
        }
        delay={0.16}
      />
    </div>
  );
}