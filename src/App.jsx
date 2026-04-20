import React from 'react';
import { base44 } from '@/api/base44Client';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import SignupFlow from './components/SignupFlow';
import TrialExpirado from './pages/TrialExpirado';
import ConfiguracoesEmpresa from './pages/ConfiguracoesEmpresa';
import MeuPerfil from './pages/MeuPerfil';
import Cadastros from './pages/Cadastros';
import Diretorio from './pages/Diretorio';
import EscolhaPlano from './pages/EscolhaPlano';
import Comercial from './pages/Comercial';
import Producao from './pages/Producao';
import Financeiro from './pages/Financeiro';
import RoleGuard from './components/shared/RoleGuard';
import Studio from './pages/Studio';
import StudioAtividades from './pages/StudioAtividades';
import StudioInventario from './pages/StudioInventario';
import GestaoEquipe from './pages/GestaoEquipe';
import SuperAdmin from './pages/SuperAdmin';
import { useNavigate } from 'react-router-dom';
import AuthRedirect from './components/AuthRedirect';

const RootGuard = ({ isAuthenticated, isLoading }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0f0f1a 0%, #1a1228 50%, #0d1117 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
          <span className="text-white/40 text-xs font-medium tracking-widest uppercase">ContaCena ERP</span>
        </div>
      </div>
    );
  }

  return isAuthenticated ? null : <LandingPage />;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "linear-gradient(145deg, #0f0f1a 0%, #1a1228 50%, #0d1117 100%)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin"></div>
          <span className="text-white/40 text-xs font-medium tracking-widest uppercase">ContaCena ERP</span>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to /login instead of root
      base44.auth.redirectToLogin(window.location.href);
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<RootGuard isAuthenticated={isAuthenticated} isLoading={isLoadingAuth || isLoadingPublicSettings} />} />
      <Route path="/signup" element={<SignupFlow />} />
      <Route path="/trial-expirado" element={<TrialExpirado />} />
      <Route element={<AppLayout />}>
        <Route path="/login" element={<Home />} />
        <Route path="/configuracoes-empresa" element={<ConfiguracoesEmpresa />} />
        <Route path="/meu-perfil" element={<MeuPerfil />} />
        <Route path="/cadastros" element={<Cadastros />} />
        <Route path="/diretorio" element={<Diretorio />} />
        <Route path="/comercial" element={<RoleGuard blockedRoles={["Producao"]}><Comercial /></RoleGuard>} />
        <Route path="/producao" element={<Studio />} />
        <Route path="/studio/atividades" element={<StudioAtividades />} />
        <Route path="/studio/inventario" element={<StudioInventario />} />
        <Route path="/financeiro" element={<RoleGuard blockedRoles={["Producao"]}><Financeiro /></RoleGuard>} />
        <Route path="/gestao-equipe" element={<GestaoEquipe />} />
      </Route>
      <Route path="/super-admin" element={<AuthRedirect />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-right" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App