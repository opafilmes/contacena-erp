import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Play, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function SignupFlow() {
  const [stage, setStage] = useState(1); // 1 = email, 2 = empresa
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ email: "", nomeEmpresa: "" });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStage1 = (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.email.includes("@")) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    setStage(2);
  };

  const handleStage2 = async (e) => {
    e.preventDefault();
    if (!form.nomeEmpresa.trim()) {
      toast.error("Informe o nome da sua empresa.");
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke("provisionTenant", {
      email: form.email.trim(),
      nomeEmpresa: form.nomeEmpresa.trim(),
    });
    setLoading(false);

    if (res.data?.ok) {
      setDone(true);
    } else {
      toast.error(res.data?.error || "Erro ao criar sua conta. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen w-full flex">

      {/* ── COLUNA ESQUERDA: Formulário ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 md:px-16 py-12">
        <div className="w-full max-w-sm">

          <div className="mb-10">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-violet-600 fill-violet-600" />
              </div>
              <span className="font-heading font-bold text-slate-900 text-base tracking-tight">ContaCena</span>
              <span className="text-slate-400 text-xs">ERP</span>
            </Link>
          </div>

          {done ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-50 border border-green-100 mb-2">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Conta criada!</h1>
              <p className="text-slate-500 text-sm leading-relaxed">
                Enviamos um e-mail de convite para <strong>{form.email}</strong>.<br />
                Acesse sua caixa de entrada e clique no link para ativar sua conta.
              </p>
              <div className="mt-2 p-3 rounded-xl bg-violet-50 border border-violet-100 text-xs text-violet-700">
                🎉 Seu trial de <strong>5 dias</strong> começa agora. Aproveite!
              </div>
              <Link to="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                Ir para o login <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : stage === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Crie sua conta</h1>
              <p className="text-slate-500 text-sm mb-8">5 dias grátis, sem cartão de crédito.</p>

              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">1</div>
                  <span className="text-xs font-medium text-slate-700">Sua conta</span>
                </div>
                <div className="flex-1 h-px bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">2</div>
                  <span className="text-xs text-slate-400">Sua empresa</span>
                </div>
              </div>

              <form onSubmit={handleStage1} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">E-mail *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set("email", e.target.value)}
                    placeholder="voce@suaempresa.com"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
                    required
                  />
                </div>
                <button type="submit" className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Já tem conta?{" "}
                <Link to="/login" className="text-violet-600 font-semibold hover:underline">Entrar</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Sua produtora</h1>
              <p className="text-slate-500 text-sm mb-8">
                Conta: <span className="font-medium text-slate-700">{form.email}</span>
              </p>

              <div className="flex items-center gap-2 mb-8">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                  <span className="text-xs text-slate-400">Sua conta</span>
                </div>
                <div className="flex-1 h-px bg-violet-200" />
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold">2</div>
                  <span className="text-xs font-medium text-slate-700">Sua empresa</span>
                </div>
              </div>

              <form onSubmit={handleStage2} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nome da Produtora *</label>
                  <input
                    type="text"
                    value={form.nomeEmpresa}
                    onChange={e => set("nomeEmpresa", e.target.value)}
                    placeholder="Ex: Minha Produtora Filmes"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Criando ambiente...</>
                  ) : (
                    <>Criar minha conta <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <button onClick={() => setStage(1)} className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors">
                ← Voltar
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── COLUNA DIREITA: Visual / Branding ── */}
      <div
        className="hidden md:flex flex-col justify-between flex-1 px-12 py-12"
        style={{ background: "linear-gradient(145deg, #0f0f1a 0%, #1a1228 50%, #0d1117 100%)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
            <Play className="w-4 h-4 text-violet-400 fill-violet-400" />
          </div>
          <span className="text-white/70 text-sm font-medium">ContaCena ERP</span>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
            🎬 Trial de 5 dias — grátis
          </div>
          <h2 className="text-4xl font-heading font-bold text-white leading-tight">
            Comece agora.<br />Escale depois.
          </h2>
          <p className="text-white/50 text-base leading-relaxed max-w-xs">
            Seu ambiente isolado e privado estará pronto em segundos.
          </p>

          <div className="space-y-3 mt-4">
            {[
              "Ambiente 100% isolado da sua empresa",
              "Dados protegidos e privados",
              "Acesso completo durante o trial",
              "Cancele quando quiser",
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 text-[10px]">✓</div>
                <span className="text-white/60 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-white/70 text-sm italic leading-relaxed">
              "Setup em menos de 2 minutos. Na mesma semana já estava enviando propostas profissionais."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-500/30 flex items-center justify-center text-xs text-sky-300 font-bold">A</div>
              <div>
                <p className="text-white/80 text-xs font-semibold">Ana P.</p>
                <p className="text-white/40 text-[10px]">Produtora Executiva · BH</p>
              </div>
            </div>
          </div>
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} ContaCena ERP. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}