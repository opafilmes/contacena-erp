import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SEGMENTOS = [
  'Produtora de Vídeo',
  'Agência de Publicidade',
  'Produtora de Conteúdo',
  'Estúdio de Pós-Produção',
  'Produtora de Eventos',
  'Produtora de Fotografia',
  'Outro'
];

export default function OnboardingEmpresa() {
  const { refreshUser } = useAuth();
  const [nome, setNome] = useState('');
  const [segmento, setSegmento] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nome.trim() || !segmento) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const me = await base44.auth.me();

      // Criar novo tenant
      const newTenant = await base44.entities.Tenant.create({
        nome_fantasia: nome,
        porte_empresa: 'Micro Empresa',
        plan_tier: 'Básico',
        subscription_status: 'Trial',
        trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      // Atualizar usuário com tenant_id
      await base44.auth.updateMe({
        tenant_id: newTenant.id,
      });

      // Criar registro em Usuarios
      await base44.entities.Usuarios.create({
        nome: me.full_name,
        email: me.email,
        role: 'Admin',
        tenant_id: newTenant.id,
        perm_comercial: true,
        perm_financeiro: true,
        perm_studio_atividades: true,
        perm_studio_inventario: true,
      });

      // Atualizar perfil do usuário com tenant_id de forma síncrona
      await base44.auth.updateMe({
        tenant_id: newTenant.id,
      });

      // Force refresh da instância de auth
      await refreshUser();

      toast.success('Empresa criada com sucesso!');
      
      // Limpar cache de sessão antes do redirecionamento
      const cacheKeys = ['tenant_id', 'company_data', 'user_tenant', 'onboarding_status'];
      cacheKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Could not clear cache key: ${key}`);
        }
      });

      // Forçar recarregamento completo da página (não apenas navegação)
      // assign() limpa estado anterior e força novo acesso como primeiro carregamento
      setTimeout(() => {
        window.location.assign('/login');
      }, 1000);
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      setError(err.message || 'Erro ao criar empresa. Tente novamente.');
      toast.error('Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
            <Building2 className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Configure sua Produtora
          </h1>
          <p className="text-muted-foreground text-sm">
            Crie sua conta empresarial para começar a usar o ContaCena.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-foreground font-medium">
              Nome da Produtora *
            </Label>
            <Input
              id="nome"
              placeholder="Ex: Minha Produtora"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
              className="bg-card border-border focus:ring-violet-500"
            />
          </div>

          {/* Segmento */}
          <div className="space-y-2">
            <Label htmlFor="segmento" className="text-foreground font-medium">
              Segmento Principal *
            </Label>
            <Select value={segmento} onValueChange={setSegmento} disabled={loading}>
              <SelectTrigger className="bg-card border-border focus:ring-violet-500">
                <SelectValue placeholder="Selecione um segmento" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTOS.map((seg) => (
                  <SelectItem key={seg} value={seg}>
                    {seg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Criando...
              </>
            ) : (
              'Criar Produtora'
            )}
          </Button>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center">
            Ao criar sua conta, você concorda com nossos Termos de Serviço.
          </p>
        </form>
      </motion.div>
    </div>
  );
}