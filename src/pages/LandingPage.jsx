import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, TrendingUp, FileText, ArrowRight, CheckCircle, Play, Shield, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Camera,
    title: "Gestão de Equipamentos",
    description: "Controle seu inventário, reserve equipamentos por job e elimine conflitos de agenda com visualização em tempo real.",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    icon: FileText,
    title: "Propostas Comerciais",
    description: "Crie propostas profissionais em minutos, gere contratos automaticamente e acompanhe o status de aprovação.",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  {
    icon: TrendingUp,
    title: "Financeiro com Split",
    description: "Contas a pagar e receber, conciliação bancária e cobranças via Stripe — tudo integrado ao seu fluxo de produção.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
  },
];

const SOCIAL_PROOF = [
  { name: "Rafael M.", role: "Diretor de Produção · SP", text: "Reduzimos 70% do tempo gasto com planilhas e propostas manuais." },
  { name: "Camila T.", role: "Produtora Executiva · RJ", text: "O controle de equipamentos salvou nossa produtora de conflitos de agenda." },
  { name: "Lucas B.", role: "Sócio · Produtora Cênica", text: "O financeiro integrado com Split foi divisor de águas para nós." },
];

const fadeUp = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090B] text-white font-body">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090B]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-violet-400 fill-violet-400" />
            </div>
            <span className="font-heading font-bold text-white text-base tracking-tight">ContaCena</span>
            <span className="text-white/30 text-xs">ERP</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm text-white/50 hover:text-white transition-colors">Recursos</a>
            <a href="#prova" className="text-sm text-white/50 hover:text-white transition-colors">Depoimentos</a>
            <a href="#precos" className="text-sm text-white/50 hover:text-white transition-colors">Preços</a>
          </nav>

          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-40 pb-28 px-6 relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Exclusivo para Produtoras Audiovisuais
            </span>
          </motion.div>

          <motion.h1
            className="font-heading font-bold text-4xl md:text-6xl text-white leading-tight tracking-tight mb-6"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            A primeira plataforma de gestão pensada para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-sky-400">
              produtoras
            </span>
          </motion.h1>

          <motion.p
            className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Gestão de equipamentos, propostas comerciais, contratos e financeiro com Split em um único lugar. Do pré à entrega.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
            >
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#recursos"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 text-sm font-medium transition-colors"
            >
              Ver Recursos
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {["Sem cartão para testar", "Setup em 5 minutos", "Suporte em português"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-white/40">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── RECURSOS ── */}
      <section id="recursos" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <span className="text-violet-400 text-xs font-semibold uppercase tracking-widest">Recursos</span>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mt-3">Tudo que sua produtora precisa</h2>
            <p className="text-white/40 mt-4 max-w-xl mx-auto text-sm leading-relaxed">
              Desenvolvido especificamente para o fluxo de trabalho de produtoras audiovisuais.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className={`p-6 rounded-2xl border ${f.border} bg-white/[0.02] hover:bg-white/[0.04] transition-colors`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-xl ${f.bg} ${f.border} border flex items-center justify-center mb-4`}>
                  <f.icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-heading font-semibold text-white text-base mb-2">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Extra features list */}
          <motion.div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4" {...fadeUp}>
            {["Plano de Filmagem", "Equipe & Freelas", "Kanban de Jobs", "Cobranças via Stripe"].map(item => (
              <div key={item} className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-xs text-white/60">{item}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section id="prova" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-14" {...fadeUp}>
            <span className="text-violet-400 text-xs font-semibold uppercase tracking-widest">Depoimentos</span>
            <h2 className="font-heading font-bold text-3xl text-white mt-3">Quem usa, recomenda</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SOCIAL_PROOF.map((s, i) => (
              <motion.div
                key={s.name}
                className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="flex mb-3 gap-0.5">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-amber-400 text-xs">★</span>
                  ))}
                </div>
                <p className="text-white/60 text-sm italic leading-relaxed mb-4">"{s.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-xs text-violet-300 font-bold">
                    {s.name[0]}
                  </div>
                  <div>
                    <p className="text-white/80 text-xs font-semibold">{s.name}</p>
                    <p className="text-white/30 text-[10px]">{s.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="precos" className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-6">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4 leading-tight">
              Pronto para profissionalizar sua produtora?
            </h2>
            <p className="text-white/40 text-base mb-8">
              Comece gratuitamente. Sem cartão de crédito. Cancele quando quiser.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
            >
              Começar Agora <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
              <Play className="w-2.5 h-2.5 text-violet-400 fill-violet-400" />
            </div>
            <span className="text-white/40 text-xs font-medium">ContaCena ERP</span>
          </div>
          <p className="text-white/20 text-xs">© {new Date().getFullYear()} ContaCena ERP. Todos os direitos reservados.</p>
          <Link to="/login" className="text-xs text-white/40 hover:text-white transition-colors">Acessar Sistema →</Link>
        </div>
      </footer>
    </div>
  );
}