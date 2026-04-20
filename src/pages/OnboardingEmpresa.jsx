import React, { useState, useEffect } from 'react';
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
import { Building2, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const SEGMENTOS = [
  'Publicidade/Institucional',
  'Livestream/Podcast',
  'Eventos/Casamentos/Festas',
  'Cinema',
  'Outro'
];

// Função auxiliar para formatar CNPJ
const formatCNPJ = (value) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 2) return v;
  if (v.length <= 5) return `${v.slice(0, 2)}.${v.slice(2)}`;
  if (v.length <= 8) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5)}`;
  if (v.length <= 12) return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8)}`;
  return `${v.slice(0, 2)}.${v.slice(2, 5)}.${v.slice(5, 8)}/${v.slice(8, 12)}-${v.slice(12, 14)}`;
};

// Função para buscar dados via CNPJ (BrasilAPI)
const buscarDadosCNPJ = async (cnpj) => {
  const cnpjLimpo = cnpj.replace(/\D/g, '');
  if (cnpjLimpo.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
    if (!response.ok) {
      throw new Error('CNPJ não encontrado');
    }

    const data = await response.json();
    return {
      razao_social: data.nome || data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      uf: data.uf || '',
      cep: data.cep || '',
      telefone: data.telefone || '',
      email_corporativo: data.email || '',
    };
  } catch (error) {
    console.warn('Erro ao buscar CNPJ:', error);
    return null;
  }
};

