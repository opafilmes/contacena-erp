import React from 'react';
import { base44 } from '@/api/base44Client';

const UserNotRegisteredError = () => {
  return (
    <div className="min-h-screen w-full flex">

      {/* ── COLUNA ESQUERDA: Formulário / Mensagem ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-8 md:px-16 py-12">
        <div className="w-full max-w-sm">
          {/* Logo / Brand mark */}
          <div className="mb-10">
            <span className="font-heading font-bold text-2xl text-slate-900 tracking-tight">ContaCena</span>
            <span className="text-slate-400 text-xs ml-1">ERP</span>
          </div>

          {/* Ícone */}
          <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-orange-50 border border-orange-100">
            <svg className="w-7 h-7 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2 leading-tight">Acesso Restrito</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Você não está cadastrado nesta aplicação. Entre em contato com o administrador para solicitar acesso.
          </p>

          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 mb-8">
            <p className="font-medium text-slate-700">O que você pode fazer:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                Verifique se está logado com a conta correta
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                Contate o administrador da sua produtora
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 mt-0.5">•</span>
                Tente sair e entrar novamente
              </li>
            </ul>
          </div>

          <button
            onClick={() => base44.auth.logout()}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Sair e tentar novamente
          </button>
        </div>
      </div>

      {/* ── COLUNA DIREITA: Visual / Branding (apenas desktop) ── */}
      <div
        className="hidden md:flex flex-col justify-between flex-1 px-12 py-12"
        style={{
          background: "linear-gradient(145deg, #0f0f1a 0%, #1a1228 50%, #0d1117 100%)",
        }}
      >
        {/* Topo: logo mark */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-600/30 border border-violet-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-white/70 text-sm font-medium">ContaCena ERP</span>
        </div>

        {/* Centro: texto de impacto */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl font-heading font-bold text-white leading-tight tracking-tight">
              O controle total<br />da sua produtora.
            </h2>
            <p className="text-white/50 text-base leading-relaxed max-w-xs">
              Gestão de equipamentos, propostas e financeiro em um só lugar.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {["Propostas", "Financeiro", "Studio", "Contratos", "Equipamentos"].map(f => (
              <span key={f} className="px-3 py-1 rounded-full text-xs font-medium bg-white/8 border border-white/10 text-white/60">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Rodapé: depoimento / copyright */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-white/70 text-sm italic leading-relaxed">
              "Desde que migramos para o ContaCena, reduzimos em 70% o tempo gasto com planilhas e propostas manuais."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-500/30 flex items-center justify-center text-xs text-violet-300 font-bold">R</div>
              <div>
                <p className="text-white/80 text-xs font-semibold">Rafael M.</p>
                <p className="text-white/40 text-[10px]">Diretor de Produção · São Paulo</p>
              </div>
            </div>
          </div>
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} ContaCena ERP. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;