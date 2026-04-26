import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from './components/layout/AppLayout';
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
import StudioCallSheet from './pages/StudioCallSheet';
import GestaoEquipe from './pages/GestaoEquipe';
import SuperAdminPage from './pages/admin/SuperAdminPage';
import DashboardGestao from './pages/business/DashboardGestao';
import DashboardStudio from './pages/studio/DashboardStudio';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm font-body">Carregando...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Raiz → redireciona para /app */}
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* Todas as rotas protegidas sob /app */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<DashboardGestao />} />
        <Route path="studio" element={<DashboardStudio />} />
        <Route path="configuracoes-empresa" element={<ConfiguracoesEmpresa />} />
        <Route path="meu-perfil" element={<MeuPerfil />} />
        <Route path="cadastros" element={<Cadastros />} />
        <Route path="diretorio" element={<Diretorio />} />
        <Route path="comercial" element={<RoleGuard blockedRoles={["Producao"]}><Comercial /></RoleGuard>} />
        <Route path="producao" element={<Studio />} />
        <Route path="studio/atividades" element={<StudioAtividades />} />
        <Route path="studio/inventario" element={<StudioInventario />} />
        <Route path="studio/call-sheet" element={<StudioCallSheet />} />
        <Route path="financeiro" element={<RoleGuard blockedRoles={["Producao"]}><Financeiro /></RoleGuard>} />
        <Route path="gestao-equipe" element={<GestaoEquipe />} />
      </Route>

      <Route path="/super-admin" element={<SuperAdminPage />} />
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