export default function OnboardingEmpresa() {
  // CAMADA 1: Dados do usuário logado e estado do formulário
  const { checkAppState } = useAuth();
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buscandoCNPJ, setBuscandoCNPJ] = useState(false);
  const [error, setError] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const [formData, setFormData] = useState({
    cnpj: '',
    nome_fantasia: '',
    razao_social: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    telefone: '',
    email_corporativo: '',
    segmento: '',
  });

  // Carrega usuário logado no mount
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const me = await base44.auth.me();
        setUsuarioAtual(me);
      } catch (err) {
        console.error('Erro ao carregar usuário:', err);
        setError('Erro ao carregar usuário logado');
      }
    };
    carregarUsuario();
  }, []);

  // Handle CNPJ input e busca automática
  const handleCNPJChange = async (e) => {
    const valor = e.target.value;
    const formatted = formatCNPJ(valor);
    setFormData(prev => ({ ...prev, cnpj: formatted }));

    // Se CNPJ completo, buscar dados
    if (formatted.replace(/\D/g, '').length === 14) {
      setBuscandoCNPJ(true);
      try {
        const dados = await buscarDadosCNPJ(formatted);
        if (dados) {
          setFormData(prev => ({ ...prev, ...dados }));
          toast.success('Dados carregados da receita federal');
        } else {
          toast.info('CNPJ não encontrado. Preencha manualmente.');
        }
      } catch (err) {
        console.warn('Erro na busca CNPJ:', err);
        toast.info('Não conseguimos buscar os dados. Preencha manualmente.');
      } finally {
        setBuscandoCNPJ(false);
      }
    }
  };

  // Handle campo genérico
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // CAMADA 2 e 3: Lógica de criação e quebra do loop
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSucesso(false);

    // Validação
    if (!formData.nome_fantasia.trim()) {
      setError('Nome da Produtora é obrigatório');
      return;
    }
    if (!formData.segmento) {
      setError('Segmento é obrigatório');
      return;
    }

    try {
      setLoading(true);

      // CAMADA 2: Criar Tenant com dados completos
      const novoTenant = await base44.entities.Tenant.create({
        nome_fantasia: formData.nome_fantasia,
        razao_social: formData.razao_social,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        logradouro: formData.logradouro,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.uf,
        cep: formData.cep,
        telefone: formData.telefone,
        email_corporativo: formData.email_corporativo,
        porte_empresa: 'Micro Empresa',
        plan_tier: 'Básico',
        subscription_status: 'Trial',
        trial_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      // VÍNCULO CRUCIAL: Atualizar usuário com tenant_id (PRIMEIRA VEZ)
      await base44.auth.updateMe({
        tenant_id: novoTenant.id,
      });

      // Criar registro em Usuarios
      await base44.entities.Usuarios.create({
        nome: usuarioAtual.full_name,
        email: usuarioAtual.email,
        role: 'Admin',
        tenant_id: novoTenant.id,
        perm_comercial: true,
        perm_financeiro: true,
        perm_studio_atividades: true,
        perm_studio_inventario: true,
      });

      setSucesso(true);
      toast.success('Empresa criada com sucesso!');

      // CAMADA 3: Quebra definitiva do loop
      // Limpar cache
      const cacheKeys = ['tenant_id', 'company_data', 'user_tenant', 'onboarding_status'];
      cacheKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Could not clear cache key: ${key}`);
        }
      });

      // Aguardar confirmação visual e redirecionar
      // window.location.href força navegador a recarregar tudo do zero
      // com o novo tenant_id já persistido no servidor
      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
      setError(err.message || 'Erro ao criar empresa. Tente novamente.');
      toast.error('Erro ao criar empresa');
      setSucesso(false);
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
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-4">
            <Building2 className="w-7 h-7 text-violet-400" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Configure sua Produtora
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            Crie sua conta empresarial para começar a usar o ContaCena.
          </p>

          {/* Confirmação do usuário logado */}
          {usuarioAtual && (
            <div className="inline-block px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
              ✓ Conectado como: <strong>{usuarioAtual.full_name}</strong> ({usuarioAtual.email})
            </div>
          )}
        </div>

        {/* Success State */}
        {sucesso && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
            <div className="text-sm text-green-300">
              <p className="font-semibold">Empresa criada com sucesso!</p>
              <p className="text-green-400/70 mt-1">Redirecionando para dashboard...</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seção 1: Dados Fiscais */}
          <div className="space-y-4 p-4 rounded-lg bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Dados Fiscais</h3>

            {/* CNPJ com busca automática */}
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-foreground font-medium">
                CNPJ *
              </Label>
              <div className="flex gap-2">
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={handleCNPJChange}
                  disabled={loading || buscandoCNPJ}
                  maxLength="18"
                  className="bg-card border-border focus:ring-violet-500"
                />
                {buscandoCNPJ && (
                  <div className="flex items-center px-3 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Nome Fantasia */}
            <div className="space-y-2">
              <Label htmlFor="nome_fantasia" className="text-foreground font-medium">
                Nome Fantasia *
              </Label>
              <Input
                id="nome_fantasia"
                placeholder="Ex: Minha Produtora"
                value={formData.nome_fantasia}
                onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                disabled={loading}
                className="bg-card border-border focus:ring-violet-500"
              />
            </div>

            {/* Razão Social */}
            <div className="space-y-2">
              <Label htmlFor="razao_social" className="text-foreground font-medium">
                Razão Social
              </Label>
              <Input
                id="razao_social"
                placeholder="Razão social completa"
                value={formData.razao_social}
                onChange={(e) => handleInputChange('razao_social', e.target.value)}
                disabled={loading}
                className="bg-card border-border focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Seção 2: Endereço */}
          <div className="space-y-4 p-4 rounded-lg bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Endereço</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="logradouro" className="text-foreground font-medium">
                  Logradouro
                </Label>
                <Input
                  id="logradouro"
                  placeholder="Rua, Avenida, etc"
                  value={formData.logradouro}
                  onChange={(e) => handleInputChange('logradouro', e.target.value)}
                  disabled={loading}
                  className="bg-card border-border focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero" className="text-foreground font-medium">
                  Número
                </Label>
                <Input
                  id="numero"
                  placeholder="123"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  disabled={loading}
                  className="bg-card border-border focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro" className="text-foreground font-medium">
                  Bairro
                </Label>
                <Input
                  id="bairro"
                  placeholder="Bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  disabled={loading}
                  className="bg-card border-border focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade" className="text-foreground font-medium">
                  Cidade
                </Label>
                <Input
                  id="cidade"
                  placeholder="São Paulo"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  disabled={loading}
                  className="bg-card border-border focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uf" className="text-foreground font-medium">
                  UF
                </Label>
                <Input
                  id="uf"
                  placeholder="SP"
                  value={formData.uf}
                  onChange={(e) => handleInputChange('uf', e.target.value.toUpperCase())}
                  disabled={loading}
                  maxLength="2"
                  className="bg-card border-border focus:ring-violet-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep" className="text-foreground font-medium">
                  CEP
                </Label>
                <Input
                  id="cep"
                  placeholder="00000-000"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  disabled={loading}
                  className="bg-card border-border focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Contato e Segmento */}
          <div className="space-y-4 p-4 rounded-lg bg-card/50 border border-border/50">
            <h3 className="text-sm font-semibold text-foreground">Contato</h3>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-foreground font-medium">
                Telefone
              </Label>
              <Input
                id="telefone"
                placeholder="(11) 99999-9999"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                disabled={loading}
                className="bg-card border-border focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email_corporativo" className="text-foreground font-medium">
                E-mail Corporativo
              </Label>
              <Input
                id="email_corporativo"
                type="email"
                placeholder="empresa@example.com"
                value={formData.email_corporativo}
                onChange={(e) => handleInputChange('email_corporativo', e.target.value)}
                disabled={loading}
                className="bg-card border-border focus:ring-violet-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segmento" className="text-foreground font-medium">
                Segmento Principal *
              </Label>
              <Select value={formData.segmento} onValueChange={(value) => handleInputChange('segmento', value)} disabled={loading}>
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
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive/80">{error}</p>
            </motion.div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading || buscandoCNPJ || sucesso}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Criando...
              </>
            ) : sucesso ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Empresa Criada
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