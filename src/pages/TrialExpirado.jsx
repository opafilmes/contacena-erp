import React from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Clock, MessageCircle, ArrowRight, Play } from "lucide-react";

// Replace with your WhatsApp number
const WHATSAPP_URL = "https://wa.me/5511999999999?text=Ol%C3%A1%2C+gostaria+de+assinar+o+ContaCena+ERP";

export default function TrialExpirado({ tenant }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "linear-gradient(145deg, #0f0f1a 0%, #1a1228 50%, #0d1117 100%)" }}
    >
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-md"
      >
        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
          </div>
          <span className="text-white/60 text-sm font-medium">ContaCena ERP</span>
        </div>

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-5">
          ⏳ Período de trial encerrado
        </div>

        <h1 className="font-heading text-3xl font-bold text-white mb-3 leading-tight">
          Seu trial expirou
        </h1>
        <p className="text-white/40 text-sm leading-relaxed mb-8">
          Esperamos que você tenha aproveitado os 5 dias testando o ContaCena!<br />
          Para continuar usando todos os recursos, assine um plano.
        </p>

        {/* CTA Principal */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors w-full justify-center mb-3"
        >
          <MessageCircle className="w-5 h-5" />
          Falar com suporte para assinar
        </a>

        {/* CTA Secundário — escolher plano inline via Stripe */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
        >
          Ver planos e preços <ArrowRight className="w-3.5 h-3.5" />
        </a>

        {/* Info empresa */}
        {tenant?.nome_fantasia && (
          <p className="mt-8 text-white/20 text-xs">
            Empresa: {tenant.nome_fantasia}
          </p>
        )}

        {/* Sair */}
        <button
          onClick={() => base44.auth.logout()}
          className="mt-3 text-xs text-white/20 hover:text-white/40 transition-colors"
        >
          Sair da conta
        </button>
      </motion.div>
    </div>
  );
}