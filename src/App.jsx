import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
import Home from './pages/Home';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
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
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App