import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function OnboardingGuard({ children }) {
  const navigate = useNavigate();
  const { user, isLoadingAuth, authChecked } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [redirectTimer, setRedirectTimer] = useState(null);

  useEffect(() => {
    // Aguardar que a autenticação seja completamente verificada
    if (authChecked && !isLoadingAuth) {
      // Adicionar um delay de tolerância para evitar redirects precipitados
      // enquanto o banco de dados está processando
      const timer = setTimeout(() => {
        setIsChecking(false);

        // Se usuário existe mas não tem tenant_id, redirecionar para onboarding
        if (user && !user.data?.tenant_id) {
          navigate('/onboarding-empresa', { replace: true });
        }
      }, 800); // 800ms de tolerância

      setRedirectTimer(timer);

      return () => clearTimeout(timer);
    }
  }, [user, isLoadingAuth, authChecked, navigate]);

  // Mostrar loading enquanto verifica autenticação ou processando redirecionamento
  if (isLoadingAuth || isChecking || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0f0f1a 0%, #1a1228 50%, #0d1117 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
          <span className="text-white/40 text-xs font-medium tracking-widest uppercase">
            {!authChecked ? 'Carregando...' : 'Sincronizando sessão...'}
          </span>
        </div>
      </div>
    );
  }

  // Se usuário está logado e tem tenant_id, renderizar children
  if (user?.data?.tenant_id) {
    return children;
  }

  // Fallback: Loading durante redirecionamento
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
        <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Redirecionando...</span>
      </div>
    </div>
  );
}